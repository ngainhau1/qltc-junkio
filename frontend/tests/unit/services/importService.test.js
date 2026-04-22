// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { parseMock, postMock } = vi.hoisted(() => ({
  parseMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('papaparse', () => ({
  default: {
    parse: parseMock,
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    post: postMock,
  },
}));

import { importFromCSV } from '@/services/importService';

describe('importService', () => {
  beforeEach(() => {
    parseMock.mockReset();
    postMock.mockReset();
  });

  it('throws an internal code when wallet name is not found', async () => {
    parseMock.mockImplementation((_file, options) => {
      options.complete({
        data: [{ wallet: 'Unknown Wallet', amount: '1000', type: 'Expense', description: 'Test' }],
      });
    });

    await expect(importFromCSV(new File(['x'], 'test.csv'), 'default-wallet', [], [])).rejects.toThrow(
      'IMPORT_WALLET_NAME_NOT_FOUND'
    );
  });

  it('throws an internal code when there are no valid transactions', async () => {
    parseMock.mockImplementation((_file, options) => {
      options.complete({
        data: [{ amount: '0', type: 'Expense', description: 'Invalid amount' }],
      });
    });

    await expect(
      importFromCSV(
        new File(['x'], 'test.csv'),
        'default-wallet',
        [{ id: 'default-wallet', name: 'Main Wallet' }],
        []
      )
    ).rejects.toThrow('IMPORT_NO_VALID_TRANSACTIONS');
  });

  it('rethrows backend error codes instead of raw text', async () => {
    parseMock.mockImplementation((_file, options) => {
      options.complete({
        data: [{ amount: '1000', type: 'Expense', description: 'Test', wallet: 'Main Wallet' }],
      });
    });
    postMock.mockRejectedValue({
      response: {
        data: {
          message: 'IMPORT_FAILED',
        },
      },
    });

    await expect(
      importFromCSV(
        new File(['x'], 'test.csv'),
        'default-wallet',
        [{ id: 'default-wallet', name: 'Main Wallet' }],
        []
      )
    ).rejects.toThrow('IMPORT_FAILED');
  });
});
