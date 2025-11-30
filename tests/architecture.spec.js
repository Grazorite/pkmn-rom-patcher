const { test, expect } = require('@playwright/test');

test.describe('Architecture Validation', () => {
  test('should load landing page correctly', async ({ page }) => {
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/Universal ROM Management/);
    await expect(page.locator('h1')).toContainText('Universal ROM Management');
    
    // Check navigation buttons work
    const patcherBtn = page.locator('a[href="patcher/"]');
    const libraryBtn = page.locator('a[href="library/"]');
    
    await expect(patcherBtn).toBeVisible();
    await expect(libraryBtn).toBeVisible();
  });

  test('should load patcher page correctly', async ({ page }) => {
    await page.goto('/docs/patcher/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/ROM Patcher/);
    await expect(page.locator('h1')).toContainText('ROM Patcher');
    
    // Check essential elements exist
    await expect(page.locator('#patchSearch')).toBeVisible();
    await expect(page.locator('#romFileInput')).toBeAttached();
    await expect(page.locator('#applyPatchBtn')).toBeVisible();
  });

  test('should load library page correctly', async ({ page }) => {
    await page.goto('/docs/library/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/ROM Library/);
    await expect(page.locator('h1')).toContainText('ROM Library');
    
    // Check essential elements exist
    await expect(page.locator('#searchInput')).toBeVisible();
    await expect(page.locator('#hackGrid')).toBeVisible();
  });

  test('should navigate between pages correctly', async ({ page }) => {
    // Start at landing
    await page.goto('/docs/');
    
    // Go to patcher
    await page.click('a[href="patcher/"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*patcher\/$/);
    
    // Go to library
    await page.click('.nav-link[href="../library/"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*library\/$/);
    
    // Go back to home
    await page.click('.nav-link[href="../"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*docs\/$/);
  });

  test('should load CSS and JavaScript correctly', async ({ page }) => {
    await page.goto('/docs/library/');
    await page.waitForLoadState('networkidle');
    
    // Check CSS is loaded
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    // Check JavaScript is working
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('should handle manifest loading', async ({ page }) => {
    await page.goto('/docs/library/');
    await page.waitForLoadState('networkidle');
    
    // Wait for manifest to load and populate
    await page.waitForTimeout(2000);
    
    const hackGrid = page.locator('#hackGrid');
    const loadingText = hackGrid.locator('.loading');
    
    // Should either show hacks or "no results" but not "Loading..."
    await expect(loadingText).not.toContainText('Loading ROM hacks...');
  });
});