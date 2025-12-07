const { test, expect } = require('@playwright/test');

test.describe('Library to Patcher Integration', () => {
    test('should navigate from library to patcher and pre-select patch', async ({ page }) => {
        // Start on library page
        await page.goto('http://localhost:3000/docs/library/');
        
        // Wait for hacks to load
        await page.waitForSelector('.hack-card', { timeout: 10000 });
        
        // Click on first hack card
        const firstHack = page.locator('.hack-card').first();
        await firstHack.click();
        
        // Wait for detail panel to open
        await page.waitForSelector('#detailPanel.open', { timeout: 5000 });
        
        // Click on Patch tab
        await page.click('[data-tab="patch"]');
        
        // Wait for patch tab content
        await page.waitForSelector('#patchTab.active', { timeout: 2000 });
        
        // Get patch info before clicking
        const hackTitle = await page.locator('#detailTitle').textContent();
        
        // Click "Open ROM Patcher" button
        await page.click('#openPatcherBtn');
        
        // Wait for navigation to patcher page
        await page.waitForURL('**/patcher/**', { timeout: 10000 });
        
        // Check URL contains patch parameters
        const url = page.url();
        expect(url).toContain('patch=');
        expect(url).toContain('name=');
        
        // Wait for patcher app to initialize
        await page.waitForSelector('#patchSearch', { timeout: 5000 });
        
        // Wait for patches to load and URL parameters to be processed
        await page.waitForTimeout(2000);
        
        // Check if search field is populated
        const searchValue = await page.locator('#patchSearch').inputValue();
        console.log('Search field value:', searchValue);
        
        // Check if patch results are shown
        const patchResults = page.locator('.patch-result');
        const resultCount = await patchResults.count();
        console.log('Number of patch results:', resultCount);
        
        if (resultCount > 0) {
            // Check if any result is selected
            const selectedResult = page.locator('.patch-result.selected');
            const selectedCount = await selectedResult.count();
            console.log('Number of selected results:', selectedCount);
            
            // Check if selected patch details are shown
            const selectedPatchContainer = page.locator('#selectedPatch');
            const isVisible = await selectedPatchContainer.isVisible();
            console.log('Selected patch container visible:', isVisible);
        }
        
        // Check if RomPatcher widget is visible
        const romPatcherContainer = page.locator('#rom-patcher-container');
        const isRomPatcherVisible = await romPatcherContainer.isVisible();
        console.log('RomPatcher container visible:', isRomPatcherVisible);
        
        // Check if notification appeared
        const notification = page.locator('.notification');
        if (await notification.count() > 0) {
            const notificationText = await notification.textContent();
            console.log('Notification text:', notificationText);
        }
        
        // Assertions
        expect(resultCount).toBeGreaterThan(0);
        expect(isRomPatcherVisible).toBe(true);
    });
    
    test('should show proper patch file name in notification', async ({ page }) => {
        // Navigate directly to patcher with patch parameters
        await page.goto('http://localhost:3000/docs/patcher/?patch=../patches/emerald/Pokemon%20Emerald%20-%20Kaizo%20Emerald%20(v1.4).bps&name=Pokemon%20Emerald%20-%20Kaizo%20Emerald');
        
        // Wait for notification to appear
        await page.waitForSelector('.notification', { timeout: 10000 });
        
        // Check notification content
        const notificationText = await page.locator('.notification span').textContent();
        console.log('Notification text:', notificationText);
        
        // Should show the actual patch file name or title
        expect(notificationText).toContain('Kaizo Emerald');
    });
});