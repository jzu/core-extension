import { OnLock, OnUnlock } from '@src/background/runtime/lifecycleCallbacks';
import { singleton } from 'tsyringe';
import { Account } from '../accounts/models';
import { Balances, BalanceServiceEvents, BALANCES_CACHE_KEY } from './models';
import { BalancesService } from './BalancesService';
import { NetworkService } from '../network/NetworkService';
import { EventEmitter } from 'events';
import * as Sentry from '@sentry/browser';

import { LockService } from '../lock/LockService';
import { StorageService } from '../storage/StorageService';
import { CachedBalancesInfo } from './models';
import { isEqual, merge } from 'lodash';
import {
  PriceChangesData,
  TOKENS_PRICE_DATA,
  TokensPriceChangeData,
  TokensPriceShortData,
  priceChangeRefreshRate,
} from '../tokens/models';
import { resolve } from '@avalabs/core-utils-sdk';
import { SettingsService } from '../settings/SettingsService';
import { isFulfilled } from '@src/utils/typeUtils';

@singleton()
export class BalanceAggregatorService implements OnLock, OnUnlock {
  #eventEmitter = new EventEmitter();
  #balances: Balances = {};
  #isBalancesCached = true;

  get balances() {
    return this.#balances;
  }

  get isBalancesCached() {
    return this.#isBalancesCached;
  }

  constructor(
    private balancesService: BalancesService,
    private networkService: NetworkService,
    private lockService: LockService,
    private storageService: StorageService,
    private settingsService: SettingsService
  ) {}

  async getBalancesForNetworks(
    chainIds: number[],
    accounts: Account[]
  ): Promise<Balances> {
    const sentryTracker = Sentry.startTransaction({
      name: 'BalanceAggregatorService: getBatchedUpdatedBalancesForNetworks',
    });

    const networks = Object.values(
      await this.networkService.activeNetworks.promisify()
    ).filter((network) => chainIds.includes(network.chainId));

    const priceChangesData = await this.getPriceChangesData();

    const updateRequests = await Promise.allSettled(
      networks.map(async (network) => {
        const networkBalances =
          await this.balancesService.getBalancesForNetwork(
            network,
            accounts,
            priceChangesData
          );

        return {
          chainId: network.chainId,
          networkBalances,
        };
      })
    );

    const updatedNetworks = updateRequests
      .filter(isFulfilled)
      .map(({ value }) => value);

    const networksWithChanges = updatedNetworks
      .filter(
        ({ chainId, networkBalances }) =>
          !isEqual(networkBalances, this.balances[chainId])
      )
      .map(({ chainId }) => chainId);

    const freshBalances = updatedNetworks.reduce<Balances>(
      (balances, balanceOfNetwork) => {
        const { chainId, networkBalances } = balanceOfNetwork;
        balances[chainId] = networkBalances;

        return balances;
      },
      {}
    );

    const aggregatedBalances = merge({}, this.balances, freshBalances);
    const hasChanges = networksWithChanges.length > 0;

    if (hasChanges && !this.lockService.locked) {
      this.#balances = aggregatedBalances;

      this.#eventEmitter.emit(BalanceServiceEvents.UPDATED, {
        balances: aggregatedBalances,
        isBalancesCached: false,
      });
      await this.#updateCachedBalancesInfo();
    }

    this.#isBalancesCached = false;

    sentryTracker.finish();

    return aggregatedBalances;
  }

  getPriceChangesData = async () => {
    const selectedCurrency = (await this.settingsService.getSettings())
      .currency;
    const changesData =
      await this.storageService.loadUnencrypted<TokensPriceChangeData>(
        `${TOKENS_PRICE_DATA}-${selectedCurrency}`
      );

    const lastUpdated = changesData?.lastUpdatedAt;

    let priceChangesData = changesData?.priceChanges || {};

    if (
      !priceChangesData ||
      !Object.keys(priceChangesData).length ||
      (lastUpdated && lastUpdated + priceChangeRefreshRate < Date.now())
    ) {
      const [priceChangesResult] = await resolve(
        fetch(
          `${process.env.PROXY_URL}/watchlist/tokens?currency=${selectedCurrency}`
        )
      );

      if (!priceChangesResult) {
        return;
      }
      const priceChanges: PriceChangesData[] = await priceChangesResult.json();
      const tokensData: TokensPriceShortData = priceChanges.reduce(
        (acc: TokensPriceShortData, data: PriceChangesData) => {
          return {
            ...acc,
            [data.symbol]: {
              priceChange: data.price_change_24h,
              priceChangePercentage: data.price_change_percentage_24h,
            },
          };
        },
        {}
      );

      priceChangesData = { ...tokensData };

      this.storageService.saveUnencrypted<TokensPriceChangeData>(
        `${TOKENS_PRICE_DATA}-${selectedCurrency}`,
        {
          priceChanges: tokensData,
          lastUpdatedAt: Date.now(),
          currency: selectedCurrency,
        }
      );
    }
    return priceChangesData;
  };

  async loadBalanceFromCache() {
    if (this.lockService.locked) {
      return;
    }

    return this.storageService.load<CachedBalancesInfo>(BALANCES_CACHE_KEY);
  }

  async #updateCachedBalancesInfo() {
    return this.storageService.save<CachedBalancesInfo>(BALANCES_CACHE_KEY, {
      balances: this.#balances,
    });
  }

  onLock() {
    this.#balances = {};
    this.#isBalancesCached = true;
  }

  async onUnlock() {
    // Do not set state from cache if we already have something in memory
    if (Object.keys(this.#balances).length) {
      return;
    }

    const cachedBalance = await this.loadBalanceFromCache();

    if (!cachedBalance?.balances) {
      return;
    }

    this.#balances = cachedBalance.balances;
    this.#isBalancesCached = true;

    this.#eventEmitter.emit(BalanceServiceEvents.UPDATED, {
      balances: this.#balances,
      isBalancesCached: true,
    });
  }

  addListener<T = unknown>(
    event: BalanceServiceEvents,
    callback: (data: T) => void
  ) {
    this.#eventEmitter.on(event, callback);
  }
}
