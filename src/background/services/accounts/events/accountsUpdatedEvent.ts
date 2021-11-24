import { map } from 'rxjs';
import { AccountsEvents } from './models';
import { accounts$ } from '@src/background/services/accounts/accounts';

export function accountsUpdateEvents() {
  //TODO: take this comment out
  return accounts$.pipe(
    map((accounts) => {
      return {
        name: AccountsEvents.ACCOUNTS_UPDATE_EVENT,
        value: accounts,
      };
    })
  );
}
