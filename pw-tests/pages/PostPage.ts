// pages/PostPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PostPage extends BasePage {
  // ── Locators — Index ─────────────────────────────────────────
  readonly createButton: Locator;
  readonly postsTable: Locator;
  readonly tableRows: Locator;

  // ── Locators — Form ─────────────────────────────────────────
  readonly titleInput: Locator;
  readonly textInput: Locator;
  readonly categorySelect: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    // Index page
    this.createButton  = page.getByRole('link', { name: /create|add/i });
    this.postsTable   = page.locator('table');
    this.tableRows     = page.locator('table tbody tr');

    // Form
    this.titleInput           = page.getByLabel('Title');
    this.textInput            = page.getByLabel('Text');
    this.categorySelect       = page.getByLabel('Category');
    this.submitButton       = page.getByRole('button', { name: /save|create|submit/i });
  }

  // ── Actions ──────────────────────────────────────────────────

  async gotoIndex(): Promise<void> {
    await this.navigate('/posts');
  }

  async gotoCreate(): Promise<void> {
    await this.navigate('/posts/create');
  }

  async fillTitle(value: string): Promise<void> {
    await this.titleInput.fill(value);
  }

  async fillText(value: string): Promise<void> {
    await this.textInput.fill(value);
  }

  async fillCategoryId(value: string): Promise<void> {
    await this.categorySelect.selectOption({ label: value });
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async createPost(title: string, text: string, categoryId?: string): Promise<void> {
    await this.gotoCreate();
    await this.fillTitle(title);
    await this.fillText(text);
    if (categoryId) await this.fillCategoryId(categoryId);
    await this.clickSubmit();
  }

  async editPostByName(currentTitle: string, title: string, text: string): Promise<void> {
    const row = this.page.locator('table tbody tr').filter({ hasText: currentTitle });
    await row.getByRole('link', { name: /edit/i }).click();
    await this.titleInput.clear();
    await this.titleInput.fill(title);
    await this.textInput.clear();
    await this.textInput.fill(text);
    await this.clickSubmit();
  }

  async deletePostByName(name: string): Promise<void> {
    const row = this.page.locator('table tbody tr').filter({ hasText: name });
    this.page.once('dialog', async dialog => {
      await dialog.accept();
    });
    await row.getByRole('button', { name: /delete/i }).click();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnIndexPage(): Promise<void> {
    await this.assertURLContains('posts');
    await expect(this.postsTable).toBeVisible();
  }

  async assertOnCreatePage(): Promise<void> {
    await this.assertURLContains('posts/create');
    await expect(this.titleInput).toBeVisible();
  }

  async assertPostExists(value: string): Promise<void> {
    await expect(this.page.locator('table').getByText(value)).toBeVisible();
  }

  async assertPostNotExists(value: string): Promise<void> {
    await expect(this.page.locator('table').getByText(value)).not.toBeVisible();
  }

  async assertTableVisible(): Promise<void> {
    await expect(this.postsTable).toBeVisible();
  }

  async assertCreateButtonVisible(): Promise<void> {
    await expect(this.createButton).toBeVisible();
  }

  async assertTitleInputVisible(): Promise<void> {
    await expect(this.titleInput).toBeVisible();
  }

  async assertTitleRequired(): Promise<void> {
    await expect(this.titleInput).toHaveAttribute('required');
  }

  async assertTextInputVisible(): Promise<void> {
    await expect(this.textInput).toBeVisible();
  }

  async assertSubmitButtonVisible(): Promise<void> {
    await expect(this.submitButton).toBeVisible();
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }
}