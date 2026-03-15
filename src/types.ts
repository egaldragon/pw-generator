// ─── Domain Types ────────────────────────────────────────────────

export interface FormField {
  id: string;           // HTML id attribute
  name: string;         // input name attribute
  label: string;        // Label text (cleaned, e.g. "Name")
  type: string;         // text | password | email | checkbox | textarea | select
  required: boolean;    // true if NOT NULL in migration (server-side required)
  htmlRequired: boolean; // true only if HTML `required` attribute present — used for toHaveAttribute('required') test
  options?: string[];   // for <select>
}

export interface ParsedView {
  path: string;
  resourceName: string;  // e.g. "categories"
  viewType: 'index' | 'create' | 'edit' | 'show' | 'auth' | 'profile' | 'dashboard' | 'other';
  fields: FormField[];
  tableColumns: string[];
  hasTable: boolean;
  hasDeleteButton: boolean;
  hasEditLink: boolean;
  hasCreateLink: boolean;
  formAction?: string;
  buttonLabels: string[];
  pageTitle: string;
  createLinkText?: string;
}

export interface RouteInfo {
  name: string;         // e.g. "categories.index"
  method: string;       // GET | POST | PUT | PATCH | DELETE
  uri: string;          // e.g. "/categories"
  controller?: string;
  action?: string;
  middleware: string[];
  isResource: boolean;
}

export interface ResourceGroup {
  name: string;              // e.g. "categories"
  singular: string;          // e.g. "category"
  className: string;         // e.g. "Category"
  routes: RouteInfo[];
  views: ParsedView[];
  fields: FormField[];
  tableColumns: string[];
  requiresAuth: boolean;
  hasIndex: boolean;
  hasCreate: boolean;
  hasEdit: boolean;
  hasDelete: boolean;
  hasShow: boolean;
  relations: RelationInfo[];
}

export interface RelationInfo {
  field: string;     // e.g. "category_id"
  relatedResource: string;  // e.g. "categories"
  label: string;     // e.g. "Category"
}

export interface MigrationField {
  name: string;
  type: string;
  nullable: boolean;
  foreignKey?: string;
}

export interface ParsedMigration {
  tableName: string;
  fields: MigrationField[];
}

export interface ProjectAnalysis {
  projectPath: string;
  resources: ResourceGroup[];
  hasAuth: boolean;
  hasProfile: boolean;
  authViews: ParsedView[];
  baseUrl: string;
  testUser: { email: string; password: string; name: string };
}

export interface GeneratorOptions {
  outputDir: string;
  language: 'id' | 'en';
  baseUrl: string;
  testUser: { email: string; password: string; name: string };
  gitea: {
    enabled: boolean;
    serverUrl: string;      // e.g. http://gitea:3000
    appHost: string;        // e.g. host.docker.internal:8000
    playwrightImage: string; // e.g. mcr.microsoft.com/playwright:v1.49.1-jammy
    branch: string;         // e.g. main
    npmCacheVolume: string;  // e.g. playwright-npm-cache
    reportVolume: string;    // e.g. playwright-report (Docker volume for HTML report)
  };
}
