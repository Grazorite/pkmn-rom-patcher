import { test, expect } from './fixtures/base.js';

test.describe('Info Box Bug Fix Verification', () => {
    test('info box loads after clearing search and typing again', async ({ page }) => {
        await page.goto('/docs/patcher/');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Initial search
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        
        // Select first patch - should show info box
        await page.locator('.patch-result').first().click();
        await page.waitForTimeout(300);
        
        const infoBox1 = page.locator('#selectedPatch');
        await expect(infoBox1).toBeVisible();
        
        // Close info box
        await page.locator('#closePatchDescription').click();
        await page.waitForTimeout(300);
        await expect(infoBox1).toBeHidden();
        
        // Clear search
        await page.fill('#patchSearch', '');
        await page.waitForTimeout(300);
        
        // New search
        await page.fill('#patchSearch', 'Gold');
        await page.waitForTimeout(500);
        
        // Select patch again - this should now work (was broken before fix)
        await page.locator('.patch-result').first().click();
        await page.waitForTimeout(300);
        
        const infoBox2 = page.locator('#selectedPatch');
        await expect(infoBox2).toBeVisible();
        
        // Verify patcher widget also shows
        const patcherWidget = page.locator('#rom-patcher-container');
        await expect(patcherWidget).toBeVisible();
    });
});