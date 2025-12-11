// Mobile test utilities
import { test as base } from '@playwright/test';

// Mobile-specific test fixture
export const mobileTest = base.extend({
    page: async ({ page }, use) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
        
        // Allow CSS media queries to apply
        await page.waitForTimeout(200);
        
        await use(page);
    }
});

// Utility functions for mobile testing
export async function waitForMobileElement(page, selector, timeout = 10000) {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        try {
            await page.waitForSelector(selector, { timeout: timeout / maxAttempts });
            return;
        } catch (error) {
            attempts++;
            if (attempts === maxAttempts) throw error;
            await page.waitForTimeout(500);
        }
    }
}

export async function waitForResponsiveLayout(page) {
    // Wait for CSS to apply responsive styles
    await page.waitForFunction(() => {
        const sidebar = document.querySelector('.sidebar');
        return sidebar && window.getComputedStyle(sidebar).display === 'none';
    }, { timeout: 5000 }).catch(() => {
        // Fallback: just wait a bit more
        return page.waitForTimeout(1000);
    });
}