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
import { generatePlaywrightConfig, generatePackageJson, generateTsConfig, generateGiteaWorkflow } from './generators/configGenerator';
import { GeneratorOptions } from './types';

// ─── CLI ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const laravelPath = args[0];
  const outputDir   = args[1] ?? './playwright-tests';

  // ── Parse options ──────────────────────────────────────────────
  const baseUrl          = getFlag(args, '--base-url')          ?? 'http://localhost:8000';
  const email            = getFlag(args, '--email')             ?? 'playwright@example.com';
  const password         = getFlag(args, '--password')          ?? 'playwright';
  const userName         = getFlag(args, '--user-name')         ?? 'Test User';

  // Gitea options
  const giteaServerUrl   = getFlag(args, '--gitea-server-url')  ?? 'http://gitea:3000';
  const giteaAppHost     = getFlag(args, '--gitea-app-host')    ?? 'host.docker.internal:8000';
  const giteaImage       = getFlag(args, '--gitea-image')       ?? 'mcr.microsoft.com/playwright:v1.58.2-jammy';
  const giteaBranch      = getFlag(args, '--gitea-branch')      ?? 'main';
  const giteaCacheVol    = getFlag(args, '--gitea-cache-vol')   ?? 'playwright-npm-cache';
  const giteaReportVol   = getFlag(args, '--gitea-report-vol')  ?? 'playwright-report';
  const skipWorkflow     = args.includes('--no-workflow');

  const opts: GeneratorOptions = {
    outputDir,
    language: 'id',
    baseUrl,
    testUser: { email, password, name: userName },
    gitea: {
      enabled: !skipWorkflow,
      serverUrl: giteaServerUrl,
      appHost:   giteaAppHost,
      playwrightImage: giteaImage,
      branch:    giteaBranch,
      npmCacheVolume: giteaCacheVol,
      reportVolume:   giteaReportVol,
    },
  };

  console.log('\n🔍  Menganalisis project Laravel...');
  console.log(`    Path  : ${path.resolve(laravelPath)}`);
  console.log(`    Output: ${path.resolve(outputDir)}\n`);

  // ── Analyze ────────────────────────────────────────────────────
  let analysis;
  try {
    analysis = analyzeProject(laravelPath);
  } catch (err: any) {
    console.error(`❌  Error: ${err.message}`);
    process.exit(1);
  }

  analysis.testUser = opts.testUser;
  analysis.baseUrl  = opts.baseUrl;

  // ── Print summary ──────────────────────────────────────────────
  console.log(`📊  Hasil analisis:`);
  console.log(`    Resources : ${analysis.resources.length} (${analysis.resources.map(r => r.name).join(', ')})`);
  console.log(`    Auth      : ${analysis.hasAuth    ? '✓' : '✗'}`);
  console.log(`    Profile   : ${analysis.hasProfile ? '✓' : '✗'}`);
  console.log('');

  for (const r of analysis.resources) {
    const ops = [r.hasIndex && 'index', r.hasCreate && 'create', r.hasEdit && 'edit', r.hasDelete && 'delete']
      .filter(Boolean).join(', ');
    console.log(`    ${r.name.padEnd(16)} fields: [${r.fields.map(f => f.name).join(', ')}]  ops: ${ops}`);
  }
  console.log('');

  // ── Create output directories ──────────────────────────────────
  const dirs = [
    outputDir,
    path.join(outputDir, 'fixtures'),
    path.join(outputDir, 'pages'),
    path.join(outputDir, 'tests'),
  ];
  if (opts.gitea.enabled) {
    dirs.push(path.join(outputDir, '.gitea', 'workflows'));
  }
  for (const d of dirs) {
    fs.mkdirSync(d, { recursive: true });
  }

  const written: string[] = [];

  function write(relPath: string, content: string) {
    const abs = path.join(outputDir, relPath);
    fs.writeFileSync(abs, content, 'utf-8');
    written.push(relPath);
  }

  // ── Config files ───────────────────────────────────────────────
  write('playwright.config.ts', generatePlaywrightConfig(opts));
  write('package.json',         generatePackageJson(opts));
  write('tsconfig.json',        generateTsConfig());

  // ── Gitea workflow ─────────────────────────────────────────────
  if (opts.gitea.enabled) {
    write('.gitea/workflows/playwright.yml', generateGiteaWorkflow(opts));
  }

  // ── Fixtures ───────────────────────────────────────────────────
  write('fixtures/test-data.ts', generateFixtures(analysis, opts));

  // ── Base Page ──────────────────────────────────────────────────
  write('pages/BasePage.ts', generateBasePage());

  // ── Auth Pages & Spec ──────────────────────────────────────────
  if (analysis.hasAuth) {
    const loginView    = analysis.authViews.find(v => v.path.includes('login'));
    const registerView = analysis.authViews.find(v => v.path.includes('register'));
    write('pages/LoginPage.ts',    generateLoginPage(loginView));
    write('pages/RegisterPage.ts', generateRegisterPage(registerView));
    write('pages/DashboardPage.ts',generateDashboardPage());
    write('tests/auth.spec.ts',    generateAuthSpec());
  }

  // ── Profile Page & Spec ────────────────────────────────────────
  if (analysis.hasProfile) {
    write('pages/ProfilePage.ts',  generateProfilePage());
    write('tests/profile.spec.ts', generateProfileSpec());
  }

  // ── Resource Pages & Specs ─────────────────────────────────────
  for (const resource of analysis.resources) {
    write(`pages/${resource.className}Page.ts`,  generateResourcePage(resource));
    write(`tests/${resource.name}.spec.ts`,       generateResourceSpec(resource));
  }

  // ── Print results ──────────────────────────────────────────────
  console.log('✅  File berhasil digenerate:\n');

  const groups: Record<string, string[]> = {
    'Workflow': [], 'Config': [], 'Fixtures': [], 'Pages': [], 'Tests': [],
  };
  for (const f of written) {
    if (f.startsWith('.gitea'))    groups['Workflow'].push(f);
    else if (f.startsWith('fixtures/')) groups['Fixtures'].push(f);
    else if (f.startsWith('pages/'))    groups['Pages'].push(f);
    else if (f.startsWith('tests/'))    groups['Tests'].push(f);
    else                                groups['Config'].push(f);
  }

  for (const [group, files] of Object.entries(groups)) {
    if (files.length === 0) continue;
    console.log(`  ${group}:`);
    for (const f of files) console.log(`    ✓ ${f}`);
  }

  console.log('');

  if (opts.gitea.enabled) {
    console.log('🚀  Gitea Actions workflow digenerate.');
    console.log(`    Push folder ini ke Gitea → workflow otomatis jalan di branch: ${opts.gitea.branch}`);
    console.log(`    Aplikasi Laravel harus berjalan di: http://${opts.gitea.appHost}`);
  }

  console.log('');
  console.log('📦  Langkah selanjutnya:');
  console.log(`    cd ${outputDir}`);
  console.log(`    npm install`);
  console.log(`    # Jalankan lokal:`);
  console.log(`    BASE_URL=${opts.baseUrl} npx playwright test`);
  console.log(`    # Atau push ke Gitea untuk CI otomatis:`);
  console.log(`    git init && git add . && git commit -m "feat: add playwright tests"`);
  console.log(`    git remote add origin <gitea-repo-url>`);
  console.log(`    git push -u origin ${opts.gitea.branch}`);
  console.log('');
  console.log(`    HTML report tersimpan di Docker volume: ${opts.gitea.reportVolume}`);
  console.log(`    Akses dari host: docker run --rm -v ${opts.gitea.reportVolume}:/report -p 9323:9323 node npx serve /report`);
  console.log('');
  console.log(`💡  User test: ${opts.testUser.email} / ${opts.testUser.password}`);
  console.log('');
}

