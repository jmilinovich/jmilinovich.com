#!/usr/bin/env node

/**
 * Generates the OG cards (1200×630) for every essay plus the site default —
 * the Process system's fourth render target (DESIGN.md §Process): dark paper,
 * the essay's own glyph as a phosphor trace, serif title, mono provenance.
 * Runs as prebuild; output goes to public/og/ (gitignored, rebuilt every deploy).
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { glyphPath } from '../src/lib/process.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src', 'content', 'writing');
const OUT = join(ROOT, 'public', 'og');
mkdirSync(OUT, { recursive: true });

const FONTS = [
  join(__dirname, 'og-fonts', 'SourceSerif4-Semibold.ttf'), // family: "Source Serif 4 SemiBold"
  join(__dirname, 'og-fonts', 'BerkeleyMono-Regular.ttf'),  // family: "Berkeley Mono"
];

const W = 1200, H = 630;
const PAPER = '#0a0a0a', INK_STRONG = '#e8e8e8', MUTED = '#8a8a8a', HAIRLINE = '#222', PHOSPHOR = '#53d339';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrapTitle(title, fontSize, maxWidth) {
  const charW = fontSize * 0.52; // Source Serif SemiBold average advance
  const perLine = Math.max(8, Math.floor(maxWidth / charW));
  const words = title.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length <= perLine) line = (line + ' ' + w).trim();
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

function card({ title, dateLabel, seed }) {
  const fontSize = title.length > 64 ? 50 : 60;
  const lineH = fontSize * 1.25;
  const lines = wrapTitle(title, fontSize, 540);
  const blockH = lines.length * lineH;
  const startY = (H - blockH) / 2 + fontSize * 0.85;
  const titleText = lines
    .map((l, i) => `<text x="80" y="${(startY + i * lineH).toFixed(0)}" font-family="Source Serif 4 SemiBold" font-size="${fontSize}" fill="${INK_STRONG}" letter-spacing="-0.5">${esc(l)}</text>`)
    .join('');

  // The mark, drawn large in phosphor: soft bloom pass under a crisp pass.
  const d = glyphPath(seed);
  const scale = 21;
  const trace = `
    <g transform="translate(668, 55) scale(${scale})" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${d}" stroke="${PHOSPHOR}" stroke-opacity="0.22" stroke-width="${(15 / scale).toFixed(3)}"/>
      <path d="${d}" stroke="${PHOSPHOR}" stroke-opacity="0.5" stroke-width="${(7 / scale).toFixed(3)}"/>
      <path d="${d}" stroke="${PHOSPHOR}" stroke-width="${(3.4 / scale).toFixed(3)}"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="${HAIRLINE}" stroke-width="3"/>
  ${trace}
  ${titleText}
  <text x="80" y="${H - 56}" font-family="Berkeley Mono" font-size="23" fill="${MUTED}" letter-spacing="0.5">mili.dev${dateLabel ? ` · ${esc(dateLabel)}` : ''}</text>
</svg>`;
}

function render(svg, outFile) {
  const resvg = new Resvg(svg, {
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Source Serif 4 SemiBold' },
  });
  writeFileSync(outFile, resvg.render().asPng());
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

let count = 0;
for (const file of readdirSync(CONTENT)) {
  if (!file.endsWith('.md')) continue;
  const raw = readFileSync(join(CONTENT, file), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  if (/^draft:\s*true/m.test(fm)) continue;
  const title = fm.match(/^title:\s*"(.*)"/m)?.[1];
  const date = fm.match(/^date:\s*"(.*)"/m)?.[1];
  if (!title || !date) continue;
  const slug = file.replace(/\.md$/, '');
  render(card({ title, dateLabel: fmtDate(date), seed: slug }), join(OUT, `${slug}.png`));
  count++;
}

render(card({ title: 'John Milinovich', dateLabel: '', seed: 'mili.dev' }), join(OUT, 'default.png'));
console.log(`generated ${count} essay OG cards + default.png → public/og/`);
