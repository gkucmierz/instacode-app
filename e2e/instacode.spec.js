import { test, expect } from '@playwright/test';

test.describe('Instacode Multi-Tab E2E Tests', () => {

  test('should load welcome code on first visit', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Check if the first tab exists and says "Script 1"
    const tabHeader = page.locator('.p-tabview-nav-link').first();
    await expect(tabHeader).toBeVisible();
    await expect(tabHeader).toContainText('Script 1');

    // Wait for the worker to evaluate and the result pane to display output
    // The welcome code evaluates to 'Hello World!' via its string literal
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText('Hello World!', { timeout: 10000 });
  });

  test('should create a new tab and close it via keyboard shortcuts', async ({ page, context }) => {
    // macOS uses Meta for Cmd, Windows/Linux uses Control.
    // Playwright `Meta` works across macOS, but we can just use ControlOrMeta
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

    await page.goto('/');
    
    // Wait for app to be ready
    await page.waitForSelector('.code-tabs');

    // Press Cmd+N to create a new tab
    await page.keyboard.press(`${modifier}+N`);

    // We should now have two tabs
    const tabs = page.locator('.p-tabview-nav-link');
    await expect(tabs).toHaveCount(2);
    
    // The active tab should be Script 2
    const activeTab = page.locator('.p-tabview-nav-link[aria-selected="true"]');
    await expect(activeTab).toContainText('Script 2');

    // Press Cmd+W to close the active tab
    await page.keyboard.press(`${modifier}+W`);

    // Should be back to 1 tab
    await expect(tabs).toHaveCount(1);
    await expect(page.locator('.p-tabview-nav-link[aria-selected="true"]')).toContainText('Script 1');
  });

  test('should preserve worker state and text when navigating to settings and back', async ({ page }) => {
    await page.goto('/');
    
    // Modify the text to set a custom string
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Meta+A'); // Select all
    await page.keyboard.press('Backspace'); // Clear it
    
    await page.keyboard.insertText('console.log("PERSISTENCE_TEST")');
    
    // Wait for it to evaluate
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText('PERSISTENCE_TEST', { timeout: 10000 });

    // Go to Settings via shortcut Cmd+,
    await page.keyboard.press('Meta+,');
    
    // Ensure we are in settings (check URL or title)
    await expect(page).toHaveURL(/.*\/settings/);

    // Go back to Home
    await page.goBack();
    
    // Ensure the state persisted in the editor
    await expect(page.locator('.cm-content').first()).toContainText('PERSISTENCE_TEST');
    
    // Ensure the result persisted
    await expect(resultPane).toContainText('PERSISTENCE_TEST');
  });

  test('should restore welcome code if the last tab is completely cleared and browser refreshed', async ({ page }) => {
    await page.goto('/');
    
    // Clear the editor completely
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Meta+A');
    await page.keyboard.press('Backspace');

    // Make sure it's actually cleared by waiting for a line to not have old text
    await expect(page.locator('.cm-content').first()).not.toContainText('Hello World!');

    // Reload the browser
    await page.reload();

    // Because it was the only tab and it was empty, it should have been restored to WELCOME_CODE
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText('Hello World!', { timeout: 10000 });
  });

});
