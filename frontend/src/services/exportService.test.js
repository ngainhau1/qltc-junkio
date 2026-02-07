// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { exportToCSV, exportToPDF } from './exportService';

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

    it('should generate valid PDF', () => {
        const transactions = [
            { date: '2024-01-01', description: 'Test PDF', amount: 200, type: 'INCOME' }
        ];

        // We just want to ensure it runs without error (doc.autoTable is found)
        // and doc.save is called.
        // We know jsPDF is used internally.
        expect(() => exportToPDF(transactions)).not.toThrow();
    });
});

