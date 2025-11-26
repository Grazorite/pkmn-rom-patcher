const { test, expect } = require('@playwright/test');

test.describe('CSS Loading and Styling', () => {
  test('should load CSS correctly and apply styles', async ({ page }) => {
    await page.goto('/docs/');
    
    // Check if CSS file loads successfully
    const response = await page.waitForResponse(response => 
      response.url().includes('main.css') || response.url().includes('style.css')
    );
    
    expect(response.status()).toBe(200);
    console.log('CSS loaded from:', response.url());
    
    // Wait for styles to be applied
    await page.waitForTimeout(1000);
    
    // Check that basic styles are applied
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        fontFamily: computed.fontFamily,
        backgroundColor: computed.backgroundColor,
        lineHeight: computed.lineHeight
      };
    });
    
    console.log('Body styles:', bodyStyles);
    
    // Font family should be set
    expect(bodyStyles.fontFamily).toContain('system');
    
    // Check CSS custom properties
    const customProps = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      return {
        primary: computed.getPropertyValue('--primary').trim(),
        bgPrimary: computed.getPropertyValue('--bg-primary').trim(),
        textPrimary: computed.getPropertyValue('--text-primary').trim()
      };
    });
    
    console.log('CSS Custom Properties:', customProps);
    
    // Custom properties should be defined
    expect(customProps.primary).toBeTruthy();
    expect(customProps.bgPrimary).toBeTruthy();
    expect(customProps.textPrimary).toBeTruthy();
  });

  test('should apply component styles correctly', async ({ page }) => {
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    // Check sidebar styles
    const sidebarStyles = await page.locator('.sidebar').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.backgroundColor,
        borderRadius: computed.borderRadius,
        padding: computed.padding,
        display: computed.display
      };
    });
    
    console.log('Sidebar styles:', sidebarStyles);
    expect(sidebarStyles.borderRadius).toBe('16px');
    
    // Check theme toggle styles
    const themeToggleStyles = await page.locator('#themeToggle').evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        borderRadius: computed.borderRadius,
        width: computed.width,
        height: computed.height
      };
    });
    
    console.log('Theme toggle styles:', themeToggleStyles);
    expect(themeToggleStyles.position).toBe('fixed');
    expect(themeToggleStyles.borderRadius).toBe('50%');
  });

  test('should handle dark mode styles', async ({ page }) => {
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    // Get initial (light mode) styles
    const lightStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        hasDarkClass: body.classList.contains('dark-mode')
      };
    });
    
    console.log('Light mode styles:', lightStyles);
    expect(lightStyles.hasDarkClass).toBe(false);
    
    // Toggle to dark mode
    await page.locator('#themeToggle').click();
    await page.waitForTimeout(500);
    
    // Get dark mode styles
    const darkStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        hasDarkClass: body.classList.contains('dark-mode')
      };
    });
    
    console.log('Dark mode styles:', darkStyles);
    expect(darkStyles.hasDarkClass).toBe(true);
    
    // Colors should be different
    expect(darkStyles.backgroundColor).not.toBe(lightStyles.backgroundColor);
  });

  test('should load all CSS modules correctly', async ({ page }) => {
    // Track CSS requests
    const cssRequests = [];
    page.on('response', response => {
      if (response.url().includes('.css')) {
        cssRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.goto('/docs/');
    await page.waitForLoadState('networkidle');
    
    console.log('CSS Requests:', cssRequests);
    
    // Should have at least one CSS file loaded successfully
    const successfulCss = cssRequests.filter(req => req.status === 200);
    expect(successfulCss.length).toBeGreaterThan(0);
    
    // Check if styles are actually applied by testing specific selectors
    const elementsWithStyles = await page.evaluate(() => {
      const selectors = [
        '.app-container',
        '.sidebar',
        '.hack-grid',
        '#themeToggle',
        '.search-input'
      ];
      
      return selectors.map(selector => {
        const element = document.querySelector(selector);
        if (!element) return { selector, exists: false };
        
        const computed = window.getComputedStyle(element);
        return {
          selector,
          exists: true,
          hasStyles: computed.cssText.length > 0 || 
                    computed.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                    computed.padding !== '0px'
        };
      });
    });
    
    console.log('Elements with styles:', elementsWithStyles);
    
    // Most elements should exist and have styles
    const styledElements = elementsWithStyles.filter(el => el.exists && el.hasStyles);
    expect(styledElements.length).toBeGreaterThan(2);
  });
});