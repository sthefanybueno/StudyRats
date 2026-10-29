/** Description: This file (eslint.config.js) contains the implementation for its respective feature. */
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

const FRAMEWORKS = [
  { name: 'react', message: 'Domínio/aplicação não podem depender de React.' },
  { name: 'react-native', message: 'Domínio/aplicação não podem depender de React Native.' },
];
const UI_E_INFRA = [
  '@/infrastructure/*', '**/infrastructure/**',
  '@/app/*', '@/components/*', '@/hooks/*', '@/providers/*',
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  // Clean Architecture: domínio não depende de nada externo nem das outras camadas.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: FRAMEWORKS,
        patterns: [...UI_E_INFRA, '@/application/*', '**/application/**', 'expo', 'expo-*', '@expo/*'],
      }],
    },
  },
  // Aplicação depende apenas do domínio (o container é a composition root e fica fora da regra).
  {
    files: ['src/application/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**', 'src/application/di/container.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: FRAMEWORKS,
        patterns: [...UI_E_INFRA, 'expo', 'expo-*', '@expo/*'],
      }],
    },
  },
  // Infraestrutura implementa as portas do domínio e não conhece a apresentação.
  {
    files: ['src/infrastructure/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: ['@/app/*', '@/components/*', '@/hooks/*', '@/providers/*'],
      }],
    },
  },
]);
