import { test, expect } from '@playwright/test';

test.describe('Background System Tests', () => {
    test('all pages have unified dark purple gradient background', async ({ page }) => {
        const pages = [
            '/',
            '/library/',
            '/patcher/',
            '/submit/'
        ];
        
        for (const pagePath of pages) {
            await page.goto(`http://localhost:3000${pagePath}`);
            await page.waitForLoadState('networkidle');
            
            // Check computed background styles
            const backgroundInfo = await page.evaluate(() => {
                const body = document.body;
                const computed = window.getComputedStyle(body);
                return {
                    background: computed.background,
                    backgroundColor: computed.backgroundColor,
                    backgroundImage: computed.backgroundImage,
                    hasBackgroundSystemCSS: !!Array.from(document.styleSheets).find(sheet => 
                        sheet.href && sheet.href.includes('background-system.css')
                    )
                };
            });
            
            console.log(`Page ${pagePath}:`, backgroundInfo);
            
            // Should have background system CSS loaded
            expect(backgroundInfo.hasBackgroundSystemCSS).toBe(true);
            
            // Should have gradient background (either in background or backgroundImage)
            const hasGradient = backgroundInfo.background.includes('linear-gradient') || 
                               backgroundInfo.backgroundImage.includes('linear-gradient');
            expect(hasGradient).toBe(true);
        }
    });
    
    test('all pages have animated floating circles', async ({ page }) => {
        const pages = [
            '/',
            '/library/',
            '/patcher/',
            '/submit/'
        ];
        
        for (const pagePath of pages) {
            await page.goto(`http://localhost:3000${pagePath}`);
            await page.waitForLoadState('networkidle');
            
            // Check background shapes container exists
            const backgroundShapes = page.locator('.background-shapes');
            await expect(backgroundShapes).toBeVisible();
            
            // Check for 5 shape elements
            const shapes = page.locator('.background-shapes .shape');
            await expect(shapes).toHaveCount(5);
            
            // Check shapes have animation
            const firstShape = shapes.first();
            const animationName = await firstShape.evaluate(el => 
                window.getComputedStyle(el).animationName
            );
            expect(animationName).toBe('float');
        }
    });
    
    test('background system CSS loads with highest priority', async ({ page }) => {
        await page.goto('http://localhost:3000/library/');
        await page.waitForLoadState('networkidle');
        
        // Check that background-system.css is loaded
        const stylesheets = await page.evaluate(() => {
            return Array.from(document.styleSheets)
                .map(sheet => sheet.href)
                .filter(href => href && href.includes('background-system.css'));
        });
        
        expect(stylesheets.length).toBeGreaterThan(0);
    });
});