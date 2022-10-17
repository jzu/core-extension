import {
  CheckmarkIcon,
  HorizontalFlex,
  LoadingSpinnerIcon,
  Card,
  SubTextTypography,
  Typography,
  VerticalFlex,
  WarningIcon,
  TextButton,
} from '@avalabs/react-components';
import styled, { useTheme } from 'styled-components';
import { t } from 'i18next';
import { Trans } from 'react-i18next';

const TroubleshootLink = styled(TextButton)`
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: ${({ theme }) => theme.colors.primary1};
`;

const LedgerCard = styled(Card)<{
  clickable: boolean;
}>`
  background-color: ${({ theme }) => `${theme.colors.bg3}80`};
  border-radius: 8px;
  padding: 16px;
  width: 343px;
  ${({ clickable }) => clickable && `cursor: pointer;`};
`;

export enum LedgerStatus {
  LEDGER_LOADING = 'loading',
  LEDGER_CONNECTED = 'connected',
  LEDGER_CONNECTION_FAILED = 'failed',
}

export function LedgerConnectCard({
  path,
  status,
  onClick,
  onError,
}: {
  path: string;
  status: LedgerStatus;
  onClick: () => void;
  onError(): void;
}) {
  const theme = useTheme();
  const isErrorStatus = LedgerStatus.LEDGER_CONNECTION_FAILED === status;

  return (
    <VerticalFlex margin="16px 0 0 0">
      <SubTextTypography size={12} height="24px">
        {t('Derivation Path')}
      </SubTextTypography>
      <LedgerCard onClick={onClick} clickable={isErrorStatus}>
        <HorizontalFlex width="100%" align="center" justify="space-between">
          <VerticalFlex>
            <Typography margin="4px 0 0" size={18} height="29px" weight={700}>
              {path}
            </Typography>
          </VerticalFlex>
          {/* Icon here */}
          {{
            [LedgerStatus.LEDGER_LOADING]: (
              <LoadingSpinnerIcon height="24px" color={theme.colors.icon1} />
            ),
            [LedgerStatus.LEDGER_CONNECTED]: (
              <CheckmarkIcon height="24px" color={theme.colors.icon1} />
            ),
            [LedgerStatus.LEDGER_CONNECTION_FAILED]: (
              <WarningIcon height="24px" color={theme.colors.icon1} />
            ),
          }[status] || null}
        </HorizontalFlex>
      </LedgerCard>
      {isErrorStatus && (
        <HorizontalFlex margin="6px 0 0" align="center">
          <Typography size={12} height="16px" color={theme.colors.primary1}>
            <Trans
              i18nKey="Unable to connect, view the troubleshoot guide <troubleshoot><link>here</link></troubleshoot>"
              components={{
                troubleshoot: <TroubleshootLink onClick={onError} />,
                link: (
                  <Typography
                    size={12}
                    height="16px"
                    color={theme.colors.primary1}
                    margin="0 0 0 4px"
                  />
                ),
              }}
            />
          </Typography>
        </HorizontalFlex>
      )}
    </VerticalFlex>
  );
}
