import { useState } from 'react';
import {
  AVAX_TOKEN,
  SendState,
  SendSubmitResponse,
} from '@avalabs/wallet-react-components';
import { useConnectionContext } from '@src/contexts/ConnectionProvider';
import { sendAvaxValidateRequest } from '@src/background/services/send/sendAvax/utils/sendAvaxValidateRequest';
import { BN, ChainIdType, Utils } from '@avalabs/avalanche-wallet-sdk';
import { sendAvaxSubmitRequest } from '@src/background/services/send/sendAvax/utils/sendAvaxSubmitRequest';
import { SendStateWithActions } from '../models';

export function useSendAvax(): SendStateWithActions {
  const [sendAvaxState, setSendAvaxState] = useState<SendState>();
  const [txId, setTxId] = useState<string>();
  const { request } = useConnectionContext();

  function parseAndSetState(state: SendState) {
    const parsedState: SendState = {
      ...state,
      amount:
        state?.amount || sendAvaxState?.amount
          ? new BN(state?.amount || sendAvaxState?.amount || 0, 'hex')
          : undefined,
      sendFee: new BN(state.sendFee || 0, 'hex'),
      maxAmount: state.maxAmount && new BN(state.maxAmount, 'hex'),
      gasPrice: state.gasPrice && new BN(state.gasPrice, 'hex'),
    };

    setSendAvaxState(parsedState);
    return parsedState;
  }

  return {
    ...sendAvaxState,
    txId,
    setValues(amount?: string, address?: string) {
      return request(sendAvaxValidateRequest(amount, address))
        .then(parseAndSetState)
        .catch((error: string) => {
          setSendAvaxState({
            ...sendAvaxState,
            error: { message: error },
          } as any);
        });
    },
    reset() {
      setSendAvaxState(undefined);
    },
    submit() {
      const amount = Utils.bnToBig(
        sendAvaxState?.amount || new BN(0),
        AVAX_TOKEN.denomination
      ).toString();
      return request<SendSubmitResponse>(
        sendAvaxSubmitRequest(
          amount,
          sendAvaxState?.targetChain as ChainIdType,
          sendAvaxState?.address as string
        )
      ).then(({ txId }: SendSubmitResponse) => {
        setTxId(txId);
        return txId;
      });
    },
  };
}
