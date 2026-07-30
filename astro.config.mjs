import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';

import sitemap from '@astrojs/sitemap';

// Posts marked `unlisted: true` stay reachable by URL but are kept out of the
// sitemap, so search engines aren't handed something not ready to share.
const WRITING_DIR = './src/content/writing';
const unlistedPaths = fs
  .readdirSync(WRITING_DIR)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => {
    const fm = fs.readFileSync(path.join(WRITING_DIR, f), 'utf8').split('---')[1] ?? '';
    return /^unlisted:\s*true\s*$/m.test(fm);
  })
  .map((f) => `/writing/${f.replace(/\.md$/, '')}/`);

export default defineConfig({
  site: 'https://mili.dev',

  redirects: {
    '/about': '/',
  },

  integrations: [
    sitemap({
      filter: (page) => !unlistedPaths.some((p) => new URL(page).pathname === p),
    }),
  ],
});