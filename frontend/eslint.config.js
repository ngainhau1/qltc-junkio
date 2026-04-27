import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// GHI CHÚ HỌC TẬP - Phần hạ tầng của Thành Đạt:
// File này đặt luật kiểm tra code frontend. Phần quan trọng nhất là kiểm tra React hooks
// để tránh lỗi dependency trong useEffect và giữ code React ổn định khi build.
export default defineConfig([
  // Bỏ qua thư mục dist vì đây là kết quả build, không phải mã nguồn cần sửa tay.
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Dùng bộ luật JavaScript cơ bản, sau đó bổ sung luật riêng cho React hooks và hot reload.
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      }
    }
  }
])
