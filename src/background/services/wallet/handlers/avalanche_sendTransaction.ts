import { injectable } from 'tsyringe';
import { WalletService } from '../WalletService';
import {
  DAppProviderRequest,
  JsonRpcRequestParams,
} from '@src/background/connections/dAppConnection/models';
import { DAppRequestHandler } from '@src/background/connections/dAppConnection/DAppRequestHandler';
import { Action } from '../../actions/models';
import { DEFERRED_RESPONSE } from '@src/background/connections/middlewares/models';
import {
  UnsignedTx,
  EVMUnsignedTx,
  EVM,
  utils,
  avaxSerial,
  VM,
} from '@avalabs/avalanchejs';
import { NetworkService } from '@src/background/services/network/NetworkService';
import { ethErrors } from 'eth-rpc-errors';
import { AccountsService } from '../../accounts/AccountsService';
import getAddressByVM from '../utils/getAddressByVM';
import { Avalanche } from '@avalabs/core-wallets-sdk';
import getProvidedUtxos from '../utils/getProvidedUtxos';
import { AnalyticsServicePosthog } from '../../analytics/AnalyticsServicePosthog';
import { ChainId } from '@avalabs/core-chains-sdk';
import { openApprovalWindow } from '@src/background/runtime/openApprovalWindow';

type TxParams = {
  transactionHex: string;
  chainAlias: 'X' | 'P' | 'C';
  externalIndices?: number[];
  internalIndices?: number[];
  utxos?: string[];
};

@injectable()
export class AvalancheSendTransactionHandler extends DAppRequestHandler<
  TxParams,
  string
