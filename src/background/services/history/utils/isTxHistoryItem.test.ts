import {
  PchainTxHistoryItem,
  TransactionType,
  TxHistoryItem,
  XchainTxHistoryItem,
} from '../models';
import { TokenType } from '../../balances/models';
import { isPchainTxHistoryItem, isTxHistoryItem } from './isTxHistoryItem';
import {
  PChainTransactionType,
  XChainTransactionType,
} from '@avalabs/glacier-sdk';

describe('src/background/services/history/utils/isTxHistoryItem.ts', () => {
  const txHistoryItem: TxHistoryItem = {
    isBridge: false,
    isContractCall: true,
    isIncoming: false,
    isOutgoing: true,
    isSender: true,
    timestamp: 'timestamp',
    hash: 'hash',
    from: 'from',
    to: 'to',
    tokens: [
      {
        name: 'tokenName',
        symbol: 'tokenSymbol',
        amount: 'tokenAmount',
        type: TokenType.NATIVE,
      },
    ],
    gasUsed: 'gasUsed',
    explorerLink: 'explorerLink',
    chainId: 'chainId',
    type: TransactionType.SEND,
  };
  const pchainTxHistoryItem: PchainTxHistoryItem = {
    isSender: true,
    timestamp: 'timestamp',
    from: ['from'],
    to: ['to'],
    token: {
      name: 'tokenName',
      symbol: 'tokenSymbol',
      amount: 'amount',
      type: TokenType.NATIVE,
    },
    gasUsed: 'gasUsed',
    explorerLink: 'explorerLink',
    chainId: 'chainId',
    type: PChainTransactionType.BASE_TX,
    vmType: 'PVM',
  };

  const xchainTxHistoryItem: XchainTxHistoryItem = {
    ...pchainTxHistoryItem,
    type: XChainTransactionType.BASE_TX,
    vmType: 'AVM',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('isTxHistoryItem', () => {
    it('should return true when the tx is txHistoryItem', () => {
      const result = isTxHistoryItem(txHistoryItem);
      expect(result).toBe(true);
    });
    it('should return false when the tx is not txHistoryItem', () => {
      const result = isTxHistoryItem(pchainTxHistoryItem);
      expect(result).toBe(false);
      const result2 = isTxHistoryItem(xchainTxHistoryItem);
      expect(result2).toBe(false);
    });
  });

  describe('isPchainTxHistoryItem', () => {
    it('should return true when the tx is PchainTxHistoryItem', () => {
      const result = isPchainTxHistoryItem(pchainTxHistoryItem);
      expect(result).toBe(true);
    });
    it('should return false when the tx is not PchainTxHistoryItem', () => {
      const result = isPchainTxHistoryItem(txHistoryItem);
      expect(result).toBe(false);
      const result2 = isPchainTxHistoryItem(xchainTxHistoryItem);
      expect(result2).toBe(false);
    });
  });
});
