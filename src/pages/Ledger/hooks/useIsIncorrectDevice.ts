import { getEvmAddressFromPubKey } from '@avalabs/wallets-sdk';
import { WalletType } from '@src/background/services/wallet/models';
import { useAccountsContext } from '@src/contexts/AccountsProvider';
import { LedgerAppType, useLedgerContext } from '@src/contexts/LedgerProvider';
import { useWalletContext } from '@src/contexts/WalletProvider';
import { useEffect, useState } from 'react';
import { MigrateMissingPublicKeysFromLedgerHandler } from '@src/background/services/ledger/handlers/migrateMissingPublicKeysFromLedger';
import { ExtensionRequest } from '@src/background/connections/extensionConnection/models';
import { useConnectionContext } from '@src/contexts/ConnectionProvider';

const useIsIncorrectDevice = () => {
  const [isIncorrectDevice, setIsIncorrectDevice] = useState<boolean>(false);
  const { isWalletLocked, walletType, derivationPath } = useWalletContext();
  const { request } = useConnectionContext();
  const { hasLedgerTransport, getPublicKey, getBtcPublicKey, appType } =
    useLedgerContext();
  const { accounts } = useAccountsContext();
  const firstAddress = accounts.primary[0]?.addressC;

  useEffect(() => {
    const compareAddresses = async () => {
      setIsIncorrectDevice(false);

      if (
        !isWalletLocked &&
        walletType === WalletType.LEDGER &&
        hasLedgerTransport &&
        derivationPath
      ) {
        try {
          const getPublicKeyByAppType = async () => {
            if (appType === LedgerAppType.AVALANCHE) {
              return getPublicKey(0, derivationPath);
            } else if (appType === LedgerAppType.BITCOIN) {
              return getBtcPublicKey(0, derivationPath);
            } else {
              throw new Error(`App type '${appType}' not supported`);
            }
          };

          if (firstAddress && appType !== LedgerAppType.UNKNOWN) {
            const pubKey = await getPublicKeyByAppType();
            const address = getEvmAddressFromPubKey(pubKey);
            const isMatching = firstAddress === address;

            setIsIncorrectDevice(!isMatching);

            if (isMatching && appType === LedgerAppType.AVALANCHE) {
              // Attempt to migrate missing X/P public keys (if there's any) once the device is verified
              await request<MigrateMissingPublicKeysFromLedgerHandler>({
                method: ExtensionRequest.LEDGER_MIGRATE_MISSING_PUBKEYS,
              });
            }
          }
        } catch (err) {
          // some problem occured with the app
          // just wait until LedgerProvider recreates the app instance
        }
      }
    };

    compareAddresses();
  }, [
    isWalletLocked,
    walletType,
    derivationPath,
    firstAddress,
    getPublicKey,
    hasLedgerTransport,
    appType,
    getBtcPublicKey,
    request,
  ]);

  return isIncorrectDevice;
};

export default useIsIncorrectDevice;
