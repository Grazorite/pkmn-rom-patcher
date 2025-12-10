import { test, expect } from '@playwright/test';

test.describe('Mobile Filters', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should show filter trigger button on library page', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(1000); // Wait for viewport manager to initialize
        
        const filterTrigger = page.locator('.mobile-filter-trigger');
        await expect(filterTrigger).toBeVisible();
        
        // Check positioning
        const triggerBox = await filterTrigger.boundingBox();
        expect(triggerBox.width).toBe(56);
        expect(triggerBox.height).toBe(56);
    });

    test('should hide desktop sidebar on mobile', async ({ page }) => {
        await page.goto('/docs/library/');
        
        const sidebar = page.locator('.sidebar');
        await expect(sidebar).toBeHidden();
    });

    test('should open filter sheet when trigger is clicked', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(1000);
        
        const filterTrigger = page.locator('.mobile-filter-trigger');
        const filterSheet = page.locator('.mobile-filter-sheet');
        const backdrop = page.locator('.mobile-filter-backdrop');
        
        await filterTrigger.click();
        
        await expect(filterSheet).toHaveClass(/open/);
        await expect(backdrop).toHaveClass(/open/);
        
        // Check body scroll lock
        const bodyOverflow = await page.evaluate(() => 
            document.body.style.overflow
        );
        expect(bodyOverflow).toBe('hidden');
    });

    test('should close filter sheet when backdrop is clicked', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(1000);
        
        const filterTrigger = page.locator('.mobile-filter-trigger');
        const filterSheet = page.locator('.mobile-filter-sheet');
        const backdrop = page.locator('.mobile-filter-backdrop');
        
        await filterTrigger.click();
        await backdrop.click();
        
        await expect(filterSheet).not.toHaveClass(/open/);
        await expect(backdrop).not.toHaveClass(/open/);
    });

    test('should close filter sheet when close button is clicked', async ({ page }) => {
        await page.goto('/docs/library/');
        await page.waitForTimeout(1000);
        
        const filterTrigger = page.locator('.mobile-filter-trigger');
        const filterSheet = page.locator('.mobile-filter-sheet');
        const closeBtn = page.locator('.mobile-filter-close');
        
        await filterTrigger.click();
        await closeBtn.click();
        
        await expect(filterSheet).not.toHaveClass(/open/);
    });
});