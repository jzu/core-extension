import { TokensPriceShortData } from '../../tokens/models';

export function getPriceChangeValues(
  tokenSymbol: string,
  balanceUSD?: number,
  priceChanges?: TokensPriceShortData
) {
  if (!priceChanges) {
    return {
      percentage: undefined,
      value: 0,
    };
  }
  const symbol = tokenSymbol.toLowerCase();
  const tokenChangePercentage = priceChanges[symbol]?.priceChangePercentage;
  const tokenChangeValue =
    (balanceUSD || 0) *
    ((priceChanges[symbol]?.priceChangePercentage || 0) / 100);

  return {
    percentage: tokenChangePercentage,
    value: tokenChangeValue,
  };
}
