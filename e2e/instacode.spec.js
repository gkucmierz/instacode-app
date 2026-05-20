import { test, expect } from '@playwright/test';

test.describe('Instacode Multi-Tab E2E Tests', () => {

  test('should load welcome code on first visit', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // In Zen Mode (1 tab), the tab header container is hidden, but the tab exists
    const tabHeaderContainer = page.locator('.code-tabs .p-tabview-nav-container');
    await expect(tabHeaderContainer).toBeHidden();

    // Wait for the worker to evaluate and the result pane to display output
    // The welcome code evaluates to 'Hello World!' via its string literal
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText('Hello World!', { timeout: 10000 });
  });

  test('should toggle Zen Mode (hide tab bar) automatically based on tab count', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.goto('/');
    
    const tabContainer = page.locator('.code-tabs .p-tabview-nav-container');
    
    // Initial state: 1 tab -> Zen mode (hidden)
    await expect(tabContainer).toBeHidden();
    
    // Press Cmd+N to create a new tab
    await page.keyboard.press(`${modifier}+N`);
    
    // 2 tabs -> Zen mode off (visible)
    await expect(tabContainer).toBeVisible();
    const tabs = page.locator('.code-tabs .p-tabview-nav-link');
    await expect(tabs).toHaveCount(2);
    
    // Press Cmd+W to close the second tab
    await page.keyboard.press(`${modifier}+W`);
    
    // Back to 1 tab -> Zen mode on (hidden)
    await expect(tabContainer).toBeHidden();
  });

  test('should create a new tab and close it via keyboard shortcuts', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

    await page.goto('/');
    
    // Wait for app to be ready
    await page.waitForSelector('.code-tabs');

    // Press Cmd+N to create a new tab
    await page.keyboard.press(`${modifier}+N`);

    // We should now have two tabs
    const tabs = page.locator('.code-tabs .p-tabview-nav-link');
    await expect(tabs).toHaveCount(2);
    
    // The active tab should be Script 2
    const activeTab = page.locator('.code-tabs .p-tabview-nav-link[aria-selected="true"]');
    await expect(activeTab).toContainText('Script 2');

    // Press Cmd+W to close the active tab
    await page.keyboard.press(`${modifier}+W`);

    // Should be back to 1 tab
    await expect(tabs).toHaveCount(1);
    // Tab bar is hidden now, so aria-selected check might need to be by state or we can just trust the count
  });

  test('should preserve worker state and text when navigating to settings and back', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.goto('/');
    
    // Modify the text to set a custom string
    await page.locator('.code-tabs .p-tabview-panel:visible .cm-content').click();
    await page.keyboard.press(`${modifier}+A`); // Select all
    await page.keyboard.press('Backspace'); // Clear it
    
    await page.keyboard.insertText('console.log("PERSISTENCE_TEST")');
    
    // Wait for it to evaluate
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText('PERSISTENCE_TEST', { timeout: 10000 });

    // Go to Settings via shortcut Cmd+,
    await page.keyboard.press(`${modifier}+,`);
    
    // Ensure we are in settings (check URL or title)
    await expect(page).toHaveURL(/.*\/settings/);

    // Go back to Home
    await page.goBack();
    
    // Ensure the state persisted in the editor
    await expect(page.locator('.code-tabs .p-tabview-panel:visible .cm-content')).toContainText('PERSISTENCE_TEST');
    
    // Ensure the result persisted
    await expect(resultPane).toContainText('PERSISTENCE_TEST');
  });

  test('should restore welcome code if the last tab is completely cleared and browser refreshed', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.goto('/');
    
    // Clear the editor completely
    await page.locator('.code-tabs .p-tabview-panel:visible .cm-content').click();
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press('Backspace');

    // Make sure it's actually cleared by waiting for a line to not have old text
    await expect(page.locator('.code-tabs .p-tabview-panel:visible .cm-content')).not.toContainText('Hello World!');

    // Reload the browser
    await page.reload();

    // Because it was the only tab and it was empty, it should have been restored to WELCOME_CODE
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText('Hello World!', { timeout: 10000 });
  });

});
