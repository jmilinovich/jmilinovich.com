import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jmilinovich.com',
  redirects: {
    '/about': '/',
  },
});
