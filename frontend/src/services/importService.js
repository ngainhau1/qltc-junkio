import Papa from 'papaparse';
import api from '@/lib/api';

const createCodeError = (code) => new Error(code);

const extractApiErrorCode = (error, fallbackCode) => {
    return error?.response?.data?.message || error?.message || fallbackCode;
};

const parseDateString = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr.substring(0, 10);
    }

    const parts = dateStr.match(new RegExp('^(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})'));
    if (parts) {
        const [, day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) {
        return parsed.toISOString().split('T')[0];
    }

    return dateStr;
};

const resolveCategoryId = (categoryStr, categoryIdRaw, categories) => {
    if (categoryIdRaw) return categoryIdRaw;
    if (!categoryStr) return null;

    const matched = categories.find(
        (category) => category.name.toLowerCase().trim() === categoryStr.toLowerCase().trim()
    );
    return matched ? matched.id : null;
};

const resolveWalletId = (walletStr, walletIdRaw, defaultWalletId, wallets) => {
    if (walletIdRaw) return walletIdRaw;
    if (!walletStr) return defaultWalletId;

    const matched = wallets.find(
        (wallet) => wallet.name.toLowerCase().trim() === walletStr.toLowerCase().trim()
    );
    if (matched) {
        return matched.id;
    }

    throw createCodeError('IMPORT_WALLET_NAME_NOT_FOUND');
};

const FALLBACK_KEYS = {
    date: ['ngay', 'ngày', 'date'],
    amount: ['sotien', 'số tiền', 'so tien', 'amount'],
    type: ['loai', 'loại', 'type'],
    desc: ['mota', 'mô tả', 'mo ta', 'description'],
    category: ['danhmuc', 'danh mục', 'danh muc', 'category', 'category_id'],
    wallet: ['vi', 'ví', 'wallet', 'wallet_id', 'wallet id'],
};

const getRowValue = (normalizedRow, possibleKeys) => {
    for (const key of possibleKeys) {
        if (normalizedRow[key] !== undefined && normalizedRow[key] !== null) {
            return String(normalizedRow[key]).trim();
        }
    }
    return '';
};

const mapRowToTransaction = (row, defaultWalletId, wallets, categories) => {
    const normalizedRow = Object.keys(row).reduce((accumulator, key) => {
        accumulator[key.trim().toLowerCase()] = row[key];
        return accumulator;
    }, {});

    const rawDate = getRowValue(normalizedRow, FALLBACK_KEYS.date);
    const date = parseDateString(rawDate);

    let amountRaw = getRowValue(normalizedRow, FALLBACK_KEYS.amount);
    amountRaw = amountRaw.replace(/,/g, '').replace(/[^-0-9.]/g, '');

    const typeString = getRowValue(normalizedRow, FALLBACK_KEYS.type).toUpperCase();

    let finalType = 'EXPENSE';
    if (typeString.includes('INCOME') || typeString.includes('INC') || typeString.includes('THU')) {
        finalType = 'INCOME';
    } else if (typeString.includes('EXPENSE') || typeString.includes('EXP') || typeString.includes('CHI')) {
        finalType = 'EXPENSE';
    }

    const categoryString = getRowValue(normalizedRow, FALLBACK_KEYS.category);
    const walletString = getRowValue(normalizedRow, FALLBACK_KEYS.wallet);
    const description = getRowValue(normalizedRow, FALLBACK_KEYS.desc);

    return {
        date,
        description,
        type: finalType,
        amount: Math.abs(parseFloat(amountRaw || 0)),
        category_id: resolveCategoryId(categoryString, normalizedRow.category_id, categories),
        wallet_id: resolveWalletId(
            walletString,
            normalizedRow.wallet_id || normalizedRow['wallet id'],
            defaultWalletId,
            wallets
        ),
    };
};

const filterValidTransactions = (transactions) =>
    transactions.filter((transaction) => transaction.wallet_id && Number.isFinite(transaction.amount) && transaction.amount > 0);

const submitTransactions = async (formattedTransactions) => {
    if (formattedTransactions.length === 0) {
        throw createCodeError('IMPORT_NO_VALID_TRANSACTIONS');
    }

    const response = await api.post('/transactions/import', {
        transactions: formattedTransactions,
    });

    return {
        success: true,
        count: response.data?.importedCount || 0,
    };
};

export const importFromCSV = (file, defaultWalletId, wallets = [], categories = []) =>
    new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const mapped = results.data.map((row) =>
                        mapRowToTransaction(row, defaultWalletId, wallets, categories)
                    );
                    const valid = filterValidTransactions(mapped);
                    const result = await submitTransactions(valid);
                    resolve(result);
                } catch (error) {
                    reject(createCodeError(extractApiErrorCode(error, 'IMPORT_UPLOAD_FAILED')));
                }
            },
            error: () => {
                reject(createCodeError('IMPORT_CSV_READ_FAILED'));
            },
        });
    });

export const importFromExcel = async (file, defaultWalletId, wallets = [], categories = []) => {
    try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
            throw createCodeError('IMPORT_EMPTY_SHEET');
        }

        const mapped = rows.map((row) => mapRowToTransaction(row, defaultWalletId, wallets, categories));
        const valid = filterValidTransactions(mapped);
        return await submitTransactions(valid);
    } catch (error) {
        throw createCodeError(extractApiErrorCode(error, 'IMPORT_UPLOAD_FAILED'));
    }
};

export const importFromFile = (file, defaultWalletId, wallets = [], categories = []) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        return importFromExcel(file, defaultWalletId, wallets, categories);
    }
    return importFromCSV(file, defaultWalletId, wallets, categories);
};
