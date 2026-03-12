import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    {
        languageOptions: { 
            globals: {
                ...globals.node,
                ...globals.jest,
            } 
        }
    },
    pluginJs.configs.recommended,
    {
        rules: {
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^(?:_.*|Sequelize)$', 'varsIgnorePattern': '^(Op|Sequelize|User|Category|Goal|transferTxOut|transferTxIn|type|x|err|userId|year|month)$' }],
            'no-console': 'off',
            'eqeqeq': 'error',
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'quotes': ['warn', 'single'],
            'semi': ['error', 'always']
        }
    }
];
