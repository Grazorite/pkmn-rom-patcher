const { test, expect } = require('@playwright/test');

test.describe('Description Box Visual Test', () => {
    test('should display description box with proper layout', async ({ page }) => {
        await page.goto('http://localhost:3000/docs/patcher/');
        await page.waitForLoadState('networkidle');

        // Search and select a patch
        await page.fill('#patchSearch', 'Emerald');
        await page.waitForTimeout(500);
        await page.locator('.patch-result').first().click();

        // Wait for description box
        const descriptionBox = page.locator('#selectedPatch');
        await expect(descriptionBox).toBeVisible();

        // Take screenshot of description box
        await descriptionBox.screenshot({ 
            path: 'test-results/description-box-layout.png' 
        });

        // Check elements exist
        const closeBtn = page.locator('#closePatchDescription');
        const patchInfo = page.locator('.patch-info');
        const description = page.locator('#selectedPatchDescription');

        await expect(closeBtn).toBeVisible();
        await expect(patchInfo).toBeVisible();
        await expect(description).toBeVisible();

        // Get bounding boxes
        const closeBtnBox = await closeBtn.boundingBox();
        const patchInfoBox = await patchInfo.boundingBox();
        const descriptionBox2 = await description.boundingBox();

        console.log('Close button:', closeBtnBox);
        console.log('Patch info container:', patchInfoBox);
        console.log('Description text:', descriptionBox2);

        // Check if close button overlaps with scrollable area
        if (closeBtnBox && patchInfoBox) {
            const overlap = closeBtnBox.y + closeBtnBox.height > patchInfoBox.y;
            console.log('Close button overlaps content:', overlap);
        }

        // Scroll to bottom to test fade effect
        await page.evaluate(() => {
            const patchInfo = document.querySelector('.patch-info');
            if (patchInfo) {
                patchInfo.scrollTop = patchInfo.scrollHeight;
            }
        });

        await page.waitForTimeout(500);

        // Take screenshot after scroll
        await descriptionBox.screenshot({ 
            path: 'test-results/description-box-scrolled.png' 
        });
    });
});
