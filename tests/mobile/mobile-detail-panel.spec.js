import { test, expect } from '@playwright/test';

test.describe('Mobile Detail Panel', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should be full screen on mobile when open', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(2000); // Wait for library to load
        
        // Open first hack detail
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        const detailPanel = page.locator('.detail-panel.open');
        await expect(detailPanel).toBeVisible();
        
        // Check full screen positioning
        const panelBox = await detailPanel.boundingBox();
        expect(panelBox.x).toBe(0);
        expect(panelBox.y).toBe(0);
        expect(panelBox.width).toBe(375); // Viewport width
        expect(panelBox.height).toBe(667); // Viewport height
    });

    test('should lock background scroll when panel is open', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(2000);
        
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        // Check body scroll lock
        const bodyClass = await page.evaluate(() => 
            document.body.className
        );
        expect(bodyClass).toContain('detail-panel-open');
        
        const bodyOverflow = await page.evaluate(() => 
            window.getComputedStyle(document.body).overflow
        );
        expect(bodyOverflow).toBe('hidden');
    });

    test('should have proper metadata layout on mobile', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(2000);
        
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        const detailMeta = page.locator('.detail-meta');
        await expect(detailMeta).toBeVisible();
        
        // Check flex layout
        const flexDirection = await detailMeta.evaluate(el => 
            window.getComputedStyle(el).flexDirection
        );
        expect(flexDirection).toBe('row');
        
        const flexWrap = await detailMeta.evaluate(el => 
            window.getComputedStyle(el).flexWrap
        );
        expect(flexWrap).toBe('wrap');
    });

    test('should have close button with proper touch target', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(2000);
        
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        const closeBtn = page.locator('.detail-close');
        await expect(closeBtn).toBeVisible();
        
        const closeBox = await closeBtn.boundingBox();
        expect(closeBox.width).toBeGreaterThanOrEqual(44);
        expect(closeBox.height).toBeGreaterThanOrEqual(44);
    });

    test('should close panel when close button is clicked', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(2000);
        
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        const closeBtn = page.locator('.detail-close');
        await closeBtn.click();
        
        const detailPanel = page.locator('.detail-panel');
        await expect(detailPanel).not.toHaveClass(/open/);
        
        // Check body scroll unlock
        const bodyClass = await page.evaluate(() => 
            document.body.className
        );
        expect(bodyClass).not.toContain('detail-panel-open');
    });
});