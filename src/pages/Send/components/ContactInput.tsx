import { useEffect, useRef, useState } from 'react';
import {
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  UserSearchIcon,
} from '@avalabs/k2-components';
import type { Contact } from '@avalabs/types';
import { NetworkVMType } from '@avalabs/chains-sdk';
import { isBech32Address } from '@avalabs/bridge-sdk';
import { isAddress } from 'ethers/lib/utils';
import { useTranslation } from 'react-i18next';

import { ContactSelect } from './ContactSelect';
import { truncateAddress } from '@src/utils/truncateAddress';
import { useIdentifyAddress } from '../hooks/useIdentifyAddress';
import { ContainedDropdown } from '@src/components/common/ContainedDropdown';
import { useNetworkContext } from '@src/contexts/NetworkProvider';
import { useContactsContext } from '@src/contexts/ContactsProvider';
import { isBitcoin } from '@src/utils/isBitcoin';

const truncateName = (name: string) => {
  if (name.length < 28) return name;
  return `${name.substring(0, 28)}...`;
};

type ContactInputProps = {
  contact?: Contact;
  onChange(contact?: Contact, selectedTab?: string): void;
  isContactsOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const ContactInput = ({
  contact,
  onChange,
  isContactsOpen,
  setIsOpen,
}: ContactInputProps) => {
  const { t } = useTranslation();
  const { network } = useNetworkContext();
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const identifyAddress = useIdentifyAddress();
  const { contacts } = useContactsContext();
  const [contactsLength, setContactsLength] = useState(contacts.length);

  useEffect(() => {
    if (contacts.length > contactsLength) {
      const recentlyAddedContact = contacts[contacts.length - 1];
      onChange(recentlyAddedContact);
    }
    setContactsLength(contacts.length);
  }, [contacts, contactsLength, onChange]);

  const changeAndCloseDropdown = (contact: Contact, selectedTab: string) => {
    onChange(contact, selectedTab);
    setIsOpen(!isContactsOpen);
  };

  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const [inputHovered, setInputHovered] = useState<boolean>(false);

  /**
   * For BTC transactions, 'address' is empty.
   * For non-BTC transactions, 'addressBTC' is empty.
   * @see useIdentifyAddress() hook.
   */
  const contactAddress = isBitcoin(network)
    ? contact?.addressBTC
    : contact?.address;

  const isValidAddress = (): boolean => {
    if (network?.vmName === NetworkVMType.EVM) {
      return contact ? isAddress(contact.address) : false;
    }
    if (network?.vmName === NetworkVMType.BITCOIN) {
      return contact && contact.addressBTC
        ? isBech32Address(contact.addressBTC)
        : false;
    }
    return false;
  };

  const getInputDisplayValue = () => {
    if (!contactAddress) {
      return '';
    }
    // Show the full address string when the text field is focused
    if (inputFocused) {
      return contactAddress || '';
    }

    // When address is known, show the contact's name and truncated address
    if (contact?.isKnown) {
      const address = isValidAddress()
        ? truncateAddress(contactAddress)
        : contactAddress;

      return `${truncateName(contact.name)}\n${address}`;
    }

    // For unknown addresses, always show the full address
    return contactAddress;
  };

  return (
    <Stack sx={{ position: 'relative', width: '100%', px: 2 }}>
      <Stack ref={inputWrapperRef} sx={{ gap: 1 }}>
        <Tooltip
          // Tooltip does not render at all when title is empty. Falling back to a single space prevents the input from re-rendering and losing focus when users starts typing.
          title={contactAddress ?? ' '}
          open={!inputFocused && inputHovered && contact?.isKnown}
          sx={{
            flexDirection: 'column',
            gap: 1,
          }}
          placement="top-end"
          PopperProps={{
            anchorEl: inputRef.current,
          }}
        >
          <TextField
            data-testid="send-address-input"
            color="primary"
            fullWidth
            label={t('Sending To')}
            inputLabelProps={{
              sx: { transform: 'none', fontSize: 'body2.fontSize' },
            }}
            inputRef={inputRef}
            InputProps={{
              sx: {
                py: 1,
                pl: 2,
                pr: 1,
              },
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{
                    mt: 2,
                    alignItems: 'end',
                  }}
                >
                  <IconButton
                    onClick={() => setIsOpen(!isContactsOpen)}
                    onMouseEnter={() => setInputHovered(false)}
                  >
                    <UserSearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            onFocus={() => {
              setInputFocused(true);
              setIsOpen(false);
            }}
            onBlur={() => setInputFocused(false)}
            onMouseEnter={() => setInputHovered(true)}
            onMouseLeave={() => setInputHovered(false)}
            placeholder={t('Input an Address')}
            multiline
            minRows={2}
            onChange={(e) => {
              onChange(identifyAddress(e.target.value));
            }}
            value={getInputDisplayValue()}
          />
        </Tooltip>
        <ContainedDropdown
          anchorEl={inputWrapperRef}
          isOpen={isContactsOpen}
          setIsOpen={setIsOpen}
        >
          <ContactSelect
            onChange={changeAndCloseDropdown}
            selectedContact={contact}
          />
        </ContainedDropdown>
      </Stack>
    </Stack>
  );
};
