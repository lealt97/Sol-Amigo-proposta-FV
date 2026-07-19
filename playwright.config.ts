import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';
const pdfCompatibilityTest = /pdf-compatibility\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop-pdf',
      testMatch: pdfCompatibilityTest,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop-pdf',
      testMatch: pdfCompatibilityTest,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'chromium-mobile-pdf',
      testMatch: pdfCompatibilityTest,
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'webkit-mobile-pdf',
      testMatch: pdfCompatibilityTest,
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'playwright-anon-key',
    },
  },
});
