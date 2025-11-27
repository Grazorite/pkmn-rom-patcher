const { test, expect } = require('@playwright/test');

test.describe('ROM Library UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/');
  });

  test('should load the ROM library page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('ROM Library');
    await expect(page.locator('.search-input')).toBeVisible();
  });

  test('should display ROM hacks after loading', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForSelector('.hack-grid .hack-card', { timeout: 10000 });
    
    // Check that hack cards are visible
    const hackCards = page.locator('.hack-card');
    await expect(hackCards).toHaveCountGreaterThan(0);
  });

  test('should show filter options', async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('#baseRomFilters .filter-option', { timeout: 10000 });
    
    // Check filter sections exist
    await expect(page.locator('#baseRomFilters')).toBeVisible();
    await expect(page.locator('#systemFilters')).toBeVisible();
    await expect(page.locator('#statusFilters')).toBeVisible();
  });

  test('should open detail panel when clicking hack card', async ({ page }) => {
    // Wait for hack cards to load
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    
    // Click first hack card
    await page.locator('.hack-card').first().click();
    
    // Check detail panel opens
    await expect(page.locator('#detailPanel')).toHaveClass(/open/);
  });

  test('should toggle theme correctly', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    
    // Click theme toggle
    await themeToggle.click();
    
    // Check body class changes
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should search ROM hacks', async ({ page }) => {
    // Wait for search to be ready
    await page.waitForSelector('.search-input', { timeout: 10000 });
    
    // Type in search
    await page.fill('.search-input', 'Gold');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check results are filtered
    const hackCards = page.locator('.hack-card');
    await expect(hackCards).toHaveCountGreaterThan(0);
  });
});

test.describe('Landing Page', () => {
  test('should load landing page correctly', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('h1')).toContainText('ROM Patcher');
    await expect(page.locator('.cta-button')).toBeVisible();
  });

  test('should navigate to ROM store', async ({ page }) => {
    await page.goto('/');
    
    await page.click('.cta-button');
    await expect(page).toHaveURL(/.*docs/);
  });

  test('should toggle theme on landing page', async ({ page }) => {
    await page.goto('/');
    
    const themeToggle = page.locator('#themeToggle');
    await themeToggle.click();
    
    await expect(page.locator('body')).toHaveClass(/dark/);
  });
});