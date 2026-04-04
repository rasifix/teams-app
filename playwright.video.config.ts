import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  workers: 1,
  use: {
    ...baseConfig.use,
    video: 'on',
    launchOptions: {
      slowMo: 450,
    },
  },
});
