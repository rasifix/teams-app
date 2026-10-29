import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'docs-screenshots.spec.ts',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
