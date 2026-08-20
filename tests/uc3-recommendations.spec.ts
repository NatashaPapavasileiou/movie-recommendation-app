import { test, expect } from '@playwright/test';

// UC3: Get Recommendations
test.describe('UC3 - Get Recommendations', () => {
  test('shows a personalized recommendations row on the home page after login', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).not.toHaveURL(/\/auth/);

    const recommendedRow = page.locator('[class*="categoryContainer"]').filter({
      has: page.getByRole('heading', { name: 'Recommended Movies For You' }),
    });

    await expect(recommendedRow).toBeVisible({ timeout: 15000 });
    await expect(recommendedRow.locator('[class*="movieCard"]').first()).toBeVisible({ timeout: 15000 });
  });
});