import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mili.dev',

  redirects: {
    '/about': '/',
  },

  integrations: [sitemap()],
});