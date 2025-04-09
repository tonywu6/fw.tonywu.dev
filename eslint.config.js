// @ts-check

import css from "@eslint/css";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
// @ts-expect-error untyped
import importPlugin from "eslint-plugin-import";
import reactJsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import ts from "typescript-eslint";

export default defineConfig([
  { ignores: ["!**/.server", "!**/.client", "build"] },

  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser },
      parserOptions: { sourceType: "module" },
    },
  },

  {
    rules: {
      curly: ["error", "all"],
      eqeqeq: "error",
    },
  },

  // eslint-disable-next-line import/no-named-as-default-member
  ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  react.configs.flat["recommended"],
  react.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],
  reactJsxA11y.flatConfigs.recommended,
  {
    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
    },
  },

  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    settings: {
      "import/internal-regex": "^@project/|^~/",
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
        node: {
          extensions: [".ts", ".tsx"],
        },
      },
    },
    rules: {
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: false,
          },
          groups: ["builtin", "external", "parent", "sibling", "index"],
          pathGroups: [
            {
              pattern: "~/**",
              patternOptions: { dot: true },
              group: "parent",
              position: "after",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
]);
