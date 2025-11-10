import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';
import prettierConfig from 'eslint-config-prettier';

export default [
    eslint.configs.recommended,
    ...vuePlugin.configs['flat/recommended'],
    {
        files: ['src/**/*.ts', 'src/**/*.tsx'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',
                // Phaser
                Phaser: 'readonly',
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
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        constructors: 'no-public',
                    },
                },
            ],
            'max-len': ['error', { code: 180, ignoreComments: true }],
            'no-bitwise': 'error',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-empty-interface': 'off',
        },
    },
    {
        // Vue files with TypeScript
        files: ['src/**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                parser: tsparser,
                extraFileExtensions: ['.vue'],
            },
            globals: {
                window: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                CustomEvent: 'readonly',
                EventListener: 'readonly',
                HTMLInputElement: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            vue: vuePlugin,
        },
        rules: {
            ...vuePlugin.configs['flat/recommended'].rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/require-default-prop': 'off',
        },
    },
    {
        // Server and shared files without type checking
        files: ['server/**/*.ts', 'shared/**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
            },
            globals: {
                // Node.js globals
                console: 'readonly',
                __dirname: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                clearTimeout: 'readonly',
                process: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            '*.spec.ts',
            'src.old/**',
            'typings/**',
            'public/**', // Ignore all public folder (phaser.js, socket.io.js, etc.)
        ],
    },
    prettierConfig,
];
