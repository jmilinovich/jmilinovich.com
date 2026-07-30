// The check for the essay foot (2026-07-29): every published essay must offer
// a way onward, and none of those ways may be a dead link, itself, or a post
// deliberately kept off every listing.
//
//   npm run build && node scripts/check-essay-foot.mjs

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist/writing/', import.meta.url).pathname;
const SRC = new URL('../src/content/writing/', import.meta.url).pathname;

const flag = async (f, key) => new RegExp(`^${key}: true`, 'm').test(await readFile(join(SRC, f), 'utf8'));
const md = (await readdir(SRC)).filter((f) => f.endsWith('.md'));
const drafts = new Set();
const unlisted = new Set();
for (const f of md) {
  if (await flag(f, 'draft')) drafts.add(f.replace(/\.md$/, ''));
  if (await flag(f, 'unlisted')) unlisted.add(f.replace(/\.md$/, ''));
}

const slugs = (await readdir(DIST, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
let failures = 0;
const fail = (msg) => { console.error(`  ✗ ${msg}`); failures++; };

for (const slug of slugs) {
  const html = await readFile(join(DIST, slug, 'index.html'), 'utf8');

  const block = html.match(/<nav class="keep-reading"[\s\S]*?<\/nav>/);
  if (!block) { fail(`${slug}: no keep-reading block`); continue; }

  const links = [...block[0].matchAll(/href="\/writing\/([^"/]+)\/?"/g)].map((m) => m[1]);
  if (links.length !== 3) fail(`${slug}: ${links.length} onward links, expected 3`);
  if (links.includes(slug)) fail(`${slug}: recommends itself`);
  for (const l of new Set(links)) {
    if (!slugs.includes(l)) fail(`${slug}: onward link "${l}" does not exist`);
    if (drafts.has(l)) fail(`${slug}: onward link "${l}" is a draft`);
    if (unlisted.has(l)) fail(`${slug}: onward link "${l}" is unlisted`);
  }
  if (new Set(links).size !== links.length) fail(`${slug}: duplicate onward links`);
  if (!/href="\/writing"[^>]*>All writing/.test(block[0])) fail(`${slug}: no "All writing" line`);

  // The fingerprint still closes the essay; the foot comes after it.
  const fp = html.indexOf('class="fingerprint"');
  if (fp === -1 || fp > html.indexOf('class="keep-reading"')) fail(`${slug}: foot is not after the fingerprint`);
}

// The global escape, every page. This gate runs on every build (postbuild), so a
// page that simply doesn't exist any more is skipped rather than failing a deploy
// for a reason unrelated to the foot — the homepage is the only one required.
const pages = ['index.html', 'writing/index.html', 'talks/index.html', 'projects/index.html', 'commits/index.html'];
let checkedPages = 0;
for (const p of pages) {
  let html;
  try {
    html = await readFile(new URL(`../dist/${p}`, import.meta.url).pathname, 'utf8');
  } catch {
    if (p === 'index.html') fail('dist/index.html is missing');
    continue;
  }
  checkedPages++;
  const footer = html.match(/<footer[\s\S]*?<\/footer>/);
  if (!footer) { fail(`${p}: no footer`); continue; }
  if (!/href="\/"[^>]*>Home</.test(footer[0])) fail(`${p}: footer has no Home link`);
}

console.log(
  failures
    ? `\n${failures} failure(s) across ${slugs.length} essays.`
    : `✓ ${slugs.length} essays: 3 live onward links each, all after the fingerprint; Home in the footer on ${checkedPages} page types.`
);
process.exit(failures ? 1 : 0);
