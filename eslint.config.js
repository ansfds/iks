import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.cache', '.vite-cache', 'admin-backup-*', 'backups', 'deploy-data']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // These modules deliberately expose reusable UI variants, hooks and context.
  {
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/contexts/*.tsx', 'src/providers/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
