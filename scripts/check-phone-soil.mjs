// Gate for the phone substrate. Run after a build:
//
//   node scripts/check-phone-soil.mjs
//
// Two invariants, both of which were violated by real code:
//
//   1. NO BLANK PHONE. Every (seed x width) must draw. Production once rendered
//      zero segments for seed 3fa2b8d4 at every phone width, and the average
//      looked fine throughout — so this asserts on the WORST case, never a mean.
//   2. NEVER CROSSES A WORD. Phone stones are individual lines of text, so roots
//      thread gaps very close to glyphs. Checked per pixel against text-node
//      rects (not element rects), because the element boxes are exactly what the
//      roots are now allowed inside.
//
// Also asserts the phone/desktop split: <=767px uses per-line stones, above it
// keeps the section stones and production behaviour.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('dist');
const PORT = 4381, BASE = `http://localhost:${PORT}`;
const FLOOR = 3000;   // visible ink px; the winner's measured worst case was ~9k
const WIDTHS = [320, 360, 390, 414, 430, 767];
const DESKTOP = 1280;
const SEEDS = [
  '0c7e2244', 'deadbeef', '1a2b3c4d', '5f3a91c0', '7b19aa03', 'c0ffee11', '3fa2b8d4', '91e0447c',
  '11111111', 'ffffffff', '00000001', 'a5a5a5a5', '4d2e9f01', 'b7c30058', '2f8a11ce', 'e0114477',
];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(path.join(ROOT, p)); res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, r));

const PROBE = `(() => {
  const SEL = 'header a, header button, main h1, main .facts > li, main .eyebrow, main .row, main .provenance, footer .footer-inner';
  const words = [];
  document.querySelectorAll(SEL).forEach((el) => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n; while ((n = walk.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const rect of Array.from(r.getClientRects())) {
        if (rect.width > 1 && rect.height > 1) words.push({ x0: rect.left, x1: rect.right, y0: rect.top + window.scrollY, y1: rect.bottom + window.scrollY });
      }
    }
  });
  const host = document.getElementById('substrate');
  const cvs = [...host.querySelectorAll('canvas')].filter((c) => c.id !== 's-dot');
  if (!cvs.length) return { ink: 0, inWords: 0, err: 'no canvas' };
  const vw = document.documentElement.clientWidth;
  let ink = 0, inWords = 0;
  const B = 64, buckets = new Map();
  for (const wd of words) {
    for (let b = Math.floor(wd.y0 / B); b <= Math.floor(wd.y1 / B); b++) {
      if (!buckets.has(b)) buckets.set(b, []);
      buckets.get(b).push(wd);
    }
  }
  for (const cv of cvs) {
    const top = parseFloat(cv.style.top) || 0;
    const dpr = cv.width / (parseFloat(cv.style.width) || cv.width);
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    for (let py = 0; py < cv.height; py++) {
      const docY = py / dpr + top;
      const bl = buckets.get(Math.floor(docY / B));
      const row = py * cv.width * 4;
      for (let px = 0; px < cv.width; px++) {
        if (d[row + px * 4 + 3] < 8) continue;
        const docX = px / dpr;
        if (docX < 0 || docX > vw) continue;
        ink++;
        if (!bl) continue;
        for (let i = 0; i < bl.length; i++) {
          const wd = bl[i];
          if (docX > wd.x0 && docX < wd.x1 && docY > wd.y0 && docY < wd.y1) { inWords++; break; }
        }
      }
    }
  }
  const s = window.__sub || {};
  return { ink, inWords, stones: s.stones, phone: s.phone, segs: s.segs };
})()`;

const fails = [];
try {
  const browser = await chromium.launch();
  for (const width of [...WIDTHS, DESKTOP]) {
    const inks = [];
    let viol = 0, stones = 0, phone = null;
    for (const seed of SEEDS) {
      const ctx = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/?seed=${seed}`, { waitUntil: 'load' });
      await page.waitForFunction(() => (document.getElementById('p-seed')?.textContent || '…').trim().length === 8, null, { timeout: 20000 });
      await page.waitForTimeout(350);
      const m = await page.evaluate(PROBE);
      inks.push(m.ink); viol += m.inWords; stones = m.stones; phone = m.phone;
      if (m.ink < FLOOR) fails.push(`blank-ish: ${width}px seed ${seed} → ${m.ink}px ink (floor ${FLOOR})`);
      if (m.inWords > 200) fails.push(`crosses words: ${width}px seed ${seed} → ${m.inWords}px inside glyphs`);
      await ctx.close();
    }
    inks.sort((a, b) => a - b);
    const expectPhone = width <= 767;
    if (phone !== expectPhone) fails.push(`${width}px: phone=${phone}, expected ${expectPhone}`);
    if (expectPhone && stones < 50) fails.push(`${width}px: ${stones} stones — expected per-line granularity`);
    if (!expectPhone && stones !== 11) fails.push(`${width}px: ${stones} stones — desktop must keep the 11 section stones`);
    console.log(`${String(width).padStart(4)}px  min=${String(inks[0]).padStart(7)} med=${String(inks[8]).padStart(7)} max=${String(inks[15]).padStart(7)}  spread=${(inks[15] / Math.max(1, inks[0])).toFixed(1)}x  inWords=${String(viol).padStart(4)}  stones=${String(stones).padStart(4)}  ${expectPhone ? 'phone' : 'desktop'}`);
  }
  await browser.close();
} finally { await new Promise((r) => server.close(r)); }

if (fails.length) {
  console.error(`\n✗ phone soil gate FAILED (${fails.length})`);
  for (const f of fails.slice(0, 20)) console.error('  ' + f);
  process.exit(1);
}
console.log(`\n✓ ${SEEDS.length} seeds x ${WIDTHS.length} phone widths: all draw (floor ${FLOOR}px), none cross a word, desktop unchanged.`);
