/**
 * Jest Configuration for Puppeteer E2E Tests
 *
 * This configuration is specifically for E2E tests using Puppeteer.
 * It's separate from the main Jest config to avoid conflicts.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Node environment for Puppeteer (not jsdom)
  roots: ['<rootDir>'],
  testMatch: [
    '**/core/**/*.test.ts',
    '**/platforms/**/*.test.ts',
    '**/features/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true
      }
    }]
  },
  // Longer timeout for E2E tests (2 minutes per test)
  testTimeout: 120000,
  // Run tests serially (not in parallel) to avoid resource conflicts
  maxWorkers: 1,
  // Verbose output
  verbose: true,
  // Collect coverage from setup files
  collectCoverageFrom: [
    'setup/**/*.ts',
    '!setup/**/*.d.ts'
  ],
  // Don't transform node_modules (except puppeteer if needed)
  transformIgnorePatterns: [
    'node_modules/(?!(puppeteer)/)'
  ]
};
