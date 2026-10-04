// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", "dist-*/**", "RaportoDemo/**", "test-results/**", "playwright-report/**", "vendor/**"],
  },
  {
    files: ["**/__tests__/**/*.{js,ts,tsx}", "**/*.test.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        afterEach: "readonly",
        beforeEach: "readonly",
      },
    },
  },
]);
