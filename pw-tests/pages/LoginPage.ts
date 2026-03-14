// pages/LoginPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput         = page.getByLabel('Email');
    this.passwordInput      = page.getByLabel('Password');
    this.rememberMeCheckbox = page.getByLabel('Remember Me');
    this.submitButton       = page.getByRole('button', { name: /log in/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot/i });
    this.registerLink       = page.getByRole('link', { name: /register/i });
  }

  // ── Actions ──────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.check();
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnLoginPage(): Promise<void> {
    await this.assertURL(/\/login/);
    await expect(this.submitButton).toBeVisible();
  }

  async assertEmailFieldVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
  }

  async assertPasswordFieldVisible(): Promise<void> {
    await expect(this.passwordInput).toBeVisible();
  }

  async assertRememberMeVisible(): Promise<void> {
    await expect(this.rememberMeCheckbox).toBeVisible();
  }

  async assertForgotPasswordLinkVisible(): Promise<void> {
    await expect(this.forgotPasswordLink).toBeVisible();
  }

  async assertRegisterLinkVisible(): Promise<void> {
    await expect(this.registerLink).toBeVisible();
  }

  async assertEmailInputType(): Promise<void> {
    await expect(this.emailInput).toHaveAttribute('type', 'email');
  }

  async assertPasswordInputType(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  async assertSubmitButtonEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  async assertEmailRequired(): Promise<void> {
    await expect(this.emailInput).toHaveAttribute('required');
  }

  async assertPasswordRequired(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('required');
  }
}
