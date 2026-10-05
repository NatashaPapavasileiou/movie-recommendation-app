import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

// UC4: Search & Filter
test.describe('UC4 - Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('shows matching results when searching for an existing title', async ({ page }) => {
    await page.getByPlaceholder('Search').first().fill('Batman');

    await expect(page.locator('[class*="resultCard"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Showing \d+ of \d+/)).toBeVisible();
  });

  test('filters results to movies only', async ({ page }) => {
    await page.getByPlaceholder('Search').first().fill('Batman');
    await expect(page.locator('[class*="resultCard"]').first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Movies', exact: true }).click();

    // Every remaining card is labelled MOVIE, and the Reset button appears
    const cards = page.locator('[class*="resultCard"]');
    await expect(cards.first()).toBeVisible();
    for (const label of await cards.locator('[class*="subText"]').filter({ hasText: /^(MOVIE|TV)$/ }).allInnerTexts()) {
      expect(label).toBe('MOVIE');
    }
    await expect(page.getByRole('button', { name: /Reset/ })).toBeVisible();
  });

  test('shows a "no match" message when filters exclude everything, and Clear Filters restores results', async ({ page }) => {
    await page.getByPlaceholder('Search').first().fill('Batman');
    await expect(page.locator('[class*="resultCard"]').first()).toBeVisible({ timeout: 10000 });

    // Batman titles are not Westerns from before 2000 with 8+ rating
    await page.getByLabel('Filter by genre').selectOption({ label: 'Western' });
    await page.getByLabel('Filter by year').selectOption('older');
    await page.getByLabel('Filter by rating').selectOption('8');

    await expect(page.getByRole('heading', { name: 'No items match your active filters!' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filters' }).click();
    await expect(page.locator('[class*="resultCard"]').first()).toBeVisible();
  });

  test('shows "No Results Found" for a nonsense query (Alternative Flow)', async ({ page }) => {
    await page.getByPlaceholder('Search').first().fill('zzxxqqwwasdkjfh123');

    await expect(page.getByRole('heading', { name: 'No Results Found !' })).toBeVisible({ timeout: 10000 });
  });
});
