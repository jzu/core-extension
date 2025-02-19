import { ChainList, NetworkVMType } from '@avalabs/core-chains-sdk';
import { DAppRequestHandler } from '@src/background/connections/dAppConnection/DAppRequestHandler';
import { DAppProviderRequest } from '@src/background/connections/dAppConnection/models';
import { DEFERRED_RESPONSE } from '@src/background/connections/middlewares/models';
import { ethErrors } from 'eth-rpc-errors';
import { injectable } from 'tsyringe';
import { Action } from '../../actions/models';
import {
  AddEthereumChainDisplayData,
  AddEthereumChainParameter,
  Network,
  NetworkWithCaipId,
} from '../models';
import { NetworkService } from '../NetworkService';
import { openApprovalWindow } from '@src/background/runtime/openApprovalWindow';
import { decorateWithCaipId } from '@src/utils/caipConversion';
import { isCoreWeb } from '../utils/isCoreWeb';

/**
 * @link https://eips.ethereum.org/EIPS/eip-3085
 * @param data
 */
@injectable()
export class WalletAddEthereumChainHandler extends DAppRequestHandler {
  methods = [DAppProviderRequest.WALLET_ADD_CHAIN];
  constructor(private networkService: NetworkService) {
    super();
  }

  handleUnauthenticated = async ({ request, scope }) => {
    const requestedChain: AddEthereumChainParameter = request.params?.[0];

    if (!requestedChain) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Chain config missing',
        }),
      };
    }

    const chains = await this.networkService.allNetworks.promisify();
    const currentActiveNetwork = await this.networkService.getNetwork(scope);
    const supportedChainIds = Object.keys(chains ?? {});
    const requestedChainId = Number(requestedChain.chainId);
    const chainRequestedIsSupported =
      requestedChain && supportedChainIds.includes(requestedChainId.toString());
    const isSameNetwork = requestedChainId === currentActiveNetwork?.chainId;

    if (isSameNetwork)
      return {
        ...request,
        result: null,
      };

    const rpcUrl = requestedChain.rpcUrls?.[0];
    if (!rpcUrl) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'RPC url missing',
        }),
      };
    }

    if (!requestedChain.nativeCurrency) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Expected nativeCurrency param to be defined',
        }),
      };
    }

    const customNetwork = decorateWithCaipId({
      chainId: requestedChainId,
      chainName: requestedChain.chainName || '',
      vmName: NetworkVMType.EVM,
      rpcUrl,
      networkToken: {
        symbol: requestedChain.nativeCurrency.symbol,
        decimals: requestedChain.nativeCurrency.decimals,
        description: '',
        name: requestedChain.nativeCurrency.name,
        logoUri: requestedChain.iconUrls?.[0] || '',
      },
      logoUri: requestedChain.iconUrls?.[0] || '',
      explorerUrl: requestedChain.blockExplorerUrls?.[0] || '',
      primaryColor: 'black',
      isTestnet: !!requestedChain.isTestnet,
    });

    if (!customNetwork.chainName) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Network Name is required',
        }),
      };
    }

    if (!customNetwork.networkToken.symbol) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Network Token Symbol is required',
        }),
      };
    }

    if (!customNetwork.networkToken.name) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'Network Token Name is required',
        }),
      };
    }
    const skipApproval = await isCoreWeb(request);

    if (skipApproval) {
      await this.actionHandler(chains, customNetwork, request.site.domain);
      return { ...request, result: null };
    }

    if (chainRequestedIsSupported) {
      const actionData: Action<{ network: Network }> = {
        ...request,
        scope,
        displayData: {
          network: customNetwork,
        },
      };

      await openApprovalWindow(actionData, `network/switch`);

      return { ...request, result: DEFERRED_RESPONSE };
    }

    const isValid = await this.networkService.isValidRPCUrl(
      customNetwork.chainId,
      customNetwork.rpcUrl
    );
    if (!isValid) {
      return {
        ...request,
        error: ethErrors.rpc.invalidParams({
          message: 'ChainID does not match the rpc url',
        }),
      };
    }

    const actionData: Action<AddEthereumChainDisplayData> = {
      ...request,
      scope,
      displayData: {
        network: customNetwork,
        options: {
          requiresGlacierApiKey: Boolean(requestedChain.requiresGlacierApiKey),
        },
      },
    };

    await openApprovalWindow(actionData, `networks/add-popup`);

    return { ...request, result: DEFERRED_RESPONSE };
  };

  handleAuthenticated = async (rpcCall) => {
    return this.handleUnauthenticated(rpcCall);
  };

  async actionHandler(
    chains: ChainList,
    network: NetworkWithCaipId,
    domain: string
  ) {
    const supportedChainIds = Object.keys(chains);

    if (network.customRpcHeaders) {
      // eslint-disable-next-line
      const { rpcUrl, ...overrides } = network; // we do not want to apply rpcUrl override from here
      await this.networkService.updateNetworkOverrides(overrides);
    }

    // Add a custom network if it is not on the list yet.
    if (!supportedChainIds.includes(network.chainId.toString())) {
      await this.networkService.saveCustomNetwork(network);
    }

    await this.networkService.setNetwork(domain, network);
  }

  onActionApproved = async (
    pendingAction: Action<AddEthereumChainDisplayData>,
    _result,
    onSuccess,
    onError
  ) => {
    try {
      const chains = await this.networkService.allNetworks.promisify();
      if (!chains) {
        onError('networks not found');
        return;
      }
      const domain = pendingAction.site?.domain;

      if (!domain) {
        return onError(new Error('Unrecognized domain'));
      }

      const { network } = pendingAction.displayData;

      await this.actionHandler(chains, network, domain);

      onSuccess(null);
    } catch (e) {
      onError(e);
    }
  };
}
