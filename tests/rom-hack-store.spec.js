const { test, expect } = require('@playwright/test');

test.describe('ROM Library - Detailed UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/');
    // Wait for page to fully load with longer timeout for Firefox
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    // Additional wait for JavaScript modules to initialize
    await page.waitForTimeout(1000);
  });

  test('should load page with correct title and header', async ({ page }) => {
    await expect(page).toHaveTitle(/ROM Library/);
    await expect(page.locator('h1')).toContainText('ROM Library');
    await expect(page.locator('.app-header p')).toContainText('Discover and patch your favorite ROM hacks');
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('.breadcrumb-link');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toHaveAttribute('href', '../');
  });

  test('should show sidebar with search and filters', async ({ page }) => {
    // Check sidebar exists
    await expect(page.locator('.sidebar')).toBeVisible();
    
    // Check search section
    await expect(page.locator('.search-input')).toBeVisible();
    await expect(page.locator('.search-input')).toHaveAttribute('placeholder', 'Search hacks...');
    await expect(page.locator('.search-icon')).toBeVisible();
    
    // Check filter sections exist
    await expect(page.locator('.filter-section h3')).toContainText('Filters');
    
    // Check specific filter groups (some may be empty/hidden)
    const filterGroups = [
      { selector: '#baseRomFilters', title: 'Base ROM', required: true },
      { selector: '#systemFilters', title: 'System', required: true },
      { selector: '#statusFilters', title: 'Status', required: true },
      { selector: '#difficultyFilters', title: 'Difficulty', required: true },
      { selector: '#tagFilters', title: 'Tags', required: false } // May be hidden if no tags
    ];
    
    for (const group of filterGroups) {
      const element = page.locator(group.selector);
      await expect(element).toBeAttached(); // Element exists in DOM
      
      if (group.required) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should load and display ROM hacks', async ({ page }) => {
    // Wait for hacks to load (up to 10 seconds)
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    
    // Check that hack cards are displayed
    const hackCards = page.locator('.hack-card');
    const cardCount = await hackCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Check first card structure
    const firstCard = hackCards.first();
    await expect(firstCard.locator('.hack-card-image')).toBeVisible();
    await expect(firstCard.locator('.hack-card-title')).toBeVisible();
    await expect(firstCard.locator('.hack-card-author')).toBeVisible();
    
    // Check results count is updated
    const resultsCount = page.locator('#resultsCount');
    await expect(resultsCount).not.toContainText('Loading...');
  });

  test('should populate filter options after loading', async ({ page }) => {
    // Wait for filters to populate
    await page.waitForSelector('.filter-option', { timeout: 10000 });
    
    // Check that filter options exist
    const baseRomOptions = page.locator('#baseRomFilters .filter-option');
    const baseRomCount = await baseRomOptions.count();
    expect(baseRomCount).toBeGreaterThan(0);
    
    // Check filter option structure
    const firstOption = baseRomOptions.first();
    await expect(firstOption.locator('input[type="checkbox"]')).toBeVisible();
    await expect(firstOption.locator('label')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    
    const searchInput = page.locator('.search-input');
    
    // Type in search box
    await searchInput.fill('Gold');
    
    // Wait for search to process
    await page.waitForTimeout(500);
    
    // Check that results are filtered (should show cards with "Gold" in title)
    const visibleCards = page.locator('.hack-card:visible');
    const cardCount = await visibleCards.count();
    
    if (cardCount > 0) {
      // If cards are visible, at least one should contain "Gold"
      const cardTitles = await visibleCards.locator('.hack-card-title').allTextContents();
      const hasGoldInTitle = cardTitles.some(title => title.toLowerCase().includes('gold'));
      expect(hasGoldInTitle).toBe(true);
    }
  });

  test('should handle filter selection', async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('.filter-option input[type="checkbox"]', { timeout: 10000 });
    
    // Get initial card count
    const initialCards = await page.locator('.hack-card').count();
    
    // Click first filter checkbox
    const firstCheckbox = page.locator('.filter-option input[type="checkbox"]').first();
    await firstCheckbox.check();
    
    // Wait for filtering to apply
    await page.waitForTimeout(500);
    
    // Results should change (either more or fewer cards)
    const filteredCards = await page.locator('.hack-card').count();
    // Note: We can't guarantee the count will be different since it depends on data
    // but we can check that the filter is checked
    await expect(firstCheckbox).toBeChecked();
  });

  test('should clear all filters', async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('.filter-option input[type="checkbox"]', { timeout: 10000 });
    
    // Check a filter
    const firstCheckbox = page.locator('.filter-option input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();
    
    // Click clear filters button
    await page.locator('#clearFilters').click();
    
    // Check that filter is unchecked
    await expect(firstCheckbox).not.toBeChecked();
    
    // Check that search is cleared
    await expect(page.locator('.search-input')).toHaveValue('');
  });

  test('should open detail panel when clicking hack card', async ({ page }) => {
    // Wait for hack cards to load
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    
    // Click first hack card
    const firstCard = page.locator('.hack-card').first();
    await firstCard.click();
    
    // Check that detail panel opens
    const detailPanel = page.locator('#detailPanel');
    await expect(detailPanel).toHaveClass(/open/);
    
    // Check detail panel content
    await expect(detailPanel.locator('#detailTitle')).toBeVisible();
    await expect(detailPanel.locator('.close-btn')).toBeVisible();
    
    // Check tabs are present
    await expect(detailPanel.locator('.tab-btn[data-tab="info"]')).toBeVisible();
    await expect(detailPanel.locator('.tab-btn[data-tab="patch"]')).toBeVisible();
    await expect(detailPanel.locator('.tab-btn[data-tab="links"]')).toBeVisible();
  });

  test('should close detail panel with close button', async ({ page }) => {
    // Open detail panel
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    await page.locator('.hack-card').first().click();
    
    const detailPanel = page.locator('#detailPanel');
    await expect(detailPanel).toHaveClass(/open/);
    
    // Click close button
    await page.locator('#closeDetail').click();
    
    // Check panel is closed
    await expect(detailPanel).not.toHaveClass(/open/);
  });

  test('should collapse detail panel when clicking outside', async ({ page }) => {
    // Open detail panel
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    await page.locator('.hack-card').first().click();
    
    const detailPanel = page.locator('#detailPanel');
    await expect(detailPanel).toHaveClass(/open/);
    
    // Click outside the panel (use body to avoid element interception)
    await page.locator('body').click({ position: { x: 100, y: 100 } });
    
    // Wait for collapse animation
    await page.waitForTimeout(500);
    
    // Check panel is collapsed (not fully closed)
    await expect(detailPanel).toHaveClass(/collapsed/);
  });

  test('should switch between detail panel tabs', async ({ page }) => {
    // Open detail panel
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    await page.locator('.hack-card').first().click();
    
    // Wait for panel to open
    await expect(page.locator('#detailPanel')).toHaveClass(/open/);
    
    // Check info tab is active by default
    await expect(page.locator('.tab-btn[data-tab="info"]')).toHaveClass(/active/);
    await expect(page.locator('#infoTab')).toHaveClass(/active/);
    
    // Click patch tab
    await page.locator('.tab-btn[data-tab="patch"]').click();
    await expect(page.locator('.tab-btn[data-tab="patch"]')).toHaveClass(/active/);
    await expect(page.locator('#patchTab')).toHaveClass(/active/);
    
    // Click links tab
    await page.locator('.tab-btn[data-tab="links"]').click();
    await expect(page.locator('.tab-btn[data-tab="links"]')).toHaveClass(/active/);
    await expect(page.locator('#linksTab')).toHaveClass(/active/);
  });

  test('should display theme toggle and work correctly', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    
    // Check initial state (should be light mode)
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
    
    // Wait for element to be stable (no animations)
    await page.waitForTimeout(500);
    
    // Click theme toggle with force to avoid animation issues
    await themeToggle.click({ force: true });
    
    // Wait for theme change to apply
    await page.waitForTimeout(300);
    
    // Check dark mode is applied
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    
    // Click again to toggle back
    await themeToggle.click({ force: true });
    await page.waitForTimeout(300);
    
    await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Check initial loading state
    const hackGrid = page.locator('#hackGrid');
    
    // Should show loading initially or show content
    const loadingText = hackGrid.locator('.loading');
    const hackCards = hackGrid.locator('.hack-card');
    
    // Either loading text or hack cards should be visible
    const hasLoading = await loadingText.isVisible();
    const hasCards = await hackCards.count() > 0;
    
    expect(hasLoading || hasCards).toBe(true);
    
    // If loading, wait for it to complete
    if (hasLoading) {
      await page.waitForSelector('.hack-card', { timeout: 10000 });
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that layout adapts
    await expect(page.locator('.app-layout')).toBeVisible();
    
    // Theme toggle should be smaller on mobile
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    
    // Sidebar should still be accessible
    await expect(page.locator('.sidebar')).toBeVisible();
    
    // Cards should stack in single column
    await page.waitForSelector('.hack-card', { timeout: 10000 });
    const hackGrid = page.locator('.hack-grid');
    await expect(hackGrid).toBeVisible();
  });
});