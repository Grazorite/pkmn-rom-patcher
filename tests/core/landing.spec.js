import { test, expect } from '../fixtures/base.js';

test.describe('Landing Page', () => {
  test('loads with correct content', async ({ landingPage, selectors }) => {
    await test.step('Check page title and header', async () => {
      await expect(landingPage).toHaveTitle(/Universal ROM Management/);
      await expect(landingPage.locator('h1')).toContainText('Universal ROM Management');
    });

    await test.step('Check CTA buttons', async () => {
      const patcherBtn = landingPage.locator('.cta-button').first();
      const libraryBtn = landingPage.locator('.cta-button.cta-secondary');
      
      await expect(patcherBtn).toBeVisible();
      await expect(libraryBtn).toBeVisible();
    });
  });

  test('navigates correctly', async ({ landingPage }) => {
    await landingPage.locator('.cta-button.cta-secondary').click();
    await expect(landingPage).toHaveURL(/.*docs/);
  });

  test('toggles theme', async ({ landingPage, selectors }) => {
    const toggle = landingPage.locator(selectors.themeToggle);
    const body = landingPage.locator('body');
    
    await toggle.click();
    await expect(body).toHaveClass(/dark-mode/);
  });
});