// Substrate contact sheet — the DESIGN.md quality gate for the page-scale
// drawing. Renders the settled organism at fixed seeds across both themes and
// both soil widths, then stitches the tiles into one reviewable image.
//
//   node scripts/substrate-sheet.mjs <outDir>
//
// Serves a SNAPSHOT of dist/ from its own static server rather than using
// `astro preview`: another session rebuilding in the same tree deletes dist
// mid-run, which kills a live preview. Uses reduced-motion so every tile is the
// fully grown organism, rendered synchronously — no arrival timing to race.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdir, writeFile, rm, cp, readFile } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'substrate-sheet');
const PORT = 4331;
const BASE = `http://localhost:${PORT}`;
const SEEDS = ['1a2b3c4d', 'deadbeef', '5f3a91c0', '0c7e2244'];
const VIEWS = [
  { name: 'desktop', width: 1280, height: 900, clip: 1700 },
  { name: 'mobile', width: 390, height: 844, clip: 1500 },
];

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.woff2': 'font/woff2', '.otf': 'font/otf', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.json': 'application/json',
};

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const ROOT = path.join(OUT, '_dist');
await cp(path.resolve('dist'), ROOT, { recursive: true });

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(PORT, r));

try {

  const browser = await chromium.launch();
  const tiles = [];

  for (const view of VIEWS) {
    for (const theme of ['light', 'dark']) {
      // no stored theme + an OS preference is how a real first-time visitor
      // resolves to dark; let the inline script do its own job
      const ctx = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        colorScheme: theme,
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
      });
      for (const seed of SEEDS) {
        const page = await ctx.newPage();
        await page.goto(`${BASE}/?seed=${seed}`, { waitUntil: 'load' });
        // the seed label only fills in once build() has run, which is gated on
        // fonts.ready — that is the real "geometry exists" signal
        await page.waitForFunction(
          () => (document.getElementById('p-seed')?.textContent || '…').trim().length === 8,
          null,
          { timeout: 15000 },
        );
        await page.waitForTimeout(400);
        const ink = await page.evaluate(() => {
          // sanity: is there actually ink in the backing store, and what colour?
          const cv = document.querySelector('#substrate canvas');
          if (!cv) return null;
          const d = cv.getContext('2d').getImageData(0, 0, cv.width, Math.min(600, cv.height)).data;
          let n = 0, r = 0, g = 0, b = 0;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] < 8) continue;
            n++; r += d[i]; g += d[i + 1]; b += d[i + 2];
          }
          return n ? { n, r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) } : { n: 0 };
        });
        const file = path.join(OUT, `${view.name}-${theme}-${seed}.png`);
        await page.screenshot({
          path: file,
          clip: { x: 0, y: 0, width: view.width, height: Math.min(view.clip, view.height * 2) },
        });
        tiles.push({ file: path.basename(file), label: `${view.name} · ${theme} · ${seed}`, ink, view: view.name });
        console.log(`${path.basename(file)}  ink=${ink?.n ?? 0}px  mean=rgb(${ink?.r},${ink?.g},${ink?.b})`);
        await page.close();
      }
      await ctx.close();
    }
  }

  // stitch: one page of tiles, screenshotted as a single sheet
  const group = (v) => tiles.filter((t) => t.view === v);
  const sheet = `<style>
    body{margin:0;background:#8a8a8a;font:11px ui-monospace,monospace;color:#111}
    section{padding:10px}
    .row{display:flex;gap:8px;align-items:flex-start}
    figure{margin:0;flex:0 0 auto}
    figcaption{padding:3px 0}
    img{display:block;border:1px solid #555}
  </style>
  ${VIEWS.map(
    (v) => `<section><div class="row">${group(v.name)
      .map((t) => `<figure><figcaption>${t.label}</figcaption><img src="${t.file}" width="${v.width / (v.name === 'desktop' ? 2.4 : 1.3)}"></figure>`)
      .join('')}</div></section>`,
  ).join('')}`;
  await writeFile(path.join(OUT, 'sheet.html'), sheet);

  const sp = await browser.newPage({ viewport: { width: 2400, height: 1600 } });
  await sp.goto('file://' + path.join(OUT, 'sheet.html'));
  await sp.waitForTimeout(600);
  await sp.screenshot({ path: path.join(OUT, 'sheet.png'), fullPage: true });
  await browser.close();
  console.log('\nsheet: ' + path.join(OUT, 'sheet.png'));
} finally {
  await new Promise((r) => server.close(r));
}
