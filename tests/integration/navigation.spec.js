import { test, expect } from '../fixtures/base.js';

test.describe('Navigation Flow', () => {
  test('all pages load and function correctly', async ({ page }) => {
    await test.step('Landing page works', async () => {
      await page.goto('/docs/');
      await expect(page.locator('h1')).toContainText('Universal ROM Manager');
      await expect(page.locator('.cta-button')).toHaveCount(2);
    });

    await test.step('Library page works', async () => {
      await page.goto('/docs/library/');
      await expect(page.locator('h1')).toContainText('ROM Library');
      await expect(page.locator('#searchInput')).toBeVisible();
    });

    await test.step('Patcher page works', async () => {
      await page.goto('/docs/patcher/');
      await expect(page.locator('h1')).toContainText('ROM Patcher');
      await expect(page.locator('#patchSearch')).toBeVisible();
    });
  });


});