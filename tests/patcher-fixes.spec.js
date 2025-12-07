const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Patcher Fixes Verification', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/docs/patcher/');
        await page.waitForLoadState('networkidle');
    });

    test('should hide widget when patch is deselected', async ({ page }) => {
        // Select a patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        // Widget should be visible
        const widget = page.locator('#rom-patcher-container');
        await expect(widget).toBeVisible();
        
        // Deselect patch
        await page.locator('#closePatchDescription').click();
        await page.waitForTimeout(300);
        
        // Widget should be hidden
        await expect(widget).toBeHidden();
    });

    test('should show CRC calculation results', async ({ page }) => {
        // Select patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        // Upload ROM
        const testRomPath = path.join(__dirname, 'fixtures', 'test-rom.gba');
        await page.locator('#rom-patcher-input-file-rom').setInputFiles(testRomPath);
        
        // Wait for CRC calculation
        await page.waitForTimeout(2000);
        
        // CRC info should be visible
        const crcInfo = page.locator('#rom-patcher-rom-info');
        await expect(crcInfo).toBeVisible();
        
        // CRC values should be calculated
        const crc32 = page.locator('#rom-patcher-span-crc32');
        const crc32Text = await crc32.textContent();
        expect(crc32Text).not.toBe('');
        expect(crc32Text).not.toBe('Calculating...');
    });

    test('should update patch name when switching patches', async ({ page }) => {
        // Select first patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        const firstPatch = page.locator('.patch-result').first();
        const firstName = await firstPatch.locator('h4').textContent();
        await firstPatch.click();
        await page.waitForTimeout(500);
        
        // Close and search for different patch
        await page.locator('#closePatchDescription').click();
        await page.waitForTimeout(300);
        
        await page.fill('#patchSearch', 'Gold');
        await page.waitForTimeout(500);
        const secondPatch = page.locator('.patch-result').first();
        const secondName = await secondPatch.locator('h4').textContent();
        await secondPatch.click();
        await page.waitForTimeout(500);
        
        // Verify different patches
        expect(firstName).not.toBe(secondName);
        
        // Widget should still be visible
        const widget = page.locator('#rom-patcher-container');
        await expect(widget).toBeVisible();
    });

    test('should style file input clearly', async ({ page }) => {
        // Select patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        // Check file input styling
        const fileInput = page.locator('#rom-patcher-input-file-rom');
        await expect(fileInput).toBeVisible();
        
        // File input should be enabled and visible
        await expect(fileInput).toBeEnabled();
        await expect(fileInput).toBeVisible();
        
        // Should have some styling applied
        const hasStyles = await fileInput.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.padding !== '0px' || styles.borderWidth !== '0px';
        });
        expect(hasStyles).toBeTruthy();
    });

    test('should show apply button with proper styling', async ({ page }) => {
        // Select patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();
        
        const applyButton = page.locator('#rom-patcher-button-apply');
        await expect(applyButton).toBeVisible();
        
        // Button should be styled and disabled initially
        await expect(applyButton).toBeDisabled();
        
        // Should have some styling
        const hasStyles = await applyButton.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.padding !== '0px' && styles.borderRadius !== '0px';
        });
        expect(hasStyles).toBeTruthy();
    });
});
