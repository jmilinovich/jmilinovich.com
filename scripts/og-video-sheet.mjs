// Contact sheet for the og:video performances (DESIGN.md §Process, OG cards):
// one row per page, the logo every half second across the 8s loop. Human review,
// like the glyph and kinship sheets — run it after touching scripts/og-motion.mjs
// or after a logo-animations update.
//
//   node scripts/generate-og.mjs && node scripts/og-video-sheet.mjs [slug ...]
//   → screenshots/og-video-sheet.png

import { mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const OG = new URL('../public/og/', import.meta.url).pathname;
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const all = readdirSync(OG).filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4)).sort();
const slugs = process.argv.length > 2 ? process.argv.slice(2) : ['default', ...all.filter((s) => s !== 'default').slice(0, 7)];

// The logo's rect from generate-og.mjs (REGION), at half size; 16 frames per row.
const inputs = slugs.flatMap((s) => ['-i', `${OG}${s}.mp4`]);
const rows = slugs.map((_, i) => `[${i}:v]select='not(mod(n\\,15))',crop=420:300:740:170,scale=210:150,tile=16x1[r${i}]`);
const stack = slugs.length > 1 ? `;${slugs.map((_, i) => `[r${i}]`).join('')}vstack=${slugs.length}` : '';
execFileSync(ffmpeg, ['-v', 'error', '-y', ...inputs, '-filter_complex', rows.join(';') + stack, '-frames:v', '1', `${OUT}og-video-sheet.png`]);
console.log(`${slugs.length} performances → screenshots/og-video-sheet.png\n  ${slugs.join('\n  ')}`);
