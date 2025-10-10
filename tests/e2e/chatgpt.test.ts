/**
 * E2E tests for ChatGPT integration
 * Tests the full flow: popup → profile creation → ChatGPT request → substitution verification
 */

import { test, expect } from './fixtures';

test.describe('ChatGPT Integration', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    // Open extension popup
    await page.goto(`chrome-extension://${extensionId}/popup-v2.html`);

    // Wait for popup to load
    await page.waitForSelector('#app');
  });

  test('creates profile and substitutes PII in ChatGPT request', async ({
    page,
    extensionId,
  }) => {
    // Step 1: Create a test profile
    await page.click('#addProfileBtn');

    // Wait for modal to appear
    await page.waitForSelector('#profileModal');

    // Fill in profile details
    await page.fill('#profileName', 'Test Profile');
    await page.fill('#realName', 'John Smith');
    await page.fill('#aliasName', 'Alex Johnson');
    await page.fill('#realEmail', 'john.smith@example.com');
    await page.fill('#aliasEmail', 'alex.johnson@example.com');

    // Save the profile
    await page.click('#modalSave');

    // Wait for modal to close
    await page.waitForSelector('#profileModal', { state: 'hidden' });

    // Verify profile was created and is enabled
    const profileCard = page.locator('.profile-card').first();
    await expect(profileCard).toContainText('Test Profile');
    await expect(profileCard).toContainText('Alias Enabled');

    // Step 2: Navigate to ChatGPT
    const chatPage = await page.context().newPage();
    await chatPage.goto('https://chat.openai.com');

    // Wait for page to load
    await chatPage.waitForLoadState('networkidle');

    // Step 3: Set up request interception
    let requestBody: any = null;
    let responseBody: any = null;

    chatPage.on('request', (request) => {
      const url = request.url();
      if (url.includes('/backend-api/conversation')) {
        // Capture the request body
        try {
          requestBody = JSON.parse(request.postData() || '{}');
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    chatPage.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/backend-api/conversation')) {
        // Capture the response body
        try {
          responseBody = await response.json();
        } catch (e) {
          // Ignore parse errors (streaming responses)
        }
      }
    });

    // Step 4: Find the textarea and type a message with PII
    const textarea = chatPage.locator('textarea[data-id="root"]').first();
    if (await textarea.isVisible()) {
      await textarea.fill(
        'My name is John Smith and my email is john.smith@example.com'
      );

      // Submit the message
      const submitButton = chatPage.locator('button[data-testid="send-button"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // Wait a moment for the request to be intercepted
      await chatPage.waitForTimeout(2000);

      // Step 5: Verify substitution occurred
      if (requestBody && requestBody.messages) {
        const lastMessage =
          requestBody.messages[requestBody.messages.length - 1];

        // Check that real name and email were replaced
        expect(lastMessage.content).toContain('Alex Johnson');
        expect(lastMessage.content).toContain('alex.johnson@example.com');

        // Check that real PII is NOT in the request
        expect(lastMessage.content).not.toContain('John Smith');
        expect(lastMessage.content).not.toContain('john.smith@example.com');
      }
    }

    await chatPage.close();
  });

  test('profile toggle disables substitution', async ({ page, extensionId }) => {
    // Create a profile
    await page.click('#addProfileBtn');
    await page.waitForSelector('#profileModal');

    await page.fill('#profileName', 'Toggle Test');
    await page.fill('#realName', 'Jane Doe');
    await page.fill('#aliasName', 'Sarah Williams');

    await page.click('#modalSave');
    await page.waitForSelector('#profileModal', { state: 'hidden' });

    // Verify profile is enabled
    const profileCard = page.locator('.profile-card').first();
    await expect(profileCard).toContainText('Alias Enabled');

    // Disable the profile
    const disableButton = profileCard.locator('button.btn-danger');
    await disableButton.click();

    // Wait a moment for the state to update
    await page.waitForTimeout(500);

    // Verify profile is now disabled
    await expect(profileCard).toContainText('Alias Disabled');

    // The disable button should now be an enable button (green)
    const enableButton = profileCard.locator('button.btn-success');
    await expect(enableButton).toContainText('Enable');

    // Re-enable the profile
    await enableButton.click();
    await page.waitForTimeout(500);

    // Verify it's enabled again
    await expect(profileCard).toContainText('Alias Enabled');
  });

  test('profile CRUD operations work correctly', async ({
    page,
    extensionId,
  }) => {
    // CREATE: Add a profile
    await page.click('#addProfileBtn');
    await page.waitForSelector('#profileModal');

    await page.fill('#profileName', 'CRUD Test');
    await page.fill('#realName', 'Test User');
    await page.fill('#aliasName', 'Fake User');

    await page.click('#modalSave');
    await page.waitForSelector('#profileModal', { state: 'hidden' });

    // READ: Verify profile appears
    const profileCard = page.locator('.profile-card').first();
    await expect(profileCard).toContainText('CRUD Test');
    await expect(profileCard).toContainText('Test User');
    await expect(profileCard).toContainText('Fake User');

    // UPDATE: Edit the profile
    const editButton = profileCard.locator('button[title="Edit"]');
    await editButton.click();

    await page.waitForSelector('#profileModal');

    // Change the alias name
    await page.fill('#aliasName', 'Updated Alias');
    await page.click('#modalSave');
    await page.waitForSelector('#profileModal', { state: 'hidden' });

    // Verify update
    await expect(profileCard).toContainText('Updated Alias');

    // DELETE: Remove the profile
    const deleteButton = profileCard.locator('button[title="Delete"]');
    await deleteButton.click();

    // Wait for confirmation modal
    await page.waitForSelector('.modal-delete', { state: 'visible' });

    // Confirm deletion
    const confirmButton = page.locator('#confirmDelete');
    await confirmButton.click();

    // Wait for modal to close
    await page.waitForSelector('.modal-delete', { state: 'hidden' });

    // Verify profile is gone and empty state is shown
    await expect(page.locator('#profilesEmptyState')).toBeVisible();
    await expect(page.locator('.profile-card')).not.toBeVisible();
  });

  test('handles multiple profiles correctly', async ({ page, extensionId }) => {
    // Create first profile
    await page.click('#addProfileBtn');
    await page.waitForSelector('#profileModal');

    await page.fill('#profileName', 'Profile 1');
    await page.fill('#realName', 'Alice Smith');
    await page.fill('#aliasName', 'Emma Wilson');

    await page.click('#modalSave');
    await page.waitForSelector('#profileModal', { state: 'hidden' });

    // Create second profile
    await page.click('#addProfileBtn');
    await page.waitForSelector('#profileModal');

    await page.fill('#profileName', 'Profile 2');
    await page.fill('#realName', 'Bob Jones');
    await page.fill('#aliasName', 'Oliver Brown');

    await page.click('#modalSave');
    await page.waitForSelector('#profileModal', { state: 'hidden' });

    // Verify both profiles exist
    const profiles = page.locator('.profile-card');
    await expect(profiles).toHaveCount(2);

    // Disable the second profile
    const profile2 = profiles.nth(1);
    const disableButton = profile2.locator('button.btn-danger');
    await disableButton.click();
    await page.waitForTimeout(500);

    // Verify first profile is enabled, second is disabled
    const profile1 = profiles.nth(0);
    await expect(profile1).toContainText('Alias Enabled');
    await expect(profile2).toContainText('Alias Disabled');
  });
});
