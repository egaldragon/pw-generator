// pages/CategoryPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CategoryPage extends BasePage {
  // ── Locators — Index ─────────────────────────────────────────
  readonly createButton: Locator;
  readonly categoriesTable: Locator;
  readonly tableRows: Locator;

  // ── Locators — Form ─────────────────────────────────────────
  readonly nameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    // Index page
    this.createButton  = page.getByRole('link', { name: /create|add/i });
    this.categoriesTable   = page.locator('table');
    this.tableRows     = page.locator('table tbody tr');

    // Form
    this.nameInput            = page.getByLabel('Name');
    this.submitButton       = page.getByRole('button', { name: /save|create|submit/i });
  }

  // ── Actions ──────────────────────────────────────────────────

  async gotoIndex(): Promise<void> {
    await this.navigate('/categories');
  }

  async gotoCreate(): Promise<void> {
    await this.navigate('/categories/create');
  }

  async fillName(value: string): Promise<void> {
    await this.nameInput.fill(value);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async createCategory(name: string): Promise<void> {
    await this.gotoCreate();
    await this.fillName(name);
    await this.clickSubmit();
  }

  async editCategoryByName(currentName: string, name: string): Promise<void> {
    const row = this.page.locator('table tbody tr').filter({ hasText: currentName });
    await row.getByRole('link', { name: /edit/i }).click();
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.clickSubmit();
  }

  async deleteCategoryByName(name: string): Promise<void> {
    const row = this.page.locator('table tbody tr').filter({ hasText: name });
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await row.getByRole('button', { name: /delete/i }).click();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnIndexPage(): Promise<void> {
    await this.assertURLContains('categories');
    await expect(this.categoriesTable).toBeVisible();
  }

  async assertOnCreatePage(): Promise<void> {
    await this.assertURLContains('categories/create');
    await expect(this.nameInput).toBeVisible();
  }

  async assertCategoryExists(value: string): Promise<void> {
    await expect(this.page.locator('table').getByText(value)).toBeVisible();
  }

  async assertCategoryNotExists(value: string): Promise<void> {
    await expect(this.page.locator('table').getByText(value)).not.toBeVisible();
  }

  async assertTableVisible(): Promise<void> {
    await expect(this.categoriesTable).toBeVisible();
  }

  async assertCreateButtonVisible(): Promise<void> {
    await expect(this.createButton).toBeVisible();
  }

  async assertNameInputVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
  }

  async assertNameRequired(): Promise<void> {
    await expect(this.nameInput).toHaveAttribute('required');
  }

  async assertSubmitButtonVisible(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }
}