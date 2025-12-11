import { test, expect } from '../fixtures/base.js';

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('displays horizontal navigation on mobile', async ({ page }) => {
    await page.goto('/library/');
    
    const navSidebar = page.locator('.nav-sidebar');
    await expect(navSidebar).toBeVisible();
    
    const flexDirection = await navSidebar.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    expect(flexDirection).toBe('row');
  });
  
  test('nav icons are properly sized for touch', async ({ page }) => {
    await page.goto('/library/');
    
    const icons = page.locator('.nav-collapsed-icon');
    const firstIcon = icons.first();
    
    const box = await firstIcon.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
  
  test('nav icons are horizontally arranged', async ({ page }) => {
    await page.goto('/library/');
    
    const iconsContainer = page.locator('.nav-collapsed-icons');
    await expect(iconsContainer).toBeVisible();
    
    const flexDirection = await iconsContainer.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    expect(flexDirection).toBe('row');
  });
});
