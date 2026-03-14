// tests/posts.spec.ts
// UI Functional Tests: Post CRUD

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PostPage } from '../pages/PostPage';
import { CategoriePage } from '../pages/CategoriePage';
import { TEST_USER, POSTS, CATEGORIES } from '../fixtures/test-data';

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
test.describe('Post Index — Elemen UI', () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    await postPage.gotoIndex();
  });

  test('harus menampilkan tabel daftar posts', async () => {
    await postPage.assertTableVisible();
  });

  test('harus menampilkan tombol tambah post', async () => {
    await postPage.assertCreateButtonVisible();
  });

  test('tabel harus memiliki kolom Title', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Title/i })).toBeVisible();
  });

  test('tabel harus memiliki kolom Category', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Category/i })).toBeVisible();
  });

  test('tabel harus memiliki kolom Actions', async ({ page }) => {
    await expect(page.locator('table th').filter({ hasText: /Actions/i })).toBeVisible();
  });

});

// ─────────────────────────────────────────────
// GROUP 2: Halaman Create — Elemen UI
// ─────────────────────────────────────────────
test.describe('Post Create — Elemen UI', () => {
  let postPage: PostPage;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    await postPage.gotoCreate();
  });

  test('harus menampilkan field Title', async () => {
    await postPage.assertTitleInputVisible();
  });

  test('harus menampilkan field Text', async () => {
    await postPage.assertTextInputVisible();
  });

  test('harus menampilkan tombol Save', async () => {
    await postPage.assertSubmitButtonVisible();
  });

  test('field Title harus bersifat required', async () => {
    await postPage.assertTitleRequired();
  });

  test('tombol Submit harus bisa diklik', async () => {
    await expect(postPage.submitButton).toBeEnabled();
  });

  test('field Title harus kosong saat pertama dibuka', async () => {
    await expect(postPage.titleInput).toHaveValue('');
  });

});

// ─────────────────────────────────────────────
// GROUP 3: Create — Fungsionalitas
// ─────────────────────────────────────────────
test.describe('Post Create — Fungsionalitas', () => {
  let postPage: PostPage;
  let categoriePage: CategoriePage;
  let testCategorieName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    categoriePage = new CategoriePage(page);
    testCategorieName = `Categorie-${Date.now()}`;
    await categoriePage.createCategorie(testCategorieName);
  });

  test('harus berhasil membuat post baru dengan data valid', async () => {
    const uniqueTitle = `Post-${Date.now()}`;
    await postPage.createPost(uniqueTitle, `Post-${Date.now()}`, testCategorieName);
    await postPage.assertOnIndexPage();
    await postPage.assertPostExists(uniqueTitle);
  });

  test('harus menampilkan error jika field required dikosongkan', async () => {
    await postPage.gotoCreate();
    await postPage.clickSubmit();
    await postPage.assertOnCreatePage();
  });

  test('setelah berhasil dibuat harus redirect ke halaman index', async () => {
    await postPage.createPost(`Post-${Date.now()}`, `Post-${Date.now()}`, testCategorieName);
    await postPage.assertOnIndexPage();
  });

  test('jumlah baris tabel harus bertambah setelah membuat post baru', async () => {
    await postPage.gotoIndex();
    const countBefore = await postPage.getRowCount();
    await postPage.createPost(`Post-${Date.now()}`, `Post-${Date.now()}`, testCategorieName);
    await postPage.gotoIndex();
    const countAfter = await postPage.getRowCount();
    expect(countAfter).toBe(countBefore + 1);
  });

});

// ─────────────────────────────────────────────
// GROUP 4: Edit — Elemen UI
// ─────────────────────────────────────────────
test.describe('Post Edit — Elemen UI', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `UI-Edit-${Date.now()}`;
    const categoriePage = new CategoriePage(page);
    const relCategorieName = `Categorie-${Date.now()}`;
    await categoriePage.createCategorie(relCategorieName);
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategorieName);
    await postPage.assertOnIndexPage();
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await row.getByRole('link', { name: /edit/i }).click();
  });

  test('halaman edit harus menampilkan field Title', async () => {
    await postPage.assertTitleInputVisible();
  });

  test('halaman edit harus menampilkan field Text', async () => {
    await postPage.assertTextInputVisible();
  });

  test('field Title harus terisi dengan nilai saat ini', async () => {
    await expect(postPage.titleInput).toHaveValue(testPostName);
  });

  test('harus menampilkan tombol Save', async () => {
    await postPage.assertSubmitButtonVisible();
  });

});

// ─────────────────────────────────────────────
// GROUP 5: Edit — Fungsionalitas
// ─────────────────────────────────────────────
test.describe('Post Edit — Fungsionalitas', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `Func-Edit-${Date.now()}`;
    const categoriePage = new CategoriePage(page);
    const relCategorieName = `Categorie-${Date.now()}`;
    await categoriePage.createCategorie(relCategorieName);
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategorieName);
    await postPage.assertOnIndexPage();
  });

  test('harus berhasil memperbarui post', async () => {
    const updatedTitle = `Updated-${Date.now()}`;
    await postPage.editPostByName(testPostName, updatedTitle, 'updated text');
    await postPage.assertOnIndexPage();
    await postPage.assertPostExists(updatedTitle);
  });

  test('harus menampilkan error jika field dikosongkan saat edit', async () => {
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await row.getByRole('link', { name: /edit/i }).click();
    await postPage.titleInput.clear();
    await postPage.clickSubmit();
    await expect(postPage.titleInput).toBeVisible();
  });

});

// ─────────────────────────────────────────────
// GROUP 6: Delete — Elemen UI
// ─────────────────────────────────────────────
test.describe('Post Delete — Elemen UI', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `UI-Delete-${Date.now()}`;
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategorieName);
    await postPage.assertOnIndexPage();
  });

  test('tombol Delete harus tersedia di baris post', async () => {
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('tombol Delete harus bisa diklik', async () => {
    const row = postPage.page.locator('table tbody tr').filter({ hasText: testPostName });
    await expect(row.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

});

// ─────────────────────────────────────────────
// GROUP 7: Delete — Fungsionalitas
// ─────────────────────────────────────────────
test.describe('Post Delete — Fungsionalitas', () => {
  let postPage: PostPage;
  let testPostName: string;

  test.beforeEach(async ({ page }) => {
    postPage = new PostPage(page);
    testPostName = `Func-Delete-${Date.now()}`;
    await postPage.createPost(testPostName, `text-${Date.now()}`, relCategorieName);
    await postPage.assertOnIndexPage();
  });

  test('harus berhasil menghapus post setelah menyetujui konfirmasi', async () => {
    const countBefore = await postPage.getRowCount();
    await postPage.deletePostByName(testPostName);
    await postPage.assertPostNotExists(testPostName);
    const countAfter = await postPage.getRowCount();
    expect(countAfter).toBe(countBefore - 1);
  });

});