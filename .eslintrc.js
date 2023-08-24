module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['**/dist/*.js', '**/config/*.js'],
  rules: {
    quotes: [1, 'single'],
    'require-jsdoc': 0,
    'jsdoc/require-returns-description': 0,
    'jsdoc/require-param-description': 0,
    'tsdoc/syntax': 0,
    'no-console': 0,
    'eslint-comments/no-unused-disable': 0,
    'eslint-comments/disable-enable-pair': 0,
    'no-empty-function': 0,
  },
};
