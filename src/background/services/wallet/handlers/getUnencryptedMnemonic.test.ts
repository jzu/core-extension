import { buildRpcCall } from '@src/tests/test-utils';
import { LockService } from '../../lock/LockService';
import { SecretType } from '../../secrets/models';
import { SecretsService } from '../../secrets/SecretsService';
import { GetUnencryptedMnemonicHandler } from './getUnencryptedMnemonic';

describe('src/background/services/wallet/handlers/getUnencryptedMnemonic.ts', () => {
  const lockService: jest.Mocked<LockService> = {
    verifyPassword: jest.fn(),
  } as any;
  const secretsService: jest.Mocked<SecretsService> = {
    getActiveAccountSecrets: jest.fn(),
  } as any;

  const buildHandler = () =>
    new GetUnencryptedMnemonicHandler(secretsService, lockService);

  it('returns error if password is invalid', async () => {
    lockService.verifyPassword.mockResolvedValue(false);

    const handler = buildHandler();

    expect(
      await handler.handle(buildRpcCall({ params: ['abcd'] } as any))
    ).toEqual(
      expect.objectContaining({
        error: 'Password invalid',
      })
    );
  });

  it('returns error if storage does not contain mnemonic', async () => {
    lockService.verifyPassword.mockResolvedValue(true);
    secretsService.getActiveAccountSecrets.mockResolvedValue({
      secretType: SecretType.Ledger,
    } as any);

    const handler = buildHandler();

    expect(
      await handler.handle(buildRpcCall({ params: ['abcd'] } as any))
    ).toEqual(
      expect.objectContaining({
        error: 'Not a MnemonicWallet',
      })
    );
  });

  it('returns the mnemonic properly', async () => {
    const mnemonic = 'super-complex-mnemonic';
    lockService.verifyPassword.mockResolvedValue(true);
    secretsService.getActiveAccountSecrets.mockResolvedValue({
      secretType: SecretType.Mnemonic,
      mnemonic,
    } as any);
    const handler = buildHandler();

    expect(
      await handler.handle(buildRpcCall({ params: ['abcd'] } as any))
    ).toEqual(
      expect.objectContaining({
        result: mnemonic,
      })
    );
  });
});
