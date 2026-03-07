import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { formatCurrency, formatDateString } from '@/lib/utils';
import { robotoBase64 } from './Roboto-Regular-normal';

// --- CSV Export ---
export const exportToCSV = (transactions) => {
    // 1. Transform data for CSV - Using English to prevent encoding/font issues
    const data = transactions.map(t => ({
        'Date': formatDateString(t.date),
        'Description': t.description || 'No description',
        'Type': t.type,
        'Amount': parseFloat(t.amount), // Emit raw number for Excel sum formulas, not text
        'Category': t.category_id,
        'Wallet ID': t.wallet_id
    }));

    // 2. Generate CSV
    const csv = Papa.unparse(data);

    // 3. Trigger Download
    // \uFEFF is the UTF-8 Byte Order Mark (BOM). Required for Excel to recognize UTF-8 in CSVs.
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Excel Export ---
export const exportToExcel = (transactions) => {
    // Using English headers and Raw Numbers
    const data = transactions.map(t => ({
        'Date': formatDateString(t.date),
        'Description': t.description || 'No description',
        'Type': t.type,
        'Amount': parseFloat(t.amount) // Raw Number so Excel treats it as a calculator digit
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Auto-size columns slightly
    worksheet['!cols'] = [
        { wch: 15 }, // Date
        { wch: 40 }, // Description
        { wch: 10 }, // Type
        { wch: 20 }, // Amount
    ];

    XLSX.writeFile(workbook, `report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// --- PDF Export ---
export const exportToPDF = (transactions, title = "Transaction Statement") => {
    const doc = new jsPDF();

    // Still load custom font to safely render user descriptions that might contain Unicode
    doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    // 1. Header
    doc.setFontSize(20);
    doc.text("JUNKIO EXPENSE TRACKER", 14, 22);

    doc.setFontSize(14);
    doc.text(title, 14, 32);

    doc.setFontSize(10);
    doc.text(`Export Date: ${formatDateString(new Date())}`, 14, 40);

    // 2. Generate Table
    autoTable(doc, {
        head: [[
            'Date',
            'Description',
            'Type',
            'Amount'
        ]],
        body: transactions.map(t => {
            const formattedAmount = formatCurrency(t.amount); // Keep string format for PDF visuals
            return [
                formatDateString(t.date),
                t.description || 'No description',
                t.type === 'INCOME' ? 'INC' : (t.type === 'EXPENSE' ? 'EXP' : 'TRF'),
                formattedAmount
            ];
        }),
        startY: 50,
        theme: 'grid',
        styles: { font: "Roboto", fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    // 4. Save
    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
};
