import { test, expect } from '../fixtures/base.js';

test.describe('Smoke Tests', () => {
  test('critical pages load', async ({ page }) => {
    const pages = [
      { url: '/', title: 'Universal ROM Manager' },
      { url: '/docs/library/', title: 'ROM Library' },
      { url: '/docs/patcher/', title: 'ROM Patcher' }
    ];

    for (const { url, title } of pages) {
      await test.step(`Load ${url}`, async () => {
        await page.goto(url);
        await expect(page.locator('h1')).toContainText(title);
      });
    }
  });

  test('essential UI elements present', async ({ libraryPage, selectors }) => {
    await expect(libraryPage.locator(selectors.searchInput)).toBeVisible();
    await expect(libraryPage.locator(selectors.navSidebar)).toBeVisible();
  });

  test('JavaScript loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/docs/patcher/');
    await page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  });
});