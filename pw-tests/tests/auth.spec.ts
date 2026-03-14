// tests/auth.spec.ts
// UI Functional Tests: Authentication (Login, Register, Logout)

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TEST_USER } from '../fixtures/test-data';

// ─────────────────────────────────────────────
// GROUP 1: Halaman Login — Elemen UI
// ─────────────────────────────────────────────
test.describe('Login Page — Elemen UI', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('harus menampilkan field Email', async () => {
    await loginPage.assertEmailFieldVisible();
  });

  test('harus menampilkan field Password', async () => {
    await loginPage.assertPasswordFieldVisible();
  });

  test('harus menampilkan tombol "Log in"', async () => {
    await loginPage.assertSubmitButtonEnabled();
  });

  test('harus menampilkan link "Forgot your password?"', async () => {
    await loginPage.assertForgotPasswordLinkVisible();
  });

  test('harus menampilkan checkbox "Remember me"', async () => {
    await loginPage.assertRememberMeVisible();
  });

  test('field Email harus bertipe email', async () => {
    await loginPage.assertEmailInputType();
  });

  test('field Password harus bertipe password', async () => {
    await loginPage.assertPasswordInputType();
  });

  test('field Email harus bersifat required', async () => {
    await loginPage.assertEmailRequired();
  });

  test('field Password harus bersifat required', async () => {
    await loginPage.assertPasswordRequired();
  });
});

// ─────────────────────────────────────────────
// GROUP 2: Halaman Login — Validasi Input
// ─────────────────────────────────────────────
test.describe('Login Page — Validasi Input', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('harus menampilkan pesan error jika email tidak valid', async () => {
    await loginPage.fillEmail('bukan-email-valid');
    await loginPage.fillPassword('password123');
    await loginPage.clickSubmit();
    await loginPage.assertOnLoginPage();
  });

  test('harus menampilkan error jika kredensial salah', async () => {
    await loginPage.login('salah@email.com', 'passwordsalah');
    await loginPage.assertOnLoginPage();
    await loginPage.assertErrorMessage('These credentials do not match our records.');
  });

  test('harus menampilkan error jika email kosong dan submit diklik', async () => {
    await loginPage.fillPassword('password123');
    await loginPage.clickSubmit();
    await loginPage.assertOnLoginPage();
  });

  test('harus menampilkan error jika password kosong dan submit diklik', async () => {
    await loginPage.fillEmail(TEST_USER.email);
    await loginPage.clickSubmit();
    await loginPage.assertOnLoginPage();
  });

  test('harus tetap di halaman login jika form kosong disubmit', async () => {
    await loginPage.clickSubmit();
    await loginPage.assertOnLoginPage();
  });
});

// ─────────────────────────────────────────────
// GROUP 3: Halaman Register — Elemen UI
// ─────────────────────────────────────────────
test.describe('Register Page — Elemen UI', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('harus menampilkan field Name', async () => {
    await registerPage.assertNameFieldVisible();
  });

  test('harus menampilkan field Email', async () => {
    await registerPage.assertEmailFieldVisible();
  });

  test('harus menampilkan field Password', async () => {
    await registerPage.assertPasswordFieldVisible();
  });

  test('harus menampilkan field Confirm Password', async () => {
    await registerPage.assertConfirmPasswordFieldVisible();
  });

  test('harus menampilkan tombol "Register"', async ({ page }) => {
    await expect(registerPage.submitButton).toBeVisible();
  });

  test('harus menampilkan link ke halaman Login', async () => {
    await registerPage.assertLoginLinkVisible();
  });

  test('field Password harus bertipe password', async () => {
    await registerPage.assertPasswordInputType();
  });

  test('field Confirm Password harus bertipe password', async () => {
    await registerPage.assertConfirmPasswordInputType();
  });
});

// ─────────────────────────────────────────────
// GROUP 4: Register — Validasi Input
// ─────────────────────────────────────────────
test.describe('Register Page — Validasi Input', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('harus menampilkan error jika password tidak cocok dengan konfirmasi', async () => {
    await registerPage.register('Test User', 'test@example.com', 'Password123!', 'PasswordBeda!');
    await registerPage.assertOnRegisterPage();
    await registerPage.assertErrorMessage('The password field confirmation does not match.');
  });

  test('harus tetap di halaman register jika form kosong disubmit', async () => {
    await registerPage.clickSubmit();
    await registerPage.assertOnRegisterPage();
  });

  test('harus menampilkan error jika email tidak valid', async ({ page }) => {
    await registerPage.fillName('Test User');
    await registerPage.fillEmail('bukan-email');
    await registerPage.fillPassword('Password123!');
    await registerPage.fillConfirmPassword('Password123!');
    await registerPage.clickSubmit();
    await registerPage.assertOnRegisterPage();
  });

  test('harus menampilkan error jika password terlalu pendek', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelectorAll('input').forEach(el => el.removeAttribute('minlength'));
    });
    await registerPage.register('Test User', 'test@example.com', '123', '123');
    await registerPage.assertOnRegisterPage();
    await registerPage.assertErrorMessage('The password field must be at least 8 characters.');
  });
});

// ─────────────────────────────────────────────
// GROUP 5: Dashboard — Elemen UI (setelah login)
// ─────────────────────────────────────────────
test.describe('Dashboard — Elemen UI', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await dashboardPage.assertOnDashboard();
  });

  test('harus menampilkan heading "Dashboard"', async () => {
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('harus menampilkan teks selamat datang', async () => {
    await dashboardPage.assertWelcomeTextVisible();
  });

  test('harus menampilkan tombol Logout', async () => {
    await dashboardPage.assertLogoutButtonVisible();
  });

  test('harus menampilkan link Profile', async () => {
    await dashboardPage.assertProfileLinkVisible();
  });
});

// ─────────────────────────────────────────────
// GROUP 6: Navigasi Auth
// ─────────────────────────────────────────────
test.describe('Navigasi Auth', () => {

  test('link Login di halaman Register harus mengarah ke /login', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    await registerPage.goto();
    await registerPage.loginLink.click();
    await loginPage.assertOnLoginPage();
  });

  test('akses /dashboard tanpa login harus redirect ke /login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.goto('/dashboard');
    await loginPage.assertOnLoginPage();
  });
});
