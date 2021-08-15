import {
  BehaviorSubject,
  exhaustMap,
  from,
  interval,
  map,
  merge,
  of,
  skip,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { onboardingStatus } from '../onboarding/onboardingFlows';
import { getMnemonicFromStorage } from './storage';
import { wallet } from './wallet';

export const mnemonicWalletUnlock = new Subject<{ mnemonic: string }>();
export const restartWalletLock = new Subject<boolean>();
/**
 * locked means:
 * IsOnboarded is false OR
 * 1. IsOnboarded is true
 * 2. A mnemonic is in storage
 * 3. There is no wallet instance
 */
export const walletLocked = new BehaviorSubject<
  { locked: boolean } | undefined
>(undefined);

onboardingStatus
  .pipe(
    switchMap(async (state) => {
      if (!state || !state.isOnBoarded) {
        return from(Promise.resolve({ locked: true }));
      }

      // only getting this as a precaution
      const encryptedMnemonic = getMnemonicFromStorage();

      if (!encryptedMnemonic) {
        // this is a problem, state got out of sync somehow. We should be pushing this to
        // some kind of analytics platform
      }

      return wallet.pipe(
        skip(1),
        map((res) => ({ locked: !res }))
      );
    }),
    exhaustMap((value) => value)
  )
  .subscribe((state) => {
    walletLocked.next(state);
  });

const HOURS_12 = 1000 * 60 * 60 * 12;

merge(of({}), restartWalletLock)
  .pipe(switchMap(() => interval(HOURS_12)))
  .subscribe(() => wallet.next(undefined));
