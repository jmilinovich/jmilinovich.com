import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mili.dev',
  redirects: {
    '/about': '/',
  },
});
