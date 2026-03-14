// ─── BasePage Generator ───────────────────────────────────────────

export function generateBasePage(): string {
  return `// pages/BasePage.ts
// Base class yang diwarisi oleh semua Page Object

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async waitForURL(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }

  // ── URL Assertions ───────────────────────────────────────────

  async assertURL(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expected);
  }

  async assertURLContains(path: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  // ── Text Assertions ──────────────────────────────────────────

  async assertTextVisible(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async assertTextNotVisible(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text)).not.toBeVisible();
  }

  async assertPageTitle(title: string): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  // ── Element Helpers ──────────────────────────────────────────

  async assertErrorMessage(message: string): Promise<void> {
    const errorLocator = this.page.locator('.text-red-600, .text-red-500, [class*="error"], .alert-danger');
    await expect(errorLocator.filter({ hasText: message })).toBeVisible();
  }

  async assertSuccessMessage(message: string): Promise<void> {
    const successLocator = this.page.locator(
      '.text-green-600, .text-green-500, [class*="success"], [role="status"]'
    );
    await expect(successLocator.filter({ hasText: message })).toBeVisible();
  }

  // ── Wait Helpers ─────────────────────────────────────────────

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}
`;
}
