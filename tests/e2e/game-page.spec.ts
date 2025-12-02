import { test, expect } from '@playwright/test';

test('game page renders correctly', async ({ page }) => {
  await page.goto('/game');

  // Take a screenshot
  await page.screenshot({ path: 'tests/e2e/screenshots/game-page.png', fullPage: true });

  // Verify main sections
  await expect(page.locator('text=ARENA')).toBeVisible();
  await expect(page.locator('text=INTELLIGENCE')).toBeVisible();

  // Verify game state header
  await expect(page.locator('text=PHASE: PLAYING')).toBeVisible();

  // Verify all player positions
  await expect(page.locator('text=NORTH')).toBeVisible();
  await expect(page.locator('text=EAST')).toBeVisible();
  await expect(page.locator('text=SOUTH')).toBeVisible();
  await expect(page.locator('text=WEST')).toBeVisible();

  // Verify activity log
  await expect(page.locator('text=ACTIVITY LOG')).toBeVisible();

  // Verify live reasoning
  await expect(page.locator('text=LIVE MODEL REASONING')).toBeVisible();

  console.log('✓ Game page loaded successfully');
});
