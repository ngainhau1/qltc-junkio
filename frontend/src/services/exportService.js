import Papa from 'papaparse';
import api from '@/lib/api';
import { cleanQueryParams } from '@/features/finance/context';
import { formatDateString } from '@/lib/utils';
import i18n from '@/lib/i18n';

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const getTodaySuffix = () => new Date().toISOString().split('T')[0];

const normalizeRows = (rows) =>
    rows.map((row) =>
        Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value ?? ''])
        )
    );

const transactionToRow = (transaction) => ({
    [i18n.t('export.date')]: formatDateString(transaction.date || transaction.transaction_date || transaction.createdAt),
    [i18n.t('export.description')]: transaction.description || i18n.t('export.noDescription'),
    [i18n.t('export.type')]: transaction.type,
    [i18n.t('export.amount')]: Number(transaction.amount || 0),
    [i18n.t('export.category')]: transaction.Category?.name || transaction.category_id || '',
    [i18n.t('export.wallet')]: transaction.Wallet?.name || transaction.wallet_id || '',
});

const reportDataToRows = (reportData) => {
    const summary = reportData?.summary || {};
    const expenseByCategory = Array.isArray(reportData?.expenseByCategory) ? reportData.expenseByCategory : [];
    const cashflowSeries = Array.isArray(reportData?.cashflowSeries) ? reportData.cashflowSeries : [];

    return [
        {
            [i18n.t('export.section')]: i18n.t('export.summary'),
            [i18n.t('export.metric')]: i18n.t('export.totalIncome'),
            [i18n.t('export.value')]: Number(summary.totalIncome || 0),
        },
        {
            [i18n.t('export.section')]: i18n.t('export.summary'),
            [i18n.t('export.metric')]: i18n.t('export.totalExpense'),
            [i18n.t('export.value')]: Number(summary.totalExpense || 0),
        },
        {
            [i18n.t('export.section')]: i18n.t('export.summary'),
            [i18n.t('export.metric')]: i18n.t('export.net'),
            [i18n.t('export.value')]: Number(summary.net || 0),
        },
        {
            [i18n.t('export.section')]: i18n.t('export.summary'),
            [i18n.t('export.metric')]: i18n.t('export.transactionCount'),
            [i18n.t('export.value')]: Number(summary.transactionCount || 0),
        },
        ...expenseByCategory.map((item) => ({
            [i18n.t('export.section')]: i18n.t('export.expenseByCategory'),
            [i18n.t('export.metric')]: item.name,
            [i18n.t('export.value')]: Number(item.value || 0),
        })),
        ...cashflowSeries.map((item) => ({
            [i18n.t('export.section')]: i18n.t('export.cashflow'),
            [i18n.t('export.metric')]: item.date,
            [i18n.t('export.income')]: Number(item.income || 0),
            [i18n.t('export.expense')]: Number(item.expense || 0),
        })),
    ];
};

export const exportRowsToCSV = (rows, filename = `export_${getTodaySuffix()}.csv`) => {
    const csv = Papa.unparse(normalizeRows(rows));
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
};

export const exportRowsToExcel = async (
    rows,
    filename = `report_${getTodaySuffix()}.xlsx`,
    sheetName = 'Data'
) => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(normalizeRows(rows));
    const workbook = XLSX.utils.book_new();

    worksheet['!cols'] = Object.keys(rows[0] || { Data: '' }).map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
};

export const exportRowsToPDF = async (
    rows,
    {
        title = '',
        filename = `report_${getTodaySuffix()}.pdf`,
    } = {}
) => {
    const [{ default: jsPDF }, { default: autoTable }, { robotoBase64 }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        import('./Roboto-Regular-normal'),
    ]);

    const normalizedRows = normalizeRows(rows);
    const columns = Object.keys(normalizedRows[0] || { Data: '' });
    const doc = new jsPDF();

    doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(20);
    doc.text(i18n.t('export.titleTracker'), 14, 22);
    doc.setFontSize(14);
    doc.text(title || i18n.t('export.titleDefault'), 14, 32);
    doc.setFontSize(10);
    doc.text(`${i18n.t('export.exportDate')} ${formatDateString(new Date())}`, 14, 40);

    autoTable(doc, {
        head: [columns],
        body: normalizedRows.map((row) => columns.map((column) => row[column])),
        startY: 50,
        theme: 'grid',
        styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 10 },
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'normal' },
    });

    doc.save(filename);
};

export const fetchAllTransactionsForExport = async (params = {}) => {
    const limit = 500;
    const transactions = [];
    let page = 1;
    let totalPages = 1;

    do {
        const response = await api.get('/transactions', {
            params: cleanQueryParams({
                ...params,
                page,
                limit,
            }),
        });

        const data = response.data;
        transactions.push(...(data.transactions || []));
        totalPages = data.totalPages || 1;
        page += 1;
    } while (page <= totalPages);

    return transactions;
};

export const exportTransactionRowsToCSV = (transactions) =>
    exportRowsToCSV(transactions.map(transactionToRow), `transactions_${getTodaySuffix()}.csv`);

export const exportTransactionRowsToExcel = (transactions) =>
    exportRowsToExcel(transactions.map(transactionToRow), `transactions_${getTodaySuffix()}.xlsx`, 'Transactions');

export const exportTransactionRowsToPDF = (transactions, title = '') =>
    exportRowsToPDF(transactions.map(transactionToRow), {
        title,
        filename: `transactions_${getTodaySuffix()}.pdf`,
    });

export const exportReportRowsToCSV = (reportData) =>
    exportRowsToCSV(reportDataToRows(reportData), `report_${getTodaySuffix()}.csv`);

export const exportReportRowsToExcel = (reportData) =>
    exportRowsToExcel(reportDataToRows(reportData), `report_${getTodaySuffix()}.xlsx`, 'Report');

export const exportReportRowsToPDF = (reportData, title = '') =>
    exportRowsToPDF(reportDataToRows(reportData), {
        title,
        filename: `report_${getTodaySuffix()}.pdf`,
    });

export const exportToCSV = exportTransactionRowsToCSV;
export const exportToExcel = exportTransactionRowsToExcel;
export const exportToPDF = exportTransactionRowsToPDF;
