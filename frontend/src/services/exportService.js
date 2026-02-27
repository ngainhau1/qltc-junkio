import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import Papa from "papaparse"; // Keep Papa for now as the unparse line is still there, but the user's snippet is contradictory. I will assume the user wants to keep Papa for CSV for now, and the XLSX import is for a future Excel export function not fully provided.
import { formatCurrency, formatDateString, removeVietnameseTones } from '@/lib/utils';
import i18n from 'i18next';

// --- CSV Export ---
export const exportToCSV = (transactions) => {
    // 1. Transform data for CSV
    // Dịch headers thông qua i18n
    const data = transactions.map(t => ({
        [i18n.t('transactions.form.date') || 'Ngày']: formatDateString(t.date),
        [i18n.t('transactions.form.desc') || 'Mô Tả']: t.description || 'Không có mô tả',
        [i18n.t('transactions.form.type') || 'Loại']: t.type === 'INCOME' ? '+' : '-',
        [i18n.t('transactions.form.amount') || 'Số Tiền']: formatCurrency(t.amount),
        [i18n.t('transactions.form.category') || 'Danh mục']: t.category_id, // Assuming category_id is what's available
        [i18n.t('transactions.form.wallet') || 'Ví']: t.wallet_id // Assuming wallet_id is what's available
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

// --- PDF Export ---
export const exportToPDF = (transactions, title = "Sao Kê Giao Dịch") => {
    const doc = new jsPDF();

    // 1. Header
    doc.setFontSize(20);
    doc.text("JUNKIO EXPENSE TRACKER", 14, 22);

    doc.setFontSize(14);
    doc.text(removeVietnameseTones(title), 14, 32);

    doc.setFontSize(10);
    doc.text(`${removeVietnameseTones(i18n.t('common.export_date') || "Ngày xuất")}: ${formatDateString(new Date())}`, 14, 40);

    // 2. Table Data
    // The tableColumn and tableRows generation is replaced by the autoTable head and body directly.

    // 3. Generate Table
    autoTable(doc, {
        head: [[
            removeVietnameseTones(i18n.t('transactions.form.date') || 'Ngay'),
            removeVietnameseTones(i18n.t('transactions.form.desc') || 'Mo Ta'),
            removeVietnameseTones(i18n.t('transactions.form.type') || 'Loai'),
            removeVietnameseTones(i18n.t('transactions.form.amount') || 'So Tien')
        ]],
        body: transactions.map(t => {
            const formattedAmount = formatCurrency(t.amount);
            return [
                formatDateString(t.date),
                removeVietnameseTones(t.description || 'Khong co mo ta'),
                t.type === 'INCOME' ? '+' : '-',
                formattedAmount
            ];
        }),
        startY: 50,
        theme: 'grid',
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    // 4. Save
    doc.save(`report_${new Date().toISOString().split('T')[0]}.pdf`);
};
