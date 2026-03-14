// pages/DashboardPage.ts

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────
  readonly heading: Locator;
  readonly logoutButton: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading      = this.page.getByRole('heading', { name: /dashboard/i });
    this.logoutButton = this.page.getByRole('button', { name: /log out|logout/i });
    this.profileLink  = this.page.getByRole('link', { name: /profile/i });
  }

  // ── Actions ──────────────────────────────────────────────────

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async gotoProfile(): Promise<void> {
    await this.profileLink.click();
  }

  // ── Assertions ───────────────────────────────────────────────

  async assertOnDashboard(): Promise<void> {
    await this.assertURL(/\/dashboard/);
  }

  async assertWelcomeTextVisible(): Promise<void> {
    await expect(this.page.getByText(/you're logged in|welcome/i)).toBeVisible();
  }

  async assertLogoutButtonVisible(): Promise<void> {
    await expect(this.logoutButton).toBeVisible();
  }

  async assertProfileLinkVisible(): Promise<void> {
    await expect(this.profileLink).toBeVisible();
  }
}
