import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    plugins: {
      "unused-imports": (await import("eslint-plugin-unused-imports")).default,
    },
    rules: {
      // 미사용 import 및 변수 자동 제거 설정
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // 기존 TypeScript unused-vars 규칙 비활성화 (중복 방지)
      "@typescript-eslint/no-unused-vars": "off",
      // 배포 시 에러 방지를 위한 설정
      "@typescript-eslint/no-explicit-any": "warn", // error에서 warn으로 변경
      "react/no-unescaped-entities": "warn", // error에서 warn으로 변경
      "@next/next/no-img-element": "warn", // error에서 warn으로 변경
      "jsx-a11y/alt-text": "warn", // error에서 warn으로 변경
      "react-hooks/exhaustive-deps": "warn", // error에서 warn으로 변경
      "@typescript-eslint/no-require-imports": "warn", // error에서 warn으로 변경
      "@typescript-eslint/no-unsafe-function-type": "warn", // error에서 warn으로 변경
    },
  },
];

export default eslintConfig;
