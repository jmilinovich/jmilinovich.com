// Visual sheet for the mobile substrate candidates (branch substrate-mobile).
//
//   node scripts/mobile-sheet.mjs <seed> <height> <variants...>
//
// One tile per variant at 1:1 phone width, so fine structure is judged at the
// size it will actually be seen. Serves a snapshot of dist so a concurrent
// rebuild cannot pull the rug (see scripts/substrate-sheet.mjs).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';

const SEED = process.argv[2] || '3fa2b8d4';
const H = Number(process.argv[3] || 1600);
const VARIANTS = process.argv.slice(4);
if (!VARIANTS.length) { console.error('usage: mobile-sheet.mjs <seed> <height> <variants...>'); process.exit(1); }

const W = 390, PORT = 4371, BASE = `http://localhost:${PORT}`;
const OUT = path.resolve('.mobile-eval');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };

await mkdir(OUT, { recursive: true });
const ROOT = path.join(OUT, '_dist');
await rm(ROOT, { recursive: true, force: true });
await cp(path.resolve('dist'), ROOT, { recursive: true });

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { const b = await readFile(path.join(ROOT, p)); res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(b); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, r));

const tiles = [];
try {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    for (const mv of VARIANTS) {
      const ctx = await browser.newContext({ viewport: { width: W, height: 844 }, colorScheme: theme, reducedMotion: 'reduce', deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const q = mv === '0' ? `?seed=${SEED}` : `?seed=${SEED}&mv=${mv}`;
      await page.goto(`${BASE}/${q}`, { waitUntil: 'load' });
      await page.waitForFunction(() => (document.getElementById('p-seed')?.textContent || '…').trim().length === 8, null, { timeout: 20000 });
      await page.waitForTimeout(600);
      const info = await page.evaluate(() => {
        const d = window.__sub || {};
        return { name: d.name || 'baseline (prod)', stones: d.stones, segs: d.segs };
      });
      const f = path.join(OUT, `sheet-${theme}-mv${mv}-${SEED}.png`);
      await page.screenshot({ path: f, clip: { x: 0, y: 0, width: W, height: H } });
      tiles.push({ f, theme, mv, label: `mv=${mv} · ${info.name}`, sub: `${info.stones} stones · ${info.segs} segs` });
      console.log(`${theme} mv=${mv} ${info.name}`);
      await ctx.close();
    }
  }
  const row = (theme) => tiles.filter((t) => t.theme === theme).map((t) =>
    `<figure><figcaption>${t.label}<br><span class="s">${t.sub}</span></figcaption>
     <img src="file://${t.f}" width="${W}"></figure>`).join('');
  const html = `<style>
    body{margin:0;background:#8a8a8a;font:12px ui-monospace,monospace;color:#111}
    h2{font:11px ui-monospace,monospace;margin:10px 8px 2px;letter-spacing:.1em;text-transform:uppercase}
    .row{display:flex;gap:8px;padding:4px 8px 12px;align-items:flex-start}
    figure{margin:0;flex:0 0 auto}
    figcaption{padding:3px 0;line-height:1.4}
    .s{color:#444}
    img{display:block;border:1px solid #555}
  </style>
  <h2>seed ${SEED} — light</h2><div class="row">${row('light')}</div>
  <h2>seed ${SEED} — dark</h2><div class="row">${row('dark')}</div>`;
  const hp = path.join(OUT, `sheet-${SEED}.html`);
  await writeFile(hp, html);
  const sp = await browser.newPage({ viewport: { width: VARIANTS.length * (W + 8) + 40, height: 900 } });
  await sp.goto('file://' + hp);
  await sp.waitForTimeout(700);
  const out = path.join(OUT, `sheet-${SEED}.png`);
  await sp.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('\n' + out);
} finally { await new Promise((r) => server.close(r)); }
