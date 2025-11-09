module.exports = {
  preset: 'ts-jest',
  // Default environment for most tests (unit tests need DOM)
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
      },
    },
  },
  // Integration tests use node environment (specified in test file with @jest-environment comment)
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};
