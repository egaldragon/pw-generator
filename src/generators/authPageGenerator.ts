import { ParsedView } from '../types';

// ─── Auth Page Generators ─────────────────────────────────────────

export function generateLoginPage(loginView?: ParsedView): string {
  const emailLabel = loginView?.fields.find(f => f.name === 'email')?.label ?? 'Email';
  const passwordLabel = loginView?.fields.find(f => f.name === 'password')?.label ?? 'Password';
  const rememberLabel = loginView?.fields.find(f => f.name === 'remember' || f.name === 'remember_me')?.label ?? 'Remember me';

  return `// pages/LoginPage.ts

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
    this.emailInput         = page.getByLabel('${emailLabel}');
    this.passwordInput      = page.getByLabel('${passwordLabel}');
    this.rememberMeCheckbox = page.getByLabel('${rememberLabel}');
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
    await this.assertURL(/\\/login/);
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
`;
}

export function generateRegisterPage(registerView?: ParsedView): string {
  const nameLabel = registerView?.fields.find(f => f.name === 'name')?.label ?? 'Name';
  const emailLabel = registerView?.fields.find(f => f.name === 'email')?.label ?? 'Email';
  const passwordLabel = registerView?.fields.find(f => f.name === 'password')?.label ?? 'Password';
  const confirmLabel = registerView?.fields.find(
    f => f.name === 'password_confirmation' || f.name === 'password_confirm'
  )?.label ?? 'Confirm Password';

  return `// pages/RegisterPage.ts

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
    this.nameInput            = page.getByLabel('${nameLabel}');
    this.emailInput           = page.getByLabel('${emailLabel}');
    this.passwordInput        = page.getByLabel('${passwordLabel}', { exact: true });
    this.confirmPasswordInput = page.getByLabel('${confirmLabel}');
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
    await this.assertURL(/\\/register/);
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
`;
}

// FIX: Breeze navbar - Logout & Profile are inside a dropdown (<a> tags, hidden by default).
// Must click the dropdown trigger (user name button) first to reveal them.
export function generateDashboardPage(): string {
  return `// pages/DashboardPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────
  readonly heading: Locator;
  // Logout and Profile are inside the user dropdown — not directly visible
  readonly navDropdownTrigger: Locator;
  readonly logoutLink: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading            = this.page.getByRole('heading', { name: /dashboard/i });
    // The trigger is the button showing the user name in the top-right nav
    this.navDropdownTrigger = this.page.locator('nav button').filter({ hasText: /./i }).first();
    // These links live inside the dropdown (hidden until trigger is clicked)
    this.logoutLink         = this.page.getByRole('link', { name: /log out/i });
    this.profileLink        = this.page.getByRole('link', { name: /^profile$/i });
  }

  // ── Actions ──────────────────────────────────────────────────

  async openNavDropdown(): Promise<void> {
    await this.navDropdownTrigger.click();
  }

  async logout(): Promise<void> {
    await this.openNavDropdown();
    await this.logoutLink.click();
  }

  async gotoProfile(): Promise<void> {
    await this.openNavDropdown();
    await this.profileLink.click();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnDashboard(): Promise<void> {
    await this.assertURL(/\\/dashboard/);
  }

  async assertWelcomeTextVisible(): Promise<void> {
    await expect(this.page.getByText(/you're logged in|welcome/i)).toBeVisible();
  }

  async assertLogoutLinkVisible(): Promise<void> {
    await this.openNavDropdown();
    await expect(this.logoutLink).toBeVisible();
  }

  async assertProfileLinkVisible(): Promise<void> {
    await this.openNavDropdown();
    await expect(this.profileLink).toBeVisible();
  }
}
`;
}

// FIX: Generate ProfilePage from Breeze's profile views (3 sections: info, password, delete)
export function generateProfilePage(): string {
  return `// pages/ProfilePage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  // ── Locators — Profile Information ───────────────────────────
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly saveProfileButton: Locator;

  // ── Locators — Update Password ────────────────────────────────
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmNewPasswordInput: Locator;
  readonly savePasswordButton: Locator;

  // ── Locators — Delete Account ─────────────────────────────────
  readonly deleteAccountButton: Locator;
  readonly deletePasswordInput: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    super(page);
    // Profile information section
    this.nameInput         = page.getByLabel('Name');
    this.emailInput        = page.getByLabel('Email');
    this.saveProfileButton = page.getByRole('button', { name: 'Save' }).first();

    // Update password section — labels share the same page, use IDs to distinguish
    this.currentPasswordInput    = page.getByLabel('Current Password');
    this.newPasswordInput        = page.getByLabel('New Password');
    this.confirmNewPasswordInput = page.getByLabel('Confirm Password');
    this.savePasswordButton      = page.getByRole('button', { name: 'Save' }).nth(1);

    // Delete account section
    this.deleteAccountButton = page.getByRole('button', { name: /delete account/i });
    this.deletePasswordInput = page.locator('dialog input[type="password"], [x-show] input[type="password"]');
    this.confirmDeleteButton = page.locator('dialog button.bg-red-600, [x-show] button[type="submit"]');
  }

  // ── Actions ──────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/profile');
  }

  async updateName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.saveProfileButton.click();
  }

  async updateEmail(email: string): Promise<void> {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.saveProfileButton.click();
  }

  async updateProfile(name: string, email: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    await this.saveProfileButton.click();
  }

  async updatePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmNewPasswordInput.fill(confirmPassword);
    await this.savePasswordButton.click();
  }

  async deleteAccount(password: string): Promise<void> {
    await this.deleteAccountButton.click();
    await this.deletePasswordInput.fill(password);
    await this.confirmDeleteButton.click();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnProfilePage(): Promise<void> {
    await this.assertURLContains('profile');
    await expect(this.nameInput).toBeVisible();
  }

  async assertNameValue(name: string): Promise<void> {
    await expect(this.nameInput).toHaveValue(name);
  }

  async assertEmailValue(email: string): Promise<void> {
    await expect(this.emailInput).toHaveValue(email);
  }

  async assertSavedSuccessfully(): Promise<void> {
    await expect(this.page.getByText('Saved.')).toBeVisible();
  }

  async assertCurrentPasswordVisible(): Promise<void> {
    await expect(this.currentPasswordInput).toBeVisible();
  }

  async assertDeleteAccountButtonVisible(): Promise<void> {
    await expect(this.deleteAccountButton).toBeVisible();
  }

  async assertNameRequired(): Promise<void> {
    await expect(this.nameInput).toHaveAttribute('required');
  }

  async assertEmailInputType(): Promise<void> {
    await expect(this.emailInput).toHaveAttribute('type', 'email');
  }

  async assertPasswordInputType(): Promise<void> {
    await expect(this.currentPasswordInput).toHaveAttribute('type', 'password');
  }
}
`;
}
