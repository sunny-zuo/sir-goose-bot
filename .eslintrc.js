module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    env: {
        node: true,
    },
    rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-non-null-assertion': 'off',
    },
};
