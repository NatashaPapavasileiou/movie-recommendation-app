import { test, expect } from '@playwright/test';

// UC5: Movie/TV Details
test.describe('UC5 - Movie/TV Details', () => {
  const openFirstRecommendedMovie = async (page: import('@playwright/test').Page) => {
    await page.goto('/auth');
    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).not.toHaveURL(/\/auth/);

    const recommendedMoviesRow = page.locator('[class*="categoryContainer"]').filter({
      has: page.getByRole('heading', { name: 'Recommended Movies For You' }),
    });
    const firstCard = recommendedMoviesRow.locator('[class*="movieCard"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    // Περιμένουμε να φορτώσει ΠΛΗΡΩΣ το overlay (όχι μόνο το σκελετό "Loading...")
    await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible({ timeout: 20000 });
  };

  test('opens the movie overlay and shows trailer, cast, reviews and similar movies', async ({ page }) => {
    await openFirstRecommendedMovie(page);

    await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cast' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Similar Movies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Community Reviews' })).toBeVisible();
  });

    test('adds and removes the movie from the watchlist', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await openFirstRecommendedMovie(page);

    const watchlistBtn = page.getByRole('button', { name: /Watchlist/ });
    await watchlistBtn.click();
    await expect(page.getByRole('button', { name: '✓ In Watchlist' })).toBeVisible();

    await page.getByRole('button', { name: '✓ In Watchlist' }).click();
    await expect(page.getByRole('button', { name: '+ Add to Watchlist' })).toBeVisible();
  });
});