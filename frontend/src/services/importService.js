import Papa from 'papaparse';
import api from '@/lib/api';

const parseDateString = (dateStr) => {
    if (!dateStr) return '';
    // If it's already ISO format like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.substring(0, 10);
    }
    // If it's DD/MM/YYYY or DD-MM-YYYY
    const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
        const [, day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Fallback if Date object parsing works
    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) {
        return parsed.toISOString().split('T')[0];
    }
    return dateStr;
};

// Mapping logic shared between CSV and Excel
const mapRowToTransaction = (row, defaultWalletId) => {
    // Normalize keys to lowercase for robust matching
    const normalizedRow = Object.keys(row).reduce((acc, key) => {
        const lowerKey = key.trim().toLowerCase();
        acc[lowerKey] = row[key];
        return acc;
    }, {});

    const rawDate = normalizedRow.date || normalizedRow.ngay || normalizedRow['ngày'] || '';
    const date = parseDateString(rawDate);
    
    let amountRaw = String(normalizedRow.amount || normalizedRow['so tien'] || normalizedRow['số tiền'] || '0');
    amountRaw = amountRaw.replace(/,/g, '').replace(/[^-0-9.]/g, '');

    let type = String(normalizedRow.type || normalizedRow.loai || normalizedRow['loại'] || 'EXPENSE').toUpperCase();
    if (type.includes('INC') || type.includes('THU')) {
        type = 'INCOME';
    } else if (type.includes('EXP') || type.includes('CHI')) {
        type = 'EXPENSE';
    }

    return {
        date,
        description: normalizedRow.description || normalizedRow['mo ta'] || normalizedRow['mô tả'] || 'Imported Transaction',
        type,
        amount: Math.abs(parseFloat(amountRaw)),
        category_id: normalizedRow.category || normalizedRow['danh muc'] || normalizedRow['danh mục'] || normalizedRow.category_id || null,
        wallet_id: normalizedRow['wallet id'] || normalizedRow.vi || normalizedRow['ví'] || normalizedRow.wallet_id || defaultWalletId,
    };
};

const filterValidTransactions = (transactions) =>
    transactions.filter(
        (tx) => tx.wallet_id && Number.isFinite(tx.amount) && tx.amount > 0
    );

const submitTransactions = async (formattedTransactions) => {
    const response = await api.post('/transactions/import', {
        transactions: formattedTransactions,
    });

    return {
        success: true,
        message: response._meta?.message || 'Import thành công',
        count: response.data?.importedCount || 0,
    };
};

// Import from CSV file
export const importFromCSV = (file, defaultWalletId) =>
    new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const mapped = results.data.map((row) => mapRowToTransaction(row, defaultWalletId));
                    const valid = filterValidTransactions(mapped);
                    const result = await submitTransactions(valid);
                    resolve(result);
                } catch (error) {
                    reject(new Error(error.response?.data?.message || 'Lỗi khi gửi dữ liệu lên máy chủ'));
                }
            },
            error: () => {
                reject(new Error('Không thể đọc file CSV. Vui lòng kiểm tra lại định dạng.'));
            },
        });
    });

// Import from Excel file (.xlsx / .xls)
export const importFromExcel = async (file, defaultWalletId) => {
    try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Read the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
            throw new Error('File Excel không có dữ liệu hoặc sheet trống.');
        }

        const mapped = rows.map((row) => mapRowToTransaction(row, defaultWalletId));
        const valid = filterValidTransactions(mapped);
        return await submitTransactions(valid);
    } catch (error) {
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

// Auto-detect file type and import
export const importFromFile = (file, defaultWalletId) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        return importFromExcel(file, defaultWalletId);
    }
    return importFromCSV(file, defaultWalletId);
};
