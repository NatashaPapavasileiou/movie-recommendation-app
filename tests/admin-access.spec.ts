import { test, expect } from '@playwright/test';
import { login, loginAsTestUser } from './helpers';

// Admin area: access control and the Explainable Recommendations tab
test.describe('Admin area', () => {
  test('a regular user who opens /admin is sent back to the home page', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/admin');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Platform Operations & Security Center' })).toHaveCount(0);
  });

  test('a visitor who is not logged in cannot open /admin', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).not.toHaveURL(/\/admin/);
  });

  test.describe('as admin', () => {
    // Needs an admin account: TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD in .env.test.local
    test.skip(!process.env.TEST_ADMIN_EMAIL, 'TEST_ADMIN_EMAIL is not set');

    test.beforeEach(async ({ page }) => {
      await login(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!);
    });

    test('logging in as admin opens the dashboard', async ({ page }) => {
      await expect(page).toHaveURL(/\/admin/);
      await expect(page.getByRole('heading', { name: 'Platform Operations & Security Center' })).toBeVisible();
      await expect(page.getByText('Live Security Telemetry Feed')).toBeVisible();
    });

    test('the Explainable Recs tab explains where a user\'s recommendations come from', async ({ page }) => {
      await page.getByRole('button', { name: /Explainable Recs/ }).click();

      await expect(page.getByRole('heading', { name: 'Where this row comes from' })).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/of \d+ \(\d+%\)/).first()).toBeVisible();
      await expect(page.getByText(/Why this movie/i)).toBeVisible();

      // Switching to TV shows rebuilds the explanation for the TV row
      await page.getByRole('button', { name: 'TV Shows', exact: true }).click();
      await expect(page.getByText(/Why this show/i)).toBeVisible({ timeout: 30000 });
    });
  });
});
