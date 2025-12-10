import { test, expect } from '@playwright/test';

test.describe('Viewport Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    });

    test('should show viewport navigation bar on narrow screens', async ({ page }) => {
        await page.goto('/docs/library/');
        
        const navSidebar = page.locator('.nav-sidebar');
        await expect(navSidebar).toBeVisible();
        
        // Check positioning and height
        const navBox = await navSidebar.boundingBox();
        expect(navBox.y).toBe(0); // Should be at top
        expect(navBox.height).toBe(60); // Should be 60px height
        expect(navBox.width).toBe(375); // Should be full width
    });

    test('should apply proper padding to app container', async ({ page }) => {
        await page.goto('/docs/library/');
        
        const appContainer = page.locator('.app-container');
        const paddingTop = await appContainer.evaluate(el => 
            window.getComputedStyle(el).paddingTop
        );
        
        expect(paddingTop).toBe('60px');
    });

    test('should have proper touch targets for navigation icons', async ({ page }) => {
        await page.goto('/docs/library/');
        
        const navIcons = page.locator('.nav-collapsed-icon');
        const count = await navIcons.count();
        
        for (let i = 0; i < count; i++) {
            const icon = navIcons.nth(i);
            const box = await icon.boundingBox();
            
            // Touch targets should be at least 44px
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
        }
    });

    test('should work across all pages', async ({ page }) => {
        const pages = ['/docs/library/', '/docs/patcher/'];
        
        for (const pagePath of pages) {
            await page.goto(pagePath);
            
            const navSidebar = page.locator('.nav-sidebar');
            await expect(navSidebar).toBeVisible();
            
            const appContainer = page.locator('.app-container');
            const paddingTop = await appContainer.evaluate(el => 
                window.getComputedStyle(el).paddingTop
            );
            expect(paddingTop).toBe('60px');
        }
    });
});