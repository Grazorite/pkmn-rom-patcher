import { test, expect } from '@playwright/test';

test.describe('Mobile Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
    });

    test('mobile components work together correctly', async ({ page }) => {
        await page.goto('/library/');
        
        // Check all mobile components are present
        await expect(page.locator('.mobile-nav-bar')).toBeVisible();
        await expect(page.locator('.mobile-filter-trigger')).toBeVisible();
        await expect(page.locator('.sidebar')).toBeHidden();
        
        // Test filter interaction doesn't interfere with navigation
        const filterTrigger = page.locator('.mobile-filter-trigger');
        await filterTrigger.click();
        
        const mobileNav = page.locator('.mobile-nav-bar');
        await expect(mobileNav).toBeVisible(); // Nav should still be visible
        
        // Close filter and test detail panel
        const backdrop = page.locator('.mobile-filter-backdrop');
        await backdrop.click();
        
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        // Detail panel should be full screen
        const detailPanel = page.locator('.detail-panel.open');
        await expect(detailPanel).toBeVisible();
        
        const panelBox = await detailPanel.boundingBox();
        expect(panelBox.width).toBe(375);
        expect(panelBox.height).toBe(667);
    });

    test('z-index layering is correct', async ({ page }) => {
        await page.goto('/library/');
        
        // Add scrollable content for back-to-top
        await page.evaluate(() => {
            document.body.style.height = '2000px';
            window.scrollTo(0, 300);
        });
        await page.waitForTimeout(200);
        
        // Get z-index values
        const navZIndex = await page.locator('.mobile-nav-bar').evaluate(el => 
            window.getComputedStyle(el).zIndex
        );
        
        const backToTopZIndex = await page.locator('.back-to-top').evaluate(el => 
            window.getComputedStyle(el).zIndex
        );
        
        // Open filter sheet
        await page.locator('.mobile-filter-trigger').click();
        
        const filterSheetZIndex = await page.locator('.mobile-filter-sheet').evaluate(el => 
            window.getComputedStyle(el).zIndex
        );
        
        // Verify layering: filter sheet > back-to-top > navigation
        expect(parseInt(filterSheetZIndex)).toBeGreaterThan(parseInt(backToTopZIndex));
        expect(parseInt(backToTopZIndex)).toBeGreaterThan(parseInt(navZIndex));
    });

    test('touch targets meet accessibility standards', async ({ page }) => {
        await page.goto('/library/');
        
        const touchElements = [
            '.mobile-filter-trigger',
            '.nav-link',
            '.mobile-filter-close'
        ];
        
        for (const selector of touchElements) {
            const elements = page.locator(selector);
            const count = await elements.count();
            
            for (let i = 0; i < count; i++) {
                const element = elements.nth(i);
                if (await element.isVisible()) {
                    const box = await element.boundingBox();
                    expect(box.width).toBeGreaterThanOrEqual(44);
                    expect(box.height).toBeGreaterThanOrEqual(44);
                }
            }
        }
    });

    test('responsive breakpoint transitions work', async ({ page }) => {
        // Start desktop
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/library/');
        
        // Should show desktop sidebar
        await expect(page.locator('.sidebar')).toBeVisible();
        await expect(page.locator('.mobile-filter-trigger')).toBeHidden();
        
        // Resize to mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(100);
        
        // Should show mobile elements
        await expect(page.locator('.sidebar')).toBeHidden();
        await expect(page.locator('.mobile-filter-trigger')).toBeVisible();
        await expect(page.locator('.mobile-nav-bar')).toBeVisible();
    });
});