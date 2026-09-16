import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

/**
 * ESLint 9 flat config.
 *
 * `npm run lint` was in package.json from the first commit but had no config to run against, so it
 * failed before checking anything ("ESLint couldn't find an eslint.config.(js|mjs|cjs) file").
 *
 * The rule set is deliberately about correctness, not formatting: `vue/flat/essential` (the errors that
 * mean a component is wrong -- a duplicate key, a mutated prop, a v-for without a key) plus the JS
 * recommended set. The stricter `vue/flat/recommended` adds attribute-order and indent rules, which
 * would rewrite files this project formats by hand and say nothing about whether they work.
 */
export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      // An unused argument is often deliberate (a signature being matched); an unused variable is not.
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },

  {
    files: ['**/*.spec.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
