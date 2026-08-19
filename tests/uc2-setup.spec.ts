import { test, expect } from '@playwright/test';

// UC2: First-time Setup (registration + cold-start preference selection)
test.describe('UC2 - First-time Setup', () => {
  test('registers a new user, selects favorites, and reaches the personalized home page', async ({ page }) => {
    // Generate a unique email each run — Supabase won't allow registering
    // the same email twice, so a fixed email (like in UC1) can't be reused here.
    const uniqueEmail = `pw-test-${Date.now()}@example.com`;
    const password = 'TestPass123';

    // RegisterForm shows a native browser alert() on success — Playwright
    // auto-dismisses unhandled dialogs, so we must accept it ourselves first.
    page.once('dialog', (dialog) => dialog.accept());

    await page.goto('/auth');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await page.getByPlaceholder('Email Address').fill(uniqueEmail);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // Post-condition of UC1 / precondition of UC2: redirected to preference setup
    await expect(page).toHaveURL(/\/setup-preferences/);

    // Wait for the 20 trending titles to load, then select the first 3
    const movieCards = page.locator('[class*="cardButton"]');
    await expect(movieCards.first()).toBeVisible({ timeout: 15000 });
    await movieCards.nth(0).click();
    await movieCards.nth(1).click();
    await movieCards.nth(2).click();

    await page.getByRole('button', { name: 'Continue to Home' }).click();

    // Post-condition: cold-start resolved, user lands on the personalized home page
    await expect(page).toHaveURL('/');
  });
});