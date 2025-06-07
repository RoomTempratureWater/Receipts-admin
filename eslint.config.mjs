import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Get base config from Next.js presets
const baseConfig = compat.extends("next/core-web-vitals", "next/typescript");

// Helper to downgrade all rule severities to "warn"
function downgradeRulesToWarn(configs) {
  return configs.map((config) => {
    if (!config.rules) return config;
    const newRules = {};
    for (const [ruleName, ruleSetting] of Object.entries(config.rules)) {
      if (Array.isArray(ruleSetting)) {
        newRules[ruleName] = [1, ...ruleSetting.slice(1)];
      } else {
        newRules[ruleName] = 1;
      }
    }
    return { ...config, rules: newRules };
  });
}

const eslintConfig = [
  ...downgradeRulesToWarn(baseConfig),
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
