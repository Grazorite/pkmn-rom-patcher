const { test, expect } = require('@playwright/test');

test.describe('Theme Persistence Across Pages', () => {
  test('should preserve theme state when navigating from landing to store', async ({ page }) => {
    // Start on landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify initial light mode
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Toggle to dark mode on landing page
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Navigate to ROM library using the correct button
    await page.locator('.cta-button.cta-secondary').click();
    await page.waitForLoadState('networkidle');
    
    // Verify dark mode is preserved
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Verify theme toggle shows correct icon for dark mode
    const themeToggle = page.locator('#themeToggle');
    const icon = themeToggle.locator('i');
    await expect(icon).toHaveAttribute('data-lucide', 'moon');
  });

  test('should preserve theme state when navigating from library to landing', async ({ page }) => {
    // Start on ROM library page
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    // Verify initial light mode
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Toggle to dark mode on library page
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Navigate back to landing page
    await page.locator('.breadcrumb-link').click();
    await page.waitForLoadState('networkidle');
    
    // Verify dark mode is preserved
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Verify theme toggle shows correct icon for dark mode
    const themeToggle = page.locator('#themeToggle');
    const icon = themeToggle.locator('i');
    await expect(icon).toHaveAttribute('data-lucide', 'moon');
  });

  test('should persist theme across browser refresh', async ({ page }) => {
    // Start on landing page and set dark mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify dark mode is still active
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Test on store page too
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    // Should still be dark mode
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
  });

  test('should handle theme toggle on both pages independently', async ({ page }) => {
    // Start on landing page in light mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Toggle to dark mode
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Navigate to library page
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    // Should be dark mode
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Toggle back to light mode on library page
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Navigate back to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should be light mode
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  });

  test('should initialize with correct theme on first visit', async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    
    // Reload to test default theme
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should default to light mode
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Theme toggle should show sun icon (light mode)
    const icon = page.locator('#themeToggle i');
    await expect(icon).toHaveAttribute('data-lucide', 'sun');
  });

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Set invalid theme value in localStorage
    await page.evaluate(() => {
      localStorage.setItem('theme', 'invalid-value');
    });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should default to light mode
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Theme toggle should still work
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
  });

  test('should maintain theme consistency across multiple page loads', async ({ page }) => {
    const pages = ['/', '/docs/', '/patcher/'];
    
    // Set dark mode on first page
    await page.goto(pages[0]);
    await page.waitForLoadState('networkidle');
    await page.locator('#themeToggle').click();
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Test theme persistence across multiple page navigations
    for (let i = 0; i < 2; i++) {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Should maintain dark mode
        await expect(page.locator('body')).toHaveClass(/dark-mode/);
        
        // Theme toggle should show moon icon
        const icon = page.locator('#themeToggle i');
        await expect(icon).toHaveAttribute('data-lucide', 'moon');
      }
    }
  });
});