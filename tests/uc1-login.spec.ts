import { test, expect } from '@playwright/test';

// UC1: Registration & Login
test.describe('UC1 - Login', () => {
  test('logs in successfully with correct credentials and reaches the main interface', async ({ page }) => {
    await page.goto('/auth');

    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();

    // Post-condition: the user reaches the main interface, not the auth screen
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('shows an error message with wrong credentials (Alternative Flow)', async ({ page }) => {
    await page.goto('/auth');

    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill('wrong-password-123');
    await page.getByRole('button', { name: 'LOG IN' }).click();

    // Alternative Flow: wrong credentials -> error shown, user stays on /auth
    await expect(page.locator(`.errorMsg, [class*="errorMsg"]`)).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });
});