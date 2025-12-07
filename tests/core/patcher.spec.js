import { test, expect } from '../fixtures/base.js';

test.describe('Patcher Page', () => {
  test('loads correctly', async ({ patcherPage, selectors }) => {
    await expect(patcherPage.locator('h1')).toContainText('ROM Patcher');
    await expect(patcherPage.locator(selectors.patchSearch)).toBeVisible();
  });

  test('displays navigation', async ({ patcherPage, selectors }) => {
    const sidebar = patcherPage.locator(selectors.navSidebar);
    await expect(sidebar).toBeVisible();
  });

  test('handles search input', async ({ patcherPage, selectors }) => {
    const searchInput = patcherPage.locator('#patchSearch');
    await searchInput.fill('test');
    await patcherPage.waitForTimeout(300);
  });

  test('hides patcher widget initially', async ({ patcherPage }) => {
    const patcherContainer = patcherPage.locator('#rom-patcher-container');
    await expect(patcherContainer).toBeHidden();
  });

  test('shows patch results container', async ({ patcherPage }) => {
    const resultsContainer = patcherPage.locator('#patchResults');
    await expect(resultsContainer).toBeVisible();
  });
});