import { test, expect } from '@playwright/test';
import { loginAsTestUser, openFirstRecommendedMovie } from './helpers';

// UC5: Movie/TV Details
test.describe('UC5 - Movie/TV Details', () => {
  test('opens the movie overlay and shows trailer, cast, reviews and similar movies', async ({ page }) => {
    await loginAsTestUser(page);
    await openFirstRecommendedMovie(page);

    await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cast' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Similar Movies' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Community Reviews' })).toBeVisible();
  });

  test('toggles the movie in the watchlist and back', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await loginAsTestUser(page);
    await openFirstRecommendedMovie(page);

    // The recommendations row can now contain titles that are already in the To-Watch list,
    // so the test reads the current state first instead of assuming "Add to Watchlist"
    const addBtn = page.getByRole('button', { name: '+ Add to Watchlist' });
    const inBtn = page.getByRole('button', { name: '✓ In Watchlist' });
    const wasInWatchlist = await inBtn.isVisible();

    if (wasInWatchlist) {
      await inBtn.click();
      await expect(addBtn).toBeVisible();
      await addBtn.click();
      await expect(inBtn).toBeVisible();
    } else {
      await addBtn.click();
      await expect(inBtn).toBeVisible();
      await inBtn.click();
      await expect(addBtn).toBeVisible();
    }
  });
});
