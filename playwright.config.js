// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2, // Reduce workers for stability
  reporter: 'html',
  timeout: 45000, // Increase timeout for slower browsers
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Add navigation timeout
    navigationTimeout: 30000,
    // Add action timeout
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chromium-specific optimizations
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific optimizations
        launchOptions: {
          firefoxUserPrefs: {
            'dom.ipc.processCount': 1,
            'dom.max_script_run_time': 0,
            'dom.max_chrome_script_run_time': 0,
            'browser.sessionstore.restore_on_demand': false,
            'browser.sessionstore.restore_tabs_lazily': false
          }
        },
        // Increase timeouts for Firefox
        navigationTimeout: 45000,
        actionTimeout: 20000,
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit-specific optimizations
        launchOptions: {
          args: ['--disable-web-security']
        }
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