// The check for share previews (2026-10-24): every page that ships an og:image
// card ships its og:video twin, and every promise the tags make about that file
// is true of the bytes — it exists, it is H.264 in MP4 at the declared size, its
// index comes first so a preview can start before it finishes loading, it carries
// no audio, and it stays small enough for a chat preview to fetch.
//
//   npm run build && node scripts/check-og.mjs

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://mili.dev';
const MAX_BYTES = 300 * 1024;

let failures = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++; };

async function* html(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* html(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const meta = (doc, prop) => {
  const all = [...doc.matchAll(new RegExp(`<meta property="${prop.replace(/[.:]/g, '\\$&')}" content="([^"]*)"`, 'g'))];
  return all.length === 1 ? all[0][1] : all.length ? all.map((m) => m[1]) : undefined;
};

// Just enough ISO-BMFF to verify the container's claims.
function boxes(buf, start = 0, end = buf.length) {
  const out = [];
  for (let o = start; o + 8 <= end;) {
    let size = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    let header = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(o + 8)); header = 16; }
    if (size === 0) size = end - o;
    if (size < header || o + size > end) throw new Error(`malformed ${type} box`);
    out.push({ type, start: o + header, end: o + size });
    o += size;
  }
  return out;
}
const child = (buf, box, type) => boxes(buf, box.start, box.end).find((b) => b.type === type);

function inspect(buf) {
  const top = boxes(buf);
  const order = top.map((b) => b.type);
  const moov = top.find((b) => b.type === 'moov');
  if (order[0] !== 'ftyp') throw new Error('does not start with ftyp');
  if (!moov) throw new Error('no moov box');
  if (order.indexOf('moov') > order.indexOf('mdat')) throw new Error('moov after mdat (not faststart)');
  const traks = boxes(buf, moov.start, moov.end).filter((b) => b.type === 'trak');
  if (traks.length !== 1) throw new Error(`${traks.length} tracks, expected one video track and no audio`);
  const trak = traks[0];
  const tkhd = child(buf, trak, 'tkhd');
  const v = buf[tkhd.start];
  const dims = tkhd.start + (v === 1 ? 88 : 76);
  const width = buf.readUInt32BE(dims) / 65536, height = buf.readUInt32BE(dims + 4) / 65536;
  const mdia = child(buf, trak, 'mdia');
  const handler = buf.toString('latin1', child(buf, mdia, 'hdlr').start + 8, child(buf, mdia, 'hdlr').start + 12);
  const stsd = child(buf, child(buf, child(buf, mdia, 'minf'), 'stbl'), 'stsd');
  const codec = buf.toString('latin1', stsd.start + 12, stsd.start + 16);
  // avcC sits after the 78-byte visual sample entry; profile 100 = High
  const entry = { start: stsd.start + 8 + 8 + 78, end: stsd.start + 8 + buf.readUInt32BE(stsd.start + 8) };
  const avcC = child(buf, entry, 'avcC');
  const profile = avcC && buf[avcC.start + 1], level = avcC && buf[avcC.start + 3];
  const mvhd = child(buf, moov, 'mvhd');
  const mv = buf[mvhd.start];
  const timescale = buf.readUInt32BE(mvhd.start + (mv === 1 ? 20 : 12));
  const duration = mv === 1 ? Number(buf.readBigUInt64BE(mvhd.start + 24)) : buf.readUInt32BE(mvhd.start + 16);
  return { width, height, handler, codec, profile, level, seconds: duration / timescale };
}

let pages = 0, withVideo = 0;
const checked = new Map();
for await (const file of html(DIST)) {
  const doc = await readFile(file, 'utf8');
  const page = '/' + relative(DIST, file);
  const image = meta(doc, 'og:image');
  if (!image) {
    // Astro's redirect stubs carry no metadata at all; anything else must.
    if (!/http-equiv="refresh"/.test(doc)) fail(`${page}: no og:image`);
    continue;
  }
  pages++;
  if (Array.isArray(image)) { fail(`${page}: ${image.length} og:image tags`); continue; }
  const card = image.match(/^https:\/\/mili\.dev\/og\/([^/]+)\.png$/);
  const video = meta(doc, 'og:video');
  if (!card) { if (video) fail(`${page}: og:video without a generated card to pair with`); continue; }
  const name = card[1];
  const want = `${SITE}/og/${name}.mp4`;
  if (video !== want) { fail(`${page}: og:video is ${JSON.stringify(video)}, expected ${want}`); continue; }
  withVideo++;
  if (meta(doc, 'og:video:secure_url') !== want) fail(`${page}: og:video:secure_url does not match og:video`);
  if (meta(doc, 'og:video:type') !== 'video/mp4') fail(`${page}: og:video:type is not video/mp4`);
  const w = +meta(doc, 'og:video:width'), h = +meta(doc, 'og:video:height');
  if (+meta(doc, 'og:image:width') !== w || +meta(doc, 'og:image:height') !== h) fail(`${page}: card and video sizes differ`);
  // og:type video.* would make Discord draw a play button on an essay link.
  if (meta(doc, 'og:type') !== 'website') fail(`${page}: og:type is ${meta(doc, 'og:type')}, expected website`);

  if (!checked.has(name)) {
    const path = join(DIST, 'og', `${name}.mp4`);
    try {
      const [buf, png] = await Promise.all([readFile(path), stat(join(DIST, 'og', `${name}.png`))]);
      const facts = inspect(buf);
      if (buf.length > MAX_BYTES) fail(`og/${name}.mp4: ${(buf.length / 1024).toFixed(0)} KB, budget ${MAX_BYTES / 1024} KB`);
      if (facts.handler !== 'vide' || facts.codec !== 'avc1') fail(`og/${name}.mp4: ${facts.handler}/${facts.codec}, expected vide/avc1`);
      if (facts.profile !== 100 || facts.level > 40) fail(`og/${name}.mp4: H.264 profile ${facts.profile} level ${facts.level}, expected High ≤ 4.0`);
      if (Math.abs(facts.seconds - 8) > 0.05) fail(`og/${name}.mp4: ${facts.seconds.toFixed(2)}s, expected the 8s loop`);
      if (!png.size) fail(`og/${name}.png is empty`);
      checked.set(name, facts);
    } catch (e) {
      fail(`og/${name}.mp4: ${e.code === 'ENOENT' ? 'missing' : e.message}`);
      checked.set(name, null);
    }
  }
  const facts = checked.get(name);
  if (facts && (facts.width !== w || facts.height !== h)) fail(`${page}: declares ${w}×${h}, file is ${facts.width}×${facts.height}`);
}

// A vacuous pass is a failure: the essays alone are dozens of pages.
if (withVideo < 40) fail(`only ${withVideo} pages carry og:video`);

if (failures) {
  console.error(`og check: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`og check: ${withVideo}/${pages} pages pair their card with a video; ${checked.size} videos verified`);
