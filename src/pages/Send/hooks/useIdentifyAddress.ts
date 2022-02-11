import { Contact } from '@src/background/services/contacts/models';
import { useAccountsContext } from '@src/contexts/AccountsProvider';
import { useContactsContext } from '@src/contexts/ContactsProvider';
import { useCallback } from 'react';

const UNSAVED_CONTACT_BASE = {
  id: '',
  name: 'Unsaved Address',
  isKnown: false,
};

export const useIdentifyAddress = () => {
  const { contacts } = useContactsContext();
  const { accounts } = useAccountsContext();

  /**
   * Identifies if an address exists in the accounts or contacts
   */
  const identifyAddress = useCallback(
    (address: string): Contact => {
      if (!address) return { ...UNSAVED_CONTACT_BASE, address: '' };
      const addressLowerCase = address.toLowerCase();
      for (const contact of contacts) {
        if (contact.address.toLowerCase() === addressLowerCase) {
          return { id: contact.id, address, name: contact.name, isKnown: true };
        }
      }
      for (const account of accounts) {
        if (account.addressC.toLowerCase() === addressLowerCase)
          return { id: '', address, name: account.name, isKnown: true };
      }
      return {
        ...UNSAVED_CONTACT_BASE,
        address,
      };
    },
    [accounts, contacts]
  );

  return identifyAddress;
};
