import { test, expect } from '../fixtures/base.js';

test.describe('Smoke Tests', () => {
  test('critical pages load', async ({ page }) => {
    const pages = [
      { url: '/', title: 'Universal ROM Management' },
      { url: '/docs/library/', title: 'ROM Library' },
      { url: '/docs/patcher/', title: 'ROM Patcher' },
      { url: '/docs/submit/', title: 'Submit Patch' }
    ];

    for (const { url, title } of pages) {
      await test.step(`Load ${url}`, async () => {
        await page.goto(url);
        await expect(page.locator('h1')).toContainText(title);
      });
    }
  });

  test('essential UI elements present', async ({ libraryPage, selectors }) => {
    await expect(libraryPage.locator(selectors.searchInput)).toBeVisible();
    await expect(libraryPage.locator(selectors.navSidebar)).toBeVisible();
  });

  test('JavaScript loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto('/docs/patcher/');
    await page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  });

  test('back-to-top button functionality works', async ({ libraryPage }) => {
    const backToTop = libraryPage.locator('.back-to-top');
    
    // Ensure button exists
    await expect(backToTop).toBeAttached();
    
    // Scroll down to trigger button visibility
    await libraryPage.evaluate(() => {
      // Add some content to ensure scrollable area
      document.body.style.minHeight = '200vh';
      window.scrollTo(0, 500);
    });
    
    // Wait for scroll handler to process
    await libraryPage.waitForTimeout(200);
    
    // Check if button has visible class
    await expect(backToTop).toHaveClass(/visible/);
    
    // Test click functionality by forcing click
    await libraryPage.evaluate(() => {
      const btn = document.querySelector('.back-to-top');
      if (btn) btn.click();
    });
    
    // Wait for smooth scroll to complete
    await libraryPage.waitForTimeout(500);
    
    // Verify scroll position is at top
    const scrollY = await libraryPage.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);
  });
  
  test('viewport navigation positioning works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/docs/library/');
    
    // Check viewport nav exists
    const navSidebar = page.locator('.nav-sidebar');
    await expect(navSidebar).toBeVisible();
    
    // Check back-to-top viewport positioning
    await page.evaluate(() => {
      document.body.style.minHeight = '200vh';
      window.scrollTo(0, 300);
    });
    await page.waitForTimeout(200);
    
    const backToTop = page.locator('.back-to-top');
    await expect(backToTop).toBeVisible();
    
    const buttonBox = await backToTop.boundingBox();
    // Button should be in bottom right area (within last 100px of viewport height)
    expect(buttonBox.y).toBeGreaterThan(567); // 667 - 100px
    expect(buttonBox.x).toBeGreaterThan(300); // Should be on right side
  });

  test('state persistence does not break page load', async ({ page }) => {
    await page.goto('/docs/library/');
    await page.fill('#searchInput', 'test');
    
    await page.goto('/docs/patcher/');
    await page.goto('/docs/library/');
    
    await expect(page.locator('h1')).toBeVisible();
  });
});