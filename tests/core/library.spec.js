import { test, expect } from '../fixtures/base.js';

test.describe('Library Page', () => {
  test('loads correctly', async ({ libraryPage, selectors }) => {
    await expect(libraryPage.locator('h1')).toContainText('ROM Library');
    await expect(libraryPage.locator(selectors.searchInput)).toBeVisible();
  });

  test('displays navigation', async ({ libraryPage, selectors }) => {
    const sidebar = libraryPage.locator(selectors.navSidebar);
    await expect(sidebar).toBeVisible();
    
    await test.step('Check collapsed nav icons', async () => {
      await expect(sidebar.locator('.nav-collapsed-icon[href="../"]')).toBeVisible();
      await expect(sidebar.locator('.nav-collapsed-icon[href="../patcher/"]')).toBeVisible();
    });
  });

  test('handles search', async ({ libraryPage, selectors }) => {
    const searchInput = libraryPage.locator(selectors.searchInput);
    await searchInput.fill('test');
    await libraryPage.waitForTimeout(300);
  });

  test('toggles theme', async ({ libraryPage }) => {
    const toggle = libraryPage.locator('#themeToggleCollapsed');
    const body = libraryPage.locator('body');
    
    await expect(toggle).toBeVisible();
    
    // Wait for app to fully initialize
    await libraryPage.waitForTimeout(2000);
    
    // Use force click since Playwright has issues with SVG clicks
    await toggle.click({ force: true });
    
    // Wait for theme change to process
    await libraryPage.waitForTimeout(500);
    
    await expect(body).toHaveClass(/dark-mode/);
  });
});