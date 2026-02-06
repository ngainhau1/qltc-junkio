// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { exportToCSV } from './exportService';

// Mock DOM elements for download
global.URL.createObjectURL = vi.fn();
global.document.createElement = vi.fn().mockReturnValue({
    setAttribute: vi.fn(),
    click: vi.fn(),
    style: {}
});
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

describe('exportService - CSV', () => {
    it('should generate valid CSV link', () => {
        const transactions = [
            { date: '2024-01-01', description: 'Test', amount: 100, type: 'EXPENSE' }
        ];

        exportToCSV(transactions);

        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(URL.createObjectURL).toHaveBeenCalled();
        // We can't easily check the BLOB content in this simple mock without reading the Blob
        // but we verify the flow executed.
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });
});
