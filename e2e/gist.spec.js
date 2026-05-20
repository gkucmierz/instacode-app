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

  test('should load gist from URL and create a new tab', async ({ page }) => {
    // Mock the GitHub Gist API response
    await page.route('https://api.github.com/gists/test_gist_id*', async route => {
      const json = {
        files: {
          "mock_script.js": {
            filename: "mock_script.js",
            language: "JavaScript",
            content: "console.log('hello from mock gist');"
          }
        }
      };
      await route.fulfill({ json });
    });

    // Navigate to the gist URL
    await page.goto('/gist/test_gist_id');

    // It should automatically redirect to home (/)
    await page.waitForURL('**/');

    // A new tab should be created with the filename 'mock_script.js'
    const newTab = page.locator('.code-tabs .p-tabview-nav-link', { hasText: 'mock_script.js' });
    await expect(newTab).toBeVisible({ timeout: 5000 });

    // The editor should contain the content
    const activeEditor = page.locator('.cm-content').first();
    await expect(activeEditor).toContainText("console.log('hello from mock gist');");
  });
  test('should successfully export a gist and link the tab, isolating the link across tabs', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Setup network mock for POST /gists
    await page.route('https://api.github.com/gists', async route => {
      if (route.request().method() === 'POST') {
        const json = {
          id: 'mock_new_gist_1234567890abcdef',
          html_url: 'https://gist.github.com/mock_new_gist_1234567890abcdef',
        };
        await route.fulfill({ json, status: 201 });
      } else {
        await route.continue();
      }
    });
    
    // Setup network mock for PATCH /gists/mock_new_gist_1234567890abcdef
    await page.route('https://api.github.com/gists/mock_new_gist_1234567890abcdef', async route => {
      await route.fulfill({ status: 200, json: {} });
    });

    // Press Cmd+G / Ctrl+G to open Gist Modal
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+g`);
    
    const modal = page.locator('.gist-modal');
    await expect(modal).toBeVisible();

    // Fill in a fake token to pass validation
    const tokenInput = modal.locator('input[placeholder="ghp_..."]');
    await tokenInput.fill('fake_token_for_testing_123');
    
    // Click Export
    const exportBtn = modal.locator('button:has-text("Export to Gist")');
    await exportBtn.click();
    
    // Check if the success message appears
    await expect(modal.locator('text=Success! Gist created successfully')).toBeVisible();
    
    // Close modal (success screen is showing)
    await modal.locator('button:has-text("Close")').click();
    await expect(modal).toBeHidden();
    
    // Reopen Gist Modal to verify the linked state (main tab view is now restored)
    await page.keyboard.press(`${modifier}+g`);
    await expect(modal).toBeVisible();

    // Verify that the "Update Gist" button is now visible
    const updateBtn = modal.locator('button:has-text("Update Gist")');
    await expect(updateBtn).toBeVisible();
    
    // Verify the visual indicator is present
    const linkedBanner = modal.locator('text=Linked to GitHub Gist:');
    await expect(linkedBanner).toBeVisible();
    await expect(modal.locator('code', { hasText: 'mock_new_gist_12' })).toBeVisible();
    
    // Close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).toBeHidden();
    
    // Create a new tab (Cmd+N / Ctrl+N)
    await page.keyboard.press(`${modifier}+n`);
    
    // Wait for a new tab to be active (Script 2)
    const newTab = page.locator('.code-tabs a.p-tabview-nav-link >> text="Script 2"');
    await expect(newTab).toBeVisible();
    
    // Open Gist Modal again
    await page.keyboard.press(`${modifier}+g`);
    await expect(modal).toBeVisible();
    
    // Verify banner is NOT visible in the new tab
    await expect(linkedBanner).toBeHidden();
    await expect(updateBtn).toBeHidden();
    
    // Close modal
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).toBeHidden();
    
    // Click back to Script 1 tab
    const firstTab = page.locator('.code-tabs a.p-tabview-nav-link >> text="Script 1"');
    await firstTab.click();
    
    // Open Gist Modal again
    await page.keyboard.press(`${modifier}+g`);
    await expect(modal).toBeVisible();
    
    // Verify banner IS visible again
    await expect(linkedBanner).toBeVisible();
    await expect(updateBtn).toBeVisible();
  });

});
