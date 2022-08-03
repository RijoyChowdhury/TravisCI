module.exports = {
  ...require('./jest.config'),
  testMatch: ['**/?(*.)+(spec|test|jest).js'],
  preset: 'jest-puppeteer',
  setupFilesAfterEnv: ['./tests/setup.js'],
  globalTeardown: './tests/teardown.js',
};
