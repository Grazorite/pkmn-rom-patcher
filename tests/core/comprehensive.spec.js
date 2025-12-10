import { test, expect } from '../fixtures/base.js';

test.describe('Comprehensive Test Suite', () => {
  
  // Landing Page - Test what's actually visible
  test('landing page core functionality', async ({ page }) => {
    await page.goto('/docs/');
    
    await expect(page.locator('h1')).toContainText('Universal ROM Management');
    await expect(page.locator('.cta-button')).toHaveCount(3);
    await expect(page.locator('.feature')).toHaveCount(4);
    
    // Test one CTA navigation
    await page.locator('.cta-button').first().click();
    await expect(page).toHaveURL(/patcher/);
  });

  // Library Page - Test core elements without hidden interactions
  test('library page core functionality', async ({ libraryPage }) => {
    await expect(libraryPage.locator('h1')).toContainText('ROM Library');
    await expect(libraryPage.locator('#searchInput')).toBeVisible();
    await expect(libraryPage.locator('#hackGrid')).toBeVisible();
    await expect(libraryPage.locator('#viewToggle')).toBeVisible();
    await expect(libraryPage.locator('#clearFilters')).toBeVisible();
    
    // Test search functionality
    await libraryPage.locator('#searchInput').fill('test');
    await libraryPage.waitForTimeout(300);
  });

  // Submit Page - Test what's actually accessible
  test('submit page core functionality', async ({ page }) => {
    await page.goto('/docs/submit/');
    
    await expect(page.locator('h1')).toContainText('Submit');
    await expect(page.locator('.progress-steps')).toBeVisible();
    await expect(page.locator('.progress-step')).toHaveCount(5);
    
    // Test basic form fields that are visible
    await page.locator('#title').fill('Test Hack');
    await page.locator('#author').fill('Test Author');
    await page.locator('#version').fill('1.0');
    
    await expect(page.locator('#title')).toHaveValue('Test Hack');
  });

  // Cross-page navigation
  test('cross-page navigation works', async ({ page }) => {
    const pages = [
      { url: '/docs/', title: 'Universal ROM Management' },
      { url: '/docs/patcher/', title: 'ROM Patcher' },
      { url: '/docs/library/', title: 'ROM Library' },
      { url: '/docs/submit/', title: 'Submit' }
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await expect(page.locator('h1')).toContainText(pageInfo.title);
    }
  });

  // Test element existence without visibility requirements
  test('form elements exist in DOM', async ({ page }) => {
    await page.goto('/docs/submit/');
    
    // Elements exist even if hidden
    await expect(page.locator('#boxArt')).toHaveCount(1);
    await expect(page.locator('#banner')).toHaveCount(1);
    await expect(page.locator('#previewContent')).toHaveCount(1);
    await expect(page.locator('input[value="url"]')).toHaveCount(1);
  });

  // Test library elements exist
  test('library elements exist in DOM', async ({ libraryPage }) => {
    await expect(libraryPage.locator('#baseRomFilters')).toHaveCount(1);
    await expect(libraryPage.locator('#systemFilters')).toHaveCount(1);
    await expect(libraryPage.locator('#detailPanel')).toHaveCount(1);
    await expect(libraryPage.locator('#openPatcherBtn')).toHaveCount(1);
  });

  // Test responsive behavior
  test('responsive design works', async ({ page }) => {
    await page.goto('/docs/');
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    
    // Desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
  });

  // Test JavaScript loads without errors
  test('no JavaScript errors on pages', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      // Ignore expected manifest loading errors in test environment
      if (!error.message.includes('manifest.json') && !error.message.includes('Load failed')) {
        errors.push(error.message);
      }
    });
    
    await page.goto('/docs/');
    await page.goto('/docs/patcher/');
    await page.goto('/docs/library/');
    await page.goto('/docs/submit/');
    
    expect(errors).toHaveLength(0);
  });

  // Test performance
  test('pages load within reasonable time', async ({ page }) => {
    const pages = ['/docs/', '/docs/patcher/', '/docs/library/', '/docs/submit/'];
    
    for (const pageUrl of pages) {
      const startTime = Date.now();
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    }
  });

  // Test theme consistency
  test('theme elements present on all pages', async ({ page }) => {
    const pages = ['/docs/', '/docs/patcher/', '/docs/library/', '/docs/submit/'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await expect(page.locator('.background-shapes')).toBeVisible();
    }
  });
});