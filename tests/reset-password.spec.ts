import { test, expect } from '@playwright/test';

// Password reset page (opened from the link in the reset email)
test.describe('Reset Password', () => {
  test('the /reset-password page shows the form, keeps the button disabled until the password is valid', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible();
    const submit = page.getByRole('button', { name: 'UPDATE PASSWORD' });

    await page.getByPlaceholder('New Password').fill('short');
    await expect(submit).toBeDisabled();

    await page.getByPlaceholder('New Password').fill('ValidPass123');
    await expect(submit).toBeEnabled();
  });

  test('"Sign In" goes back to the login page', async ({ page }) => {
    await page.goto('/reset-password');

    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/auth/);
  });
});
