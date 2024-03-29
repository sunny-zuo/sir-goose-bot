module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint', 'deprecation'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    env: {
        node: true,
    },
    rules: {
        'no-empty': ['error', { allowEmptyCatch: true }],
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/require-await': 'error',
        'deprecation/deprecation': 'error',
    },
};
