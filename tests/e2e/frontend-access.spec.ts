import { test, expect } from '@playwright/test';

test('can access and interact with the frontend', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Take a screenshot to verify we can see the page
  await page.screenshot({ path: 'tests/e2e/screenshots/homepage.png', fullPage: true });

  // Check that the page loaded by verifying we have some content
  const body = await page.locator('body');
  await expect(body).toBeVisible();

  // Log the page title
  const title = await page.title();
  console.log('Page title:', title);

  // Log some basic page info
  const url = page.url();
  console.log('Current URL:', url);

  // Get the page content to verify it's rendering
  const content = await page.content();
  console.log('Page has content:', content.length > 0);
});
