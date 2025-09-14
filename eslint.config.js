import js from '@eslint/js';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    ignores: ['node_modules/**', '.svelte-kit/**', 'build/**', 'dist/**', 'package-lock.json', '.netlify/**', 'netlify/**']
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node
      }
    }
  }
];