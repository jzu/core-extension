import {
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  BridgeIcon,
  NotesIcon,
  Stack,
  SwapIcon,
  useTheme,
} from '@avalabs/core-k2-components';
import { isNFT } from '@src/background/services/balances/nft/utils/isNFT';
import {
  TransactionType,
  TxHistoryItem,
} from '@src/background/services/history/models';
import { CollectibleMedia } from '@src/pages/Collectibles/components/CollectibleMedia';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface ActivityCardProp {
  historyItem: TxHistoryItem;
}

export function ActivityCardIcon({ historyItem }: ActivityCardProp) {
  const [txIcon, setTxIcon] = useState<JSX.Element>();
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const getNftIcon = (tx: TxHistoryItem) => (
      <CollectibleMedia
        height={theme.spacing(4)}
        maxHeight={theme.spacing(4)}
        width="auto"
        maxWidth={theme.spacing(4)}
        url={tx.tokens?.[0]?.imageUri}
        hover={false}
        margin="8px 0"
        showPlayIcon={false}
        borderRadius="50%"
      />
    );

    const iconSize = theme.spacing(2);

    const defaultIcon = historyItem.isSender ? (
      <ArrowUpIcon size={iconSize} />
    ) : (
      <ArrowDownIcon size={iconSize} />
    );

    switch (historyItem.type) {
      case TransactionType.BRIDGE:
        setTxIcon(<BridgeIcon size={iconSize} />);
        break;
      case TransactionType.SWAP:
        setTxIcon(<SwapIcon size={iconSize} />);
        break;
      case TransactionType.SEND:
        setTxIcon(<ArrowUpRightIcon size={iconSize} />);
        break;
      case TransactionType.RECEIVE:
        setTxIcon(<ArrowDownLeftIcon size={iconSize} />);
        break;
      case TransactionType.NFT_BUY:
        setTxIcon(getNftIcon(historyItem));
        break;
      case TransactionType.TRANSFER:
        if (historyItem.tokens[0] && isNFT(historyItem.tokens[0]?.type)) {
          setTxIcon(getNftIcon(historyItem));
        } else {
          setTxIcon(defaultIcon);
        }
        break;
      default:
        if (historyItem.isContractCall) {
          setTxIcon(<NotesIcon size={iconSize} />);
          break;
        }
        setTxIcon(defaultIcon);
    }
  }, [t, theme, historyItem]);

  return (
    <Stack
      sx={{
        height: theme.spacing(4),
        width: theme.spacing(4),
        borderRadius: '50%',
        backgroundColor: theme.palette.grey[800],
        justifyContent: 'center',
        alignItems: 'center',
        color: 'secondary.main',
      }}
    >
      {txIcon}
    </Stack>
  );
}
