import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { formatCurrency, formatDateString } from '@/lib/utils';
import i18n from 'i18next';
import { robotoBase64 } from './Roboto-Regular-normal';

// --- CSV Export ---
export const exportToCSV = (transactions) => {
    // 1. Transform data for CSV
    // Dịch headers thông qua i18n
    const data = transactions.map(t => ({
        [i18n.t('transactions.form.date') || 'Ngày']: formatDateString(t.date),
        [i18n.t('transactions.form.desc') || 'Mô Tả']: t.description || 'Không có mô tả',
        [i18n.t('transactions.form.type') || 'Loại']: t.type === 'INCOME' ? '+' : '-',
        [i18n.t('transactions.form.amount') || 'Số Tiền']: formatCurrency(t.amount),
        [i18n.t('transactions.form.category') || 'Danh mục']: t.category_id,
        [i18n.t('transactions.form.wallet') || 'Ví']: t.wallet_id
    }));

    // 2. Generate CSV
    const csv = Papa.unparse(data);

    // 3. Trigger Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Excel Export ---
export const exportToExcel = (transactions, title = "Sao Kê Giao Dịch") => {
    const data = transactions.map(t => ({
        [i18n.t('transactions.form.date') || 'Ngày']: formatDateString(t.date),
        [i18n.t('transactions.form.desc') || 'Mô Tả']: t.description || 'Không có mô tả',
        [i18n.t('transactions.form.type') || 'Loại']: t.type === 'INCOME' ? 'Thu' : 'Chi',
        [i18n.t('transactions.form.amount') || 'Số Tiền']: Number(t.amount)
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
export const exportToPDF = (transactions, title = "Sao Kê Giao Dịch") => {
    const doc = new jsPDF();

    // Add custom font for UTF-8 Support
    doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto"); // Set default font to our custom font

    // 1. Header
    doc.setFontSize(20);
    doc.text("JUNKIO EXPENSE TRACKER", 14, 22);

    doc.setFontSize(14);
    doc.text(title, 14, 32);

    doc.setFontSize(10);
    doc.text(`${i18n.t('common.export_date') || "Ngày xuất"}: ${formatDateString(new Date())}`, 14, 40);

    // 2. Generate Table
    autoTable(doc, {
        head: [[
            i18n.t('transactions.form.date') || 'Ngày',
            i18n.t('transactions.form.desc') || 'Mô Tả',
            i18n.t('transactions.form.type') || 'Loại',
            i18n.t('transactions.form.amount') || 'Số Tiền'
        ]],
        body: transactions.map(t => {
            const formattedAmount = formatCurrency(t.amount);
            return [
                formatDateString(t.date),
                t.description || 'Không có mô tả',
                t.type === 'INCOME' ? '+' : '-',
                formattedAmount
            ];
        }),
        startY: 50,
        theme: 'grid',
        styles: { font: "Roboto", fontSize: 10 }, // Use Roboto here too
        headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    // 4. Save
    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
};
