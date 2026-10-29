// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // TypeScript checks namespace members. The import plugin cannot follow Evolu's `export *` chain.
    files: ['**/*.ts', '**/*.tsx'],
    rules: { 'import/namespace': 'off' },
  },
]);
