import Papa from 'papaparse';
import api from '@/lib/api';

export const importFromCSV = (file, defaultWalletId) =>
    new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const formattedTransactions = results.data
                        .map((row) => {
                            const date = row.Date || row.Ngay || row.date || '';
                            let amountRaw = String(row.Amount || row['So Tien'] || row.amount || '0');
                            amountRaw = amountRaw.replace(/,/g, '').replace(/[^-0-9.]/g, '');

                            let type = String(row.Type || row.Loai || row.type || 'EXPENSE').toUpperCase();
                            if (type.includes('INC') || type.includes('THU')) {
                                type = 'INCOME';
                            } else if (type.includes('EXP') || type.includes('CHI')) {
                                type = 'EXPENSE';
                            }

                            return {
                                date,
                                description: row.Description || row['Mo Ta'] || row.description || 'Imported Transaction',
                                type,
                                amount: Math.abs(parseFloat(amountRaw)),
                                category_id: row.Category || row['Danh muc'] || row.category_id || null,
                                wallet_id: row['Wallet ID'] || row.Vi || row.wallet_id || defaultWalletId,
                            };
                        })
                        .filter((transaction) => transaction.wallet_id && Number.isFinite(transaction.amount) && transaction.amount > 0);

                    const response = await api.post('/transactions/import', {
                        transactions: formattedTransactions,
                    });

                    resolve({
                        success: true,
                        message: response._meta?.message || 'Nhap du lieu thanh cong',
                        count: response.data?.importedCount || 0,
                    });
                } catch (error) {
                    reject(new Error(error.response?.data?.message || 'Loi khi gui du lieu len may chu'));
                }
            },
            error: () => {
                reject(new Error('Khong the doc file CSV. Vui long kiem tra lai dinh dang.'));
            },
        });
    });
