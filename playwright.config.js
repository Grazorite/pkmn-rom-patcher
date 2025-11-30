// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html'], ['list']],
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    navigationTimeout: 15000,
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-dev-shm-usage']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox']
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari']
      },
    },
  ],

  webServer: {
    command: 'npx http-server . -p 3000 --cors',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Increase server startup timeout
  },
});