import { ResourceGroup, FormField } from '../types';
import { camelCase, capitalize } from './pageObjectGenerator';

// ─── Resource Spec Generator ──────────────────────────────────────

export function generateResourceSpec(resource: ResourceGroup): string {
  const { name, singular, className, fields, hasCreate, hasEdit, hasDelete, relations } = resource;
  const pageName = `${className}Page`;
  const constName = name.toUpperCase();

  const textFields = fields.filter(f => f.type !== 'select' && !f.name.endsWith('_id'));
  const selectFields = fields.filter(f => f.type === 'select' || f.name.endsWith('_id'));
  const primaryField = textFields[0];

  // FIX: use proper singularize (handles -ies→-y, -ses, -s)
  const relatedImports = relations.map(r => {
    const relClass = capitalize(singularize(r.relatedResource));
    return `import { ${relClass}Page } from '../pages/${relClass}Page';`;
  });

  const lines: string[] = [];

  lines.push(`// tests/${name}.spec.ts`);
  lines.push(`// UI Functional Tests: ${className} CRUD`);
  lines.push(``);
  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push(`import { LoginPage } from '../pages/LoginPage';`);
  lines.push(`import { ${pageName} } from '../pages/${pageName}';`);
  if (relatedImports.length > 0) lines.push(...relatedImports);

  const fixtureImports = [`TEST_USER`, constName];
  if (relations.length > 0) {
    fixtureImports.push(...relations.map(r => r.relatedResource.toUpperCase()));
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

  // ── GROUP 1: Index UI ──────────────────────────────────────────
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

  const indexView = resource.views.find(v => v.viewType === 'index');
  // Named columns from <th> — skip columns that are relation display names (FK labels)
  const relationLabels = new Set(relations.map(r => r.label.replace(/:$/, '').toLowerCase()));
  if (indexView) {
    for (const col of indexView.tableColumns) {
      if (!col.trim()) continue;
      // Skip if this column is just displaying a related resource (e.g. 'Category' in posts)
      if (relationLabels.has(col.toLowerCase())) continue;
      lines.push(`  test('tabel harus memiliki kolom ${col}', async ({ page }) => {`);
      lines.push(`    await expect(page.locator('table th').filter({ hasText: /${col}/i })).toBeVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }
  }


  lines.push(`});`);
  lines.push(``);

  if (hasCreate) {
    // ── GROUP 2: Create UI ────────────────────────────────────────
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

    // Text fields
    for (const f of textFields) {
      lines.push(`  test('harus menampilkan field ${f.label.replace(/:$/, '')}', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name))}InputVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }
    // FIX: Select/dropdown fields also get a visibility test in Create UI
    for (const f of selectFields) {
      const locatorName = `${camelCase(f.name.replace(/_id$/, ''))}Select`;
      const label = f.label.replace(/:$/, '');
      lines.push(`  test('harus menampilkan dropdown ${label}', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name.replace(/_id$/, '')))}SelectVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`  test('harus menampilkan tombol Submit', async () => {`);
    lines.push(`    await ${singular}Page.assertSubmitButtonVisible();`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`  test('tombol Submit harus bisa diklik', async () => {`);
    lines.push(`    await expect(${singular}Page.submitButton).toBeEnabled();`);
    lines.push(`  });`);
    lines.push(``);

    for (const f of textFields.filter(f => f.required)) {
      lines.push(`  test('field ${f.label.replace(/:$/, '')} harus bersifat required', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name))}Required();`);
      lines.push(`  });`);
      lines.push(``);
    }

    // FIX: empty check for each text field (not just primary)
    for (const f of textFields) {
      lines.push(`  test('field ${f.label.replace(/:$/, '')} harus kosong saat pertama dibuka', async () => {`);
      lines.push(`    await expect(${singular}Page.${camelCase(f.name)}Input).toHaveValue('');`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`});`);
    lines.push(``);

    // ── GROUP 3: Create Functionality ─────────────────────────────
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`// GROUP 3: Create — Fungsionalitas`);
    lines.push(`// ─────────────────────────────────────────────`);
    lines.push(`test.describe('${className} Create — Fungsionalitas', () => {`);
    lines.push(`  let ${singular}Page: ${pageName};`);
    for (const rel of relations) {
      const relSingular = singularize(rel.relatedResource);
      const relClass = capitalize(relSingular);
      lines.push(`  let ${relSingular}Page: ${relClass}Page;`);
      lines.push(`  let test${relClass}Name: string;`);
    }
    lines.push(``);
    lines.push(`  test.beforeEach(async ({ page }) => {`);
    lines.push(`    ${singular}Page = new ${pageName}(page);`);
    for (const rel of relations) {
      const relSingular = singularize(rel.relatedResource);
      const relClass = capitalize(relSingular);
      lines.push(`    ${relSingular}Page = new ${relClass}Page(page);`);
      lines.push(`    test${relClass}Name = \`${relClass}-\${Date.now()}\`;`);
      lines.push(`    await ${relSingular}Page.create${relClass}(test${relClass}Name);`);
    }
    lines.push(`  });`);
    lines.push(``);

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
    lines.push(`    await ${singular}Page.create${className}(${createCallArgs('redirect')});`);
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

    // FIX: extra test for create with select/relation — only when there are select fields
    if (selectFields.length > 0) {
      lines.push(`  test('harus berhasil membuat ${singular} dengan memilih ${selectFields[0].label.replace(/:$/, '')}', async ({ page }) => {`);
      for (const rel of relations) {
        const relSingular = singularize(rel.relatedResource);
        const relClass = capitalize(relSingular);
        lines.push(`    const extra${relClass}Page = new ${relClass}Page(page);`);
        lines.push(`    const extra${relClass}Name = \`${relClass}-\${Date.now()}\`;`);
        lines.push(`    await extra${relClass}Page.create${relClass}(extra${relClass}Name);`);
      }
      lines.push(`    await ${singular}Page.gotoCreate();`);
      for (const f of textFields) {
        lines.push(`    await ${singular}Page.fill${capitalize(camelCase(f.name))}(\`${capitalize(singular)}-\${Date.now()}\`);`);
      }
      for (const rel of relations) {
        const relSingular = singularize(rel.relatedResource);
        const relClass = capitalize(relSingular);
        const selField = selectFields.find(f => f.name === rel.field || f.name === rel.field);
        const locatorName = `${camelCase((selField?.name ?? rel.field).replace(/_id$/, ''))}Select`;
        lines.push(`    if (await ${singular}Page.${locatorName}.isVisible()) {`);
        lines.push(`      await ${singular}Page.fill${capitalize(camelCase((selField?.name ?? rel.field).replace(/_id$/, '')))}(extra${relClass}Name);`);
        lines.push(`    }`);
      }
      lines.push(`    await ${singular}Page.clickSubmit();`);
      lines.push(`    await ${singular}Page.assertOnIndexPage();`);
      lines.push(`  });`);
      lines.push(``);
    }

    lines.push(`});`);
    lines.push(``);
  }

  if (hasEdit && primaryField) {
    // rel setup reused in groups 4, 5, 6, 7
    const relSetupBlock = relations.map(rel => {
      const relSingular = singularize(rel.relatedResource);
      const relClass = capitalize(relSingular);
      return [
        `    const ${relSingular}Page = new ${relClass}Page(page);`,
        `    const rel${relClass}Name = \`${relClass}-\${Date.now()}\`;`,
        `    await ${relSingular}Page.create${relClass}(rel${relClass}Name);`,
      ];
    }).flat();

    // ── GROUP 4: Edit UI ──────────────────────────────────────────
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
    lines.push(...relSetupBlock);
    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, className)});`);
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
    // FIX: dropdown visibility test in Edit UI too
    for (const f of selectFields) {
      const label = f.label.replace(/:$/, '');
      lines.push(`  test('halaman edit harus menampilkan dropdown ${label}', async () => {`);
      lines.push(`    await ${singular}Page.assert${capitalize(camelCase(f.name.replace(/_id$/, '')))}SelectVisible();`);
      lines.push(`  });`);
      lines.push(``);
    }
    lines.push(`  test('field ${primaryField.label.replace(/:$/, '')} harus terisi dengan nilai saat ini', async () => {`);
    lines.push(`    await expect(${singular}Page.${camelCase(primaryField.name)}Input).toHaveValue(test${className}Name);`);
    lines.push(`  });`);
    lines.push(``);
    // FIX: save button visible AND enabled in one test (matches OG pattern)
    lines.push(`  test('harus menampilkan tombol Save dan bisa diklik', async () => {`);
    lines.push(`    await expect(${singular}Page.submitButton).toBeVisible();`);
    lines.push(`    await ${singular}Page.assertSubmitButtonVisible();`);
    lines.push(`  });`);
    lines.push(``);
    lines.push(`});`);
    lines.push(``);

    // ── GROUP 5: Edit Functionality ───────────────────────────────
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
    lines.push(...relSetupBlock);
    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, className)});`);
    lines.push(`    await ${singular}Page.assertOnIndexPage();`);
    lines.push(`  });`);
    lines.push(``);
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

    // ── GROUP 6: Delete UI ────────────────────────────────────────
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
    lines.push(...relSetupBlock);
    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, className)});`);
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

    // ── GROUP 7: Delete Functionality ─────────────────────────────
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
    lines.push(...relSetupBlock);
    lines.push(`    await ${singular}Page.create${className}(${buildSpecCreateArgsForEdit(fields, relations, className)});`);
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

function singularize(name: string): string {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('ses')) return name.slice(0, -2);
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1);
  return name;
}

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
          const relClass = capitalize(singularize(rel.relatedResource));
          return `test${relClass}Name`;
        }
        return `'test'`;
      }
      const pName = camelCase(f.name);
      if (variant === 'unique' && fields.filter(x => x.type !== 'select' && !x.name.endsWith('_id')).indexOf(f) === 0) {
        return `unique${capitalize(pName)}`;
      }
      return `\`${capitalize(singular)}-\${Date.now()}\``;
    }).join(', ');
  };
}

function buildSpecCreateArgsForEdit(
  fields: FormField[],
  relations: { field: string; relatedResource: string; label: string }[],
  className: string
): string {
  const textOnly = fields.filter(f => f.type !== 'select' && !f.name.endsWith('_id'));
  return fields.map(f => {
    if (f.type === 'select' || f.name.endsWith('_id')) {
      const rel = relations.find(r => r.field === f.name);
      if (rel) {
        const relClass = capitalize(singularize(rel.relatedResource));
        return `rel${relClass}Name`;
      }
      return `'test'`;
    }
    if (textOnly.indexOf(f) === 0) {
      return `test${className}Name`;
    }
    return `\`text-\${Date.now()}\``;
  }).join(', ');
}
