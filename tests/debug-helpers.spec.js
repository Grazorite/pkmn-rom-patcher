const { test, expect } = require('@playwright/test');

test.describe('Debug Helpers - Diagnose UI Issues', () => {
  test('should capture page state and console errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('/docs/');
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/rom-store-debug.png', fullPage: true });
    
    // Log page state
    console.log('=== PAGE DEBUG INFO ===');
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check if main elements exist
    const elements = {
      'App Container': '.app-container',
      'Sidebar': '.sidebar',
      'Search Input': '.search-input',
      'Hack Grid': '#hackGrid',
      'Filter Sections': '.filter-section',
      'Theme Toggle': '#themeToggle'
    };
    
    for (const [name, selector] of Object.entries(elements)) {
      const element = page.locator(selector);
      const exists = await element.count() > 0;
      const visible = exists ? await element.first().isVisible() : false;
      console.log(`${name}: exists=${exists}, visible=${visible}`);
    }
    
    // Check for JavaScript errors
    console.log('Console Errors:', consoleErrors);
    console.log('Page Errors:', pageErrors);
    
    // Check network requests
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type']
      });
    });
    
    // Reload to capture network requests
    await page.reload();
    await page.waitForTimeout(1000);
    
    console.log('Network Responses:');
    responses.forEach(resp => {
      if (resp.status >= 400) {
        console.log(`❌ ${resp.status} - ${resp.url}`);
      } else {
        console.log(`✅ ${resp.status} - ${resp.url}`);
      }
    });
    
    // Check if manifest loads
    const manifestResponse = await page.goto('/docs/manifest.json');
    console.log('Manifest Status:', manifestResponse.status());
    
    if (manifestResponse.status() === 200) {
      const manifestData = await manifestResponse.json();
      console.log('Manifest Data:', JSON.stringify(manifestData, null, 2));
    }
    
    // Go back to main page
    await page.goto('/docs/');
    
    // Check CSS loading
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => ({
        href: sheet.href,
        rules: sheet.cssRules ? sheet.cssRules.length : 'blocked'
      }));
    });
    console.log('Stylesheets:', stylesheets);
    
    // Check if JavaScript modules load
    const scripts = await page.evaluate(() => {
      return Array.from(document.scripts).map(script => ({
        src: script.src,
        type: script.type,
        loaded: script.readyState || 'unknown'
      }));
    });
    console.log('Scripts:', scripts);
    
    // Fail test if there are critical errors
    expect(pageErrors.length).toBe(0);
  });

  test('should check app initialization state', async ({ page }) => {
    await page.goto('/docs/');
    
    // Wait for potential app initialization
    await page.waitForTimeout(3000);
    
    // Check if app object exists
    const appExists = await page.evaluate(() => {
      return typeof window.app !== 'undefined';
    });
    
    console.log('App object exists:', appExists);
    
    if (appExists) {
      const appState = await page.evaluate(() => {
        return {
          hasHacks: window.app.hacks ? window.app.hacks.length : 0,
          hasFilteredHacks: window.app.filteredHacks ? window.app.filteredHacks.length : 0,
          selectedHack: window.app.selectedHack ? 'exists' : 'null'
        };
      });
      console.log('App State:', appState);
    }
    
    // Check DOM state
    const domState = await page.evaluate(() => {
      return {
        hackCards: document.querySelectorAll('.hack-card').length,
        filterOptions: document.querySelectorAll('.filter-option').length,
        loadingElements: document.querySelectorAll('.loading').length,
        hasManifestData: !!document.querySelector('#hackGrid .hack-card')
      };
    });
    
    console.log('DOM State:', domState);
    
    // Check local storage
    const localStorage = await page.evaluate(() => {
      return {
        theme: window.localStorage.getItem('theme'),
        keys: Object.keys(window.localStorage)
      };
    });
    
    console.log('Local Storage:', localStorage);
  });

  test('should verify CSS is loading correctly', async ({ page }) => {
    await page.goto('/docs/');
    
    // Check if main CSS file loads
    const cssResponse = await page.goto('/docs/styles/main.css');
    console.log('Main CSS Status:', cssResponse.status());
    
    if (cssResponse.status() !== 200) {
      // Try old CSS path
      const oldCssResponse = await page.goto('/docs/style.css');
      console.log('Old CSS Status:', oldCssResponse.status());
    }
    
    // Go back to main page
    await page.goto('/docs/');
    
    // Check computed styles
    const styles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        fontFamily: computed.fontFamily,
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        hasCustomProperties: computed.getPropertyValue('--primary') !== ''
      };
    });
    
    console.log('Computed Styles:', styles);
    
    // Check if CSS custom properties are working
    const customProps = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      return {
        primary: computed.getPropertyValue('--primary'),
        bgPrimary: computed.getPropertyValue('--bg-primary'),
        textPrimary: computed.getPropertyValue('--text-primary')
      };
    });
    
    console.log('CSS Custom Properties:', customProps);
  });

  test('should check module loading and imports', async ({ page }) => {
    // Listen for module loading errors
    const moduleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('import')) {
        moduleErrors.push(msg.text());
      }
    });

    await page.goto('/docs/');
    await page.waitForTimeout(2000);
    
    // Check if ES modules are supported
    const moduleSupport = await page.evaluate(() => {
      const script = document.createElement('script');
      script.type = 'module';
      return 'noModule' in script;
    });
    
    console.log('ES Module Support:', moduleSupport);
    console.log('Module Errors:', moduleErrors);
    
    // Check if specific modules loaded
    const moduleStatus = await page.evaluate(() => {
      return {
        Utils: typeof window.Utils !== 'undefined',
        SearchManager: typeof window.SearchManager !== 'undefined',
        UIManager: typeof window.UIManager !== 'undefined',
        PatchManager: typeof window.PatchManager !== 'undefined'
      };
    });
    
    console.log('Module Status:', moduleStatus);
  });
});