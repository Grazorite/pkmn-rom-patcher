import { test, expect } from '@playwright/test';

test('patcher loaded patch alignment', async ({ page }) => {
  await page.goto('http://localhost:8080/patcher/');
  
  // Search for a patch
  await page.fill('#patchSearch', 'emerald');
  await page.waitForTimeout(500);
  
  // Click first result
  await page.click('.patch-card');
  await page.waitForTimeout(500);
  
  // Upload a dummy ROM file
  const romInput = page.locator('#rom-patcher-input-file-rom');
  await romInput.setInputFiles({
    name: 'test.gba',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(1024)
  });
  
  await page.waitForTimeout(1000);
  
  // Check if loaded patch info is visible
  const loadedPatchInfo = page.locator('#rom-patcher-loaded-patch-info');
  await expect(loadedPatchInfo).toBeVisible();
  
  // Get bounding boxes
  const romFileRow = page.locator('#rom-patcher-row-file-rom');
  const romFileBox = await romFileRow.boundingBox();
  const loadedPatchBox = await loadedPatchInfo.boundingBox();
  
  // Check alignment - widths should match within 5px
  const widthDiff = Math.abs(romFileBox.width - loadedPatchBox.width);
  console.log(`ROM file row width: ${romFileBox.width}px`);
  console.log(`Loaded patch width: ${loadedPatchBox.width}px`);
  console.log(`Difference: ${widthDiff}px`);
  
  expect(widthDiff).toBeLessThan(5);
  
  // Take screenshot
  await page.screenshot({ path: 'tests/screenshots/patcher-alignment.png', fullPage: true });
});
