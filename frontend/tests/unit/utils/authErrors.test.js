import { describe, expect, it } from 'vitest';
import { extractErrorCode, resolveError } from '@/utils/authErrors';

describe('authErrors', () => {
  const t = (key) => key;

  it('maps known backend codes to i18n keys', () => {
    expect(resolveError('INSUFFICIENT_BALANCE', t)).toBe('errors.transactions.insufficientBalance');
  });

  it('maps validation codes to the validation namespace', () => {
    expect(resolveError('VALIDATION_WALLET_ID_INVALID_UUID', t)).toBe(
      'errors.validation.wallet_id_invalid_uuid'
    );
  });

  it('maps import codes to the import namespace', () => {
    expect(resolveError('IMPORT_NO_VALID_TRANSACTIONS', t)).toBe(
      'errors.import.no_valid_transactions'
    );
  });

  it('falls back to the provided i18n key for unknown codes instead of returning raw text', () => {
    expect(resolveError('SOME_NEW_BACKEND_CODE', t, 'common.error')).toBe('common.error');
    expect(resolveError('Unexpected plain text', t, 'auth.loginFailed')).toBe('auth.loginFailed');
  });

  it('extracts backend message codes from common error shapes', () => {
    expect(
      extractErrorCode({
        response: {
          data: {
            message: 'FAMILY_FORBIDDEN',
          },
        },
      })
    ).toBe('FAMILY_FORBIDDEN');
    expect(extractErrorCode(new Error('IMPORT_UPLOAD_FAILED'))).toBe('IMPORT_UPLOAD_FAILED');
    expect(extractErrorCode(null, 'FALLBACK_CODE')).toBe('FALLBACK_CODE');
  });
});
