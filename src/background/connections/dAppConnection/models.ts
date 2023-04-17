export enum DAppProviderRequest {
  DOMAIN_METADATA_METHOD = 'metamask_sendDomainMetadata',
  CONNECT_METHOD = 'eth_requestAccounts',
  INIT_DAPP_STATE = 'metamask_getProviderState',
  ETH_ACCOUNTS = 'eth_accounts',
  WALLET_PERMISSIONS = 'wallet_requestPermissions',
  WALLET_GET_PERMISSIONS = 'wallet_getPermissions',
  WALLET_ADD_CHAIN = 'wallet_addEthereumChain',
  WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
  WALLET_WATCH_ASSET = 'wallet_watchAsset',
  ETH_SEND_TX = 'eth_sendTransaction',
  PERSONAL_EC_RECOVER = 'personal_ecRecover',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
  ETH_SIGN = 'eth_sign',
  GET_IS_DEFAULT_EXTENSION = 'avalanche_getIsDefaultExtensionState',
  AVALANCHE_GET_CONTACTS = 'avalanche_getContacts',
  AVALANCHE_CREATE_CONTACT = 'avalanche_createContact',
  AVALANCHE_UPDATE_CONTACT = 'avalanche_updateContact',
  AVALANCHE_REMOVE_CONTACT = 'avalanche_removeContact',
  AVALANCHE_GET_ACCOUNTS = 'avalanche_getAccounts',
  AVALANCHE_GET_ADDRESSES_IN_RANGE = 'avalanche_getAddressesInRange',
  AVALANCHE_BRIDGE_ASSET = 'avalanche_bridgeAsset',
  AVALANCHE_GET_BRIDGE_STATE = 'avalanche_getBridgeState',
  AVALANCHE_SELECT_WALLET = 'avalanche_selectWallet',
  AVALANCHE_SET_DEVELOPER_MODE = 'avalanche_setDeveloperMode',
  ACCOUNT_SELECT = 'avalanche_selectAccount',
  AVALANCHE_GET_ACCOUNT_PUB_KEY = 'avalanche_getAccountPubKey',
  AVALANCHE_SEND_TRANSACTION = 'avalanche_sendTransaction',
  AVALANCHE_SIGN_TRANSACTION = 'avalanche_signTransaction',
  BITCOIN_SEND_TRANSACTION = 'bitcoin_sendTransaction',
}

export enum Web3Event {
  ACCOUNTS_CHANGED = 'metamask_accountsChanged',
  UNLOCK_STATE_CHANGED = 'metamask_unlockStateChanged',
  CHAIN_CHANGED = 'metamask_chainChanged',
}
