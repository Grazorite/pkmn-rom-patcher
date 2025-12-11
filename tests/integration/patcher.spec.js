import { test, expect } from '../fixtures/base.js';
const path = require('path');

test.describe('Integration Tests', () => {
    test.describe('Cross-Page Navigation', () => {
        test('maintains independent state per page', async ({ page, browserName }) => {
            // WebKit has known timing issues with sessionStorage in test environments
            test.fixme(browserName === 'webkit', 'WebKit sessionStorage timing issue in test environment');
            await page.goto('/library/');
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('#searchInput', { timeout: 5000 });
            await page.fill('#searchInput', 'library search');
            await page.waitForTimeout(1000); // Allow state to save
            
            await page.goto('/patcher/');
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('#patchSearch', { timeout: 5000 });
            await page.fill('#patchSearch', 'patcher search');
            await page.waitForTimeout(1000); // Allow state to save
            
            await page.goto('/library/');
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('#searchInput', { timeout: 5000 });
            
            // Wait for state restoration to complete
            await page.waitForTimeout(1000); // Allow state restoration
            
            await expect(page.locator('#searchInput')).toHaveValue('library search');
            
            await page.goto('/patcher/');
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('#patchSearch', { timeout: 5000 });
            await page.waitForTimeout(1000); // Allow state restoration
            await expect(page.locator('#patchSearch')).toHaveValue('patcher search');
        });
    });

    test.describe('Patcher Integration', () => {
        test.beforeEach(async ({ patcherPage }) => {
            // Use patcherPage fixture for better reliability
        });

        test('hides patcher widget until patch is selected', async ({ patcherPage }) => {
            const patcherContainer = patcherPage.locator('#rom-patcher-container');
            await expect(patcherContainer).toBeHidden();
        });

        test('shows patcher widget after selecting a patch', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            await patcherPage.locator('.patch-result').first().click();
            
            const patcherContainer = patcherPage.locator('#rom-patcher-container');
            await expect(patcherContainer).toBeVisible();
            
            const romInput = patcherPage.locator('#rom-patcher-input-file-rom');
            await expect(romInput).toBeEnabled();
        });

        test('hides widget when patch is deselected', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            await patcherPage.locator('.patch-result').first().click();
            
            const widget = patcherPage.locator('#rom-patcher-container');
            await expect(widget).toBeVisible();
            
            await patcherPage.locator('#closePatchDescription').click();
            await patcherPage.waitForTimeout(300);
            
            await expect(widget).toBeHidden();
        });

        test('calculates CRC after ROM upload', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            await patcherPage.locator('.patch-result').first().click();
            await patcherPage.waitForSelector('#rom-patcher-container', { state: 'visible' });

            const testRomPath = path.join(__dirname, '..', 'fixtures', 'test-rom.gba');
            await patcherPage.locator('#rom-patcher-input-file-rom').setInputFiles(testRomPath);
            await patcherPage.waitForTimeout(2000);

            const crc32Span = patcherPage.locator('#rom-patcher-span-crc32');
            const crc32Text = await crc32Span.textContent();
            expect(crc32Text).not.toBe('Calculating...');
            expect(crc32Text).not.toBe('');
        });

        test('enables apply button after ROM is loaded', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            await patcherPage.locator('.patch-result').first().click();

            const testRomPath = path.join(__dirname, '..', 'fixtures', 'test-rom.gba');
            await patcherPage.locator('#rom-patcher-input-file-rom').setInputFiles(testRomPath);
            await patcherPage.waitForTimeout(2000);

            const applyButton = patcherPage.locator('#rom-patcher-button-apply');
            await expect(applyButton).toBeEnabled();
        });

        test('shows patch description when selected', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            await patcherPage.locator('.patch-result').first().click();

            const selectedPatch = patcherPage.locator('#selectedPatch');
            await expect(selectedPatch).toBeVisible();

            const description = patcherPage.locator('#selectedPatchDescription');
            await expect(description).not.toBeEmpty();
        });

        test('updates patch name when switching patches', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            const firstPatch = patcherPage.locator('.patch-result').first();
            const firstName = await firstPatch.locator('h4').textContent();
            await firstPatch.click();
            await patcherPage.waitForTimeout(500);
            
            await patcherPage.locator('#closePatchDescription').click();
            await patcherPage.waitForTimeout(300);
            
            await patcherPage.fill('#patchSearch', 'Gold');
            await patcherPage.waitForTimeout(500);
            const secondPatch = patcherPage.locator('.patch-result').first();
            const secondName = await secondPatch.locator('h4').textContent();
            await secondPatch.click();
            await patcherPage.waitForTimeout(500);
            
            expect(firstName).not.toBe(secondName);
            
            const widget = patcherPage.locator('#rom-patcher-container');
            await expect(widget).toBeVisible();
        });

        test('styles apply button correctly', async ({ patcherPage }) => {
            await patcherPage.fill('#patchSearch', 'Emerald');
            await patcherPage.waitForTimeout(500);
            await patcherPage.locator('.patch-result').first().click();
            
            const applyButton = patcherPage.locator('#rom-patcher-button-apply');
            await expect(applyButton).toBeVisible();
            await expect(applyButton).toBeDisabled();
            
            const hasStyles = await applyButton.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.padding !== '0px' && styles.borderRadius !== '0px';
            });
            expect(hasStyles).toBeTruthy();
        });
    });
});
