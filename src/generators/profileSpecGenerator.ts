// ─── Profile Spec Generator ───────────────────────────────────────

export function generateProfileSpec(): string {
  return `// tests/profile.spec.ts
// UI Functional Tests: Profile Page

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { TEST_USER } from '../fixtures/test-data';

// Login sebelum setiap test
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  await page.waitForURL(/dashboard/);
});

// ─────────────────────────────────────────────
// GROUP 1: Halaman Profile — Elemen UI
// ─────────────────────────────────────────────
test.describe('Profile Page — Elemen UI', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('harus menampilkan field Name', async () => {
    await expect(profilePage.nameInput).toBeVisible();
  });

  test('harus menampilkan field Email', async () => {
    await expect(profilePage.emailInput).toBeVisible();
  });

  test('harus menampilkan tombol Save untuk profil', async () => {
    await expect(profilePage.saveProfileButton).toBeVisible();
  });

  test('field Name harus bersifat required', async () => {
    await profilePage.assertNameRequired();
  });

  test('field Email harus bertipe email', async () => {
    await profilePage.assertEmailInputType();
  });

  test('harus menampilkan field Current Password di section update password', async () => {
    await profilePage.assertCurrentPasswordVisible();
  });

  test('field Current Password harus bertipe password', async () => {
    await profilePage.assertPasswordInputType();
  });

  test('harus menampilkan tombol Delete Account', async () => {
    await profilePage.assertDeleteAccountButtonVisible();
  });

  test('harus menampilkan nilai Name sesuai data user yang login', async () => {
    await profilePage.assertNameValue(TEST_USER.name);
  });

  test('harus menampilkan nilai Email sesuai data user yang login', async () => {
    await profilePage.assertEmailValue(TEST_USER.email);
  });
});

// ─────────────────────────────────────────────
// GROUP 2: Update Informasi Profil
// ─────────────────────────────────────────────
test.describe('Profile Page — Update Informasi', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('harus berhasil menyimpan nama baru', async () => {
    await profilePage.updateName('Updated Name');
    await profilePage.assertSavedSuccessfully();
  });

  test('harus memperbarui nilai field Name setelah disimpan', async () => {
    const newName = 'Name After Update';
    await profilePage.updateName(newName);
    await profilePage.assertNameValue(newName);
  });

  test('harus menampilkan error jika Name dikosongkan', async () => {
    await profilePage.updateName('');
    await profilePage.assertOnProfilePage();
  });

  test('harus menampilkan error jika Email diisi format tidak valid', async () => {
    await profilePage.updateEmail('bukan-email');
    await profilePage.assertOnProfilePage();
  });

  test('tombol Save harus bisa diklik', async () => {
    await expect(profilePage.saveProfileButton).toBeEnabled();
  });

  test.afterAll(async ({ browser }) => {
    // Reset nama dan email user kembali ke data awal agar test suite lain tidak gagal
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    const pPage = new ProfilePage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await pPage.goto();
    await pPage.updateProfile(TEST_USER.name, TEST_USER.email);
    await context.close();
  });
});

// ─────────────────────────────────────────────
// GROUP 3: Update Password
// ─────────────────────────────────────────────
test.describe('Profile Page — Update Password', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('harus menampilkan field New Password', async () => {
    await expect(profilePage.newPasswordInput).toBeVisible();
  });

  test('harus menampilkan field Confirm Password', async () => {
    await expect(profilePage.confirmNewPasswordInput).toBeVisible();
  });

  test('field New Password harus bertipe password', async () => {
    await expect(profilePage.newPasswordInput).toHaveAttribute('type', 'password');
  });

  test('harus menampilkan error jika password baru tidak cocok', async () => {
    await profilePage.updatePassword(TEST_USER.password, 'NewPassword123!', 'BedaPassword456!');
    await profilePage.assertOnProfilePage();
    await profilePage.assertErrorMessage('The password field confirmation does not match.');
  });

  test('harus menampilkan error jika Current Password salah', async () => {
    await profilePage.updatePassword('passwordsalah', 'NewPassword123!', 'NewPassword123!');
    await profilePage.assertOnProfilePage();
    await profilePage.assertErrorMessage('The password is incorrect.');
  });

  test('tombol Save untuk update password harus bisa diklik', async () => {
    await expect(profilePage.savePasswordButton).toBeEnabled();
  });
});
`;
}
