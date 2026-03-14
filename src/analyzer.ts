import * as path from 'path';
import * as fs from 'fs';
import { scanViews } from './parsers/bladeParser';
import { parseRoutes } from './parsers/routeParser';
import { parseMigrations } from './parsers/migrationParser';
import {
  ProjectAnalysis, ResourceGroup, ParsedView, RouteInfo,
  FormField, RelationInfo,
} from './types';

// ─── Project Analyzer ─────────────────────────────────────────────

export function analyzeProject(projectPath: string): ProjectAnalysis {
  const absPath = path.resolve(projectPath);

  if (!fs.existsSync(absPath)) {
    throw new Error(`Project path does not exist: ${absPath}`);
  }

  const views = scanViews(absPath);
  const routes = parseRoutes(absPath);
  const migrations = parseMigrations(absPath);

  // Separate auth views from resource views
  const authViews = views.filter(v => v.resourceName === 'auth' || v.viewType === 'auth');
  const resourceViews = views.filter(v => v.resourceName !== 'auth' &&
    v.viewType !== 'auth' && v.viewType !== 'dashboard' &&
    !['welcome', 'profile'].includes(v.resourceName));

  // Identify resource groups from routes
  const resourceNames = new Set<string>();
  for (const r of routes) {
    if (r.isResource) {
      const name = r.name.split('.')[0];
      resourceNames.add(name);
    }
  }

  // Build resource groups
  const resources: ResourceGroup[] = [];
  for (const name of resourceNames) {
    const resourceRoutes = routes.filter(r => r.name.startsWith(`${name}.`));
    const resourceViewsList = views.filter(v => v.resourceName === name);

    // Gather all fields from create/edit forms
    const allFields: FormField[] = [];
    const seenFields = new Set<string>();
    for (const v of resourceViewsList) {
      if (v.viewType === 'create' || v.viewType === 'edit') {
        for (const f of v.fields) {
          if (!seenFields.has(f.name)) {
            seenFields.add(f.name);
            allFields.push(f);
          }
        }
      }
    }

    // Table columns from index view
    const indexView = resourceViewsList.find(v => v.viewType === 'index');
    const tableColumns = indexView?.tableColumns ?? [];

    // Auth middleware check
    const requiresAuth = resourceRoutes.some(r => r.middleware.includes('auth'));

    // Detect foreign key relations
    const relations = detectRelations(allFields, resources);

    // Migration-based nullable detection
    const migration = migrations.find(m => m.tableName === name ||
      m.tableName === `${name}s` || m.tableName === `${name}es`);
    if (migration) {
      for (const field of allFields) {
        const mField = migration.fields.find(f => f.name === field.name);
        if (mField) {
          field.required = !mField.nullable && field.required !== false;
          if (mField.foreignKey) {
            field.type = 'select';
          }
        }
      }
    }

    resources.push({
      name,
      singular: singularize(name),
      className: capitalize(singularize(name)),
      routes: resourceRoutes,
      views: resourceViewsList,
      fields: allFields,
      tableColumns,
      requiresAuth,
      hasIndex: resourceRoutes.some(r => r.action === 'index'),
      hasCreate: resourceRoutes.some(r => r.action === 'create'),
      hasEdit: resourceRoutes.some(r => r.action === 'edit'),
      hasDelete: resourceRoutes.some(r => r.action === 'destroy'),
      hasShow: resourceRoutes.some(r => r.action === 'show') &&
               resourceViewsList.some(v => v.viewType === 'show'),
      relations,
    });
  }

  const hasProfile = views.some(v => v.resourceName === 'profile');

  return {
    projectPath: absPath,
    resources,
    hasAuth: authViews.length > 0 || routes.some(r => r.name === 'login'),
    hasProfile,
    authViews,
    baseUrl: 'http://localhost:8000',
    testUser: {
      email: 'playwright@example.com',
      password: 'playwright',
      name: 'Test User',
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function detectRelations(fields: FormField[], existingResources: ResourceGroup[]): RelationInfo[] {
  return fields
    .filter(f => f.type === 'select' || f.name.endsWith('_id'))
    .map(f => {
      const base = f.name.replace(/_id$/, '');
      const related = existingResources.find(r => r.singular === base || r.name === base + 's');
      return {
        field: f.name,
        relatedResource: related?.name ?? base + 's',
        label: f.label,
      };
    });
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
