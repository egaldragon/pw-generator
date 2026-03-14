// pages/RegisterPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput            = page.getByLabel('Name');
    this.emailInput           = page.getByLabel('Email');
    this.passwordInput        = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password');
    this.submitButton         = page.getByRole('button', { name: /register/i });
    this.loginLink            = page.getByRole('link', { name: /already registered|login|sign in/i });
  }

  // ── Actions ──────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/register');
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async register(name: string, email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.fillName(name);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword ?? password);
    await this.clickSubmit();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnRegisterPage(): Promise<void> {
    await this.assertURL(/\/register/);
    await expect(this.submitButton).toBeVisible();
  }

  async assertNameFieldVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
  }

  async assertEmailFieldVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }

  async assertPasswordFieldVisible(): Promise<void> {
    await expect(this.passwordInput).toBeVisible();
  }

  async assertConfirmPasswordFieldVisible(): Promise<void> {
    await expect(this.confirmPasswordInput).toBeVisible();
  }

  async assertLoginLinkVisible(): Promise<void> {
    await expect(this.loginLink).toBeVisible();
  }

  async assertPasswordInputType(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async assertConfirmPasswordInputType(): Promise<void> {
    await expect(this.confirmPasswordInput).toHaveAttribute('type', 'password');
  }

  async assertErrorMessage(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
