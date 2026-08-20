import { test, expect } from '@playwright/test';

// UC4: Search
test.describe('UC4 - Search', () => {
  test('shows matching results when searching for an existing title', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).not.toHaveURL(/\/auth/);

    await page.getByPlaceholder('Search').first().fill('Batman');

    await expect(page.locator('[class*="resultCard"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows "No Results Found" for a nonsense query (Alternative Flow)', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).not.toHaveURL(/\/auth/);

    await page.getByPlaceholder('Search').first().fill('zzxxqqwwasdkjfh123');

    await expect(page.getByRole('heading', { name: 'No Results Found !' })).toBeVisible({ timeout: 10000 });
  });
});