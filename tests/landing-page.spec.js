const { test, expect } = require('@playwright/test');

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load landing page with correct content', async ({ page }) => {
    await expect(page).toHaveTitle(/Universal ROM Management/);
    await expect(page.locator('h1')).toContainText('Universal ROM Management');
    await expect(page.locator('.hero p')).toContainText('Apply patches to your favorite games with ease');
  });

  test('should display all feature cards', async ({ page }) => {
    const features = page.locator('.feature');
    await expect(features).toHaveCount(4);
    
    // Check each feature has required elements
    for (let i = 0; i < 4; i++) {
      const feature = features.nth(i);
      await expect(feature.locator('.feature-icon')).toBeVisible();
      await expect(feature.locator('h3')).toBeVisible();
      await expect(feature.locator('p')).toBeVisible();
    }
    
    // Check specific feature titles
    await expect(features.nth(0).locator('h3')).toContainText('Secure');
    await expect(features.nth(1).locator('h3')).toContainText('Universal');
    await expect(features.nth(2).locator('h3')).toContainText('Smart');
    await expect(features.nth(3).locator('h3')).toContainText('Organized');
  });

  test('should have working CTA buttons', async ({ page }) => {
    const patcherButton = page.locator('.cta-button').first();
    const libraryButton = page.locator('.cta-button.cta-secondary');
    
    await expect(patcherButton).toBeVisible();
    await expect(patcherButton).toContainText('ROM Patcher');
    await expect(patcherButton).toHaveAttribute('href', 'patcher/');
    
    await expect(libraryButton).toBeVisible();
    await expect(libraryButton).toContainText('ROM Library');
    await expect(libraryButton).toHaveAttribute('href', 'docs/');
    
    // Test library navigation
    await libraryButton.click();
    await expect(page).toHaveURL(/.*docs/);
    await expect(page.locator('h1')).toContainText('ROM Library');
  });

  test('should display theme toggle', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    
    // Should be positioned fixed in bottom-left
    const styles = await themeToggle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        bottom: computed.bottom,
        left: computed.left
      };
    });
    
    expect(styles.position).toBe('fixed');
  });

  test('should toggle theme correctly', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    const body = page.locator('body');
    
    // Check initial state (light mode)
    await expect(body).not.toHaveClass(/dark-mode/);
    
    // Click to toggle to dark mode
    await themeToggle.click();
    await expect(body).toHaveClass(/dark-mode/);
    
    // Click to toggle back to light mode
    await themeToggle.click();
    await expect(body).not.toHaveClass(/dark-mode/);
  });

  test('should display background animations', async ({ page }) => {
    const backgroundShapes = page.locator('.background-shapes');
    await expect(backgroundShapes).toBeVisible();
    
    const shapes = page.locator('.shape');
    await expect(shapes).toHaveCount(3);
    
    // Check shapes have animation
    for (let i = 0; i < 3; i++) {
      const shape = shapes.nth(i);
      await expect(shape).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible and accessible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.cta-button')).toBeVisible();
    await expect(page.locator('.features')).toBeVisible();
    
    // Theme toggle should be smaller on mobile
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
  });

  test('should have proper Lucide icons', async ({ page }) => {
    // Wait for Lucide to initialize
    await page.waitForTimeout(1000);
    
    // Check CTA button icons
    const patcherIcon = page.locator('.cta-button i[data-lucide="download"]');
    const libraryIcon = page.locator('.cta-button i[data-lucide="book-open"]');
    await expect(patcherIcon).toBeVisible();
    await expect(libraryIcon).toBeVisible();
    
    // Check feature icons
    const featureIcons = page.locator('.feature-icon');
    await expect(featureIcons).toHaveCount(4);
    
    // Check theme toggle icon
    const themeIcon = page.locator('#themeToggle i');
    await expect(themeIcon).toBeVisible();
  });
});