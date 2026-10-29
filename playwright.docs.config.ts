import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: ['scripts/docs-screenshots.spec.ts', 'e2e/uc-us-001.spec.ts', 'e2e/uc-gr-006.spec.ts', 'e2e/uc-gr-011.spec.ts', 'e2e/uc-ev-001.spec.ts'],
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    ...devices['Desktop Chrome'],
    ...(process.env.DOCS_SCREENSHOT_CHANNEL ? { channel: process.env.DOCS_SCREENSHOT_CHANNEL } : {}),
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120000,
  },
});

process.env.DOCS_SCREENSHOT_CAPTURE = '1';
