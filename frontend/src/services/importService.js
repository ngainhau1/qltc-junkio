import Papa from 'papaparse';
import axios from 'axios';

// Giả định backend base URL, bạn có thể truyền từ .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Phân tích file CSV và gửi lên Backend để import.
 * Yêu cầu CSV phải có cấu trúc tương thích với: Date, Description, Type, Amount.
 * Các trường khác (Category, Wallet_ID) có thể map trong logic hoặc mặc định.
 * 
 * @param {File} file Object File người dùng upload
 * @param {String} defaultWalletId ID của ví sẽ nhận các giao dịch mặc định nếu CSV không chỉ định rõ
 * @returns {Promise<Object>} Kết quả từ server hoặc báo lỗi
 */
export const importFromCSV = (file, defaultWalletId) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const parsedData = results.data;

                    // Transformation/Mapping CSV columns -> Backend expected format
                    const formattedTransactions = parsedData.map(row => {
                        // Nhận diện cột ngày (tùy theo ngôn ngữ CSV xuất ra có thể khác nhau)
                        const dateStr = row.Date || row.Ngày || row.date || '';

                        // Xử lý số tiền an toàn, phòng trường hợp "1,000,000"
                        let amountStr = String(row.Amount || row['Số Tiền'] || row.amount || '0');
                        amountStr = amountStr.replace(/,/g, '').replace(/[^-0-9.]/g, ''); // Xóa chữ, giữ lại dấu trừ và số
                        const amount = Math.abs(parseFloat(amountStr));

                        // Nhận diện Type. Coi mặc định là chi nếu không ghi chú
                        let type = row.Type || row.Loại || row.type || 'EXPENSE';
                        // Nếu trong báo cáo excel Tiếng Anh ta ghi là 'INC'
                        if (type.toUpperCase().includes('INC') || type.toUpperCase().includes('THU')) {
                            type = 'INCOME';
                        } else if (type.toUpperCase().includes('EXP') || type.toUpperCase().includes('CHI')) {
                            type = 'EXPENSE';
                        }

                        return {
                            date: dateStr,
                            description: row.Description || row['Mô Tả'] || row.description || 'Imported Transaction',
                            type: type,
                            amount: amount,
                            category_id: row.Category || row['Danh mục'] || 'general',
                            wallet_id: row['Wallet ID'] || row['Ví'] || defaultWalletId
                        };
                    });

                    // Gọi API Backend thực hiện Bulk Create
                    // Lưu ý: Cần truyền token nếu API được bảo vệ bởi authMiddleware
                    const token = localStorage.getItem('token'); // Tạm thời lấy bằng tay, sau sẽ dời vào Interceptor

                    const response = await axios.post(
                        `${API_URL}/transactions/import`,
                        { transactions: formattedTransactions },
                        {
                            headers: {
                                ...(token ? { 'x-auth-token': token } : {})
                            }
                        }
                    );

                    resolve({
                        success: true,
                        message: response.data.message,
                        count: response.data.importedCount
                    });

                } catch (error) {
                    console.error('Import API error:', error);
                    reject(new Error(error.response?.data?.message || 'Lỗi khi gửi dữ liệu lên máy chủ'));
                }
            },
            error: (err) => {
                console.error('CSV Parsing error:', err);
                reject(new Error('Không thể đọc file CSV. Vui lòng kiểm tra lại định dạng.'));
            }
        });
    });
};
