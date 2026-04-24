import globals from 'globals';
import pluginJs from '@eslint/js';

// GHI CHÚ HỌC TẬP - Phần hạ tầng của Thành Đạt:
// File này đặt luật kiểm tra code backend. Mục tiêu là phát hiện lỗi cú pháp,
// biến không dùng, thiếu dấu chấm phẩy và sai định dạng trước khi đưa mã lên kho chung.
export default [
    {
        languageOptions: { 
            globals: {
                // Backend chạy trong Node.js và test chạy bằng Jest nên cần khai báo cả hai nhóm biến toàn cục.
                ...globals.node,
                ...globals.jest,
            } 
        }
    },
    pluginJs.configs.recommended,
    {
        rules: {
            // Một số biến được bỏ qua cảnh báo vì Sequelize hoặc test có thể cần giữ tên cố định.
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^(?:_.*|Sequelize)$', 'varsIgnorePattern': '^(Op|Sequelize|User|Category|Goal|transferTxOut|transferTxIn|type|x|err|userId|year|month)$' }],
            // Backend được phép dùng console để ghi log vận hành và lỗi cron/API.
            'no-console': 'off',
            'eqeqeq': 'error',
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'quotes': ['warn', 'single'],
            'semi': ['error', 'always']
        }
    }
];
