// Mobile substrate evaluation harness (branch substrate-mobile).
//
//   node scripts/mobile-eval.mjs [width] [variants...]
//
// For every ?mv= variant and seed, renders the settled organism and measures:
//   ink        total ink pixels across the WHOLE document (all canvas slices)
//   inWords    ink pixels landing inside a real word rect — the doctrine check.
//              "Text is stone / never crosses a word" is the one invariant that
//              cannot be traded, and per-row/per-line variants deliberately
//              enter the section box, so this must be measured against line
//              rects rather than section rects.
//   segs       segment count (work), iters (settle length)
//
// Ranking is on the WORST seed, not the mean: the bug being fixed is that some
// seeds render almost nothing, which an average hides completely.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const WIDTH = Number(process.argv[2] || 390);
const ONLY = process.argv.slice(3);
const ROOT = path.resolve('dist');
const PORT = 4361, BASE = `http://localhost:${PORT}`;
const OUT = path.resolve('.mobile-eval');
const SEEDS = ['0c7e2244', 'deadbeef', '1a2b3c4d', '5f3a91c0', '7b19aa03', 'c0ffee11', '3fa2b8d4', '91e0447c'];
const VARIANTS = ONLY.length ? ONLY : ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(path.join(ROOT, p)); res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, r));

// Runs in the page. Word rects come from text-node Ranges, i.e. the actual
// glyph boxes, which is the real promise the doctrine makes.
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
  if (!cvs.length) return { ink: 0, inWords: 0, words: words.length, err: 'no canvas' };
  // bleed: canvas is offset left of the viewport when the soil overhangs
  const bleed = -parseFloat(cvs[0].style.left || '0') || 0;
  const vw = document.documentElement.clientWidth;
  let ink = 0, inWords = 0;
  // bucket words by 64px of depth so the per-pixel test stays cheap
  const B = 64, buckets = new Map();
  for (const wd of words) {
    for (let b = Math.floor(wd.y0 / B); b <= Math.floor(wd.y1 / B); b++) {
      if (!buckets.has(b)) buckets.set(b, []);
      buckets.get(b).push(wd);
    }
  }
  for (const cv of cvs) {
    const top = parseFloat(cv.style.top) || 0;
    const cssW = parseFloat(cv.style.width) || cv.width;
    const dpr = cv.width / cssW;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    for (let py = 0; py < cv.height; py++) {
      const docY = py / dpr + top;
      const bl = buckets.get(Math.floor(docY / B));
      const row = py * cv.width * 4;
      for (let px = 0; px < cv.width; px++) {
        if (d[row + px * 4 + 3] < 8) continue;
        const docX = px / dpr - bleed;
        // clipped overhang is invisible to the reader and must not score
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
  const dbg = window.__sub || {};
  return { ink, inWords, words: words.length, bleed, segs: dbg.segs || 0, iters: dbg.iters || 0, stones: dbg.stones || 0 };
})()`;

await mkdir(OUT, { recursive: true });
const rows = [];
try {
  const browser = await chromium.launch();
  for (const mv of VARIANTS) {
    const per = [];
    for (const seed of SEEDS) {
      const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const q = mv === '0' ? `?seed=${seed}` : `?seed=${seed}&mv=${mv}`;
      await page.goto(`${BASE}/${q}`, { waitUntil: 'load' });
      await page.waitForFunction(() => (document.getElementById('p-seed')?.textContent || '…').trim().length === 8, null, { timeout: 20000 });
      await page.waitForTimeout(500);
      const m = await page.evaluate(PROBE);
      const name = await page.evaluate(() => (window.__sub && window.__sub.name) || '');
      per.push({ seed, ...m, name });
      if (seed === SEEDS[0] || seed === 'deadbeef') {
        await page.screenshot({ path: path.join(OUT, `w${WIDTH}-mv${mv}-${seed}.png`), clip: { x: 0, y: 0, width: WIDTH, height: 1500 } });
      }
      await ctx.close();
    }
    const inks = per.map((p) => p.ink).sort((a, b) => a - b);
    const viol = per.reduce((a, p) => a + p.inWords, 0);
    const r = {
      mv, name: per[0].name, min: inks[0], med: inks[Math.floor(inks.length / 2)], max: inks[inks.length - 1],
      spread: (inks[inks.length - 1] / Math.max(1, inks[0])).toFixed(1), inWords: viol,
      segs: Math.round(per.reduce((a, p) => a + p.segs, 0) / per.length),
      stones: per[0].stones,
    };
    r.perSeed = per.map((p) => ({ seed: p.seed, ink: p.ink, inWords: p.inWords }));
    rows.push(r);
    console.log(`mv=${String(mv).padStart(2)} ${String(r.name).padEnd(36)} min=${String(r.min).padStart(7)} med=${String(r.med).padStart(7)} max=${String(r.max).padStart(7)} spread=${String(r.spread).padStart(6)}x inWords=${String(viol).padStart(6)} stones=${String(r.stones).padStart(4)}`);
  }
  await browser.close();
  await writeFile(path.join(OUT, `results-w${WIDTH}.json`), JSON.stringify(rows, null, 2));
  console.log('\nzero/near-zero seeds (the actual bug):');
  for (const r of rows) {
    const bad = r.perSeed.filter((p) => p.ink < 2000).map((p) => `${p.seed}:${p.ink}`);
    if (bad.length) console.log(`  mv=${String(r.mv).padStart(2)}  ${bad.join('  ')}`);
  }
  console.log(`\nranked by WORST seed (the bug is worst-case, not average):`);
  for (const r of [...rows].sort((a, b) => b.min - a.min)) {
    const flag = r.inWords > 200 ? '  ✗ CROSSES WORDS' : '';
    console.log(`  min=${String(r.min).padStart(7)}  mv=${String(r.mv).padStart(2)}  ${r.name}${flag}`);
  }
} finally { await new Promise((r) => server.close(r)); }
