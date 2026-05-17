import { test, expect } from '@playwright/test';

test.describe('Instacode Gist Export', () => {

  test('should prompt for token on missing token and handle bad credentials gracefully', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Press Cmd+G / Ctrl+G to open Gist Modal
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+g`);

    // Modal should open
    const modal = page.locator('.gist-modal');
    await expect(modal).toBeVisible();

    // Because there is no token configured, the Provide GitHub Token prompt should be visible
    const tokenPrompt = modal.locator('text=Provide GitHub Token');
    await expect(tokenPrompt).toBeVisible();

    // Fill in a deliberately fake token
    const tokenInput = modal.locator('input[placeholder="ghp_..."]');
    await expect(tokenInput).toBeVisible();
    await tokenInput.fill('fake_token_for_testing_123');

    // Click Export
    const exportBtn = modal.locator('button:has-text("Export to Gist")');
    await exportBtn.click();

    // The button state should change to Exporting temporarily
    await expect(modal.locator('button:has-text("Exporting...")')).toBeVisible();

    // Since the token is invalid, GitHub API will return a 401 Unauthorized / Bad credentials
    // The UI should display the error gracefully
    const errorMsg = modal.locator('text=Failed to create gist: Bad credentials');
    await expect(errorMsg).toBeVisible({ timeout: 10000 });

    // The token prompt should remain visible (or reappear) allowing the user to correct the bad token
    await expect(tokenPrompt).toBeVisible();
  });

});
