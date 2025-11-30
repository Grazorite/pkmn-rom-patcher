import { test as base, expect } from '@playwright/test';

class BaseFixtures {
    constructor() {
        // Common selectors used across tests
        this.selectors = {
            // Landing page
            ctaButton: '.cta-button',
            
            // Library page
            searchInput: '#searchInput',
            hackGrid: '#hackGrid',
            hackCard: '.hack-card',
            detailPanel: '#detailPanel',
            closeDetail: '#closeDetail',
            navSidebar: '#navSidebar',
            
            // Patcher page
            patchSearch: '#patchSearch',
            patchResults: '#patchResults',
            romFileInput: '#romFileInput',
            applyPatchBtn: '#applyPatchBtn'
        };
    }

    async landingPage({ page }) {
        await page.goto('http://localhost:3000/docs/');
        await page.waitForLoadState('networkidle');
        return { page, selectors: this.selectors };
    }

    async libraryPage({ page }) {
        await page.goto('http://localhost:3000/docs/library/');
        await page.waitForLoadState('networkidle');
        // Just wait for basic page load, not app initialization
        await page.waitForSelector('h1', { timeout: 5000 });
        return { page, selectors: this.selectors };
    }

    async patcherPage({ page }) {
        await page.goto('http://localhost:3000/docs/patcher/');
        await page.waitForLoadState('networkidle');
        // Just wait for basic page load
        await page.waitForSelector('h1', { timeout: 5000 });
        return { page, selectors: this.selectors };
    }
}

const fixtures = new BaseFixtures();

// Custom fixtures for common setup
export const test = base.extend({
    // Landing page fixture
    landingPage: async ({ page }, use) => {
        const result = await fixtures.landingPage({ page });
        await use(result.page);
    },

    // Library page fixture
    libraryPage: async ({ page }, use) => {
        const result = await fixtures.libraryPage({ page });
        await use(result.page);
    },

    // Patcher page fixture
    patcherPage: async ({ page }, use) => {
        const result = await fixtures.patcherPage({ page });
        await use(result.page);
    },

    // Common selectors
    selectors: async ({}, use) => {
        await use(fixtures.selectors);
    }
});

export { expect };