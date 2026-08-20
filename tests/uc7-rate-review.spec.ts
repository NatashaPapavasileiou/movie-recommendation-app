import { test, expect } from '@playwright/test';

// UC7: Rate & Review
test.describe('UC7 - Rate & Review', () => {
  test('submits a review from the movie overlay and it appears in Community Reviews', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

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
    await expect(page.getByRole('heading', { name: 'Trailer' })).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: 'Write Review' }).click();
    await expect(page.getByRole('heading', { name: 'Write Review' })).toBeVisible();

    const reviewText = `Automated UC7 test review ${Date.now()}`;
    await page.locator('[class*="starButton"]').nth(7).click(); // 8-star rating
    await page.getByPlaceholder('Share your thoughts about the movie...').fill(reviewText);
    await page.getByRole('button', { name: 'SUBMIT REVIEW' }).click();

    // The new review should now be visible under Community Reviews
    await expect(page.getByText(reviewText)).toBeVisible({ timeout: 15000 });

    // Cleanup: delete the review we just posted
    const reviewCard = page.locator('[class*="commentCard"]').filter({ hasText: reviewText });
    await reviewCard.locator('[class*="deleteButton"]').click();
    await expect(page.getByText(reviewText)).toHaveCount(0);

    // Submitting a review also marks the movie "watched" in the watchlist as a side effect —
    // remove it from the watchlist too, so it doesn't interfere with other tests (e.g. UC6).
    const watchlistBtn = page.getByRole('button', { name: '✓ In Watchlist' });
    if (await watchlistBtn.isVisible()) {
      await watchlistBtn.click();
    }
  });
});