import { test, expect } from '../fixtures/base.js';

test.describe('Submit Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/submit/');
    await page.waitForLoadState('networkidle');
  });

  test('loads correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Submit');
    await expect(page.locator('.progress-steps')).toBeVisible();
  });

  test('displays all form steps', async ({ page }) => {
    const steps = page.locator('.progress-step');
    await expect(steps).toHaveCount(5);
  });

  test('shows step 1 by default', async ({ page }) => {
    const activeStep = page.locator('.form-step.active');
    await expect(activeStep).toHaveAttribute('data-step', '1');
  });

  test('validates required fields', async ({ page }) => {
    const nextBtn = page.locator('#nextBtn');
    await nextBtn.click();
    
    // Should stay on step 1 if validation fails
    const activeStep = page.locator('.form-step.active');
    await expect(activeStep).toHaveAttribute('data-step', '1');
  });

  test('navigates between steps', async ({ page }) => {
    // Fill required fields
    await page.fill('#title', 'Test Hack');
    await page.selectOption('#baseRom', 'Crystal');
    await page.fill('#author', 'Test Author');
    
    // Go to next step
    await page.locator('#nextBtn').click();
    await page.waitForTimeout(300);
    
    const activeStep = page.locator('.form-step.active');
    await expect(activeStep).toHaveAttribute('data-step', '2');
  });

  test('populates base ROM dropdown', async ({ page }) => {
    const baseRomSelect = page.locator('#baseRom');
    const options = baseRomSelect.locator('option');
    const count = await options.count();
    
    // Should have more than just the placeholder
    expect(count).toBeGreaterThan(1);
  });
});
