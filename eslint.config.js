import js from '@eslint/js';
import sveltePlugin from 'eslint-plugin-svelte';

export default [
  js.configs.recommended,
  {
    files: ['**/*.svelte'],
    ...sveltePlugin.configs.recommended,
    rules: {
      ...sveltePlugin.configs.recommended.rules,
    }
  },
  {
    ignores: ['node_modules/**']
  },
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    env: {
      browser: true,
      es2017: true,
      node: true
    }
  }
];