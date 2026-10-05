import { test, expect } from '@playwright/test';
import { loginAsTestUser, recommendationsRow } from './helpers';

// UC3: Get Personalized Recommendations
test.describe('UC3 - Get Recommendations', () => {
  for (const heading of ['Recommended Movies For You', 'Recommended TV Shows For You']) {
    test(`shows the "${heading}" row with up to 12 unique titles`, async ({ page }) => {
      await loginAsTestUser(page);

      const row = recommendationsRow(page, heading);
      await expect(row).toBeVisible({ timeout: 20000 });

      const cards = row.locator('[class*="movieCard"]');
      await expect(cards.first()).toBeVisible({ timeout: 20000 });

      // The hybrid engine fills the row with at most 12 titles and never repeats one
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(12);

      const titles = await cards.locator('[class*="textBoldxl"]').allInnerTexts();
      expect(new Set(titles).size).toBe(titles.length);
    });
  }
});
