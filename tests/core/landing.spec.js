import { test, expect } from '../fixtures/base.js';

test.describe('Landing Page', () => {
  test('loads with correct content', async ({ landingPage, selectors }) => {
    await test.step('Check page title and header', async () => {
      await expect(landingPage).toHaveTitle(/Universal ROM Manager/);
      await expect(landingPage.locator('h1')).toContainText('Universal ROM Manager');
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


});