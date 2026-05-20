import { test, expect } from '@playwright/test';

test.describe('Instacode Smart JSON Formatter E2E Tests', () => {

  test('should detect JS object output, show Open JSON button, and open it in a new tab', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Clear the editor completely
    await page.locator('.code-tabs .p-tabpanel:visible .cm-content').click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press('Backspace');

    // Type a JS object (which evaluates to a JS object, not JSON)
    const testCode = '({ pick: "Wukong", ban: "" })';
    await page.keyboard.insertText(testCode);

    // Wait for the worker to evaluate and the result pane to display output
    const resultPane = page.locator('.result-code');
    // The worker formats it via javascript-stringify
    await expect(resultPane).toContainText("pick: 'Wukong'", { timeout: 10000 });

    // Verify the "Open JSON" button appears
    const openJsonBtn = page.locator('.json-btn');
    await expect(openJsonBtn).toBeVisible();
    await expect(openJsonBtn).toContainText('Open JSON');

    // Click the "Open JSON" button
    await openJsonBtn.click();

    // Verify a new tab was created (Zen Mode should toggle off, so tab bar is visible)
    const tabContainer = page.locator('.code-tabs .p-tabview-nav-container');
    await expect(tabContainer).toBeVisible();
    
    // Verify there are now 2 tabs
    const tabs = page.locator('.code-tabs .p-tabview-nav-link');
    await expect(tabs).toHaveCount(2);

    // Verify the new active tab has the title "output.json"
    const activeTabTitle = page.locator('.code-tabs .p-tabview-nav-link[aria-selected="true"] .tab-title-text');
    await expect(activeTabTitle).toContainText('output.json');

    // Verify the code editor in the new tab contains the properly formatted JSON
    // with double quotes around keys and string values
    const editorContent = page.locator('.code-tabs .p-tabpanel:visible .cm-content');
    await expect(editorContent).toContainText('"pick": "Wukong"');
    await expect(editorContent).toContainText('"ban": ""');
  });

});
