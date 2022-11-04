import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import { ExtensionRequestHandler } from '@src/background/connections/models';
import { injectable } from 'tsyringe';
import { AccountsService } from '../../accounts/AccountsService';
import { Account } from '../../accounts/models';
import { NetworkService } from '../../network/NetworkService';
import { BalanceAggregatorService } from '../BalanceAggregatorService';
import { Balances } from '../models';

type HandlerType = ExtensionRequestHandler<
  ExtensionRequest.NETWORK_BALANCES_UPDATE,
  Balances,
  [accounts?: Account[], networks?: number[]] | undefined
>;

@injectable()
export class UpdateBalancesForNetworkHandler implements HandlerType {
  method = ExtensionRequest.NETWORK_BALANCES_UPDATE as const;

  constructor(
    private networkBalancesService: BalanceAggregatorService,
    private accountsService: AccountsService,
    private networkSerice: NetworkService
  ) {}

  handle: HandlerType['handle'] = async (request) => {
    const params = request.params || [];

    // if no account or network is defined default to the currently active one
    const [accounts, networks] = params;

    const accountsToFetch = accounts?.length
      ? accounts
      : this.accountsService.getAccounts();

    if (Object.keys(accountsToFetch).length === 0) {
      return {
        ...request,
        error: 'accounts undefined or empty',
      };
    }

    const networksToFetch = networks?.length
      ? networks
      : Object.values(await this.networkSerice.activeNetworks.promisify()).map(
          (n) => n.chainId
        );
    if (Object.keys(networksToFetch).length === 0) {
      return {
        ...request,
        error: 'networks undefined or empty',
      };
    }

    const balances =
      await this.networkBalancesService.updateBalancesForNetworks(
        networksToFetch,
        accountsToFetch
      );
    return {
      ...request,
      result: balances,
    };
  };
}
