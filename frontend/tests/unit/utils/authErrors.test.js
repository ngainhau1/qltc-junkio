import { describe, expect, it } from 'vitest';
import { resolveError } from '@/utils/authErrors';

describe('resolveError', () => {
  const t = (key) => key;

  it('maps known backend codes to i18n keys', () => {
    expect(resolveError('INSUFFICIENT_BALANCE', t)).toBe('errors.transactions.insufficientBalance');
  });

  it('falls back to the provided i18n key for unknown codes instead of returning raw text', () => {
    expect(resolveError('SOME_NEW_BACKEND_CODE', t, 'common.error')).toBe('common.error');
    expect(resolveError('Unexpected plain text', t, 'auth.loginFailed')).toBe('auth.loginFailed');
  });
});
