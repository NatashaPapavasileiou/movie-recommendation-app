import { test, expect } from '@playwright/test';

// UC6: Watchlist Management
test.describe('UC6 - Watchlist Management', () => {
  test('moves a movie from To Watch to Watched and back', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/auth');
    await page.getByPlaceholder('Email Address').fill(process.env.TEST_USER_EMAIL!);
    await page.getByPlaceholder('Password').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).not.toHaveURL(/\/auth/);

    // Open the first recommended movie
    const recommendedMoviesRow = page.locator('[class*="categoryContainer"]').filter({
      has: page.getByRole('heading', { name: 'Recommended Movies For You' }),
    });
    const firstCard = recommendedMoviesRow.locator('[class*="movieCard"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();
    await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible({ timeout: 20000 });

    const movieTitle = await page.locator('[class*="titleText"]').innerText();

    // Make sure it's in the watchlist (add it if it isn't already)
    const watchlistToggleBtn = page.getByRole('button', { name: /Watchlist/ });
    if ((await watchlistToggleBtn.innerText()).includes('Add to Watchlist')) {
      await watchlistToggleBtn.click();
      await expect(page.getByRole('button', { name: '✓ In Watchlist' })).toBeVisible();
    }

    await page.locator('[class*="closeButton"]').click();

    // Go to the Watchlist page
    await page.getByRole('link', { name: 'Watchlist' }).first().click();
    await expect(page).toHaveURL(/\/watchlist/);

    const toWatchColumn = page.locator('[class*="watchlistColumn"]').filter({
      has: page.getByRole('heading', { name: 'TO WATCH' }),
    });
    const watchedColumn = page.locator('[class*="watchlistColumn"]').filter({
      has: page.getByRole('heading', { name: 'WATCHED' }),
    });

    const toWatchCard = toWatchColumn.locator('[class*="movieCard"]').filter({ hasText: movieTitle });
    await expect(toWatchCard).toBeVisible({ timeout: 15000 });

    // Mark it as watched (this opens the review form)
    await toWatchCard.getByRole('button', { name: /MARK WATCHED/ }).click();
    await expect(page.getByRole('heading', { name: 'Write Review' })).toBeVisible();

    await page.locator('[class*="starButton"]').nth(6).click();
    await page.getByPlaceholder('Share your thoughts about the movie...').fill('Great pick for testing UC6!');
    await page.getByRole('button', { name: 'SUBMIT REVIEW' }).click();

    const watchedCard = watchedColumn.locator('[class*="movieCard"]').filter({ hasText: movieTitle });
    await expect(watchedCard).toBeVisible({ timeout: 15000 });
    await expect(toWatchCard).toHaveCount(0);

    // Move it back to To Watch, to leave the account clean
    await watchedCard.getByRole('button', { name: /MOVE BACK/ }).click();
    await expect(toWatchColumn.locator('[class*="movieCard"]').filter({ hasText: movieTitle })).toBeVisible({ timeout: 15000 });
  });
});