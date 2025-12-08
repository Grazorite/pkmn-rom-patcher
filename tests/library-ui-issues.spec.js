const { test, expect } = require('@playwright/test');

test.describe('Library Page UI Issues', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/library/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#hackGrid', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('#viewToggle', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000); // Wait for animations
  });

  test('Toggle view icon switching verification', async ({ page }) => {
    const viewToggle = page.locator('#viewToggle');
    await expect(viewToggle).toBeVisible();
    
    // Get initial icon
    const initialIcon = await viewToggle.locator('i').getAttribute('data-lucide');
    console.log(`Initial icon: ${initialIcon}`);
    
    // Get initial view mode from grid class
    const hackGrid = page.locator('#hackGrid');
    const initialHasGridView = await hackGrid.evaluate(el => el.classList.contains('grid-view'));
    console.log(`Initial grid-view class: ${initialHasGridView}`);
    
    // Click toggle
    await viewToggle.click();
    await page.waitForTimeout(500); // Wait for icon update
    
    // Get new icon
    const newIcon = await viewToggle.locator('i').getAttribute('data-lucide');
    console.log(`After click icon: ${newIcon}`);
    
    // Get new view mode
    const newHasGridView = await hackGrid.evaluate(el => el.classList.contains('grid-view'));
    console.log(`After click grid-view class: ${newHasGridView}`);
    
    // Verify icon changed
    console.log(`Icon changed: ${initialIcon !== newIcon}`);
    
    // Expected behavior:
    // If starting in card mode (no grid-view): icon should be grid-3x3
    // After click (grid mode, has grid-view): icon should be layout-list
    
    if (!initialHasGridView) {
      console.log('Started in card mode');
      expect(initialIcon).toBe('grid-3x3');
      expect(newIcon).toBe('layout-list');
      expect(newHasGridView).toBe(true);
    } else {
      console.log('Started in grid mode');
      expect(initialIcon).toBe('layout-list');
      expect(newIcon).toBe('grid-3x3');
      expect(newHasGridView).toBe(false);
    }
    
    // Click again to verify it toggles back
    await viewToggle.click();
    await page.waitForTimeout(500);
    
    const finalIcon = await viewToggle.locator('i').getAttribute('data-lucide');
    const finalHasGridView = await hackGrid.evaluate(el => el.classList.contains('grid-view'));
    
    console.log(`After second click icon: ${finalIcon}`);
    console.log(`After second click grid-view class: ${finalHasGridView}`);
    
    // Should be back to initial state
    expect(finalIcon).toBe(initialIcon);
    expect(finalHasGridView).toBe(initialHasGridView);
  });

  test('Toggle view tooltip verification', async ({ page }) => {
    const viewToggle = page.locator('#viewToggle');
    
    // Check if title attribute exists
    const title = await viewToggle.getAttribute('title');
    console.log(`Toggle view title attribute: ${title}`);
    
    expect(title).toBeTruthy();
    expect(title).toBe('Toggle view');
    
    // Hover and check if tooltip appears (browser native tooltip)
    await viewToggle.hover();
    await page.waitForTimeout(1000);
    
    console.log('✓ Tooltip should appear on hover (native browser tooltip)');
  });

  test('Clear filters tooltip verification', async ({ page }) => {
    const clearFilters = page.locator('#clearFilters');
    
    // Check if title attribute exists
    const title = await clearFilters.getAttribute('title');
    console.log(`Clear filters title attribute: ${title}`);
    
    expect(title).toBeTruthy();
    expect(title).toBe('Clear filters');
    
    // Hover and check if tooltip appears
    await clearFilters.hover();
    await page.waitForTimeout(1000);
    
    console.log('✓ Tooltip should appear on hover (native browser tooltip)');
  });

  test('Sidebar and main-content alignment verification', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const mainContent = page.locator('.main-content');
    
    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
    
    // Get bounding boxes
    const sidebarBox = await sidebar.boundingBox();
    const mainContentBox = await mainContent.boundingBox();
    
    console.log('\nSidebar position:');
    console.log(`  Top: ${sidebarBox.y}px`);
    console.log(`  Height: ${sidebarBox.height}px`);
    
    console.log('\nMain content position:');
    console.log(`  Top: ${mainContentBox.y}px`);
    console.log(`  Height: ${mainContentBox.height}px`);
    
    console.log(`\nVertical alignment difference: ${Math.abs(sidebarBox.y - mainContentBox.y)}px`);
    
    // They should be aligned at the top (within 5px tolerance)
    const alignmentDiff = Math.abs(sidebarBox.y - mainContentBox.y);
    
    if (alignmentDiff > 5) {
      console.log(`❌ NOT ALIGNED - Difference: ${alignmentDiff}px`);
    } else {
      console.log(`✓ ALIGNED - Difference: ${alignmentDiff}px`);
    }
    
    // Check parent container
    const appLayout = page.locator('.app-layout');
    const layoutStyles = await appLayout.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        alignItems: computed.alignItems,
        gridTemplateColumns: computed.gridTemplateColumns
      };
    });
    
    console.log('\nApp layout styles:');
    console.log(JSON.stringify(layoutStyles, null, 2));
  });

  test('Check icon rendering after toggle', async ({ page }) => {
    const viewToggle = page.locator('#viewToggle');
    
    // Get SVG element inside icon
    const getSvgInfo = async () => {
      return await viewToggle.evaluate(btn => {
        const icon = btn.querySelector('i');
        const svg = btn.querySelector('svg');
        return {
          iconDataLucide: icon?.getAttribute('data-lucide'),
          hasSvg: !!svg,
          svgClass: svg?.getAttribute('class'),
          iconHTML: icon?.outerHTML.substring(0, 100)
        };
      });
    };
    
    console.log('\nInitial state:');
    const initial = await getSvgInfo();
    console.log(JSON.stringify(initial, null, 2));
    
    // Click toggle
    await viewToggle.click();
    await page.waitForTimeout(500);
    
    console.log('\nAfter first click:');
    const afterClick = await getSvgInfo();
    console.log(JSON.stringify(afterClick, null, 2));
    
    // Check if SVG actually changed
    console.log(`\nSVG changed: ${initial.svgClass !== afterClick.svgClass}`);
    console.log(`Icon data-lucide changed: ${initial.iconDataLucide !== afterClick.iconDataLucide}`);
  });

  test('Check localStorage view mode persistence', async ({ page }) => {
    // Get initial localStorage value
    const initialMode = await page.evaluate(() => localStorage.getItem('libraryViewMode'));
    console.log(`Initial localStorage viewMode: ${initialMode}`);
    
    const viewToggle = page.locator('#viewToggle');
    await viewToggle.click();
    await page.waitForTimeout(500);
    
    const afterClickMode = await page.evaluate(() => localStorage.getItem('libraryViewMode'));
    console.log(`After click localStorage viewMode: ${afterClickMode}`);
    
    // Should have toggled
    if (initialMode === 'card') {
      expect(afterClickMode).toBe('grid');
    } else if (initialMode === 'grid') {
      expect(afterClickMode).toBe('card');
    } else {
      // Default is 'card', so after click should be 'grid'
      expect(afterClickMode).toBe('grid');
    }
  });

  test('Visual screenshot comparison', async ({ page }) => {
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'tests/screenshots/library-initial.png',
      fullPage: false 
    });
    
    // Click toggle
    const viewToggle = page.locator('#viewToggle');
    await viewToggle.click();
    await page.waitForTimeout(1000);
    
    // Take screenshot after toggle
    await page.screenshot({ 
      path: 'tests/screenshots/library-after-toggle.png',
      fullPage: false 
    });
    
    console.log('✓ Screenshots saved for visual comparison');
  });
});
