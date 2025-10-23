import { test, expect } from '@playwright/test';

test.describe('Navigation System', () => {
  test('should display main navigation on all pages', async ({ page }) => {
    // Test main page
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('Context Engineer Workbench')).toBeVisible();

    // Test navigation items are present
    await expect(page.getByText('Workbench')).toBeVisible();
    await expect(page.getByText('Keyword Search')).toBeVisible();
    await expect(page.getByText('Vector Search')).toBeVisible();
    await expect(page.getByText('Graph Search')).toBeVisible();
    await expect(page.getByText('TreeSitter')).toBeVisible();
  });

  test('should navigate between pages correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to Keyword Search
    await page.getByText('Keyword Search').click();
    await expect(page).toHaveURL('/rag-keyword-playground');
    await expect(page.getByText('RAG Keyword Search Playground')).toBeVisible();

    // Navigate to Vector Search
    await page.getByText('Vector Search').click();
    await expect(page).toHaveURL('/rag-vector-playground');
    await expect(page.getByText('RAG Vector Search Playground')).toBeVisible();

    // Navigate back to home
    await page.getByText('Workbench').click();
    await expect(page).toHaveURL('/');
  });

  test('should show breadcrumbs on playground pages', async ({ page }) => {
    await page.goto('/rag-keyword-playground');

    // Check breadcrumbs are present
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Keyword Search')).toBeVisible();

    // Test breadcrumb navigation
    await page.getByText('Home').click();
    await expect(page).toHaveURL('/');
  });

  test('should display page headers with flow descriptions', async ({ page }) => {
    await page.goto('/rag-keyword-playground');

    await expect(page.getByText('RAG Keyword Search Playground')).toBeVisible();
    await expect(
      page.getByText('Learn how keyword-based retrieval works in RAG systems')
    ).toBeVisible();
    await expect(
      page.getByText('Flow: Query → Rewrite → Keyword Search → BM25 Scoring → Results')
    ).toBeVisible();
  });

  test('should show quick navigation search', async ({ page }) => {
    await page.goto('/');

    // Look for search button or trigger
    const searchButton = page.getByText('Search');
    if (await searchButton.isVisible()) {
      await searchButton.click();
      // Quick navigation modal should appear
      await expect(page.getByPlaceholder('Search pages...')).toBeVisible();
    }
  });

  test('should have responsive navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Navigation should still be functional on mobile
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('Context Engineer Workbench')).toBeVisible();
  });

  test('should show active state for current page', async ({ page }) => {
    await page.goto('/rag-keyword-playground');

    // The Keyword Search navigation item should have active styling
    const keywordSearchLink = page.getByText('Keyword Search');
    await expect(keywordSearchLink).toBeVisible();

    // Check if it has active state classes (this might need adjustment based on actual implementation)
    const linkElement = await keywordSearchLink.locator('..').first();
    const classes = await linkElement.getAttribute('class');
    expect(classes).toContain('bg-indigo-100'); // Active state class
  });
});

test.describe('Layout System', () => {
  test('should use correct layout for workbench page', async ({ page }) => {
    await page.goto('/');

    // Workbench should have sidebar
    await expect(page.getByText('Configuration Center')).toBeVisible();
    await expect(page.getByText('Context Assembly View')).toBeVisible();
    await expect(page.getByText('Chat & Interaction')).toBeVisible();
  });

  test('should use correct layout for playground pages', async ({ page }) => {
    await page.goto('/rag-keyword-playground');

    // Playground pages should have standard layout with page header
    await expect(page.getByText('RAG Keyword Search Playground')).toBeVisible();
    await expect(page.getByText('Pipeline & Papers')).toBeVisible();
  });
});
