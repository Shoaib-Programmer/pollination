import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";
import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js"; // Import ESLint's recommended rules
import globals from "globals"; // <-- Add this import

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname, // Recommended to align paths
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
    // 1. ESLint recommended rules
    js.configs.recommended,

    // 2. TypeScript configuration
    {
        files: ["**/*.{ts,tsx,mts,cts}"], // Apply only to TS files
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                project: true, // Automatically find tsconfig.json
                tsconfigRootDir: __dirname, // Use current dir as root
            },
            globals: {
                ...globals.node,
                Phaser: "readonly",
                NodeJS: "readonly",
                Bun: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
        rules: {
            // Apply recommended TS rules
            ...typescriptPlugin.configs["eslint-recommended"].rules,
            ...typescriptPlugin.configs.recommended.rules,
            // Disable the base no-unused-vars rule, use TS version instead
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ], // Or "error"
        },
    },

    // 3. Next.js configuration (using compatibility layer)
    ...compat.extends("next/core-web-vitals"),

    // 4. Add any global ignores or custom rules last
    {
        ignores: ["next-env.d.ts", ".next/", "node_modules/"], // Example ignores
    },
    // {
    //    rules: {
    //        "your-custom-rule": "error"
    //    }
    // }
];

export default config;
