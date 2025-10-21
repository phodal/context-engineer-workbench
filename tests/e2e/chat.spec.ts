import { test, expect } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workbench page
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should send a message and receive a response', async ({ page }) => {
    // Find the textarea input
    const messageInput = page.locator('textarea[placeholder*="Type your message here"]');
    await expect(messageInput).toBeVisible();

    // Type a test message
    const testMessage = 'Hello, this is a test message';
    await messageInput.fill(testMessage);

    // Find and click the send button
    const sendButton = page.locator('button[type="submit"]', { hasText: 'Send' });
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    
    // Click send button
    await sendButton.click();

    // Verify the input is cleared after sending
    await expect(messageInput).toHaveValue('');

    // Wait for the user message to appear in the chat
    const userMessage = page.locator('.bg-indigo-600', { hasText: testMessage });
    await expect(userMessage).toBeVisible({ timeout: 5000 });

    // Wait for the loading indicator to appear and then disappear
    const loadingIndicator = page.locator('.animate-bounce').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });

    // Wait for the assistant response to appear
    const assistantMessage = page.locator('.bg-gray-100').last();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });

    // Verify the assistant message contains some text
    const assistantText = await assistantMessage.textContent();
    expect(assistantText).toBeTruthy();
    expect(assistantText!.length).toBeGreaterThan(0);
  });

  test('should not send empty messages', async ({ page }) => {
    // Find the send button
    const sendButton = page.locator('button[type="submit"]', { hasText: 'Send' });
    
    // Button should be disabled when input is empty
    await expect(sendButton).toBeDisabled();

    // Try typing spaces only
    const messageInput = page.locator('textarea[placeholder*="Type your message here"]');
    await messageInput.fill('   ');
    
    // Button should still be disabled
    await expect(sendButton).toBeDisabled();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const messageInput = page.locator('textarea[placeholder*="Type your message here"]');
    await messageInput.fill('Test message via Enter key');

    // Press Enter (without Shift) to send
    await messageInput.press('Enter');

    // Verify the input is cleared
    await expect(messageInput).toHaveValue('');

    // Verify message appears
    const userMessage = page.locator('.bg-indigo-600', { hasText: 'Test message via Enter key' });
    await expect(userMessage).toBeVisible({ timeout: 5000 });
  });

  test('should allow multiline input with Shift+Enter', async ({ page }) => {
    const messageInput = page.locator('textarea[placeholder*="Type your message here"]');
    
    // Type first line
    await messageInput.fill('First line');
    
    // Press Shift+Enter to add new line
    await messageInput.press('Shift+Enter');
    
    // Type second line
    await messageInput.type('Second line');
    
    // Verify the textarea contains both lines
    const inputValue = await messageInput.inputValue();
    expect(inputValue).toContain('First line\nSecond line');
  });

  test('should display error messages when API fails', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/chat', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test error' })
      });
    });

    const messageInput = page.locator('textarea[placeholder*="Type your message here"]');
    await messageInput.fill('This should trigger an error');

    const sendButton = page.locator('button[type="submit"]', { hasText: 'Send' });
    await sendButton.click();

    // Wait for error message to appear
    const errorMessage = page.locator('.text-red-600');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should show character count', async ({ page }) => {
    const messageInput = page.locator('textarea[placeholder*="Type your message here"]');
    const characterCount = page.locator('text=/\\d+ characters/');

    // Initially should show 0 characters
    await expect(characterCount).toHaveText('0 characters');

    // Type some text
    await messageInput.fill('Hello');
    
    // Should show 5 characters
    await expect(characterCount).toHaveText('5 characters');
  });
});
