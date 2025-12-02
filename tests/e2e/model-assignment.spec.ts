import { test, expect } from '@playwright/test';

test('model assignment page renders correctly', async ({ page }) => {
  await page.goto('/');

  // Take a screenshot to see the new design
  await page.screenshot({ path: 'tests/e2e/screenshots/model-assignment.png', fullPage: true });

  // Verify the page elements
  await expect(page.locator('h1')).toContainText('EUCHRE REASONING ARENA');
  await expect(page.locator('.live-indicator')).toBeVisible();

  // Check all four position selects are present
  await expect(page.locator('text=NORTH')).toBeVisible();
  await expect(page.locator('text=EAST')).toBeVisible();
  await expect(page.locator('text=SOUTH')).toBeVisible();
  await expect(page.locator('text=WEST')).toBeVisible();

  // Check start button
  await expect(page.locator('.start-button')).toContainText('START GAME');

  console.log('✓ Model assignment page loaded successfully');
});
