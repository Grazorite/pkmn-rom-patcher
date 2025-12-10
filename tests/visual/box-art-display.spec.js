import { test, expect } from '../fixtures/base.js';

test.describe('Box Art Display Tests', () => {
    test('should display complete box art without cropping in card view', async ({ libraryPage, selectors }) => {
        // Wait for hack grid to load
        await libraryPage.waitForSelector(selectors.hackGrid, { timeout: 10000 });
        
        // Wait for first hack card with image to appear
        const firstCard = libraryPage.locator('.hack-card').first();
        await firstCard.waitFor({ timeout: 10000 });
        
        // Find a card with box art image
        const cardWithImage = libraryPage.locator('.hack-card').filter({ 
            has: libraryPage.locator('img[src*="boxart"], img[src*="banner"]') 
        }).first();
        
        if (await cardWithImage.count() > 0) {
            const image = cardWithImage.locator('.hack-card-image img').first();
            await image.waitFor({ state: 'visible', timeout: 5000 });
            
            // Get image and container dimensions
            const imageBox = await image.boundingBox();
            const containerBox = await cardWithImage.locator('.hack-card-image').boundingBox();
            
            // Verify image is not cropped (should fit within container with object-fit: contain)
            expect(imageBox.width).toBeLessThanOrEqual(containerBox.width);
            expect(imageBox.height).toBeLessThanOrEqual(containerBox.height);
            
            // Check computed style
            const objectFit = await image.evaluate(el => getComputedStyle(el).objectFit);
            expect(objectFit).toBe('cover');
        }
    });
    
    test('should display complete box art without cropping in grid view', async ({ libraryPage, selectors }) => {
        // Wait for hack grid to load
        await libraryPage.waitForSelector(selectors.hackGrid, { timeout: 10000 });
        
        // Switch to grid view
        const viewToggle = libraryPage.locator('#viewToggle');
        if (await viewToggle.count() > 0) {
            await viewToggle.click();
            await libraryPage.waitForTimeout(500); // Wait for view change
        }
        
        // Verify grid view is active
        const hackGrid = libraryPage.locator(selectors.hackGrid);
        await expect(hackGrid).toHaveClass(/grid-view/);
        
        // Find a card with box art image in grid view
        const cardWithImage = libraryPage.locator('.hack-card').filter({ 
            has: libraryPage.locator('img[src*="boxart"], img[src*="banner"]') 
        }).first();
        
        if (await cardWithImage.count() > 0) {
            const image = cardWithImage.locator('.hack-card-image img').first();
            await image.waitFor({ state: 'visible', timeout: 5000 });
            
            // Get image and container dimensions
            const imageBox = await image.boundingBox();
            const containerBox = await cardWithImage.locator('.hack-card-image').boundingBox();
            
            // Verify image is not cropped
            expect(imageBox.width).toBeLessThanOrEqual(containerBox.width);
            expect(imageBox.height).toBeLessThanOrEqual(containerBox.height);
            
            // Check computed style
            const objectFit = await image.evaluate(el => getComputedStyle(el).objectFit);
            expect(objectFit).toBe('cover');
        }
    });
    
    test('should verify image aspect ratio preservation', async ({ libraryPage, selectors }) => {
        // Wait for hack grid to load
        await libraryPage.waitForSelector(selectors.hackGrid, { timeout: 10000 });
        
        const cardWithImage = libraryPage.locator('.hack-card').filter({ 
            has: libraryPage.locator('img[src*="boxart"], img[src*="banner"]') 
        }).first();
        
        if (await cardWithImage.count() > 0) {
            const image = cardWithImage.locator('.hack-card-image img').first();
            await image.waitFor({ state: 'visible', timeout: 5000 });
            
            // Get natural and displayed dimensions
            const dimensions = await image.evaluate(el => ({
                naturalWidth: el.naturalWidth,
                naturalHeight: el.naturalHeight,
                displayWidth: el.offsetWidth,
                displayHeight: el.offsetHeight
            }));
            
            // Calculate aspect ratios
            const naturalRatio = dimensions.naturalWidth / dimensions.naturalHeight;
            const displayRatio = dimensions.displayWidth / dimensions.displayHeight;
            
            // With object-fit: contain, aspect ratio should be preserved
            // Allow small tolerance for rounding
            expect(Math.abs(naturalRatio - displayRatio)).toBeLessThan(0.1);
        }
    });
});