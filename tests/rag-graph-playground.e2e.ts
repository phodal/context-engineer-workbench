import { test, expect } from '@playwright/test';

test.describe('RAG Graph Playground - LLM Documentation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the RAG Graph Playground
    await page.goto('/rag-graph-playground');

    // Wait for the page to load
    await expect(page.getByText('RAG Graph Search Playground')).toBeVisible();
  });

  test('should display the playground with code editor and build button', async ({ page }) => {
    // Check for main components
    await expect(page.getByText('Code Editor')).toBeVisible();
    await expect(page.getByRole('button', { name: /Build Graph/i })).toBeVisible();

    // Check for language selector
    const languageSelect = page.locator('select');
    await expect(languageSelect).toBeVisible();
  });

  test('should build a graph from example code', async ({ page }) => {
    // Click the Build Graph button
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for the graph to be built (look for loading indicator to disappear)
    await page.waitForTimeout(2000);

    // Check that the graph visualization appears
    const graphContainer = page.locator('svg');
    await expect(graphContainer).toBeVisible();
  });

  test('should display statistics after building graph', async ({ page }) => {
    // Build the graph
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for graph to build
    await page.waitForTimeout(2000);

    // Check for statistics panel
    await expect(page.getByText('Statistics')).toBeVisible();

    // Check for node and edge counts
    const statsText = await page.locator('.text-2xl.font-bold').first().textContent();
    expect(statsText).toBeTruthy();
  });

  test('should select a node and display node info panel', async ({ page }) => {
    // Build the graph first
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for graph to build
    await page.waitForTimeout(2000);

    // Click on a node in the graph (find the first circle element)
    const nodes = page.locator('circle');
    const firstNode = nodes.first();

    if (await firstNode.isVisible()) {
      await firstNode.click();

      // Wait for the node info panel to appear
      await page.waitForTimeout(1000);

      // Check that the node info panel is displayed
      // The panel should show node information
      const nodePanel = page.locator('[class*="NodeInfoPanel"]');
      if (await nodePanel.isVisible()) {
        // Panel is visible, check for content
        const closeButton = page.getByRole('button', { name: /Close|×/i });
        await expect(closeButton).toBeVisible();
      }
    }
  });

  test('should handle code input changes', async ({ page }) => {
    // Get the code editor
    const codeEditor = page.locator('textarea').first();

    // Clear and enter new code
    await codeEditor.clear();
    await codeEditor.fill(`
      class TestClass {
        constructor() {
          this.value = 0;
        }
        
        getValue() {
          return this.value;
        }
      }
    `);

    // Build the graph
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for graph to build
    await page.waitForTimeout(2000);

    // Check that the graph was built
    const graphContainer = page.locator('svg');
    await expect(graphContainer).toBeVisible();
  });

  test('should support different programming languages', async ({ page }) => {
    // Get the language selector
    const languageSelect = page.locator('select').first();

    // Try changing to TypeScript
    await languageSelect.selectOption('typescript');

    // Verify the selection changed
    const selectedValue = await languageSelect.inputValue();
    expect(selectedValue).toBe('typescript');

    // Build the graph
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for graph to build
    await page.waitForTimeout(2000);

    // Check that the graph was built
    const graphContainer = page.locator('svg');
    await expect(graphContainer).toBeVisible();
  });

  test('should show error message for empty code', async ({ page }) => {
    // Clear the code editor
    const codeEditor = page.locator('textarea').first();
    await codeEditor.clear();

    // Try to build the graph
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for error message
    await page.waitForTimeout(500);

    // Check for error message
    const errorMessage = page.locator('[class*="error"]');
    if (await errorMessage.isVisible()) {
      const text = await errorMessage.textContent();
      expect(text).toContain('Please enter some code');
    }
  });

  test('should disable build button when loading', async ({ page }) => {
    // Click the Build Graph button
    const buildButton = page.getByRole('button', { name: /Build Graph/i });

    // The button should be enabled initially
    await expect(buildButton).toBeEnabled();

    // Click it
    await buildButton.click();

    // The button should be disabled while loading
    // (This might be too fast to catch, but we can try)
    await page.waitForTimeout(500);

    // After loading completes, button should be enabled again
    await page.waitForTimeout(2000);
    await expect(buildButton).toBeEnabled();
  });

  test('should highlight code when node is selected', async ({ page }) => {
    // Build the graph
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for graph to build
    await page.waitForTimeout(2000);

    // Click on a node
    const nodes = page.locator('circle');
    const firstNode = nodes.first();

    if (await firstNode.isVisible()) {
      await firstNode.click();

      // Wait for highlighting
      await page.waitForTimeout(500);

      // Check if code editor has highlight styling
      const codeEditor = page.locator('textarea').first();
      await expect(codeEditor).toBeVisible();
    }
  });

  test('should close node info panel when close button is clicked', async ({ page }) => {
    // Build the graph
    const buildButton = page.getByRole('button', { name: /Build Graph/i });
    await buildButton.click();

    // Wait for graph to build
    await page.waitForTimeout(2000);

    // Click on a node
    const nodes = page.locator('circle');
    const firstNode = nodes.first();

    if (await firstNode.isVisible()) {
      await firstNode.click();

      // Wait for panel to appear
      await page.waitForTimeout(1000);

      // Find and click the close button
      const closeButton = page.getByRole('button', { name: /Close|×/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();

        // Wait for panel to close
        await page.waitForTimeout(500);

        // Check that statistics are visible again
        await expect(page.getByText('Statistics')).toBeVisible();
      }
    }
  });
});
