import { ResourceGroup, FormField } from '../types';

// ─── Resource Page Object Generator ──────────────────────────────

export function generateResourcePage(resource: ResourceGroup): string {
  const { className, name, fields, hasDelete, hasEdit, hasCreate, relations } = resource;
  const pageName = `${className}Page`;

  const selectFields = fields.filter(f => f.type === 'select' || f.name.endsWith('_id'));
  const textFields = fields.filter(f => f.type !== 'select' && !f.name.endsWith('_id'));

  const lines: string[] = [];

  lines.push(`// pages/${pageName}.ts`);
  lines.push(``);
  lines.push(`import { Page, Locator, expect } from '@playwright/test';`);
  lines.push(`import { BasePage } from './BasePage';`);
  lines.push(``);
  lines.push(`export class ${pageName} extends BasePage {`);
  lines.push(`  // ── Locators — Index ─────────────────────────────────────────`);

  if (hasCreate) {
    lines.push(`  readonly createButton: Locator;`);
  }
  lines.push(`  readonly ${name}Table: Locator;`);
  lines.push(`  readonly tableRows: Locator;`);
  lines.push(``);
  lines.push(`  // ── Locators — Form ─────────────────────────────────────────`);

  // All form fields
  for (const f of fields) {
    const locatorName = fieldToLocatorName(f);
    lines.push(`  readonly ${locatorName}: Locator;`);
  }

  lines.push(`  readonly submitButton: Locator;`);
  lines.push(``);
  lines.push(`  constructor(page: Page) {`);
  lines.push(`    super(page);`);
  lines.push(``);
  lines.push(`    // Index page`);

  if (hasCreate) {
    lines.push(`    this.createButton  = page.getByRole('link', { name: /create|add/i });`);
  }
  lines.push(`    this.${name}Table   = page.locator('table');`);
  lines.push(`    this.tableRows     = page.locator('table tbody tr');`);
  lines.push(``);
  lines.push(`    // Form`);

  for (const f of fields) {
    const locatorName = fieldToLocatorName(f);
    const locator = buildLocator(f);
    lines.push(`    this.${locatorName.padEnd(20)} = ${locator};`);
  }

  lines.push(`    this.submitButton       = page.getByRole('button', { name: /save|create|submit/i });`);
  lines.push(`  }`);
  lines.push(``);

  // ── Actions ──
  lines.push(`  // ── Actions ──────────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`  async gotoIndex(): Promise<void> {`);
  lines.push(`    await this.navigate('/${name}');`);
  lines.push(`  }`);
  lines.push(``);

  if (hasCreate) {
    lines.push(`  async gotoCreate(): Promise<void> {`);
    lines.push(`    await this.navigate('/${name}/create');`);
    lines.push(`  }`);
    lines.push(``);
  }

  // Individual fill methods
  for (const f of fields) {
    const locatorName = fieldToLocatorName(f);
    const methodName = `fill${capitalize(camelCase(f.name))}`;

    if (f.type === 'select' || f.name.endsWith('_id')) {
      lines.push(`  async ${methodName}(value: string): Promise<void> {`);
      lines.push(`    await this.${locatorName}.selectOption({ label: value });`);
      lines.push(`  }`);
    } else {
      lines.push(`  async ${methodName}(value: string): Promise<void> {`);
      lines.push(`    await this.${locatorName}.fill(value);`);
      lines.push(`  }`);
    }
    lines.push(``);
  }

  lines.push(`  async clickSubmit(): Promise<void> {`);
  lines.push(`    await this.submitButton.click();`);
  lines.push(`  }`);
  lines.push(``);

  // Composite create method
  const primaryField = textFields[0];
  const createParams = buildCreateParams(fields);
  const createArgs = buildCreateArgs(fields);

  if (hasCreate) {
    lines.push(`  async create${className}(${createParams}): Promise<void> {`);
    lines.push(`    await this.gotoCreate();`);
    for (const f of fields) {
      if (f.type === 'select' || f.name.endsWith('_id')) {
        const rel = resource.relations.find(r => r.field === f.name);
        lines.push(`    if (${camelCase(f.name)}) await this.fill${capitalize(camelCase(f.name))}(${camelCase(f.name)});`);
      } else {
        lines.push(`    await this.fill${capitalize(camelCase(f.name))}(${camelCase(f.name)});`);
      }
    }
    lines.push(`    await this.clickSubmit();`);
    lines.push(`  }`);
    lines.push(``);
  }

  // Edit by primary field
  if (hasEdit && primaryField) {
    const updateParams = buildUpdateParams(fields, primaryField);
    lines.push(`  async edit${className}ByName(current${capitalize(camelCase(primaryField.name))}: string, ${buildEditArgs(fields, primaryField)}): Promise<void> {`);
    lines.push(`    const row = this.page.locator('table tbody tr').filter({ hasText: current${capitalize(camelCase(primaryField.name))} });`);
    lines.push(`    await row.getByRole('link', { name: /edit/i }).click();`);
    for (const f of textFields) {
      lines.push(`    await this.${fieldToLocatorName(f)}.clear();`);
      lines.push(`    await this.${fieldToLocatorName(f)}.fill(${camelCase(f.name)});`);
    }
    lines.push(`    await this.clickSubmit();`);
    lines.push(`  }`);
    lines.push(``);
  }

  // Delete by primary field
  if (hasDelete && primaryField) {
    lines.push(`  async delete${className}ByName(name: string): Promise<void> {`);
    lines.push(`    const row = this.page.locator('table tbody tr').filter({ hasText: name });`);
    lines.push(`    this.page.once('dialog', async dialog => {`);
    lines.push(`      await dialog.accept();`);
    lines.push(`    });`);
    lines.push(`    await row.getByRole('button', { name: /delete/i }).click();`);
    lines.push(`  }`);
    lines.push(``);
  }

  // ── Assertions ──
  lines.push(`  // ── Assertions ───────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`  async assertOnIndexPage(): Promise<void> {`);
  lines.push(`    await this.assertURLContains('${name}');`);
  lines.push(`    await expect(this.${name}Table).toBeVisible();`);
  lines.push(`  }`);
  lines.push(``);

  if (hasCreate) {
    lines.push(`  async assertOnCreatePage(): Promise<void> {`);
    lines.push(`    await this.assertURLContains('${name}/create');`);
    if (primaryField) {
      lines.push(`    await expect(this.${fieldToLocatorName(primaryField)}).toBeVisible();`);
    }
    lines.push(`  }`);
    lines.push(``);
  }

  if (primaryField) {
    lines.push(`  async assert${className}Exists(value: string): Promise<void> {`);
    lines.push(`    await expect(this.page.locator('table').getByText(value)).toBeVisible();`);
    lines.push(`  }`);
    lines.push(``);
    lines.push(`  async assert${className}NotExists(value: string): Promise<void> {`);
    lines.push(`    await expect(this.page.locator('table').getByText(value)).not.toBeVisible();`);
    lines.push(`  }`);
    lines.push(``);
  }

  lines.push(`  async assertTableVisible(): Promise<void> {`);
  lines.push(`    await expect(this.${name}Table).toBeVisible();`);
  lines.push(`  }`);
  lines.push(``);

  if (hasCreate) {
    lines.push(`  async assertCreateButtonVisible(): Promise<void> {`);
    lines.push(`    await expect(this.createButton).toBeVisible();`);
    lines.push(`  }`);
    lines.push(``);
  }

  for (const f of textFields) {
    const locatorName = fieldToLocatorName(f);
    const methodSuffix = `${capitalize(camelCase(f.name))}`;
    lines.push(`  async assert${methodSuffix}InputVisible(): Promise<void> {`);
    lines.push(`    await expect(this.${locatorName}).toBeVisible();`);
    lines.push(`  }`);
    lines.push(``);
    if (f.required) {
      lines.push(`  async assert${methodSuffix}Required(): Promise<void> {`);
      lines.push(`    await expect(this.${locatorName}).toHaveAttribute('required');`);
      lines.push(`  }`);
      lines.push(``);
    }
  }

  lines.push(`  async assertSubmitButtonVisible(): Promise<void> {`);
  lines.push(`    await expect(this.submitButton).toBeVisible();`);
  lines.push(`  }`);
  lines.push(``);

  lines.push(`  async getRowCount(): Promise<number> {`);
  lines.push(`    return await this.tableRows.count();`);
  lines.push(`  }`);

  lines.push(`}`);

  return lines.join('\n');
}

// ── Helpers ───────────────────────────────────────────────────────

function fieldToLocatorName(f: FormField): string {
  if (f.type === 'select' || f.name.endsWith('_id')) {
    return `${camelCase(f.name.replace(/_id$/, ''))}Select`;
  }
  if (f.type === 'textarea') return `${camelCase(f.name)}Input`;
  return `${camelCase(f.name)}Input`;
}

function buildLocator(f: FormField): string {
  if (f.type === 'select' || f.name.endsWith('_id')) {
    return `page.getByLabel('${f.label.replace(/:$/, '')}')`;
  }
  if (f.type === 'checkbox') {
    return `page.getByLabel('${f.label.replace(/:$/, '')}')`;
  }
  return `page.getByLabel('${f.label.replace(/:$/, '')}')`;
}

function buildCreateParams(fields: FormField[]): string {
  return fields.map(f => {
    const paramName = camelCase(f.name);
    const type = (f.type === 'select' || f.name.endsWith('_id')) ? 'string | undefined' : 'string';
    const optional = (f.type === 'select' || f.name.endsWith('_id')) ? '?' : '';
    return `${paramName}${optional}: ${type.replace(' | undefined', '')}`;
  }).join(', ');
}

function buildCreateArgs(fields: FormField[]): string {
  return fields.map(f => camelCase(f.name)).join(', ');
}

function buildUpdateParams(fields: FormField[], primary: FormField): string {
  return fields
    .filter(f => f.type !== 'select' && !f.name.endsWith('_id'))
    .map(f => `${camelCase(f.name)}: string`)
    .join(', ');
}

function buildEditArgs(fields: FormField[], primary: FormField): string {
  return fields
    .filter(f => f.type !== 'select' && !f.name.endsWith('_id'))
    .map(f => `${camelCase(f.name)}: string`)
    .join(', ');
}

export function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
