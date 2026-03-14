#!/usr/bin/env node
// pw-generator — Static analysis tool to generate Playwright tests from Laravel source code

import * as fs from 'fs';
import * as path from 'path';
import { analyzeProject } from './analyzer';
import { generateFixtures } from './generators/fixturesGenerator';
import { generateBasePage } from './generators/basePageGenerator';
import { generateResourcePage } from './generators/pageObjectGenerator';
import { generateLoginPage, generateRegisterPage, generateDashboardPage, generateProfilePage } from './generators/authPageGenerator';
import { generateResourceSpec } from './generators/specGenerator';
import { generateAuthSpec } from './generators/authSpecGenerator';
import { generateProfileSpec } from './generators/profileSpecGenerator';
import { generatePlaywrightConfig, generatePackageJson, generateTsConfig } from './generators/configGenerator';
import { GeneratorOptions } from './types';

// ─── CLI ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const laravelPath = args[0];
  const outputDir = args[1] ?? './playwright-tests';

  // Parse options
  const baseUrl = getFlag(args, '--base-url') ?? 'http://localhost:8000';
  const email = getFlag(args, '--email') ?? 'playwright@example.com';
  const password = getFlag(args, '--password') ?? 'playwright';
  const userName = getFlag(args, '--user-name') ?? 'Test User';

  const opts: GeneratorOptions = {
    outputDir,
    language: 'id',
    baseUrl,
    testUser: { email, password, name: userName },
  };

  console.log('\n🔍  Menganalisis project Laravel...');
  console.log(`    Path  : ${path.resolve(laravelPath)}`);
  console.log(`    Output: ${path.resolve(outputDir)}\n`);

  // ── Analyze ──
  let analysis;
  try {
    analysis = analyzeProject(laravelPath);
  } catch (err: any) {
    console.error(`❌  Error: ${err.message}`);
    process.exit(1);
  }

  // Override test user from opts
  analysis.testUser = opts.testUser;
  analysis.baseUrl = opts.baseUrl;

  // ── Print summary ──
  console.log(`📊  Hasil analisis:`);
  console.log(`    Resources ditemukan : ${analysis.resources.length} (${analysis.resources.map(r => r.name).join(', ')})`);
  console.log(`    Auth views          : ${analysis.hasAuth ? '✓' : '✗'}`);
  console.log(`    Profile             : ${analysis.hasProfile ? '✓' : '✗'}`);
  console.log('');

  for (const r of analysis.resources) {
    const ops = [r.hasIndex && 'index', r.hasCreate && 'create', r.hasEdit && 'edit', r.hasDelete && 'delete']
      .filter(Boolean).join(', ');
    console.log(`    ${r.name.padEnd(16)} fields: [${r.fields.map(f => f.name).join(', ')}]  ops: ${ops}`);
  }
  console.log('');

  // ── Create output directories ──
  const dirs = [
    outputDir,
    path.join(outputDir, 'fixtures'),
    path.join(outputDir, 'pages'),
    path.join(outputDir, 'tests'),
  ];
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  const written: string[] = [];

  function write(relPath: string, content: string) {
    const abs = path.join(outputDir, relPath);
    fs.writeFileSync(abs, content, 'utf-8');
    written.push(relPath);
  }

  // ── Config files ──
  write('playwright.config.ts', generatePlaywrightConfig(opts));
  write('package.json', generatePackageJson(opts));
  write('tsconfig.json', generateTsConfig());

  // ── Fixtures ──
  write('fixtures/test-data.ts', generateFixtures(analysis, opts));

  // ── Base Page ──
  write('pages/BasePage.ts', generateBasePage());

  // ── Auth Pages ──
  if (analysis.hasAuth) {
    const loginView = analysis.authViews.find(v => v.path.includes('login'));
    const registerView = analysis.authViews.find(v => v.path.includes('register'));

    write('pages/LoginPage.ts', generateLoginPage(loginView));
    write('pages/RegisterPage.ts', generateRegisterPage(registerView));
    write('pages/DashboardPage.ts', generateDashboardPage());
    write('tests/auth.spec.ts', generateAuthSpec());
  }

  // Profile Page & Spec
  if (analysis.hasProfile) {
    write('pages/ProfilePage.ts', generateProfilePage());
    write('tests/profile.spec.ts', generateProfileSpec());
  }

  // ── Resource Pages & Specs ──
  for (const resource of analysis.resources) {
    const pageName = `${resource.className}Page`;
    write(`pages/${pageName}.ts`, generateResourcePage(resource));
    write(`tests/${resource.name}.spec.ts`, generateResourceSpec(resource));
  }

  // ── Print results ──
  console.log('✅  File berhasil digenerate:\n');

  const groups: Record<string, string[]> = { 'Config': [], 'Fixtures': [], 'Pages': [], 'Tests': [] };
  for (const f of written) {
    if (f.startsWith('fixtures/')) groups['Fixtures'].push(f);
    else if (f.startsWith('pages/')) groups['Pages'].push(f);
    else if (f.startsWith('tests/')) groups['Tests'].push(f);
    else groups['Config'].push(f);
  }

  for (const [group, files] of Object.entries(groups)) {
    if (files.length === 0) continue;
    console.log(`  ${group}:`);
    for (const f of files) {
      console.log(`    ✓ ${f}`);
    }
  }

  console.log('');
  console.log('📦  Langkah selanjutnya:');
  console.log(`    cd ${outputDir}`);
  console.log(`    npm install`);
  console.log(`    npx playwright install chromium`);
  console.log(`    npm test`);
  console.log('');
  console.log(`💡  Pastikan Laravel berjalan di ${opts.baseUrl}`);
  console.log(`    dan user test sudah dibuat:`);
  console.log(`    email   : ${opts.testUser.email}`);
  console.log(`    password: ${opts.testUser.password}`);
  console.log('');
}

// ── Helpers ───────────────────────────────────────────────────────

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function printHelp() {
  console.log(`
pw-generator — Generate Playwright tests dari source code Laravel

PENGGUNAAN:
  npx ts-node src/index.ts <laravel-path> [output-dir] [options]

ARGUMEN:
  laravel-path   Path ke project Laravel (wajib)
  output-dir     Direktori output untuk test yang digenerate (default: ./playwright-tests)

OPTIONS:
  --base-url     URL base aplikasi (default: http://localhost:8000)
  --email        Email user test (default: playwright@example.com)
  --password     Password user test (default: playwright)
  --user-name    Nama user test (default: Test User)
  --help, -h     Tampilkan bantuan ini

CONTOH:
  npx ts-node src/index.ts ./my-laravel-app ./tests
  npx ts-node src/index.ts ./app ./pw-tests --base-url http://localhost:8080 --email admin@test.com --password secret

YANG DIGENERATE:
  playwright.config.ts         Konfigurasi Playwright
  package.json + tsconfig.json Konfigurasi project
  fixtures/test-data.ts        Data test terpusat
  pages/BasePage.ts            Base class Page Object
  pages/LoginPage.ts           Page Object untuk login
  pages/RegisterPage.ts        Page Object untuk register
  pages/DashboardPage.ts       Page Object untuk dashboard
  pages/<Resource>Page.ts      Page Object per resource (CRUD)
  tests/auth.spec.ts           Test suite autentikasi
  tests/<resource>.spec.ts     Test suite per resource (CRUD)
`);
}

main();
