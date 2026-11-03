/** Description: This file (jest.config.js) contains the implementation for its respective feature. */
const expoPreset = require('jest-expo/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  ...expoPreset,
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.spec.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/global\\.css$': '<rootDir>/jest.styleStub.js',
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/jest.styleStub.js',
    '\\.css$': '<rootDir>/jest.styleStub.js',
    ...(expoPreset.moduleNameMapper || {}),
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  setupFiles: [
    require.resolve('./jest.polyfill.js'),
    ...(expoPreset.setupFiles || []),
    '<rootDir>/jest.setup.js',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
    '!src/hooks/use-color-scheme*.ts',
    '!src/constants/**',
    '!src/global.css',
    '!src/domain/gateways/**',
    '!src/domain/repositories/**',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
