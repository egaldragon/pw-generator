import { ResourceGroup, FormField } from '../types';
import { camelCase, capitalize } from './pageObjectGenerator';

// ─── Resource Spec Generator ──────────────────────────────────────

export function generateResourceSpec(resource: ResourceGroup): string {
  const { name, singular, className, fields, hasCreate, hasEdit, hasDelete, relations } = resource;
  const pageName = `${className}Page`;
  const constName = name.toUpperCase();

  const textFields = fields.filter(f => f.type !== 'select' && !f.name.endsWith('_id'));
  const primaryField = textFields[0];
  const primaryConst = primaryField ? `${constName}.valid.${primaryField.name}` : `'test'`;
  const primaryLabel = primaryField?.label ?? 'Name';

  // Related resource imports
  const relatedImports = relations.map(r => {
    const relClass = capitalize(r.relatedResource.replace(/s$/, ''));
    return `import { ${relClass}Page } from '../pages/${relClass}Page';`;
  });

  const lines: string[] = [];

  lines.push(`// tests/${name}.spec.ts`);
  lines.push(`// UI Functional Tests: ${className} CRUD`);
  lines.push(``);
  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push(`import { LoginPage } from '../pages/LoginPage';`);
  lines.push(`import { ${pageName} } from '../pages/${pageName}';`);

  if (relatedImports.length > 0) {
    lines.push(...relatedImports);
  }

  // Build import list for fixtures
  const fixtureImports = [`TEST_USER`, constName];
  if (relations.length > 0) {
    const relConsts = relations.map(r => r.relatedResource.toUpperCase());
    fixtureImports.push(...relConsts);
  }

  lines.push(`import { ${fixtureImports.join(', ')} } from '../fixtures/test-data';`);
  lines.push(``);
  lines.push(`// Login sebelum setiap test`);
  lines.push(`test.beforeEach(async ({ page }) => {`);
  lines.push(`  const loginPage = new LoginPage(page);`);
  lines.push(`  await loginPage.goto();`);
  lines.push(`  await loginPage.login(TEST_USER.email, TEST_USER.password);`);
  lines.push(`  await page.waitForURL(/dashboard/);`);
  lines.push(`});`);
  lines.push(``);

  // ── GROUP 1: Index UI ──
  lines.push(`// ─────────────────────────────────────────────`);
  lines.push(`// GROUP 1: Halaman Index — Elemen UI`);
  lines.push(`// ─────────────────────────────────────────────`);
  lines.push(`test.describe('${className} Index — Elemen UI', () => {`);
  lines.push(`  let ${singular}Page: ${pageName};`);
  lines.push(``);
  lines.push(`  test.beforeEach(async ({ page }) => {`);
  lines.push(`    ${singular}Page = new ${pageName}(page);`);
  lines.push(`    await ${singular}Page.gotoIndex();`);
  lines.push(`  });`);
  lines.push(``);
  lines.push(`  test('harus menampilkan tabel daftar ${name}', async () => {`);
  lines.push(`    await ${singular}Page.assertTableVisible();`);
  lines.push(`  });`);
  lines.push(``);

  if (hasCreate) {
    lines.push(`  test('harus menampilkan tombol tambah ${singular}', async () => {`);
    lines.push(`    await ${singular}Page.assertCreateButtonVisible();`);
    lines.push(`  });`);
    lines.push(``);
  }

  // Table column tests
  const indexView = resource.views.find(v => v.viewType === 'index');
  if (indexView && indexView.tableColumns.length > 0) {
    for (const col of indexView.tableColumns) {
      if (!col.trim()) continue;
      lines.push(`  test('tabel harus memiliki kolom ${col}', async ({ page }) => {`);
      lines.push(`    await expect(page.locator('table th').filter({ hasText: /${col}/i })).toBeVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }
  }

  lines.push(`});`);
  lines.push(``);

  // ── GROUP 2: Create UI ──
  if (hasCreate) {
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 2: Halaman Create — Elemen UI`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Create — Elemen UI', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);
    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);
    lines.push(`    await ${singular}Page.gotoCreate();`);
    lines.push(`  });`);
    lines.push(``);

    for (const f of textFields) {
      lines.push(`  test('harus menampilkan field ${f.label.replace(/:$/, '')}', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name))}InputVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`  test('harus menampilkan tombol Save', async () => {`);
    lines.push(`    await ${singular}Page.assertSubmitButtonVisible();`);
    lines.push(`  });`);
    lines.push(``);

    const requiredFields = textFields.filter(f => f.required);
    for (const f of requiredFields) {
      lines.push(`  test('field ${f.label.replace(/:$/, '')} harus bersifat required', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name))}Required();`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`  test('tombol Submit harus bisa diklik', async () => {`);
    lines.push(`    await expect(${singular}Page.submitButton).toBeEnabled();`);
    lines.push(`  });`);
    lines.push(``);

    if (primaryField) {
      lines.push(`  test('field ${primaryField.label.replace(/:$/, '')} harus kosong saat pertama dibuka', async () => {`);
      lines.push(`    await expect(${singular}Page.${camelCase(primaryField.name)}Input).toHaveValue('');`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`});`);
    lines.push(``);

    // ── GROUP 3: Create Functionality ──
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 3: Create — Fungsionalitas`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Create — Fungsionalitas', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);

    // Setup related resource if needed
    if (relations.length > 0) {
      for (const rel of relations) {
        const relSingular = rel.relatedResource.replace(/s$/, '');
        const relClass = capitalize(relSingular);
        lines.push(`  let ${relSingular}Page: ${relClass}Page;`);
        lines.push(`  let test${relClass}Name: string;`);
      }
    }

    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);

    // Create related resources first
    if (relations.length > 0) {
      for (const rel of relations) {
        const relSingular = rel.relatedResource.replace(/s$/, '');
        const relClass = capitalize(relSingular);
        lines.push(`    ${relSingular}Page = new ${relClass}Page(page);`);
        lines.push(`    test${relClass}Name = \`${relClass}-\${Date.now()}\`;`);
        lines.push(`    await ${relSingular}Page.create${relClass}(test${relClass}Name);`);
      }
    }

    lines.push(`  });`);
    lines.push(``);

    // Build create call
    const createCallArgs = buildSpecCreateArgs(fields, relations, singular);

    lines.push(`  test('harus berhasil membuat ${singular} baru dengan data valid', async () => {`);
    if (primaryField) {
      lines.push(`    const unique${capitalize(camelCase(primaryField.name))} = \`${capitalize(singular)}-\${Date.now()}\`;`);
    }
    lines.push(`    await ${singular}Page.create${className}(${createCallArgs('unique')});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    if (primaryField) {
      lines.push(`    await ${singular}Page.assert${className}Exists(unique${capitalize(camelCase(primaryField.name))});`);
    }
    lines.push(`  });`);
    lines.push(``);

    lines.push(`  test('harus menampilkan error jika field required dikosongkan', async () => {`);
    lines.push(`    await ${singular}Page.gotoCreate();`);
    lines.push(`    await ${singular}Page.clickSubmit();`);
    lines.push(`    await ${singular}Page.assertOnCreatePage();`);
    lines.push(`  });`);
    lines.push(``);

    lines.push(`  test('setelah berhasil dibuat harus redirect ke halaman index', async () => {`);
    if (primaryField) {
      lines.push(`    await ${singular}Page.create${className}(${createCallArgs('redirect')});`);
    }
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`  });`);
    lines.push(``);

    lines.push(`  test('jumlah baris tabel harus bertambah setelah membuat ${singular} baru', async () => {`);
    lines.push(`    await ${singular}Page.gotoIndex();`);
    lines.push(`    const countBefore = await ${singular}Page.getRowCount();`);
    lines.push(`    await ${singular}Page.create${className}(${createCallArgs('count')});`);
    lines.push(`    await ${singular}Page.gotoIndex();`);
    lines.push(`    const countAfter = await ${singular}Page.getRowCount();`);
    lines.push(`    expect(countAfter).toBe(countBefore + 1);`);
    lines.push(`  });`);
    lines.push(``);

    lines.push(`});`);
    lines.push(``);
  }

  // ── GROUP 4: Edit UI ──
  if (hasEdit && primaryField) {
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 4: Edit — Elemen UI`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Edit — Elemen UI', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);
    lines.push(`  let test${className}Name: string;`);
    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);
    lines.push(`    test${className}Name = \`UI-Edit-\${Date.now()}\`;`);

    if (relations.length > 0) {
      for (const rel of relations) {
        const relSingular = rel.relatedResource.replace(/s$/, '');
        const relClass = capitalize(relSingular);
        lines.push(`    const ${relSingular}Page = new ${relClass}Page(page);`);
        lines.push(`    const rel${relClass}Name = \`${relClass}-\${Date.now()}\`;`);
        lines.push(`    await ${relSingular}Page.create${relClass}(rel${relClass}Name);`);
      }
    }

    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, singular)});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`    const row = ${singular}Page.page.locator('table tbody tr').filter({ hasText: test${className}Name });`);
    lines.push(`    await row.getByRole('link', { name: /edit/i }).click();`);
    lines.push(`  });`);
    lines.push(``);

    for (const f of textFields) {
      lines.push(`  test('halaman edit harus menampilkan field ${f.label.replace(/:$/, '')}', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name))}InputVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }

    if (primaryField) {
      lines.push(`  test('field ${primaryField.label.replace(/:$/, '')} harus terisi dengan nilai saat ini', async () => {`);
      lines.push(`    await expect(${singular}Page.${camelCase(primaryField.name)}Input).toHaveValue(test${className}Name);`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`  test('harus menampilkan tombol Save', async () => {`);
    lines.push(`    await ${singular}Page.assertSubmitButtonVisible();`);
    lines.push(`  });`);
    lines.push(``);

    lines.push(`});`);
    lines.push(``);

    // ── GROUP 5: Edit Functionality ──
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 5: Edit — Fungsionalitas`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Edit — Fungsionalitas', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);
    lines.push(`  let test${className}Name: string;`);
    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);
    lines.push(`    test${className}Name = \`Func-Edit-\${Date.now()}\`;`);

    if (relations.length > 0) {
      for (const rel of relations) {
        const relSingular = rel.relatedResource.replace(/s$/, '');
        const relClass = capitalize(relSingular);
        lines.push(`    const ${relSingular}Page = new ${relClass}Page(page);`);
        lines.push(`    const rel${relClass}Name = \`${relClass}-\${Date.now()}\`;`);
        lines.push(`    await ${relSingular}Page.create${relClass}(rel${relClass}Name);`);
      }
    }

    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, singular)});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`  });`);
    lines.push(``);

    const editArgs = textFields.map(f => `\`Updated-\${Date.now()}\``).join(', ');
    lines.push(`  test('harus berhasil memperbarui ${singular}', async () => {`);
    lines.push(`    const updated${capitalize(camelCase(primaryField.name))} = \`Updated-\${Date.now()}\`;`);
    lines.push(`    await ${singular}Page.edit${className}ByName(test${className}Name, ${textFields.map((f, i) => i === 0 ? `updated${capitalize(camelCase(f.name))}` : `'updated text'`).join(', ')});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`    await ${singular}Page.assert${className}Exists(updated${capitalize(camelCase(primaryField.name))});`);
    lines.push(`  });`);
    lines.push(``);

    lines.push(`  test('harus menampilkan error jika field dikosongkan saat edit', async () => {`);
    lines.push(`    const row = ${singular}Page.page.locator('table tbody tr').filter({ hasText: test${className}Name });`);
    lines.push(`    await row.getByRole('link', { name: /edit/i }).click();`);
    lines.push(`    await ${singular}Page.${camelCase(primaryField.name)}Input.clear();`);
    lines.push(`    await ${singular}Page.clickSubmit();`);
    lines.push(`    await expect(${singular}Page.${camelCase(primaryField.name)}Input).toBeVisible();`);
    lines.push(`  });`);
    lines.push(``);

    lines.push(`});`);
    lines.push(``);
  }

  // ── GROUP 6: Delete UI ──
  if (hasDelete && primaryField) {
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 6: Delete — Elemen UI`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Delete — Elemen UI', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);
    lines.push(`  let test${className}Name: string;`);
    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);
    lines.push(`    test${className}Name = \`UI-Delete-\${Date.now()}\`;`);
    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, singular)});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`  test('tombol Delete harus tersedia di baris ${singular}', async () => {`);
    lines.push(`    const row = ${singular}Page.page.locator('table tbody tr').filter({ hasText: test${className}Name });`);
    lines.push(`    await expect(row.getByRole('button', { name: /delete/i })).toBeVisible();`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`  test('tombol Delete harus bisa diklik', async () => {`);
    lines.push(`    const row = ${singular}Page.page.locator('table tbody tr').filter({ hasText: test${className}Name });`);
    lines.push(`    await expect(row.getByRole('button', { name: /delete/i })).toBeEnabled();`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`});`);
    lines.push(``);

    // ── GROUP 7: Delete Functionality ──
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 7: Delete — Fungsionalitas`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Delete — Fungsionalitas', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);
    lines.push(`  let test${className}Name: string;`);
    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);
    lines.push(`    test${className}Name = \`Func-Delete-\${Date.now()}\`;`);
    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, singular)});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`  test('harus berhasil menghapus ${singular} setelah menyetujui konfirmasi', async () => {`);
    lines.push(`    const countBefore = await ${singular}Page.getRowCount();`);
    lines.push(`    await ${singular}Page.delete${className}ByName(test${className}Name);`);
    lines.push(`    await ${singular}Page.assert${className}NotExists(test${className}Name);`);
    lines.push(`    const countAfter = await ${singular}Page.getRowCount();`);
    lines.push(`    expect(countAfter).toBe(countBefore - 1);`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`});`);
  }

  return lines.join('\n');
}

