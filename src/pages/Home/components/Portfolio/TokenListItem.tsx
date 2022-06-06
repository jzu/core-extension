import { useSettingsContext } from '@src/contexts/SettingsProvider';
import { TokenCard } from '@avalabs/react-components';

interface TokenListItemProps {
  name: string;
  symbol: string;
  balanceDisplayValue?: string;
  children: any;
  balanceUSD?: string;
  onClick(): void;
}

export function TokenListItem({
  name,
  symbol,
  balanceDisplayValue,
  children,
  balanceUSD,
  onClick,
}: TokenListItemProps) {
  const { currencyFormatter } = useSettingsContext();
  return (
    <TokenCard
      name={name}
      symbol={symbol}
      onClick={onClick}
      balanceDisplayValue={balanceDisplayValue}
      balanceUSD={balanceUSD}
      currencyFormatter={currencyFormatter}
    >
      {children}
    </TokenCard>
  );
}
