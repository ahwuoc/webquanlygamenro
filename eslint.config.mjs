import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // Project rules overrides to keep CI/build green while retaining useful checks
  {
    rules: {
      // Allow using `any` in API/typing boundaries to speed development
      "@typescript-eslint/no-explicit-any": "off",
      // Keep unused-vars as warnings and allow underscore to intentionally ignore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      // Allow common apostrophes/quotes in JSX text without escaping
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
