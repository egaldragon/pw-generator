# pw-generator

Tool CLI untuk generate Playwright test secara otomatis dari source code Laravel, tanpa AI.

## Cara Kerja

Tool ini melakukan **analisis statis** terhadap 4 sumber di project Laravel:

| Sumber Laravel | Yang Dibaca |
|---|---|
| `routes/web.php` | Resource routes, middleware (auth), URL patterns |
| `resources/views/*.blade.php` | Label field, tipe input, teks tombol, kolom tabel |
| `app/Http/Controllers/*.php` | Method CRUD yang tersedia |
| `database/migrations/*.php` | Field yang required/nullable, foreign key |

## Instalasi

```bash
cd pw-generator
npm install
```

## Penggunaan

```bash
npx ts-node src/index.ts <laravel-path> [output-dir] [options]
```

### Argumen

| Argumen | Deskripsi | Default |
|---|---|---|
| `laravel-path` | Path ke project Laravel **(wajib)** | - |
| `output-dir` | Direktori output | `./playwright-tests` |
| `--base-url` | URL base aplikasi | `http://localhost:8000` |
| `--email` | Email user test | `playwright@example.com` |
| `--password` | Password user test | `playwright` |
| `--user-name` | Nama user test | `Test User` |

### Contoh

```bash
# Minimal
npx ts-node src/index.ts ./my-laravel-app

# Lengkap
npx ts-node src/index.ts ./my-laravel-app ./pw-tests \
  --base-url http://localhost:8080 \
  --email admin@test.com \
  --password secret123
```

## Output yang Digenerate

```
playwright-tests/
├── playwright.config.ts        ← Konfigurasi Playwright
├── package.json
├── tsconfig.json
├── fixtures/
│   └── test-data.ts            ← Data test terpusat (user, routes, data entitas)
├── pages/
│   ├── BasePage.ts             ← Base class (navigate, assert URL/text/error)
│   ├── LoginPage.ts            ← Page Object login (auto dari login.blade.php)
│   ├── RegisterPage.ts         ← Page Object register
│   ├── DashboardPage.ts        ← Page Object dashboard
│   └── <Resource>Page.ts       ← 1 Page Object per resource CRUD
└── tests/
    ├── auth.spec.ts             ← Test suite auth (login, register, validasi)
    └── <resource>.spec.ts       ← 7 grup test per resource (lihat di bawah)
```

### Struktur Test per Resource

Setiap resource menghasilkan **7 grup test**:

1. **Index — Elemen UI** — tabel tampil, tombol create ada, kolom tabel
2. **Create — Elemen UI** — field form tampil, required, tombol save
3. **Create — Fungsionalitas** — berhasil simpan, redirect, row bertambah, validasi error
4. **Edit — Elemen UI** — field tampil, terisi nilai lama, tombol save
5. **Edit — Fungsionalitas** — berhasil update, error jika dikosongkan
6. **Delete — Elemen UI** — tombol delete tersedia dan bisa diklik
7. **Delete — Fungsionalitas** — berhasil hapus, row berkurang

### Deteksi Relasi Otomatis

Jika resource `posts` memiliki field `category_id`, tool otomatis:
- Mendeteksi relasi ke resource `categories`
- Menambahkan import `CategoryPage` di `posts.spec.ts`
- Men-setup kategori terlebih dahulu di `beforeEach` sebelum membuat post

## Langkah Setelah Generate

```bash
cd playwright-tests
npm install
npx playwright install chromium

# Buat user test di Laravel:
php artisan tinker
User::create(['name'=>'Test User','email'=>'playwright@example.com','password'=>bcrypt('playwright'),'is_admin'=>true]);

# Jalankan test
npm test
```

## Arsitektur Tool

```
src/
├── index.ts               ← CLI entry point
├── analyzer.ts            ← Koordinator analisis
├── types.ts               ← TypeScript interfaces
├── parsers/
│   ├── bladeParser.ts     ← Parse Blade views → form fields, table columns
│   ├── routeParser.ts     ← Parse web.php → routes, middleware
│   └── migrationParser.ts ← Parse migrations → field types, nullable
└── generators/
    ├── fixturesGenerator.ts   ← Generate test-data.ts
    ├── basePageGenerator.ts   ← Generate BasePage.ts
    ├── pageObjectGenerator.ts ← Generate <Resource>Page.ts
    ├── authPageGenerator.ts   ← Generate LoginPage, RegisterPage, DashboardPage
    ├── specGenerator.ts       ← Generate <resource>.spec.ts
    ├── authSpecGenerator.ts   ← Generate auth.spec.ts
    └── configGenerator.ts     ← Generate playwright.config.ts, package.json
```
