import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVE_SITE = 'https://jmilinovich.com';
const LOCAL_SITE = 'http://localhost:4321';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'talks', path: '/talks' },
  { name: 'writing', path: '/writing' },
];

async function screenshotPage(page: Page, url: string, name: string, prefix: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Wait for fonts to load
  await page.waitForTimeout(1000);
  const dir = path.join(SCREENSHOT_DIR, prefix);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  });
}

test.describe('Visual comparison - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const p of pages) {
    test(`capture live site: ${p.name} (desktop)`, async ({ page }) => {
      await screenshotPage(page, `${LIVE_SITE}${p.path}`, `${p.name}-desktop`, 'live');
    });

    test(`capture local site: ${p.name} (desktop)`, async ({ page }) => {
      await screenshotPage(page, `${LOCAL_SITE}${p.path}`, `${p.name}-desktop`, 'local');
    });
  }

  // Also capture a blog post
  test('capture live site: blog post (desktop)', async ({ page }) => {
    await screenshotPage(page, `${LIVE_SITE}/the-agentic-web/`, 'post-desktop', 'live');
  });

  test('capture local site: blog post (desktop)', async ({ page }) => {
    await screenshotPage(page, `${LOCAL_SITE}/writing/the-agentic-web`, 'post-desktop', 'local');
  });
});

test.describe('Visual comparison - Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const p of pages) {
    test(`capture live site: ${p.name} (mobile)`, async ({ page }) => {
      await screenshotPage(page, `${LIVE_SITE}${p.path}`, `${p.name}-mobile`, 'live');
    });

    test(`capture local site: ${p.name} (mobile)`, async ({ page }) => {
      await screenshotPage(page, `${LOCAL_SITE}${p.path}`, `${p.name}-mobile`, 'local');
    });
  }
});
