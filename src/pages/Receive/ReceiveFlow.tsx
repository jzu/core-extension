import {
  ContextContainer,
  useIsSpecificContextContainer,
} from '@src/hooks/useIsSpecificContextContainer';
import { Receive } from './Receive';
import { ReceiveMiniMode } from './Receive.minimode';

export function ReceiveFlow() {
  const isMiniMode = useIsSpecificContextContainer(ContextContainer.POPUP);
  return isMiniMode ? <ReceiveMiniMode /> : <Receive />;
}
