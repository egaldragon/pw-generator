// fixtures/test-data.ts
// Data test terpusat untuk seluruh test suite

export const TEST_USER = {
  name: 'Test User',
  email: 'playwright@example.com',
  password: 'playwright',
};

export const CATEGORIES = {
  valid: {
    name: 'Category Name',
  },
  updated: {
    name: 'Updated Category Name',
  },
  empty: {
    name: '',
  },
};

export const POSTS = {
  valid: {
    title: 'My First Post',
    text: 'This is the content of the post.',
  },
  updated: {
    title: 'My Updated Post',
    text: 'Updated content for this post.',
  },
  empty: {
    title: '',
    text: '',
  },
};

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  profile: '/profile',
  categories: {
    index: '/categories',
    create: '/categories/create',
  },
  posts: {
    index: '/posts',
    create: '/posts/create',
  },
};