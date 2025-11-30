import { test, expect } from '../fixtures/base.js';

test.describe('Patcher Page', () => {
  test('loads correctly', async ({ patcherPage, selectors }) => {
    await expect(patcherPage.locator('h1')).toContainText('ROM Patcher');
    await expect(patcherPage.locator(selectors.searchInput)).toBeVisible();
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

  test('shows creator mode toggle', async ({ patcherPage }) => {
    const toggleLabel = patcherPage.locator('.toggle-switch');
    await expect(toggleLabel).toBeVisible();
  });

  test('displays patch interface', async ({ patcherPage }) => {
    await expect(patcherPage.locator('.file-input-label')).toBeVisible();
    await expect(patcherPage.locator('#applyPatchBtn')).toBeVisible();
    await expect(patcherPage.locator('#applyPatchBtn')).toBeDisabled();
  });
});