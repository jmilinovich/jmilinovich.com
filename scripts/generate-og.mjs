#!/usr/bin/env node

/**
 * Generates the share previews for every essay plus the site default
 * (DESIGN.md §Process, OG cards): a 1200×630 og:image card — dark paper,
 * hairline frame, serif title, mono provenance, the living-logo wordmark — and
 * its og:video, the same card with the logo alive for one seamless 8s loop
 * (scripts/og-motion.mjs). Poster, first frame and last frame are one image, so
 * a platform that plays the video shows the card coming alive and one that
 * doesn't loses nothing. Runs as prebuild; output goes to public/og/
 * (gitignored, rebuilt every deploy).
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import ffmpegPath from 'ffmpeg-static';
import { choreography, poseAt, FPS, FRAMES } from './og-motion.mjs';

// ffmpeg-static downloads its binary at install time; without it there is no
// video, and a page must never advertise one that doesn't exist.
if (!ffmpegPath || !existsSync(ffmpegPath)) throw new Error('ffmpeg-static binary is missing — reinstall dependencies (npm ci)');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src', 'content', 'writing');
const OUT = join(ROOT, 'public', 'og');
mkdirSync(OUT, { recursive: true });
// Encoded videos are cached by the hash of everything that decides their bytes
// (below), which is safe only because the output is deterministic. node_modules
// survives between Netlify builds, so a deploy that changes no card re-encodes
// nothing; a cold build simply encodes everything.
const CACHE = join(ROOT, 'node_modules', '.cache', 'og-video');
mkdirSync(CACHE, { recursive: true });
const pkgVersion = (name) => createRequire(import.meta.url)(`${name}/package.json`).version;

const FONTS = [
  join(__dirname, 'og-fonts', 'SourceSerif4-Semibold.ttf'), // family: "Source Serif 4 SemiBold"
  join(__dirname, 'og-fonts', 'BerkeleyMono-Regular.ttf'),  // family: "Berkeley Mono"
];

const W = 1200, H = 630;
const PAPER = '#0a0a0a', INK_STRONG = '#e8e8e8', MUTED = '#8a8a8a', HAIRLINE = '#222';
const PAPER_RGB = 0x0a;

// John's hand-designed mili wordmark, pulled live from the real component so the
// cards can never drift from the site. viewBox 0 0 3109 2091. The class names are
// what the living logo animates (eyes, smile).
const logoSource = readFileSync(join(ROOT, 'src', 'components', 'Logo.astro'), 'utf8');
const logoPaths = [...logoSource.matchAll(/<path[^>]*\bclass="([^"]+)"[^>]*\bd="([^"]+)"/g)].map((m) => ({ cls: m[1], d: m[2] }));
const logoClasses = new Set(logoPaths.map((p) => p.cls));
if (logoPaths.length < 5 || !['smile', 'eye-left', 'eye-right'].every((c) => logoClasses.has(c))) {
  throw new Error('could not extract the logo paths (and their eye/smile classes) from Logo.astro');
}
const LOGO_W = 3109, LOGO_H = 2091;

// The wordmark's place on the card: right side, vertically centred.
const LOGO_PX = 360;
const LOGO_SCALE = LOGO_PX / LOGO_W;
const LOGO_X = W - 80 - LOGO_PX;
const LOGO_Y = Math.round((H - LOGO_H * LOGO_SCALE) / 2);
// Everything the performance can touch sits inside this rect — the widest smile
// mood rotated, the furthest glance, the breath — with room to spare, so a video
// frame only re-renders the logo and pastes it onto the card. Only paper lies
// under it; the title wraps at 540px and ends well left of it.
const REGION = { x: LOGO_X - 20, y: LOGO_Y - 24, w: 420, h: 300 };

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

// The wordmark in a given pose. At rest every transform is empty, so the poster
// and the video's rest frames are the same markup, not a lookalike.
function logo(pose, dx = 0, dy = 0) {
  const attr = (t) => (t ? ` transform="${t}"` : '');
  const byClass = { smile: pose.smile, 'eye-left': pose.eyeLeft, 'eye-right': pose.eyeRight };
  return `
    <g transform="translate(${LOGO_X - dx}, ${LOGO_Y - dy}) scale(${LOGO_SCALE.toFixed(4)})" fill="${INK_STRONG}">
      <g${attr(pose.breath)}>
      ${logoPaths.map(({ cls, d }) => `<path d="${d}"${attr(byClass[cls])}/>`).join('\n      ')}
      </g>
    </g>`;
}

const REST = poseAt(null, 0);

function card({ title, dateLabel }) {
  const fontSize = title.length > 64 ? 50 : 60;
  const lineH = fontSize * 1.25;
  const lines = wrapTitle(title, fontSize, 540);
  const blockH = lines.length * lineH;
  const startY = (H - blockH) / 2 + fontSize * 0.85;
  const titleText = lines
    .map((l, i) => `<text x="80" y="${(startY + i * lineH).toFixed(0)}" font-family="Source Serif 4 SemiBold" font-size="${fontSize}" fill="${INK_STRONG}" letter-spacing="-0.5">${esc(l)}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="${HAIRLINE}" stroke-width="3"/>
  ${logo(REST)}
  ${titleText}
  <text x="80" y="${H - 56}" font-family="Berkeley Mono" font-size="23" fill="${MUTED}" letter-spacing="0.5">mili.dev${dateLabel ? ` · ${esc(dateLabel)}` : ''}</text>
</svg>`;
}

// Just the logo's rect, on paper, in one pose.
const regionSvg = (pose) => `<svg xmlns="http://www.w3.org/2000/svg" width="${REGION.w}" height="${REGION.h}" viewBox="0 0 ${REGION.w} ${REGION.h}">
  <rect width="${REGION.w}" height="${REGION.h}" fill="${PAPER}"/>
  ${logo(pose, REGION.x, REGION.y)}
</svg>`;

const rgb = (rgba) => {
  const out = Buffer.allocUnsafe((rgba.length / 4) * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) { out[j] = rgba[i]; out[j + 1] = rgba[i + 1]; out[j + 2] = rgba[i + 2]; }
  return out;
};

// H.264 in MP4 is the one format both iMessage and Discord play. High@4.0 and
// yuv420p decode on every phone, BT.709-tagged, moov atom first so the preview
// starts before the file finishes, no audio track (there is nothing to hear, and
// a mute toggle would promise sound), one keyframe because nobody seeks a loop.
// Bit-exact flags plus a pinned ffmpeg-static keep the bytes identical build to
// build.
const ENCODE = [
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-threads', '1',
  '-profile:v', 'high', '-level:v', '4.0', '-g', String(FRAMES),
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-an', '-map_metadata', '-1', '-movflags', '+faststart', '-fflags', '+bitexact', '-flags:v', '+bitexact',
];

// ffmpeg holds the poster as a still and lays each frame's logo rect over it, so
// only the rect crosses the pipe.
const FILTER = `[0:v]loop=loop=-1:size=1[bg];[bg][1:v]overlay=${REGION.x}:${REGION.y}:shortest=1:format=rgb,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`;
function encode(posterFile, regions, outFile) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      '-v', 'error', '-y',
      '-framerate', String(FPS), '-i', posterFile,
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${REGION.w}x${REGION.h}`, '-r', String(FPS), '-i', 'pipe:0',
      '-filter_complex', FILTER,
      '-map', '[v]', ...ENCODE, '-f', 'mp4', outFile,
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    ff.stderr.on('data', (d) => (err += d));
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg failed on ${outFile}: ${err}`))));
    // If ffmpeg dies the pipe breaks; 'close' reports why, with its stderr.
    ff.stdin.on('error', () => {});
    (async () => {
      for (const region of regions()) {
        if (ff.exitCode !== null) return;
        if (!ff.stdin.write(region)) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end();
    })().catch(reject);
  });
}

// The seam, measured: the first and last frames must be the poster, or a
// platform that swaps the og:image for the playing video would visibly jump and
// the loop would hitch. 40 dB PSNR is past visible difference; what remains is
// the RGB -> 4:2:0 round trip. Only a video that passes enters the cache.
const SEAM_DB = 40;
function seamPsnr(posterFile, videoFile) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, [
      '-hide_banner', '-i', posterFile, '-i', videoFile, '-lavfi',
      `[1:v]select='eq(n\\,0)+eq(n\\,${FRAMES - 1})',setpts=N/(${FPS}*TB),format=rgb24[v];` +
      `[0:v]loop=loop=1:size=1,setpts=N/(${FPS}*TB),format=rgb24[p];[p][v]psnr`,
      '-f', 'null', '-',
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    ff.stderr.on('data', (d) => (err += d));
    ff.on('error', reject);
    ff.on('close', (code) => {
      const min = err.match(/PSNR .*min:([\d.]+|inf)/)?.[1];
      if (code !== 0 || !min) return reject(new Error(`seam check failed on ${videoFile}: ${err}`));
      resolve(min === 'inf' ? Infinity : +min);
    });
  });
}

// The logo's rect for every frame, as the exact SVG to render, or null where the
// frame is at rest. Identical consecutive poses (holds) share one string.
function framePlan(perf) {
  const restKey = JSON.stringify(REST);
  let lastKey = '', svg = null;
  return Array.from({ length: FRAMES }, (_, i) => {
    const key = JSON.stringify(poseAt(perf, i / FPS));
    if (key === restKey) return null;
    if (key !== lastKey) { svg = regionSvg(JSON.parse(key)); lastKey = key; }
    return svg;
  });
}

// At rest the rect is cut from the poster itself, so the loop's seam is the
// poster exactly; in motion it is rendered in that frame's pose.
function* logoRegions(poster, plan) {
  const rest = Buffer.allocUnsafe(REGION.w * REGION.h * 3);
  for (let row = 0; row < REGION.h; row++) {
    poster.copy(rest, row * REGION.w * 3, ((REGION.y + row) * W + REGION.x) * 3, ((REGION.y + row) * W + REGION.x + REGION.w) * 3);
  }
  let last = null, region = null;
  for (const svg of plan) {
    if (svg === null) { yield rest; continue; }
    if (svg !== last) {
      region = rgb(new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels);
      // Ink on the rect's edge means the pose reached past it and the pasted
      // logo would be clipped mid-gesture.
      for (let i = 0; i < REGION.w * REGION.h; i++) {
        const x = i % REGION.w, y = (i / REGION.w) | 0;
        if ((x === 0 || y === 0 || x === REGION.w - 1 || y === REGION.h - 1) && region[i * 3] !== PAPER_RGB) {
          throw new Error('og video: the logo moved outside its re-rendered rect; widen REGION');
        }
      }
      last = svg;
    }
    yield region;
  }
}

const used = new Set();
let encoded = 0;
async function preview({ name, title, dateLabel }) {
  const resvg = new Resvg(card({ title, dateLabel }), {
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Source Serif 4 SemiBold' },
  });
  const img = resvg.render();
  const pngBytes = img.asPng();
  const png = join(OUT, `${name}.png`);
  writeFileSync(png, pngBytes);

  const plan = framePlan(choreography(name));
  const hash = createHash('sha256');
  for (const part of [pkgVersion('ffmpeg-static'), pkgVersion('@resvg/resvg-js'), FPS, FRAMES, JSON.stringify(REGION), FILTER, ENCODE.join(' ')]) hash.update(`${part}\0`);
  hash.update(pngBytes);
  for (const svg of plan) hash.update(`${svg ?? ''}\0`);
  const cached = join(CACHE, `${hash.digest('hex').slice(0, 32)}.mp4`);
  used.add(cached);

  if (!existsSync(cached)) {
    const tmp = `${cached}.${process.pid}.tmp`;
    await encode(png, () => logoRegions(rgb(img.pixels), plan), tmp);
    const seam = await seamPsnr(png, tmp);
    if (seam < SEAM_DB) throw new Error(`${name}.mp4: first/last frame is ${seam.toFixed(1)} dB from the poster, need ${SEAM_DB}`);
    copyFileSync(tmp, cached);
    rmSync(tmp);
    encoded++;
  }
  copyFileSync(cached, join(OUT, `${name}.mp4`));
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

const jobs = [];
for (const file of readdirSync(CONTENT).sort()) {
  if (!file.endsWith('.md')) continue;
  const raw = readFileSync(join(CONTENT, file), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  if (/^draft:\s*true/m.test(fm)) continue;
  const title = fm.match(/^title:\s*"(.*)"/m)?.[1];
  const date = fm.match(/^date:\s*"(.*)"/m)?.[1];
  if (!title || !date) continue;
  jobs.push({ name: file.replace(/\.md$/, ''), title, dateLabel: fmtDate(date) });
}
const essays = jobs.length;
jobs.push({ name: 'default', title: 'John Milinovich', dateLabel: '' });

// One single-threaded encoder per core, capped so a many-core build box doesn't
// run dozens of ffmpegs at once; frames are cheap, x264 is the cost.
const queue = [...jobs];
await Promise.all(Array.from({ length: Math.min(8, availableParallelism()) }, async () => {
  while (queue.length) await preview(queue.shift());
}));
// Keep the cache to what this build uses, so edits don't pile up stale videos.
for (const f of readdirSync(CACHE)) if (!used.has(join(CACHE, f))) rmSync(join(CACHE, f));
console.log(`generated ${essays} essay OG cards + videos, plus default.png/.mp4 → public/og/ (${encoded} encoded, ${jobs.length - encoded} cached)`);
