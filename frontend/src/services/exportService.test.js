// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { exportToCSV, exportToPDF } from './exportService';

vi.mock('./pdfFont', () => ({
    loadRobotoBase64: vi.fn().mockResolvedValue(null),
}));

// Mock DOM elements for download
global.URL.createObjectURL = vi.fn();
global.document.createElement = vi.fn().mockReturnValue({
    setAttribute: vi.fn(),
    click: vi.fn(),
    style: {}
});
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();


describe('exportService', () => {
    it('should generate valid CSV link', () => {
        const transactions = [
            { date: '2024-01-01', description: 'Test', amount: 100, type: 'EXPENSE' }
        ];

        exportToCSV(transactions);

        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('should generate valid PDF', async () => {
        const transactions = [
            { date: '2024-01-01', description: 'Test PDF', amount: 200, type: 'INCOME' }
        ];

        await expect(exportToPDF(transactions)).resolves.toBeUndefined();
    });
});
