const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Patcher Page Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/docs/patcher/');
        await page.waitForLoadState('networkidle');
    });

    test('should hide patcher widget until patch is selected', async ({ page }) => {
        // Patcher widget should be hidden initially
        const patcherContainer = page.locator('#rom-patcher-container');
        await expect(patcherContainer).toBeHidden();
    });

    test('should show patcher widget after selecting a patch', async ({ page }) => {
        // Search for a patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);

        // Click first result
        const firstResult = page.locator('.patch-result').first();
        await expect(firstResult).toBeVisible();
        await firstResult.click();

        // Patcher widget should now be visible
        const patcherContainer = page.locator('#rom-patcher-container');
        await expect(patcherContainer).toBeVisible();

        // ROM file input should be enabled
        const romInput = page.locator('#rom-patcher-input-file-rom');
        await expect(romInput).toBeEnabled();
    });

    test('should calculate CRC after ROM upload', async ({ page }) => {
        // Select a patch first
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();

        // Wait for patcher to be visible
        await page.waitForSelector('#rom-patcher-container', { state: 'visible' });

        // Upload a test ROM
        const testRomPath = path.join(__dirname, 'fixtures', 'test-rom.gba');
        const romInput = page.locator('#rom-patcher-input-file-rom');
        await romInput.setInputFiles(testRomPath);

        // Wait for CRC calculation
        await page.waitForTimeout(2000);

        // CRC should be calculated (not "Calculating...")
        const crc32Span = page.locator('#rom-patcher-span-crc32');
        const crc32Text = await crc32Span.textContent();
        expect(crc32Text).not.toBe('Calculating...');
        expect(crc32Text).not.toBe('');
    });

    test('should enable apply button after ROM is loaded', async ({ page }) => {
        // Select a patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();

        // Upload ROM
        const testRomPath = path.join(__dirname, 'fixtures', 'test-rom.gba');
        await page.locator('#rom-patcher-input-file-rom').setInputFiles(testRomPath);

        // Wait for processing
        await page.waitForTimeout(2000);

        // Apply button should be enabled
        const applyButton = page.locator('#rom-patcher-button-apply');
        await expect(applyButton).toBeEnabled();
    });

    test('should show patch description when selected', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();

        // Patch description should be visible
        const selectedPatch = page.locator('#selectedPatch');
        await expect(selectedPatch).toBeVisible();

        const description = page.locator('#selectedPatchDescription');
        await expect(description).not.toBeEmpty();
    });
});
