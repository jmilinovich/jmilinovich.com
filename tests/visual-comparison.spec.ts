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

// ────────────────────────────────────────────────────────────
// Screenshots: capture every page for visual review
// ────────────────────────────────────────────────────────────
const allPages = [
  { name: 'home', path: '/' },
  
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

    for (const p of ['home', 'writing', 'talks', 'projects']) {
      await page.goto(`${BASE}/${p}`, { waitUntil: 'networkidle' });
      const h1 = page.locator('main h1').first();
      headingStyles[p] = await getStyles(h1, styleProps);
    }

    // All section h1s should match
    const reference = headingStyles['home'];
    for (const [pageName, styles] of Object.entries(headingStyles)) {
      for (const prop of styleProps) {
        expect(styles[prop], `h1 ${prop} on /${pageName} vs /home`).toBe(reference[prop]);
      }
    }
  });

  test('list item titles have consistent styling: writing vs talks', async ({ page }) => {
    // Writing page: PostCard titles (span.post-card-title)
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingTitle = page.locator('.post-card-title').first();
    const writingStyles = await getStyles(writingTitle, ['font-size', 'line-height']);

    // Talks page: talk item links
    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkTitle = page.locator('.talk-item a').first();
    const talkStyles = await getStyles(talkTitle, ['font-size', 'line-height']);

    // Font size and line height should match
    expect(talkStyles['font-size'], 'talk title font-size should match writing title').toBe(writingStyles['font-size']);
    expect(talkStyles['line-height'], 'talk title line-height should match writing title').toBe(writingStyles['line-height']);
  });

  test('list item dates have consistent styling: writing vs talks', async ({ page }) => {
    const dateProps = ['font-size', 'color'];

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
    const talkItem = page.locator('.talk-item').first();
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
    const talkLink = page.locator('.talk-item a').first();
    linkColors['talks'] = (await getStyles(talkLink, ['color']))['color'];

    // All content links should match
    expect(linkColors['talks'], 'talk link color should match writing link color').toBe(linkColors['writing']);
  });

  test('nav links use consistent font across all pages', async ({ page }) => {
    const navFonts: Record<string, string> = {};

    for (const p of allPages) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      const navLink = page.locator('.nav-link').first();
      navFonts[p.name] = (await getStyles(navLink, ['font-family']))['font-family'];
    }

    // All nav links should use the same font family
    const reference = navFonts['home'];
    for (const [pageName, font] of Object.entries(navFonts)) {
      expect(font, `nav font-family on ${pageName} vs home`).toBe(reference);
    }
  });

  test('body text uses Source Serif on all pages', async ({ page }) => {
    for (const p of allPages) {
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      const body = page.locator('body');
      const styles = await getStyles(body, ['font-family']);
      expect(styles['font-family'], `body font on ${p.name}`).toContain('Source Serif');
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

  test('writing and talks use consistent list item pattern', async ({ page }) => {
    // Writing: each .post-card should have a title and date
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    const writingItems = page.locator('.post-card');
    const writingCount = await writingItems.count();
    expect(writingCount, 'writing should have post cards').toBeGreaterThan(0);

    const firstWriting = writingItems.first();
    await expect(firstWriting.locator('.post-card-title')).toBeVisible();
    await expect(firstWriting.locator('.post-card-date')).toBeVisible();

    // Talks: each .talk-item should have a link and date
    await page.goto(`${BASE}/talks`, { waitUntil: 'networkidle' });
    const talkItems = page.locator('.talk-item');
    const talkCount = await talkItems.count();
    expect(talkCount, 'talks should have talk items').toBeGreaterThan(0);

    const firstTalk = talkItems.first();
    await expect(firstTalk.locator('a')).toBeVisible();
    await expect(firstTalk.locator('.talk-date')).toBeVisible();
  });

  // The attribution on /projects is load-bearing, not decorative: a bare product name
  // like "Canva AI" on a personal projects page reads as a claim to have authored it.
  // DESIGN.md §The projects page makes the role line a hard rule; this is the gate.
  test('every "With teams" project states a sourced role', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' });

    const items = page.locator('.band[data-band="With teams"] .project-item');
    const count = await items.count();
    expect(count, 'the With teams band should have rows').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const name = (await item.locator('.project-name').textContent())?.trim();
      const meta = item.locator('.project-meta');
      await expect(meta, `${name} should have a provenance line`).toHaveCount(1);
      // `company · role`, lowercase, before any secondary link
      const text = (await meta.textContent())?.trim() ?? '';
      expect(text, `${name} should open with "company · role"`).toMatch(/^[a-z][a-z.\-]* · \S/);
    }
  });

  test('every project row has a name and a date', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' });

    const items = page.locator('.project-item');
    const count = await items.count();
    expect(count, 'projects page should have rows').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(items.nth(i).locator('.project-name')).toHaveCount(1);
      await expect(items.nth(i).locator('.project-date')).toHaveCount(1);
    }
  });

  // Star counts were removed 2026-08-03 — they are a scoreboard, which DESIGN.md bans.
  test('projects page shows no star counts', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'networkidle' });
    const main = (await page.locator('main').textContent()) ?? '';
    expect(main, 'no star glyph on /projects').not.toContain('★');
    // the old markup rendered the star via `.project-stars::before`, which textContent misses
    const html = await page.content();
    expect(html, 'no star-count element on /projects').not.toContain('project-stars');
  });

  test('all pages render without errors', async ({ page }) => {
    for (const p of allPages) {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
      expect(errors, `${p.name} should have no JS errors`).toEqual([]);
    }
  });

  test('all post links resolve to valid pages', async ({ page }) => {
    await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
    // Collect hrefs first, then navigate
    const hrefs = await page.locator('.post-card-link').evaluateAll(
      (els) => els.slice(0, 5).map((el) => el.getAttribute('href'))
    );
    for (const href of hrefs) {
      expect(href).toBeTruthy();
      const response = await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' });
      expect(response?.status(), `${href} should return 200`).toBe(200);
    }
  });

  test('no broken images on key pages', async ({ page }) => {
    for (const p of ['/writing/the-agentic-web', '/writing/the-great-acceleration', '/']) {
      await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle' });
      const images = await page.locator('img').all();
      for (const img of images) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const src = await img.getAttribute('src');
        expect(naturalWidth, `image ${src} on ${p} should load`).toBeGreaterThan(0);
      }
    }
  });
});
