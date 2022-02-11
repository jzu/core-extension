import { HorizontalFlex, LoadingSpinnerIcon } from '@avalabs/react-components';
import { useTheme } from 'styled-components';

export function SwapLoadingSpinnerIcon() {
  const theme = useTheme();
  return (
    <HorizontalFlex align="center" justify="center" padding="16px 0">
      <LoadingSpinnerIcon color={theme.colors.icon1} height="16px" />
    </HorizontalFlex>
  );
}
