import { test, expect } from '@playwright/test';

test.describe('Manual Verification', () => {
    test('patcher page navigation and images work', async ({ page }) => {
        // Test desktop viewport
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/patcher/');
        
        // Check navigation exists
        const navSidebar = page.locator('.nav-sidebar');
        await expect(navSidebar).toBeVisible();
        
        // Check back-to-top button positioning
        await page.evaluate(() => {
            document.body.style.height = '2000px';
            window.scrollTo(0, 300);
        });
        await page.waitForTimeout(200);
        
        const backToTop = page.locator('.back-to-top');
        if (await backToTop.isVisible()) {
            const buttonBox = await backToTop.boundingBox();
            expect(buttonBox.x).toBeGreaterThan(900); // Should be on right side
        }
        
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        // Check mobile navigation
        const navBox = await navSidebar.boundingBox();
        expect(navBox.height).toBe(60);
        expect(navBox.width).toBe(375);
        
        // Check collapsed icons are visible
        const collapsedIcons = page.locator('.nav-collapsed-icon');
        const iconCount = await collapsedIcons.count();
        expect(iconCount).toBeGreaterThan(0);
        
        // Check app container has proper padding
        const appContainer = page.locator('.app-container');
        const paddingTop = await appContainer.evaluate(el => 
            window.getComputedStyle(el).paddingTop
        );
        expect(paddingTop).toBe('60px');
    });
    
    test('back-to-top button appears on right side', async ({ page }) => {
        await page.goto('/library/');
        await page.waitForTimeout(2000);
        
        // Add scrollable content
        await page.evaluate(() => {
            document.body.style.height = '2000px';
            window.scrollTo(0, 400);
        });
        await page.waitForTimeout(300);
        
        const backToTop = page.locator('.back-to-top');
        await expect(backToTop).toBeVisible();
        
        const buttonBox = await backToTop.boundingBox();
        const viewportWidth = await page.viewportSize().then(size => size.width);
        
        // Button should be on right side (x position > 50% of viewport width)
        expect(buttonBox.x).toBeGreaterThan(viewportWidth * 0.5);
    });
});