// ── Helpers ────────────────────────────────────────────────────────

function buildSpecCreateArgs(
  fields: FormField[],
  relations: { field: string; relatedResource: string; label: string }[],
  singular: string
) {
  return (variant: string) => {
    return fields.map(f => {
      if (f.type === 'select' || f.name.endsWith('_id')) {
        const rel = relations.find(r => r.field === f.name);
        if (rel) {
          const relSingular = rel.relatedResource.replace(/s$/, '');
          const relClass = capitalize(relSingular);
          return `test${relClass}Name`;
        }
        return `'test'`;
      }
      const pName = camelCase(f.name);
      if (variant === 'unique' && fields.indexOf(f) === 0) {
        return `unique${capitalize(pName)}`;
      }
      return `\`${capitalize(singular)}-\${Date.now()}\``;
    }).join(', ');
  };
}

function buildSpecCreateArgsForEdit(
  fields: FormField[],
  relations: { field: string; relatedResource: string; label: string }[],
  singular: string
): string {
  return fields.map(f => {
    if (f.type === 'select' || f.name.endsWith('_id')) {
      const rel = relations.find(r => r.field === f.name);
      if (rel) {
        const relSingular = rel.relatedResource.replace(/s$/, '');
        const relClass = capitalize(relSingular);
        return `rel${relClass}Name`;
      }
      return `'test'`;
    }
    const pName = camelCase(f.name);
    if (fields.indexOf(f) === 0) {
      return `test${capitalize(singular.charAt(0).toUpperCase() + singular.slice(1))}Name`;
    }
    return `\`text-\${Date.now()}\``;
  }).join(', ');
}
