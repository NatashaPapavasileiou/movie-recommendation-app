import { test, expect } from '@playwright/test';

// UC8: Logout
test.describe('UC8 - Logout', () => {
  test('logs the user out and returns to the login page', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).not.toHaveURL(/\/auth/);

    await page.getByRole('button', { name: 'Log Out' }).first().click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole('button', { name: 'LOG IN' })).toBeVisible();
  });
});