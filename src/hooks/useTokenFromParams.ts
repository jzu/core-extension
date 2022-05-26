import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useBalancesContext } from '@src/contexts/BalancesProvider';
import { useAccountsContext } from '@src/contexts/AccountsProvider';
import { TokenWithBalance } from '@src/background/services/balances/models';
import { useTokensWithBalances } from './useTokensWithBalances';

export function useTokenFromParams() {
  const { search } = useLocation();
  const allTokens = useTokensWithBalances(true);
  const [selectedToken, setSelectedToken] = useState<TokenWithBalance>(
    allTokens[0]
  );
  const { activeAccount } = useAccountsContext();
  const balances = useBalancesContext();

  const { tokenSymbol, tokenAddress } = useMemo(
    () =>
      (Object as any).fromEntries(
        (new URLSearchParams(search) as any).entries()
      ),
    [search]
  );

  useEffect(() => {
    const targetToken = allTokens?.find((token) =>
      token.isERC20
        ? token.address === tokenAddress
        : token.symbol === tokenSymbol
    );
    setSelectedToken(targetToken ?? allTokens[0]);
  }, [tokenSymbol, tokenAddress, allTokens, activeAccount, balances]);

  return selectedToken;
}
