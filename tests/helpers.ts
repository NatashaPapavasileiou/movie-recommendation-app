import { expect, type Page } from '@playwright/test';

// Logs in with the credentials from .env.test.local and waits until the app leaves /auth
export const login = async (page: Page, email: string, password: string) => {
  await page.goto('/auth');
  await page.getByPlaceholder('Email Address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await expect(page).not.toHaveURL(/\/auth/);
};

export const loginAsTestUser = (page: Page) =>
  login(page, process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);

// The personalised row on the home page ("Recommended Movies For You" / "Recommended TV Shows For You")
export const recommendationsRow = (page: Page, heading: string) =>
  page.locator('[class*="categoryContainer"]').filter({
    has: page.getByRole('heading', { name: heading }),
  });

// Opens the first title of the movie recommendations row and waits for the overlay to finish loading
export const openFirstRecommendedMovie = async (page: Page) => {
  const firstCard = recommendationsRow(page, 'Recommended Movies For You').locator('[class*="movieCard"]').first();
  await expect(firstCard).toBeVisible({ timeout: 20000 });
  await firstCard.click();
  await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible({ timeout: 20000 });
};
