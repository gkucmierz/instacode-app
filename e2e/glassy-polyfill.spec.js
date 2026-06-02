import { test, expect } from '@playwright/test';

test.describe('Instacode Glassy Polyfill E2E Tests', () => {

  test('should polyfill window object when setting is enabled, and fail when disabled', async ({ page }) => {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    
    // 1. Visit Home
    await page.goto('/');

    // 2. Clear editor and write a script checking typeof window and window.devicePixelRatio
    await page.locator('.code-tabs .p-tabview-panel:visible .left-pane .cm-content').click();
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText('console.log("WINDOW_TYPE:", typeof window); console.log("WINDOW_DPR:", window.devicePixelRatio);');

    // 3. Wait for execution and verify window is polyfilled (default is true)
    const resultPane = page.locator('.result-code');
    await expect(resultPane).toContainText("'WINDOW_TYPE:', 'object'", { timeout: 10000 });
    await expect(resultPane).toContainText("'WINDOW_DPR:', 1", { timeout: 10000 });

    // 4. Navigate to Settings page
    await page.goto('/settings');
    
    // Locate the wrapper switch using its parent structure or label
    const polyfillSwitch = page.locator('#workerWindowPolyfill').locator('xpath=..');
    await polyfillSwitch.click();

    // 5. Go back to Home
    await page.goto('/');

    // 6. Write a script to trigger evaluation
    await page.locator('.code-tabs .p-tabview-panel:visible .left-pane .cm-content').click();
    await page.keyboard.press(`${modifier}+A`);
    await page.keyboard.press('Backspace');
    await page.keyboard.insertText('console.log("CHECK_WINDOW:", window.devicePixelRatio);');

    // 7. With polyfill disabled, window is not defined, which should result in an error
    await expect(resultPane).toContainText('window is not defined', { timeout: 10000 });

    // 8. Cleanup: Restore settings
    await page.goto('/settings');
    const polyfillSwitchRestore = page.locator('#workerWindowPolyfill').locator('xpath=..');
    await polyfillSwitchRestore.click();
  });

});
