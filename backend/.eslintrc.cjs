module.exports = {
  env: {
    node: true,
    jest: true,
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module' // Added since standard project is module sometimes
  },
  rules: {
    // Override các rules nếu cần
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^(next|_)|res|req|err' }]
  }
};
