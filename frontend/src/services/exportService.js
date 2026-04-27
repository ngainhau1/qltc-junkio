import Papa from 'papaparse';
import api from '@/lib/api';
import { cleanQueryParams } from '@/features/finance/context';
import { localizeCategoryName } from '@/features/categories/categoryLocalization';
import { formatDateString } from '@/lib/utils';
import i18n from '@/lib/i18n';
import { loadRobotoBase64 } from './pdfFont';

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

const formatCurrency = (value) => {
    const num = Number(value || 0);
    return num.toLocaleString('vi-VN');
};

const transactionToRow = (transaction) => ({
    [i18n.t('export.date')]: formatDateString(transaction.date || transaction.transaction_date || transaction.createdAt),
    [i18n.t('export.description')]: transaction.description || i18n.t('export.noDescription'),
    [i18n.t('export.type')]: transaction.type,
    [i18n.t('export.amount')]: Number(transaction.amount || 0),
    [i18n.t('export.category')]: localizeCategoryName(transaction.Category?.name, i18n.t.bind(i18n)) || transaction.category_id || '',
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
            [i18n.t('export.metric')]: localizeCategoryName(item.name, i18n.t.bind(i18n)),
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
    const normalizedRows = normalizeRows(rows);
    const worksheet = XLSX.utils.json_to_sheet(normalizedRows);

    const columns = Object.keys(normalizedRows[0] || { Data: '' });
    worksheet['!cols'] = columns.map((col) => {
        const maxLen = Math.max(
            col.length,
            ...normalizedRows.map((row) => String(row[col] ?? '').length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 12), 40) };
    });

    const workbook = XLSX.utils.book_new();
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
    const [{ default: jsPDF }, { default: autoTable }, robotoBase64] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        loadRobotoBase64().catch(() => null),
    ]);

    const normalizedRows = normalizeRows(rows);
    const columns = Object.keys(normalizedRows[0] || { Data: '' });
    const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

    if (robotoBase64) {
        doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto', 'normal');
    } else {
        doc.setFont('helvetica', 'normal');
    }

    doc.setFontSize(20);
    doc.text(i18n.t('export.titleTracker'), 14, 22);
    doc.setFontSize(14);
    doc.text(title || i18n.t('export.titleDefault'), 14, 32);
    doc.setFontSize(10);
    doc.text(`${i18n.t('export.exportDate')} ${formatDateString(new Date())}`, 14, 40);
    doc.text(`${i18n.t('common.total')}: ${normalizedRows.length} ${i18n.t('export.records')}`, 14, 46);

    const amountKey = i18n.t('export.amount');
    const formattedBody = normalizedRows.map((row) =>
        columns.map((col) => {
            if (col === amountKey && typeof row[col] === 'number') {
                return formatCurrency(row[col]);
            }
            return row[col];
        })
    );

    autoTable(doc, {
        head: [columns],
        body: formattedBody,
        startY: 52,
        theme: 'grid',
        styles: {
            font: robotoBase64 ? 'Roboto' : 'helvetica',
            fontStyle: 'normal',
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [79, 70, 229],
            fontStyle: 'normal',
            halign: 'center',
        },
        columnStyles: columns.reduce((acc, col, idx) => {
            if (col === amountKey) {
                acc[idx] = { halign: 'right' };
            }
            return acc;
        }, {}),
        didDrawPage: (data) => {
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `${i18n.t('common.page')} ${data.pageNumber} / ${pageCount}`,
                doc.internal.pageSize.getWidth() - 40,
                doc.internal.pageSize.getHeight() - 10
            );
        },
    });

    if (columns.includes(amountKey) && columns.includes(i18n.t('export.type'))) {
        const typeKey = i18n.t('export.type');
        let totalIncome = 0;
        let totalExpense = 0;

        normalizedRows.forEach((row) => {
            const amount = Number(row[amountKey]) || 0;
            const type = String(row[typeKey] || '').toUpperCase();
            if (type === 'INCOME' || type === 'TRANSFER_IN') {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }
        });

        const finalY = doc.lastAutoTable?.finalY ?? 60;
        const summaryY = finalY + 10;

        if (summaryY < doc.internal.pageSize.getHeight() - 30) {
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(`${i18n.t('export.totalIncome')}: ${formatCurrency(totalIncome)}`, 14, summaryY);
            doc.text(`${i18n.t('export.totalExpense')}: ${formatCurrency(totalExpense)}`, 14, summaryY + 7);
            doc.setFontSize(12);
            const net = totalIncome - totalExpense;
            doc.setTextColor(net >= 0 ? 22 : 220, net >= 0 ? 163 : 38, net >= 0 ? 74 : 38);
            doc.text(`${i18n.t('export.net')}: ${formatCurrency(net)}`, 14, summaryY + 16);
        }
    }

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
    exportRowsToExcel(
        transactions.map(transactionToRow),
        `transactions_${getTodaySuffix()}.xlsx`,
        i18n.t('export.sheetTransactions')
    );

export const exportTransactionRowsToPDF = (transactions, title = '') =>
    exportRowsToPDF(transactions.map(transactionToRow), {
        title,
        filename: `transactions_${getTodaySuffix()}.pdf`,
    });

export const exportReportRowsToCSV = (reportData) =>
    exportRowsToCSV(reportDataToRows(reportData), `report_${getTodaySuffix()}.csv`);

export const exportReportRowsToExcel = (reportData) =>
    exportRowsToExcel(
        reportDataToRows(reportData),
        `report_${getTodaySuffix()}.xlsx`,
        i18n.t('export.sheetReport')
    );

export const exportReportRowsToPDF = (reportData, title = '') =>
    exportRowsToPDF(reportDataToRows(reportData), {
        title,
        filename: `report_${getTodaySuffix()}.pdf`,
    });
