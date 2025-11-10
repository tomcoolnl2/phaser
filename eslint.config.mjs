import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
    eslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
        parser: tsparser,
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            project: './tsconfig.json',
        },
        },
        plugins: {
        '@typescript-eslint': tseslint,
        },
        rules: {
        ...tseslint.configs.recommended.rules,
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'max-len': ['error', { code: 180, ignoreComments: true }],
        'no-bitwise': 'error',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-empty-interface': 'off',
        },
    },
    {
        ignores: ['node_modules/**', 'dist/**', '*.spec.ts'],
    },
    prettierConfig,
];
