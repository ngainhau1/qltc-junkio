import Papa from 'papaparse';
import api from '@/lib/api';

const parseDateString = (dateStr) => {
    if (!dateStr) return '';
    // If it's already ISO format like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.substring(0, 10);
    }
    // If it's DD/MM/YYYY or DD-MM-YYYY
    const parts = dateStr.match(new RegExp('^(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})'));
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

// Validates or matches category string against state
const resolveCategoryId = (categoryStr, categoryIdRaw, categories) => {
    if (categoryIdRaw) return categoryIdRaw;
    if (!categoryStr) return null;
    
    const matched = categories.find(c => c.name.toLowerCase().trim() === categoryStr.toLowerCase().trim());
    return matched ? matched.id : null;
};

// Validates or matches wallet string against state
const resolveWalletId = (walletStr, walletIdRaw, defaultWalletId, wallets) => {
    if (walletIdRaw) return walletIdRaw;
    if (!walletStr) return defaultWalletId; // Fallback to default if no column value

    const matched = wallets.find(w => w.name.toLowerCase().trim() === walletStr.toLowerCase().trim());
    if (matched) {
        return matched.id;
    }
    
    // User requested to THROW an error if wallet string is provided but invalid
    throw new Error(`Tên ví "${walletStr}" không tồn tại trong hệ thống. Vui lòng kiểm tra lại file.`);
};

// Add a system array of fallback keys per column just in case the file doesn't come from Junkio but user types manually
const FALLBACK_KEYS = {
    date: ['ngày', 'ngay', 'date'],
    amount: ['số tiền', 'sotien', 'amount', 'so tien'],
    type: ['loại', 'loai', 'type'],
    desc: ['mô tả', 'mota', 'description', 'mo ta'],
    category: ['danh mục', 'danhmuc', 'category', 'danh muc', 'category_id'],
    wallet: ['ví', 'vi', 'wallet', 'wallet_id', 'wallet id']
};

const extractI18nKeys = (i18n, i18nKey) => {
    const keys = [];
    const langs = ['vi', 'en']; // Currently supported locales
    
    langs.forEach(lng => {
        const val = i18n.getResource(lng, 'translation', i18nKey);
        if (val) keys.push(val.toLowerCase());
    });
    
    // Auto-fallback: Last part of the translation key itself
    const fallback = i18nKey.split('.').pop().toLowerCase();
    if (!keys.includes(fallback)) keys.push(fallback);
    
    return keys;
};

const getRowValueByI18nKey = (normalizedRow, i18n, i18nKey, specificKeys = []) => {
    const possibleKeys = [...extractI18nKeys(i18n, i18nKey), ...specificKeys];
    for (const key of possibleKeys) {
        if (normalizedRow[key] !== undefined && normalizedRow[key] !== null) {
            return String(normalizedRow[key]).trim();
        }
    }
    return ''; // Not found
};

// Mapping logic shared between CSV and Excel
const mapRowToTransaction = (row, defaultWalletId, wallets, categories) => {
    // Normalize keys to lowercase for robust matching
    const normalizedRow = Object.keys(row).reduce((acc, key) => {
        const lowerKey = key.trim().toLowerCase();
        acc[lowerKey] = row[key];
        return acc;
    }, {});

    // Lazy load i18n
    const i18n = require('@/lib/i18n').default;

    const rawDate = getRowValueByI18nKey(normalizedRow, i18n, 'export.date', FALLBACK_KEYS.date);
    const date = parseDateString(rawDate);
    
    let amountRaw = getRowValueByI18nKey(normalizedRow, i18n, 'export.amount', FALLBACK_KEYS.amount);
    amountRaw = amountRaw.replace(/,/g, '').replace(/[^-0-9.]/g, '');

    let typeStr = getRowValueByI18nKey(normalizedRow, i18n, 'export.type', FALLBACK_KEYS.type).toUpperCase();
    
    // Check against i18n values for Income/Expense
    const incomeKeys = extractI18nKeys(i18n, 'export.income').map(k => k.toUpperCase());
    const expenseKeys = extractI18nKeys(i18n, 'export.expense').map(k => k.toUpperCase());
    
    let finalType = 'EXPENSE'; // Default
    if (incomeKeys.some(k => typeStr.includes(k)) || typeStr.includes('INC') || typeStr.includes('THU')) {
        finalType = 'INCOME';
    } else if (expenseKeys.some(k => typeStr.includes(k)) || typeStr.includes('EXP') || typeStr.includes('CHI')) {
        finalType = 'EXPENSE';
    }

    const categoryStr = getRowValueByI18nKey(normalizedRow, i18n, 'export.category', FALLBACK_KEYS.category);
    const walletStr = getRowValueByI18nKey(normalizedRow, i18n, 'export.wallet', FALLBACK_KEYS.wallet);
    const descStr = getRowValueByI18nKey(normalizedRow, i18n, 'export.description', FALLBACK_KEYS.desc) || 'Imported Transaction';

    return {
        date,
        description: descStr,
        type: finalType,
        amount: Math.abs(parseFloat(amountRaw || 0)),
        category_id: resolveCategoryId(categoryStr, normalizedRow.category_id, categories),
        wallet_id: resolveWalletId(walletStr, normalizedRow.wallet_id || normalizedRow['wallet id'], defaultWalletId, wallets),
    };
};

const filterValidTransactions = (transactions) =>
    transactions.filter(
        (tx) => tx.wallet_id && Number.isFinite(tx.amount) && tx.amount > 0
    );

const submitTransactions = async (formattedTransactions) => {
    if (formattedTransactions.length === 0) {
        throw new Error('Không có giao dịch nào hợp lệ để thêm (các dòng có thể đang thiếu số tiền hoặc thông tin bắt buộc).');
    }

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
export const importFromCSV = (file, defaultWalletId, wallets = [], categories = []) =>
    new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const mapped = results.data.map((row) => mapRowToTransaction(row, defaultWalletId, wallets, categories));
                    const valid = filterValidTransactions(mapped);
                    const result = await submitTransactions(valid);
                    resolve(result);
                } catch (error) {
                    reject(new Error(error.response?.data?.message || error.message || 'Lỗi khi gửi dữ liệu lên máy chủ'));
                }
            },
            error: () => {
                reject(new Error('Không thể đọc file CSV. Vui lòng kiểm tra lại định dạng.'));
            },
        });
    });

// Import from Excel file (.xlsx / .xls)
export const importFromExcel = async (file, defaultWalletId, wallets = [], categories = []) => {
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

        const mapped = rows.map((row) => mapRowToTransaction(row, defaultWalletId, wallets, categories));
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
export const importFromFile = (file, defaultWalletId, wallets = [], categories = []) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        return importFromExcel(file, defaultWalletId, wallets, categories);
    }
    return importFromCSV(file, defaultWalletId, wallets, categories);
};
