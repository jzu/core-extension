import {
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  DerivationPath,
} from '@avalabs/wallets-sdk';
import {
  FireblocksApiData,
  FireblocksImportData,
  ImportType,
} from '../accounts/models';
import { UnsignedTx } from '@avalabs/avalanchejs-v2';
import { SignerSessionData } from '@cubist-labs/cubesigner-sdk';
import { TransactionRequest } from 'ethers';

export type SignTransactionRequest =
  | TransactionRequest
  | BtcTransactionRequest
  | AvalancheTransactionRequest;

export interface BtcTransactionRequest {
  inputs: BitcoinInputUTXO[];
  outputs: BitcoinOutputUTXO[];
}

export interface AvalancheTransactionRequest {
  tx: UnsignedTx;
  externalIndices?: number[];
  internalIndices?: number[];
}

export interface WalletLockedState {
  locked: boolean;
}

export interface WalletSecretInStorage {
  derivationPath: DerivationPath;
  mnemonic?: string;
  // Extended public key of m/44'/60'/0'
  xpub?: string;
  /**
   * 	Extended public key of m/44'/9000'/0'
   * 	Used X/P chain derivation on mnemonic and Ledger (BIP44) wallets.
   */
  xpubXP?: string;
  pubKeys?: PubKeyType[];
  imported?: Record<
    string,
    | {
        type: ImportType.PRIVATE_KEY;
        secret: string;
      }
    | {
        type: ImportType.WALLET_CONNECT;
        addresses: {
          addressC: string;
        };
        pubKey?: PubKeyType;
      }
    | ({ type: ImportType.FIREBLOCKS } & FireblocksImportData['data'])
  >;
  authProvider?: SeedlessAuthProvider;
  masterFingerprint?: string;
  seedlessSignerToken?: SignerSessionData;
  btcWalletPolicyDetails?: BtcWalletPolicyDetails;
}

export type PrivateKeyWalletData = {
  type: ImportType.PRIVATE_KEY;
  secret: string;
};

export type WalletConnectWalletData = {
  type: ImportType.WALLET_CONNECT;
  addresses: {
    addressC: string;
  };
  pubKey?: PubKeyType;
};

export type FireblocksWalletData = {
  type: ImportType.FIREBLOCKS;
  addresses: {
    addressC: string;
    addressBTC?: string;
  };
  api?: FireblocksApiData;
};

export type ImportedWalletData =
  | PrivateKeyWalletData
  | WalletConnectWalletData
  | FireblocksWalletData;

export enum WalletEvents {
  WALLET_STATE_UPDATE = 'wallet-state-updated',
}

export const WALLET_STORAGE_KEY = 'wallet';

export enum WalletType {
  SEEDLESS = 'SEEDLESS',
  MNEMONIC = 'MNEMONIC',
  LEDGER = 'LEDGER',
  KEYSTONE = 'KEYSTONE',
}

export enum SeedlessAuthProvider {
  Google = 'google',
}

export type BtcWalletPolicyDetails = {
  hmacHex: string;
  /**
   * Extended public key of m/44'/60'/n
   */
  xpub: string;
  masterFingerprint: string;
  name: string;
};

/**
 * Used for Ledger Live accounts on ledger.
 */
export type PubKeyType = {
  evm: string;
  /**
   * Public keys used for X/P chain are from a different derivation path.
   */
  xp?: string;
  btcWalletPolicyDetails?: BtcWalletPolicyDetails;
};

export type SigningResult =
  | { txHash: string; signedTx?: never }
  | { signedTx: string; txHash?: never };
