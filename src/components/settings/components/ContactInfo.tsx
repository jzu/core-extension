import type { Contact } from '@avalabs/types';
import { SimpleAddressK2 } from '@src/components/common/SimpleAddressK2';
import {
  Stack,
  Typography,
  AvalancheColorIcon,
  BitcoinColorIcon,
} from '@avalabs/k2-components';

export const ContactInfo = ({ contact }: { contact: Contact }) => {
  return (
    <Stack
      sx={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="body1"
        title={contact.name}
        sx={{
          maxWidth: '95%',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontWeight: 'fontWeightSemibold',
        }}
      >
        {contact.name}
      </Typography>
      <Stack>
        {contact.address && (
          <Stack
            sx={{ flexDirection: 'row', alignItems: 'center', width: '120px' }}
            data-testid="contact-li-copy-ava-address"
          >
            <AvalancheColorIcon
              sx={{
                mr: 0.5,
              }}
              size={16}
            />
            <SimpleAddressK2 address={contact.address} />
          </Stack>
        )}
        {contact.addressBTC && (
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '120px',
              mt: 1,
            }}
            data-testid="contact-li-copy-btc-address"
          >
            <BitcoinColorIcon
              sx={{
                mr: 0.5,
              }}
              size={16}
            />
            <SimpleAddressK2 address={contact.addressBTC} />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
