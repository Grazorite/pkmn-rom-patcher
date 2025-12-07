const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Patcher Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/docs/patcher/');
        await page.waitForLoadState('networkidle');
    });

    test('hides patcher widget until patch is selected', async ({ page }) => {
        const patcherContainer = page.locator('#rom-patcher-container');
        await expect(patcherContainer).toBeHidden();
    });

    test('shows patcher widget after selecting a patch', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        const patcherContainer = page.locator('#rom-patcher-container');
        await expect(patcherContainer).toBeVisible();
        
        const romInput = page.locator('#rom-patcher-input-file-rom');
        await expect(romInput).toBeEnabled();
    });

    test('hides widget when patch is deselected', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        const widget = page.locator('#rom-patcher-container');
        await expect(widget).toBeVisible();
        
        await page.locator('#closePatchDescription').click();
        await page.waitForTimeout(300);
        
        await expect(widget).toBeHidden();
    });

    test('calculates CRC after ROM upload', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        await page.waitForSelector('#rom-patcher-container', { state: 'visible' });

        const testRomPath = path.join(__dirname, '..', 'fixtures', 'test-rom.gba');
        await page.locator('#rom-patcher-input-file-rom').setInputFiles(testRomPath);
        await page.waitForTimeout(2000);

        const crc32Span = page.locator('#rom-patcher-span-crc32');
        const crc32Text = await crc32Span.textContent();
        expect(crc32Text).not.toBe('Calculating...');
        expect(crc32Text).not.toBe('');
    });

    test('enables apply button after ROM is loaded', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();

        const testRomPath = path.join(__dirname, '..', 'fixtures', 'test-rom.gba');
        await page.locator('#rom-patcher-input-file-rom').setInputFiles(testRomPath);
        await page.waitForTimeout(2000);

        const applyButton = page.locator('#rom-patcher-button-apply');
        await expect(applyButton).toBeEnabled();
    });

    test('shows patch description when selected', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();

        const selectedPatch = page.locator('#selectedPatch');
        await expect(selectedPatch).toBeVisible();

        const description = page.locator('#selectedPatchDescription');
        await expect(description).not.toBeEmpty();
    });

    test('updates patch name when switching patches', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        const firstPatch = page.locator('.patch-result').first();
        const firstName = await firstPatch.locator('h4').textContent();
        await firstPatch.click();
        await page.waitForTimeout(500);
        
        await page.locator('#closePatchDescription').click();
        await page.waitForTimeout(300);
        
        await page.fill('#patchSearch', 'Gold');
        await page.waitForTimeout(500);
        const secondPatch = page.locator('.patch-result').first();
        const secondName = await secondPatch.locator('h4').textContent();
        await secondPatch.click();
        await page.waitForTimeout(500);
        
        expect(firstName).not.toBe(secondName);
        
        const widget = page.locator('#rom-patcher-container');
        await expect(widget).toBeVisible();
    });

    test('styles apply button correctly', async ({ page }) => {
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        const applyButton = page.locator('#rom-patcher-button-apply');
        await expect(applyButton).toBeVisible();
        await expect(applyButton).toBeDisabled();
        
        const hasStyles = await applyButton.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.padding !== '0px' && styles.borderRadius !== '0px';
        });
        expect(hasStyles).toBeTruthy();
    });
});
