import js from '@eslint/js';
import { createRequire } from 'node:module';
import eslintConfigPrettier from 'eslint-config-prettier';
import astro from 'eslint-plugin-astro';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const typeScriptFiles = ['**/*.{ts,tsx,mts,cts}'];
const require = createRequire(import.meta.url);
const { buildEslintBoundaryConfig, loadModuleBoundariesManifest } = require('./scripts/module-boundaries-manifest.cjs');
const boundaryConfig = buildEslintBoundaryConfig(loadModuleBoundariesManifest());

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/.astro/**',
      '**/.wrangler/**',
      '**/.vite/**',
      '**/coverage/**',
      'apps/backend/openapi/*.json',
      'apps/backend/src/generated/**',
      'packages/api-client/src/generated/**',
      '.planning/archive/**',
    ],
  },
  js.configs.recommended,
  {
    files: typeScriptFiles,
    extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-undef': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: boundaryConfig.files,
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': boundaryConfig.descriptors,
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*', '**/test/**'],
      'import/resolver': {
        typescript: {
          project: ['tsconfig.boundaries.json', 'apps/backend/tsconfig.json', 'packages/api-client/tsconfig.json'],
        },
      },
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: boundaryConfig.dependencyRules,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@blackbox/api-client/src/*', '@blackbox/api-client/src/**'],
              message: 'Use @blackbox/api-client package exports instead of deep source imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-undef': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.astro/*.js', '**/*.astro/*.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  eslintConfigPrettier,
);
