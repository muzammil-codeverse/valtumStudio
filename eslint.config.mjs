import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import promise from "eslint-plugin-promise";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      promise,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports"
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSNonNullExpression",
          message: "Non-null assertions are forbidden. Narrow the value safely instead."
        },
        {
          selector: "TSAnyKeyword",
          message: "Use a specific type or safely narrow unknown values instead of any."
        }
      ],
      "promise/catch-or-return": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/**"],
              message: "Feature modules must not import route files from src/app."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/**"],
              message: "Generic UI primitives must not import feature modules."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/lib/**/*.{ts,tsx}", "src/config/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/**", "@/app/**"],
              message:
                "Shared infrastructure must not import routes or feature modules."
            }
          ]
        }
      ]
    }
  },
  globalIgnores([
    ".next/**",
    ".next-playwright/**",
    "coverage/**",
    "node_modules/**",
    "playwright-report/**",
    "src/generated/prisma/**",
    "test-results/**"
  ])
]);
