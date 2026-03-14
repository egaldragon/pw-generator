// tests/categories.spec.ts
// UI Functional Tests: Category CRUD

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CategoryPage } from '../pages/CategoryPage';
import { TEST_USER, CATEGORIES } from '../fixtures/test-data';

// Login sebelum setiap test
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);
  await page.waitForURL(/dashboard/);
});

// ─────────────────────────────────────────────
// GROUP 1: Halaman Index — Elemen UI
// ─────────────────────────────────────────────
test.describe('Category Index — Elemen UI', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    await categoryPage.gotoIndex();
  });

  test('harus menampilkan tabel daftar categories', async () => {
    await categoryPage.assertTableVisible();
  });

  test('harus menampilkan tombol tambah category', async () => {
    await categoryPage.assertCreateButtonVisible();
  });

  test('tabel harus memiliki kolom Name', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Name/i })).toBeVisible();
  });

  test('tabel harus memiliki kolom Actions', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Actions/i })).toBeVisible();
  });

});

// ─────────────────────────────────────────────
// GROUP 2: Halaman Create — Elemen UI
// ─────────────────────────────────────────────
test.describe('Category Create — Elemen UI', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    await categoryPage.gotoCreate();
  });

  test('harus menampilkan field Name', async () => {
    await categoryPage.assertNameInputVisible();
  });

  test('harus menampilkan tombol Save', async () => {
    await categoryPage.assertSubmitButtonVisible();
  });

  test('field Name harus bersifat required', async () => {
    await categoryPage.assertNameRequired();
  });

  test('tombol Submit harus bisa diklik', async () => {
    await expect(categoryPage.submitButton).toBeEnabled();
  });

  test('field Name harus kosong saat pertama dibuka', async () => {
    await expect(categoryPage.nameInput).toHaveValue('');
  });

});

// ─────────────────────────────────────────────
// GROUP 3: Create — Fungsionalitas
// ─────────────────────────────────────────────
test.describe('Category Create — Fungsionalitas', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
  });

  test('harus berhasil membuat category baru dengan data valid', async () => {
    const uniqueName = `Category-${Date.now()}`;
    await categoryPage.createCategory(uniqueName);
    await categoryPage.assertOnIndexPage();
    await categoryPage.assertCategoryExists(uniqueName);
  });

  test('harus menampilkan error jika field required dikosongkan', async () => {
    await categoryPage.gotoCreate();
    await categoryPage.clickSubmit();
    await categoryPage.assertOnCreatePage();
  });

  test('setelah berhasil dibuat harus redirect ke halaman index', async () => {
    await categoryPage.createCategory(`Category-${Date.now()}`);
    await categoryPage.assertOnIndexPage();
  });

  test('jumlah baris tabel harus bertambah setelah membuat category baru', async () => {
    await categoryPage.gotoIndex();
    const countBefore = await categoryPage.getRowCount();
    await categoryPage.createCategory(`Category-${Date.now()}`);
    await categoryPage.gotoIndex();
    const countAfter = await categoryPage.getRowCount();
    expect(countAfter).toBe(countBefore + 1);
  });

});

// ─────────────────────────────────────────────
// GROUP 4: Edit — Elemen UI
// ─────────────────────────────────────────────
test.describe('Category Edit — Elemen UI', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `UI-Edit-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await row.getByRole('link', { name: /edit/i }).click();
  });

  test('halaman edit harus menampilkan field Name', async () => {
    await categoryPage.assertNameInputVisible();
  });

  test('field Name harus terisi dengan nilai saat ini', async () => {
    await expect(categoryPage.nameInput).toHaveValue(testCategoryName);
  });

  test('harus menampilkan tombol Save', async () => {
    await categoryPage.assertSubmitButtonVisible();
  });

});

// ─────────────────────────────────────────────
// GROUP 5: Edit — Fungsionalitas
// ─────────────────────────────────────────────
test.describe('Category Edit — Fungsionalitas', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `Func-Edit-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
  });

  test('harus berhasil memperbarui category', async () => {
    const updatedName = `Updated-${Date.now()}`;
    await categoryPage.editCategoryByName(testCategoryName, updatedName);
    await categoryPage.assertOnIndexPage();
    await categoryPage.assertCategoryExists(updatedName);
  });

  test('harus menampilkan error jika field dikosongkan saat edit', async () => {
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await row.getByRole('link', { name: /edit/i }).click();
    await categoryPage.nameInput.clear();
    await categoryPage.clickSubmit();
    await expect(categoryPage.nameInput).toBeVisible();
  });

});

// ─────────────────────────────────────────────
// GROUP 6: Delete — Elemen UI
// ─────────────────────────────────────────────
test.describe('Category Delete — Elemen UI', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `UI-Delete-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
  });

  test('tombol Delete harus tersedia di baris category', async () => {
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('tombol Delete harus bisa diklik', async () => {
    const row = categoryPage.page.locator('table tbody tr').filter({ hasText: testCategoryName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

});

// ─────────────────────────────────────────────
// GROUP 7: Delete — Fungsionalitas
// ─────────────────────────────────────────────
test.describe('Category Delete — Fungsionalitas', () => {
  let categoryPage: CategoryPage;
  let testCategoryName: string;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    testCategoryName = `Func-Delete-${Date.now()}`;
    await categoryPage.createCategory(testCategoryName);
    await categoryPage.assertOnIndexPage();
  });

  test('harus berhasil menghapus category setelah menyetujui konfirmasi', async () => {
    const countBefore = await categoryPage.getRowCount();
    await categoryPage.deleteCategoryByName(testCategoryName);
    await categoryPage.assertCategoryNotExists(testCategoryName);
    const countAfter = await categoryPage.getRowCount();
    expect(countAfter).toBe(countBefore - 1);
  });

});