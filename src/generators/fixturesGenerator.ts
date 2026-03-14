import { ProjectAnalysis, GeneratorOptions, FormField } from '../types';

// ─── Fixtures Generator ───────────────────────────────────────────

export function generateFixtures(analysis: ProjectAnalysis, opts: GeneratorOptions): string {
  const { resources, testUser } = analysis;
  const lines: string[] = [];

  lines.push(`// fixtures/test-data.ts`);
  lines.push(`// Data test terpusat untuk seluruh test suite`);
  lines.push(``);

  // TEST_USER
  lines.push(`export const TEST_USER = {`);
  lines.push(`  name: '${testUser.name}',`);
  lines.push(`  email: '${testUser.email}',`);
  lines.push(`  password: '${testUser.password}',`);
  lines.push(`};`);
  lines.push(``);

  // Per-resource data constants
  for (const resource of resources) {
    const constName = resource.name.toUpperCase();
    const textFields = resource.fields.filter(f =>
      !['select', 'checkbox'].includes(f.type) && !f.name.endsWith('_id')
    );

    if (textFields.length === 0) continue;

    lines.push(`export const ${constName} = {`);
    lines.push(`  valid: {`);
    for (const f of textFields) {
      lines.push(`    ${f.name}: '${sampleValue(f, resource.name, 'valid')}',`);
    }
    lines.push(`  },`);
    lines.push(`  updated: {`);
    for (const f of textFields) {
      lines.push(`    ${f.name}: '${sampleValue(f, resource.name, 'updated')}',`);
    }
    lines.push(`  },`);
    lines.push(`  empty: {`);
    for (const f of textFields) {
      lines.push(`    ${f.name}: '',`);
    }
    lines.push(`  },`);
    lines.push(`};`);
    lines.push(``);
  }

  // ROUTES
  lines.push(`export const ROUTES = {`);
  lines.push(`  home: '/',`);
  lines.push(`  login: '/login',`);
  lines.push(`  register: '/register',`);
  lines.push(`  dashboard: '/dashboard',`);
  lines.push(`  profile: '/profile',`);

  for (const resource of resources) {
    lines.push(`  ${resource.name}: {`);
    lines.push(`    index: '/${resource.name}',`);
    lines.push(`    create: '/${resource.name}/create',`);
    lines.push(`  },`);
  }

  lines.push(`};`);

  return lines.join('\n');
}

// ── Helpers ───────────────────────────────────────────────────────

function sampleValue(field: FormField, resourceName: string, variant: 'valid' | 'updated'): string {
  const name = field.name.toLowerCase();
  const singular = singularize(resourceName);

  if (name === 'title' || name.includes('title')) {
    return variant === 'valid'
      ? `My First ${capitalize(singular)}`
      : `My Updated ${capitalize(singular)}`;
  }
  if (name === 'name') {
    return variant === 'valid'
      ? `${capitalize(singular)} Name`
      : `Updated ${capitalize(singular)} Name`;
  }
  if (name === 'text' || name.includes('body') || name.includes('content') || name.includes('description')) {
    return variant === 'valid'
      ? `This is the content of the ${singular}.`
      : `Updated content for this ${singular}.`;
  }
  if (name.includes('email')) {
    return variant === 'valid' ? 'test@example.com' : 'updated@example.com';
  }
  if (name.includes('slug')) {
    return variant === 'valid' ? `${singular}-slug` : `updated-${singular}-slug`;
  }
  return variant === 'valid' ? `Sample ${field.label}` : `Updated ${field.label}`;
}

function singularize(name: string): string {
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('ses')) return name.slice(0, -2);
  if (name.endsWith('s') && !name.endsWith('ss')) return name.slice(0, -1);
  return name;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