> {
  methods = [DAppProviderRequest.AVALANCHE_SEND_TRANSACTION];

  constructor(
    private walletService: WalletService,
    private networkService: NetworkService,
    private accountsService: AccountsService,
    private analyticsServicePosthog: AnalyticsServicePosthog
  ) {
    super();
  }

  handleAuthenticated = async (
    rpcCall: JsonRpcRequestParams<DAppProviderRequest, TxParams>
  ) => {
    let unsignedTx: UnsignedTx | EVMUnsignedTx;

    const { request, scope } = rpcCall;
    const {
      transactionHex,
      chainAlias,
      externalIndices,
      internalIndices,
      utxos: providedUtxoHexes,
    } = (request.params ?? {}) as TxParams;

    if (!transactionHex || !chainAlias) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)',
        }),
      };
    }

    const vm = Avalanche.getVmByChainAlias(chainAlias);
    const txBytes = utils.hexToBuffer(transactionHex);
    const provider = await this.networkService.getAvalanceProviderXP();
    const currentAddress = getAddressByVM(
      vm,
      this.accountsService.activeAccount
    );

    if (!currentAddress) {
      return {
        ...request,
        error: ethErrors.rpc.invalidRequest({
          message: 'No active account found',
        }),
      };
    }

    const providedUtxos = getProvidedUtxos({
      utxoHexes: providedUtxoHexes,
      vm,
    });
    const utxos = providedUtxos.length
      ? providedUtxos
      : await Avalanche.getUtxosByTxFromGlacier({
          transactionHex,
          chainAlias,
          isTestnet: !this.networkService.isMainnet(),
          url: process.env.GLACIER_URL as string,
          token: process.env.GLACIER_API_KEY,
        });

    if (vm === EVM) {
      unsignedTx = await Avalanche.createAvalancheEvmUnsignedTx({
        txBytes,
        vm,
        utxos,
        fromAddress: currentAddress,
      });
    } else {
      const tx = utils.unpackWithManager(vm, txBytes) as avaxSerial.AvaxTx;

      const externalAddresses = await this.walletService.getAddressesByIndices(
        externalIndices ?? [],
        chainAlias as 'X' | 'P',
        false
      );

      const internalAddresses = await this.walletService.getAddressesByIndices(
        internalIndices ?? [],
        chainAlias as 'X' | 'P',
        true
      );

      const fromAddresses = [
        ...new Set([
          currentAddress,
          ...externalAddresses,
          ...internalAddresses,
        ]),
      ];

      const fromAddressBytes = fromAddresses.map(
        (address) => utils.parse(address)[2]
      );

      unsignedTx = await Avalanche.createAvalancheUnsignedTx({
        tx,
        utxos,
        provider,
        fromAddressBytes,
      });
    }

    const txData = await Avalanche.parseAvalancheTx(
      unsignedTx,
      provider,
      currentAddress
    );

    if (txData.type === 'unknown') {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Unable to parse transaction data. Unsupported tx type',
        }),
      };
    }

    const actionData = {
      ...request,
      scope,
      displayData: {
        unsignedTxJson: JSON.stringify(unsignedTx.toJSON()),
        txData,
        vm,
      },
    };

    await openApprovalWindow(actionData, `approve/avalancheSignTx`);

    return {
      ...request,
      result: DEFERRED_RESPONSE,
    };
  };

  handleUnauthenticated = ({ request }) => {
    return {
      ...request,
      error: ethErrors.provider.unauthorized(),
    };
  };

  #getAddressForVM(vm: VM) {
    const account = this.accountsService.activeAccount;

    if (!account) {
      return;
    }

    if (vm === 'EVM') {
      return account.addressC;
    } else if (vm === 'AVM') {
      return account.addressAVM;
    } else if (vm === 'PVM') {
      return account.addressPVM;
    }
  }

  #getChainIdForVM(vm: VM) {
    const isMainnet = this.networkService.isMainnet();

    if (vm === 'EVM') {
      return isMainnet
        ? ChainId.AVALANCHE_MAINNET_ID
        : ChainId.AVALANCHE_TESTNET_ID;
    } else if (vm === 'AVM') {
      return isMainnet ? ChainId.AVALANCHE_X : ChainId.AVALANCHE_TEST_X;
    }

    return isMainnet ? ChainId.AVALANCHE_P : ChainId.AVALANCHE_TEST_P;
  }

  onActionApproved = async (
    pendingAction: Action,
    result,
    onSuccess,
    onError,
    frontendTabId?: number
  ) => {
    const {
      displayData: { vm, unsignedTxJson },
      params: { externalIndices, internalIndices },
    } = pendingAction;

    const usedAddress = this.#getAddressForVM(vm);
    const usedNetwork = this.#getChainIdForVM(vm);

    try {
      // Parse the json into a tx object
      const unsignedTx =
        vm === EVM
          ? EVMUnsignedTx.fromJSON(unsignedTxJson)
          : UnsignedTx.fromJSON(unsignedTxJson);

      const hasMultipleAddresses =
        unsignedTx.addressMaps.getAddresses().length > 1;

      if (
        hasMultipleAddresses &&
        !(externalIndices ?? []).length &&
        !(internalIndices ?? []).length
      ) {
        throw new Error(
          'Transaction contains multiple addresses, but indices were not provided'
        );
      }

      const { txHash, signedTx } = await this.walletService.sign(
        {
          tx: unsignedTx,
          externalIndices,
          internalIndices,
        },
        this.networkService.getAvalancheNetworkXP(),
        frontendTabId,
        DAppProviderRequest.AVALANCHE_SEND_TRANSACTION
      );

      if (typeof txHash === 'string') {
        this.analyticsServicePosthog.captureEncryptedEvent({
          name: 'avalanche_sendTransaction_success',
          windowId: crypto.randomUUID(),
          properties: {
            address: usedAddress,
            txHash: txHash,
            chainId: usedNetwork,
          },
        });

        // If we already have the transaction hash (i.e. it was dispatched by WalletConnect),
        // we just return it to the caller.
        onSuccess(txHash);
      } else if (typeof signedTx === 'string') {
        const signedTransaction =
          vm === EVM
            ? EVMUnsignedTx.fromJSON(signedTx)
            : UnsignedTx.fromJSON(signedTx);

        if (!signedTransaction.hasAllSignatures()) {
          throw new Error('Signing error, missing signatures.');
        }

        const signedTransactionHex = Avalanche.signedTxToHex(
          signedTransaction.getSignedTx()
        );

        // Submit the transaction and return the tx id
        const prov = await this.networkService.getAvalanceProviderXP();
        const res = await prov.issueTxHex(signedTransactionHex, vm);

        this.analyticsServicePosthog.captureEncryptedEvent({
          name: 'avalanche_sendTransaction_success',
          windowId: crypto.randomUUID(),
          properties: {
            address: usedAddress,
            txHash: res.txID,
            chainId: usedNetwork,
          },
        });

        onSuccess(res.txID);
      }
    } catch (e) {
      this.analyticsServicePosthog.captureEncryptedEvent({
        name: 'avalanche_sendTransaction_failed',
        windowId: crypto.randomUUID(),
        properties: {
          address: usedAddress,
          chainId: usedNetwork,
        },
      });

      onError(e);
    }
  };
}