// ── Helpers ───────────────────────────────────────────────────────

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function printHelp() {
  console.log(`
pw-generator — Generate Playwright tests + Gitea CI workflow dari source code Laravel

PENGGUNAAN:
  npx ts-node src/index.ts <laravel-path> [output-dir] [options]

ARGUMEN:
  laravel-path     Path ke project Laravel (wajib)
  output-dir       Direktori output (default: ./playwright-tests)

OPTIONS DASAR:
  --base-url       URL aplikasi untuk test lokal (default: http://localhost:8000)
  --email          Email user test (default: playwright@example.com)
  --password       Password user test (default: playwright)
  --user-name      Nama user test (default: Test User)

OPTIONS GITEA CI:
  --gitea-server-url   URL server Gitea (default: http://gitea:3000)
  --gitea-app-host     Host aplikasi Laravel di dalam Docker (default: host.docker.internal:8000)
  --gitea-image        Docker image Playwright (default: mcr.microsoft.com/playwright:v1.58.2-jammy)
  --gitea-branch       Branch yang memicu workflow (default: main)
  --gitea-cache-vol    Nama volume npm cache (default: playwright-npm-cache)
  --gitea-report-vol   Nama volume Docker untuk HTML report (default: playwright-report)
  --no-workflow        Jangan generate file .gitea/workflows/playwright.yml

  --help, -h       Tampilkan bantuan ini

CONTOH:
  # Generate dengan workflow Gitea default
  npx ts-node src/index.ts ./my-laravel-app ./pw-tests

  # Custom Gitea server dan app host
  npx ts-node src/index.ts ./app ./tests \\
    --gitea-server-url http://gitea.local:3000 \\
    --gitea-app-host 192.168.1.100:8000 \\
    --email admin@test.com --password secret

  # Tanpa Gitea workflow (hanya test files)
  npx ts-node src/index.ts ./app ./tests --no-workflow

OUTPUT:
  .gitea/workflows/playwright.yml   Workflow CI Gitea Actions
  playwright.config.ts              Konfigurasi Playwright
  package.json + tsconfig.json      Konfigurasi project
  fixtures/test-data.ts             Data test terpusat
  pages/BasePage.ts                 Base Page Object
  pages/LoginPage.ts                Page Object auth
  pages/<Resource>Page.ts           Page Object per resource
  tests/auth.spec.ts                Test suite auth
  tests/<resource>.spec.ts          Test suite per resource (7 grup)
`);
}

main();
