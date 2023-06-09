import { TokenWithBalance } from '@src/background/services/balances/models';

import { useTokensWithBalances } from '@src/hooks/useTokensWithBalances';
import Scrollbars from 'react-custom-scrollbars-2';
import { ActiveNetworkWidget } from './ActiveNetworkWidget';
import { NetworkList } from './NetworkList';
import { Stack } from '@avalabs/k2-components';

export const tokensWithBalances = (tokenList?: TokenWithBalance[]) => {
  if (!tokenList) {
    return;
  }

  return tokenList.filter((token) => !token.balance.isZero());
};

export const getNetworkBalance = (assetList: TokenWithBalance[]) => {
  const sum = assetList.reduce((prevAssetUSD, currentAsset) => {
    return (
      prevAssetUSD +
      ((currentAsset.unconfirmedBalanceUSD || 0) +
        (currentAsset.balanceUSD || 0))
    );
  }, 0);
  return sum;
};

export function NetworksWidget() {
  const activeNetworkAssetList = useTokensWithBalances();
  const activeNetworkBalance = getNetworkBalance(activeNetworkAssetList);

  return (
    <Scrollbars style={{ flexGrow: 1, maxHeight: 'unset', height: '100%' }}>
      <Stack sx={{ m: 2 }}>
        <ActiveNetworkWidget
          assetList={activeNetworkAssetList}
          activeNetworkBalance={activeNetworkBalance}
        />
        <NetworkList />
      </Stack>
    </Scrollbars>
  );
}
