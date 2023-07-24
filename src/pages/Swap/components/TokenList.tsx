import { useMemo } from 'react';
import { TokenCard, VerticalFlex } from '@avalabs/react-components';
import { TokenIcon } from '@src/components/common/TokenImage';
import { AvaxTokenIcon } from '@src/components/icons/AvaxTokenIcon';
import { Scrollbars } from '@src/components/common/scrollbars/Scrollbars';
import { useSettingsContext } from '@src/contexts/SettingsProvider';
import {
  TokenType,
  TokenWithBalance,
} from '@src/background/services/balances/models';

interface TokenListProps {
  searchQuery?: string;
  onClick: any;
  onClose: any;
  tokenList: TokenWithBalance[];
}

export function TokenList({
  tokenList,
  searchQuery,
  onClick,
  onClose,
}: TokenListProps) {
  const AVAX_TOKEN = tokenList.find((token) => token.type === TokenType.NATIVE);
  const { currency, currencyFormatter } = useSettingsContext();
  const { tokens, showAvax } = useMemo(() => {
    const filteredTokens = searchQuery
      ? tokenList.filter(
          (i) =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : tokenList;

    const shouldShowAvax =
      searchQuery &&
      ((AVAX_TOKEN as TokenWithBalance).name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        (AVAX_TOKEN as TokenWithBalance).symbol
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    return { tokens: filteredTokens, showAvax: shouldShowAvax };
  }, [tokenList, searchQuery, AVAX_TOKEN]);

  if (!tokens.length && !showAvax) {
    return null;
  }

  return (
    <VerticalFlex grow="1" padding="16px 0 0 0">
      <Scrollbars>
        <VerticalFlex padding="0px 16px 73px">
          {AVAX_TOKEN && (!searchQuery || showAvax) && (
            <TokenCard
              name={AVAX_TOKEN.name}
              symbol={AVAX_TOKEN.symbol}
              onClick={() => {
                onClick(AVAX_TOKEN);
                onClose();
              }}
              currency={currency}
              balanceDisplayValue={AVAX_TOKEN.balanceDisplayValue}
              balanceUSD={AVAX_TOKEN.balanceUsdDisplayValue?.toString()}
              currencyFormatter={currencyFormatter}
            >
              <AvaxTokenIcon height="32px" />
            </TokenCard>
          )}

          {tokens
            ?.filter((token) => token.type === TokenType.NATIVE)
            .map((token, index) => {
              return (
                <TokenCard
                  name={token.name}
                  symbol={token.symbol}
                  onClick={() => {
                    onClick(token);
                    onClose();
                  }}
                  currency={currency}
                  balanceDisplayValue={token.balanceDisplayValue}
                  balanceUSD={token.balanceUSD?.toString()}
                  currencyFormatter={currencyFormatter}
                  key={`${token.name}-${token.symbol}-${index}`}
                >
                  <TokenIcon
                    width="32px"
                    height="32px"
                    src={token.logoUri}
                    name={token.name}
                  />
                </TokenCard>
              );
            })}

          {tokens
            ?.filter((token) => token.type === TokenType.ERC20)
            .map((token, index) => (
              <TokenCard
                name={token.name}
                symbol={token.symbol}
                onClick={() => {
                  onClick(token);
                  onClose();
                }}
                currency={currency}
                balanceDisplayValue={token.balanceDisplayValue}
                balanceUSD={token.balanceUSD?.toString()}
                currencyFormatter={currencyFormatter}
                key={`${token.name}-${token.symbol}-${index}`}
              >
                <TokenIcon
                  width="32px"
                  height="32px"
                  src={token.logoUri}
                  name={token.name}
                />
              </TokenCard>
            ))}
        </VerticalFlex>
      </Scrollbars>
    </VerticalFlex>
  );
}
