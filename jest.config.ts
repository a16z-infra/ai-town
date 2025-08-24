import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
    '^../assets/(.*)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
    '^../../assets/(.*)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js',
    '^./(.*)\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js'
  },
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/vite-env.d.ts',
    '!src/main.tsx',
    '!src/index.css'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    __dirname: '/home/runner/work/ustypology.github.io/ustypology.github.io'
  }
};
export default jestConfig;
