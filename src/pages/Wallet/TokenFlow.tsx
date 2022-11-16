import {
  VerticalFlex,
  Typography,
  HorizontalFlex,
  SubTextTypography,
  LoadingIcon,
  SecondaryButton,
  ComponentSize,
} from '@avalabs/react-components';
import { PageTitle } from '@src/components/common/PageTitle';
import { TokenIcon } from '@src/components/common/TokenImage';
import { useSettingsContext } from '@src/contexts/SettingsProvider';
import { useSetSendDataInParams } from '@src/hooks/useSetSendDataInParams';
import { useTokenFromParams } from '@src/hooks/useTokenFromParams';
import { useTokensWithBalances } from '@src/hooks/useTokensWithBalances';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { Activity } from '../Activity/Activity';
import { useTranslation } from 'react-i18next';

export function TokenFlow() {
  const { t } = useTranslation();
  const history = useHistory();
  const { currencyFormatter } = useSettingsContext();
  const token = useTokenFromParams();
  const tokensWithBalances = useTokensWithBalances();
  const [showSend, setShowSend] = useState<boolean>();
  const setSendDataInParams = useSetSendDataInParams();

  useEffect(() => {
    setShowSend(!!tokensWithBalances.length);
  }, [tokensWithBalances]);

  if (!token || showSend === undefined) {
    return <LoadingIcon />;
  }

  const balanceCurrencyValue = token.balanceUsdDisplayValue ?? token.balanceUSD;

  return (
    <VerticalFlex width={'100%'} position="relative">
      <PageTitle>{t('Token Details')}</PageTitle>
      <HorizontalFlex width={'100%'} padding="8px 16px" justify={'center'}>
        <TokenIcon
          height={'40px'}
          width={'40px'}
          src={token.logoUri}
          name={token.name}
        />
        <VerticalFlex flex={1} margin={'0 0 0 16px'}>
          <Typography
            data-testid="token-details-name"
            size={18}
            weight={'bold'}
            height="22px"
          >
            {token.name}
          </Typography>
          <SubTextTypography
            data-testid="token-details-balance"
            size={14}
            height="17px"
            margin={'4px 0 0'}
          >
            {token.balanceDisplayValue} {token.symbol}
          </SubTextTypography>
        </VerticalFlex>
        <Typography
          data-testid="token-details-currency-balance"
          size={14}
          height="24px"
        >
          {balanceCurrencyValue &&
            currencyFormatter(Number(balanceCurrencyValue))}
        </Typography>
      </HorizontalFlex>
      <HorizontalFlex justify="center" margin="24px 16px">
        <SecondaryButton
          data-testid="token-details-receive-button"
          size={ComponentSize.LARGE}
          onClick={() => history.push('/receive')}
        >
          {t('Receive')}
        </SecondaryButton>
        <SecondaryButton
          data-testid="token-details-send-button"
          size={ComponentSize.LARGE}
          margin="0 0 0 16px"
          onClick={() =>
            setSendDataInParams({ token, options: { path: '/send' } })
          }
        >
          {t('Send')}
        </SecondaryButton>
      </HorizontalFlex>
      <VerticalFlex grow="1" padding="0 16px">
        <Activity tokenSymbolFilter={token.symbol} isEmbedded />
      </VerticalFlex>
    </VerticalFlex>
  );
}
