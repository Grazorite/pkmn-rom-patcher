const { test, expect } = require('@playwright/test');

test.describe('Data Loading and API', () => {
  test('should load manifest.json successfully', async ({ page }) => {
    // Test direct manifest access
    const manifestResponse = await page.goto('/docs/manifest.json');
    expect(manifestResponse.status()).toBe(200);
    
    const manifestData = await manifestResponse.json();
    console.log('Manifest data:', JSON.stringify(manifestData, null, 2));
    
    // Validate manifest structure
    expect(Array.isArray(manifestData)).toBe(true);
    expect(manifestData.length).toBeGreaterThan(0);
    
    // Check first item structure
    const firstItem = manifestData[0];
    const requiredFields = ['id', 'title', 'file', 'type', 'baseRom', 'meta'];
    
    for (const field of requiredFields) {
      expect(firstItem).toHaveProperty(field);
    }
    
    console.log('First ROM hack:', firstItem.title);
    console.log('Base ROM:', firstItem.baseRom);
    console.log('File type:', firstItem.type);
  });

  test('should load manifest in the app and populate UI', async ({ page }) => {
    // Listen for fetch requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('manifest.json')) {
        requests.push(request.url());
      }
    });
    
    await page.goto('/docs/');
    
    // Wait for manifest to be fetched
    await page.waitForTimeout(3000);
    
    console.log('Manifest requests:', requests);
    expect(requests.length).toBeGreaterThan(0);
    
    // Check if app loaded the data
    const appData = await page.evaluate(() => {
      return {
        appExists: typeof window.app !== 'undefined',
        hacksCount: window.app && window.app.hacks ? window.app.hacks.length : 0,
        filteredCount: window.app && window.app.filteredHacks ? window.app.filteredHacks.length : 0
      };
    });
    
    console.log('App data state:', appData);
    
    if (appData.appExists) {
      expect(appData.hacksCount).toBeGreaterThan(0);
      expect(appData.filteredCount).toBeGreaterThan(0);
    }
  });

  test('should handle manifest loading errors gracefully', async ({ page }) => {
    // Mock a failed manifest request
    await page.route('**/manifest.json', route => {
      route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Not Found'
      });
    });
    
    await page.goto('/docs/');
    await page.waitForTimeout(2000);
    
    // Should show error state
    const errorState = await page.evaluate(() => {
      const hackGrid = document.querySelector('#hackGrid');
      return {
        hasErrorMessage: hackGrid && hackGrid.textContent.includes('Failed'),
        hasLoadingMessage: hackGrid && hackGrid.textContent.includes('Loading')
      };
    });
    
    console.log('Error state:', errorState);
    expect(errorState.hasErrorMessage || errorState.hasLoadingMessage).toBe(true);
  });

  test('should populate filters from manifest data', async ({ page }) => {
    await page.goto('/docs/');
    
    // Wait for data to load and filters to populate
    await page.waitForSelector('.filter-option', { timeout: 10000 });
    
    // Check that filters are populated
    const filterData = await page.evaluate(() => {
      const getFilterOptions = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return [];
        
        return Array.from(container.querySelectorAll('.filter-option')).map(option => {
          const label = option.querySelector('label');
          const count = option.querySelector('.filter-count');
          return {
            text: label ? label.textContent.trim() : '',
            count: count ? count.textContent.trim() : '0'
          };
        });
      };
      
      return {
        baseRom: getFilterOptions('baseRomFilters'),
        system: getFilterOptions('systemFilters'),
        status: getFilterOptions('statusFilters'),
        difficulty: getFilterOptions('difficultyFilters'),
        tags: getFilterOptions('tagFilters')
      };
    });
    
    console.log('Filter data:', filterData);
    
    // Should have some filter options
    expect(filterData.baseRom.length).toBeGreaterThan(0);
    expect(filterData.system.length).toBeGreaterThan(0);
    expect(filterData.status.length).toBeGreaterThan(0);
    
    // Check that counts are reasonable
    filterData.baseRom.forEach(filter => {
      expect(parseInt(filter.count)).toBeGreaterThan(0);
    });
  });

  test('should render hack cards from manifest data', async ({ page }) => {
    await page.goto('/docs/');
    
    // Wait for hack cards to render
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    
    // Get card data
    const cardData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.hack-card')).map(card => {
        const title = card.querySelector('.hack-card-title');
        const author = card.querySelector('.hack-card-author');
        const badges = Array.from(card.querySelectorAll('.badge')).map(badge => badge.textContent.trim());
        const status = card.querySelector('.status-indicator');
        
        return {
          title: title ? title.textContent.trim() : '',
          author: author ? author.textContent.trim() : '',
          badges: badges,
          hasStatus: !!status,
          hasImage: !!card.querySelector('.hack-card-image')
        };
      });
    });
    
    console.log('Card data:', cardData);
    
    expect(cardData.length).toBeGreaterThan(0);
    
    // Each card should have required elements
    cardData.forEach((card, index) => {
      expect(card.title).toBeTruthy();
      expect(card.author).toBeTruthy();
      expect(card.hasImage).toBe(true);
      console.log(`Card ${index + 1}: ${card.title} by ${card.author}`);
    });
  });

  test('should handle search functionality with real data', async ({ page }) => {
    await page.goto('/docs/');
    
    // Wait for data to load
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    
    // Get initial card count
    const initialCount = await page.locator('.hack-card').count();
    console.log('Initial card count:', initialCount);
    
    // Get first card title for search test
    const firstCardTitle = await page.locator('.hack-card-title').first().textContent();
    console.log('First card title:', firstCardTitle);
    
    // Search for part of the first card's title
    const searchTerm = firstCardTitle.split(' ')[0]; // First word
    await page.fill('.search-input', searchTerm);
    
    // Wait for search to process
    await page.waitForTimeout(1000);
    
    // Check results
    const searchResults = await page.locator('.hack-card').count();
    console.log(`Search results for "${searchTerm}":`, searchResults);
    
    // Should have at least one result (the card we searched for)
    expect(searchResults).toBeGreaterThan(0);
    expect(searchResults).toBeLessThanOrEqual(initialCount);
    
    // Clear search
    await page.fill('.search-input', '');
    await page.waitForTimeout(500);
    
    // Should return to original count
    const clearedCount = await page.locator('.hack-card').count();
    expect(clearedCount).toBe(initialCount);
  });
});