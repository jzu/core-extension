import Joi from 'joi';
import { ChainId, Network } from '@avalabs/chains-sdk';
import { runtime } from 'webextension-polyfill';
import { chainIdToCaip } from '@src/utils/caipConversion';

const VERSION = 4;

type PreviousSchema = {
  activeNetworkId: number | null;
  favoriteNetworks: number[];
  customNetworks: Record<number, Network>;
};
const previousSchema = Joi.object();

const up = async (networkStorage: PreviousSchema) => {
  const { activeNetworkId, ...storage } = networkStorage;

  const scope = chainIdToCaip(activeNetworkId ?? ChainId.AVALANCHE_MAINNET_ID);

  return {
    ...storage,
    dAppScopes: {
      [runtime.id]: scope,
    },
    version: VERSION,
  };
};

export default {
  previousSchema,
  up,
};
