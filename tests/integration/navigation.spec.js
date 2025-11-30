import { test, expect } from '../fixtures/base.js';

test.describe('Navigation Flow', () => {
  test('navigates between pages', async ({ page }) => {
    await test.step('Start at landing page', async () => {
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('Universal ROM Management');
    });

    await test.step('Navigate to library', async () => {
      await page.locator('.cta-button.cta-secondary').click();
      await expect(page).toHaveURL(/.*docs/);
      await expect(page.locator('h1')).toContainText('ROM Library');
    });

    await test.step('Navigate to patcher', async () => {
      await page.locator('a[href="../patcher/"]').click();
      await expect(page).toHaveURL(/.*patcher/);
      await expect(page.locator('h1')).toContainText('ROM Patcher');
    });

    await test.step('Return home', async () => {
      await page.locator('a[href="../"]').click();
      await expect(page).toHaveURL(/.*docs/);
    });
  });

  test('preserves theme across navigation', async ({ page }) => {
    await page.goto('/');
    
    await test.step('Enable dark mode', async () => {
      await page.locator('#themeToggle').click();
      await expect(page.locator('body')).toHaveClass(/dark-mode/);
    });

    await test.step('Navigate and check theme persistence', async () => {
      await page.locator('.cta-button.cta-secondary').click();
      await expect(page.locator('body')).toHaveClass(/dark-mode/);
    });
  });
});