const { test, expect } = require('@playwright/test');

test.describe('ROM Patcher Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/patcher/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should load patcher page with correct content', async ({ page }) => {
    await expect(page).toHaveTitle(/ROM Patcher/);
    await expect(page.locator('h1')).toContainText('ROM Patcher');
    await expect(page.locator('.app-header p')).toContainText('Search and apply patches directly to your ROM files');
  });

  test('should display navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('.nav-sidebar');
    await expect(sidebar).toBeVisible();
    
    // Check navigation links
    const homeLink = page.locator('.nav-link[href="../"]');
    const patcherLink = page.locator('.nav-link.active');
    const libraryLink = page.locator('.nav-link[href="../library/"]');
    
    await expect(homeLink).toBeVisible();
    await expect(patcherLink).toBeVisible();
    await expect(libraryLink).toBeVisible();
    
    // Check active state
    await expect(patcherLink).toHaveClass(/active/);
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('.breadcrumb-link');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toHaveAttribute('href', '../');
  });

  test('should show creator mode toggle', async ({ page }) => {
    const creatorToggle = page.locator('#creatorMode');
    const creatorLabel = page.locator('.creator-mode-label');
    
    await expect(creatorToggle).toBeVisible();
    await expect(creatorLabel).toContainText('Creator Mode');
    
    // Should be unchecked by default
    await expect(creatorToggle).not.toBeChecked();
  });

  test('should display search interface', async ({ page }) => {
    const searchInput = page.locator('#patchSearch');
    const searchIcon = page.locator('.search-icon');
    
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search for patches...');
    await expect(searchIcon).toBeVisible();
  });

  test('should show patch results area', async ({ page }) => {
    const patchResults = page.locator('#patchResults');
    await expect(patchResults).toBeVisible();
    await expect(patchResults).toContainText('Start typing to search for patches...');
  });

  test('should display file input section', async ({ page }) => {
    const fileLabel = page.locator('.file-input-label');
    const fileInput = page.locator('#romFileInput');
    
    await expect(fileLabel).toBeVisible();
    await expect(fileLabel).toContainText('Select ROM File');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', '.gb,.gbc,.gba,.nes,.smc,.sfc,.z64,.n64');
  });

  test('should show apply patch button (disabled initially)', async ({ page }) => {
    const applyBtn = page.locator('#applyPatchBtn');
    
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toContainText('Apply Patch');
    await expect(applyBtn).toBeDisabled();
  });

  test('should display theme toggle and work correctly', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    
    // Check initial state (should be light mode)
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Click theme toggle
    await themeToggle.click({ force: true });
    await page.waitForTimeout(300);
    
    // Check dark mode is applied
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
  });

  test('should handle search input', async ({ page }) => {
    const searchInput = page.locator('#patchSearch');
    
    // Type in search box
    await searchInput.fill('Pokemon');
    
    // Wait for search to process
    await page.waitForTimeout(500);
    
    // Results area should update (even if no results found)
    const patchResults = page.locator('#patchResults');
    await expect(patchResults).not.toContainText('Start typing to search for patches...');
  });

  test('should toggle creator mode', async ({ page }) => {
    const creatorToggle = page.locator('#creatorMode');
    
    // Initially unchecked
    await expect(creatorToggle).not.toBeChecked();
    
    // Click to enable
    await creatorToggle.click();
    await expect(creatorToggle).toBeChecked();
    
    // Click to disable
    await creatorToggle.click();
    await expect(creatorToggle).not.toBeChecked();
  });

  test('should show debug container when present', async ({ page }) => {
    const debugContainer = page.locator('#debugContainer');
    await expect(debugContainer).toBeAttached();
    
    // Should be hidden by default
    await expect(debugContainer).toHaveCSS('display', 'none');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that layout adapts
    await expect(page.locator('.patcher-layout')).toBeVisible();
    await expect(page.locator('.patcher-main')).toBeVisible();
    await expect(page.locator('.patcher-sidebar')).toBeVisible();
    
    // Navigation should still be accessible
    await expect(page.locator('.nav-sidebar')).toBeVisible();
  });

  test('should handle loading overlay', async ({ page }) => {
    const loadingOverlay = page.locator('#loadingOverlay');
    await expect(loadingOverlay).toBeAttached();
    
    // Should be hidden by default
    await expect(loadingOverlay).toHaveCSS('display', 'none');
  });

  test('should navigate back to home', async ({ page }) => {
    const breadcrumb = page.locator('.breadcrumb-link');
    
    await breadcrumb.click();
    await page.waitForLoadState('networkidle');
    
    // Should be on landing page
    await expect(page).toHaveURL(/.*docs\/$/);
    await expect(page.locator('h1')).toContainText('Universal ROM Management');
  });

  test('should navigate to library', async ({ page }) => {
    const libraryLink = page.locator('.nav-link[href="../library/"]');
    
    await libraryLink.click();
    await page.waitForLoadState('networkidle');
    
    // Should be on library page
    await expect(page).toHaveURL(/.*library\/$/);
    await expect(page.locator('h1')).toContainText('ROM Library');
  });
});