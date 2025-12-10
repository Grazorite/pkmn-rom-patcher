import { test, expect } from '@playwright/test';

test.describe('Responsive Desktop Mobile Layout', () => {
    test('desktop browser with mobile dimensions shows mobile layout', async ({ page }) => {
        // Start with desktop size
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/library/');
        
        // Should show desktop layout
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.mobile-filter-trigger')).toBeHidden();
        
        // Resize to mobile dimensions
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(100);
        
        // Should switch to mobile layout
        await expect(page.locator('.sidebar')).toBeHidden();
        await expect(page.locator('.mobile-filter-trigger')).toBeVisible();
        await expect(page.locator('.mobile-nav-bar')).toBeVisible();
    });

    test('narrow desktop window triggers mobile layout', async ({ page }) => {
        // Set narrow desktop window (like resized browser)
        await page.setViewportSize({ width: 600, height: 800 });
        await page.goto('/library/');
        
        // Should show mobile layout at 600px width
        await expect(page.locator('.sidebar')).toBeHidden();
        await expect(page.locator('.mobile-filter-trigger')).toBeVisible();
        await expect(page.locator('.mobile-nav-bar')).toBeVisible();
        
        // Widen window
        await page.setViewportSize({ width: 900, height: 800 });
        await page.waitForTimeout(100);
        
        // Should switch back to desktop layout
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.mobile-filter-trigger')).toBeHidden();
    });

    test('detail panel adapts to narrow desktop window', async ({ page }) => {
        await page.setViewportSize({ width: 500, height: 700 });
        await page.goto('/library/');
        
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        const detailPanel = page.locator('.detail-panel.open');
        await expect(detailPanel).toBeVisible();
        
        // Should be full screen on narrow window
        const panelBox = await detailPanel.boundingBox();
        expect(panelBox.width).toBe(500);
        expect(panelBox.height).toBe(700);
        
        // Should have mobile-style metadata layout
        const detailMeta = page.locator('.detail-meta');
        const flexDirection = await detailMeta.evaluate(el => 
            window.getComputedStyle(el).flexDirection
        );
        expect(flexDirection).toBe('row');
    });

    test('back-to-top button positioning adapts to window size', async ({ page }) => {
        await page.setViewportSize({ width: 400, height: 600 });
        await page.goto('/');
        
        // Add scrollable content
        await page.evaluate(() => {
            document.body.style.height = '2000px';
            window.scrollTo(0, 300);
        });
        await page.waitForTimeout(200);
        
        const backToTop = page.locator('.back-to-top');
        await expect(backToTop).toBeVisible();
        
        const buttonBox = await backToTop.boundingBox();
        // Should use mobile positioning (above nav bar)
        expect(buttonBox.y).toBeLessThan(540); // 600 - 60px nav
    });
});