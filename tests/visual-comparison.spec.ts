import { test, expect, type Page, type Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = process.env.TEST_URL || 'http://localhost:4321';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

// Ensure screenshot dir exists
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ────────────────────────────────────────────────────────────
// Helper: extract computed styles from an element
// ────────────────────────────────────────────────────────────
async function getStyles(locator: Locator, properties: string[]) {
  return locator.evaluate((el, props) => {
    const cs = window.getComputedStyle(el);
    const result: Record<string, string> = {};
    for (const p of props) {
      result[p] = cs.getPropertyValue(p);
    }
    return result;
  }, properties);
}

async function getAllStyles(locators: Locator[], properties: string[]) {
  const results = [];
  const count = await locators[0].count?.() ?? 0;
  // If it's a single locator with multiple matches
  if (locators.length === 1) {
    const loc = locators[0];
    const n = await loc.count();
    for (let i = 0; i < Math.min(n, 3); i++) {
      results.push(await getStyles(loc.nth(i), properties));
    }
  } else {
    for (const loc of locators) {
      if (await loc.count() > 0) {
        results.push(await getStyles(loc.first(), properties));
      }
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────
// Screenshots: capture every page for visual review
// ────────────────────────────────────────────────────────────
const allPages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'writing', path: '/writing' },
  { name: 'talks', path: '/talks' },
  { name: 'projects', path: '/projects' },
];

test.describe('Screenshots', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const p of allPages) {
    test(`screenshot: ${p.name}`, async ({ page }) => {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${p.name}.png`),
        fullPage: true,
      });
    });
  }

  test('screenshot: blog post', async ({ page }) => {
    await page.goto(`${BASE}/writing/the-agentic-web`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'blog-post.png'),
      fullPage: true,
    });
  });
});

// ────────────────────────────────────────────────────────────
// Self-consistency: same patterns look the same across pages
// ────────────────────────────────────────────────────────────
test.describe('Self-consistency across pages', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const styleProps = ['font-family', 'font-size', 'font-weight', 'color', 'line-height', 'letter-spacing'];

  test('page headings (h1) have consistent styling across section pages', async ({ page }) => {
    const headingStyles: Record<string, Record<string, string>> = {};

    for (const p of ['about', 'writing', 'talks', 'projects']) {
      await page.goto(`${BASE}/${p}`, { waitUntil: 'networkidle' });
      const h1 = page.locator('main h1').first();
      headingStyles[p] = await getStyles(h1, styleProps);
    }

    // All section h1s should match
    const reference = headingStyles['about'];
    for (const [pageName, styles] of Object.entries(headingStyles)) {
      for (const prop of styleProps) {
        expect(styles[prop], `h1 ${prop} on /${pageName} vs /about`).toBe(reference[prop]);
      }
    }
  });

  test('list item titles have consistent styling: writing vs talks', async ({ page }) => {
    // Writing page: PostCard titles
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingTitle = page.locator('.post-card-title, .post-card h2').first();
    const writingStyles = await getStyles(writingTitle, styleProps);

    // Talks page: talk titles
    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkTitle = page.locator('.talk-title, .talk-item h2').first();
    const talkStyles = await getStyles(talkTitle, styleProps);

    // They should match
    for (const prop of styleProps) {
      expect(talkStyles[prop], `talk title ${prop} should match writing title`).toBe(writingStyles[prop]);
    }
  });

  test('list item dates have consistent styling: writing vs talks', async ({ page }) => {
    const dateProps = ['font-size', 'color', 'font-weight'];

    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingDate = page.locator('.post-card-date').first();
    const writingStyles = await getStyles(writingDate, dateProps);

    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkDate = page.locator('.talk-date').first();
    const talkStyles = await getStyles(talkDate, dateProps);

    for (const prop of dateProps) {
      expect(talkStyles[prop], `talk date ${prop} should match writing date`).toBe(writingStyles[prop]);
    }
  });

  test('list item spacing is consistent: writing vs talks', async ({ page }) => {
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingCard = page.locator('.post-card').first();
    const writingMargin = await getStyles(writingCard, ['margin-bottom']);

    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkItem = page.locator('.talk-item, article').first();
    const talkMargin = await getStyles(talkItem, ['margin-bottom']);

    expect(talkMargin['margin-bottom'], 'talk item margin should match post card').toBe(writingMargin['margin-bottom']);
  });

  test('content link colors are consistent across pages', async ({ page }) => {
    const linkColors: Record<string, string> = {};

    // Writing page links
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingLink = page.locator('.post-card-link').first();
    linkColors['writing'] = (await getStyles(writingLink, ['color']))['color'];

    // Talks page links
    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkLink = page.locator('.talk-link, .talk-item a').first();
    linkColors['talks'] = (await getStyles(talkLink, ['color']))['color'];

    // About page links
    await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' });
    const aboutLink = page.locator('.about-content a').first();
    linkColors['about'] = (await getStyles(aboutLink, ['color']))['color'];

    // Projects page links
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' });
    const projectLink = page.locator('.project-name').first();
    linkColors['projects'] = (await getStyles(projectLink, ['color']))['color'];

    // All should be the same blue
    const reference = linkColors['writing'];
    for (const [pageName, color] of Object.entries(linkColors)) {
      expect(color, `content link color on /${pageName}`).toBe(reference);
    }
  });

  test('nav links use consistent font across all pages', async ({ page }) => {
    const navStyles: Record<string, Record<string, string>> = {};

    for (const p of allPages) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      const navLink = page.locator('.nav-link').first();
      navStyles[p.name] = await getStyles(navLink, ['font-family', 'font-size', 'font-weight', 'color']);
    }

    const reference = navStyles['home'];
    for (const [pageName, styles] of Object.entries(navStyles)) {
      for (const prop of Object.keys(reference)) {
        expect(styles[prop], `nav ${prop} on ${pageName} vs home`).toBe(reference[prop]);
      }
    }
  });

  test('body text uses serif font on all pages', async ({ page }) => {
    for (const p of allPages) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      const body = page.locator('body');
      const styles = await getStyles(body, ['font-family']);
      expect(styles['font-family'], `body font on ${p.name}`).toContain('Georgia');
    }
  });

  test('no page uses Space Grotesk or Inter in rendered styles', async ({ page }) => {
    for (const p of allPages) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      const html = await page.content();
      expect(html, `${p.name} should not reference Space Grotesk`).not.toContain('Space Grotesk');
      expect(html, `${p.name} should not reference Inter font`).not.toContain("'Inter'");
    }
  });
});

// ────────────────────────────────────────────────────────────
// List structure consistency
// ────────────────────────────────────────────────────────────
test.describe('List structure consistency', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('writing and talks use same DOM pattern: heading + date block', async ({ page }) => {
    // Writing
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingItems = page.locator('.post-card, article').filter({ has: page.locator('h2') });
    const writingCount = await writingItems.count();
    expect(writingCount, 'writing should have items with h2').toBeGreaterThan(0);

    // Each writing item should have an h2 and a time/date element
    const firstWritingItem = writingItems.first();
    await expect(firstWritingItem.locator('h2')).toBeVisible();
    await expect(firstWritingItem.locator('time, .post-card-date')).toBeVisible();

    // Talks
    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkItems = page.locator('.talk-item, article').filter({ has: page.locator('h2') });
    const talkCount = await talkItems.count();
    expect(talkCount, 'talks should have items with h2').toBeGreaterThan(0);

    // Each talk item should have an h2 and a date element
    const firstTalkItem = talkItems.first();
    await expect(firstTalkItem.locator('h2')).toBeVisible();
    await expect(firstTalkItem.locator('.talk-date, time')).toBeVisible();

    // Date should be on its own line (block display), not inline with parentheses
    const dateText = await firstTalkItem.locator('.talk-date, time').first().textContent();
    expect(dateText, 'talk date should not be in parentheses').not.toMatch(/^\(/);
  });
});
