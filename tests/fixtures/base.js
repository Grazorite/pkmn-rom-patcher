import { test as base, expect } from '@playwright/test';

// Custom fixtures for common setup
export const test = base.extend({
  // Landing page fixture
  landingPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  // Library page fixture
  libraryPage: async ({ page }, use) => {
    await page.goto('/docs/library/');
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  },

  // Patcher page fixture
  patcherPage: async ({ page }, use) => {
    await page.goto('/docs/patcher/');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  // Common selectors
  selectors: async ({}, use) => {
    await use({
      themeToggle: '#themeToggle',
      navSidebar: '#navSidebar',
      searchInput: '.search-input',
      hackCard: '.hack-card',
      detailPanel: '#detailPanel',
      ctaButton: '.cta-button',
      navToggle: '#navToggle'
    });
  }
});

export { expect };