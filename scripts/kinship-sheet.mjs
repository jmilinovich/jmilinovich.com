// Contact sheet for computed kinship (DESIGN.md §quality gate): print every
// essay's onward picks and their similarity scores, so a dud is visible to a
// human before it ships. Algorithmic slop is still slop.
//
//   node scripts/kinship-sheet.mjs           every essay
//   node scripts/kinship-sheet.mjs weakest   the 12 loosest picks only

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kinship } from '../src/lib/kinship.js';

const DIR = new URL('../src/content/writing/', import.meta.url).pathname;

function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, '');
    data[kv[1]] = v === 'true' ? true : v === 'false' ? false : v;
  }
  return { data, body: m[2] };
}

// `related:` overrides live in the frontmatter as a yaml list; the flat parser
// above only reads scalars, so read the list separately.
function* raw_related(raw) {
  const block = raw.match(/^related:\n((?:\s+-\s+\S+\n)+)/m);
  if (!block) return;
  for (const line of block[1].trim().split('\n')) yield line.replace(/^\s*-\s*/, '').trim();
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.md'));
const all = [];
for (const f of files) {
  const { data, body } = frontmatter(await readFile(join(DIR, f), 'utf8'));
  if (data.draft) continue;
  // `related:` is a yaml list, which the parser above doesn't read — pull it directly.
  const rel = [...raw_related(await readFile(join(DIR, f), 'utf8'))];
  all.push({ id: f.replace(/\.md$/, ''), title: data.title, date: data.date, unlisted: !!data.unlisted, related: rel, body });
}
all.sort((a, b) => (a.date < b.date ? 1 : -1));

const linkable = new Set(all.filter((p) => !p.unlisted).map((p) => p.id));
const map = kinship(all, { linkable, count: 3 });
const byId = new Map(all.map((p) => [p.id, p]));

const mode = process.argv[2];
const rows = [];
for (const p of all) {
  const picks = p.related.length
    ? p.related.map((id) => ({ id, score: NaN, cosine: NaN }))
    : map.get(p.id);
  rows.push({ post: p, picks, override: p.related.length > 0, best: p.related.length ? Infinity : picks[0].score });
}

const show = mode === 'weakest' ? [...rows].sort((a, b) => a.best - b.best).slice(0, 12) : rows;

for (const r of show) {
  const tag = [r.post.unlisted && '[unlisted]', r.override && '[hand-set]'].filter(Boolean).join(' ');
  console.log(`\n${r.post.title}  ${tag ? tag + ' ' : ''}(${r.post.date})`);
  for (const pick of r.picks) {
    const t = byId.get(pick.id);
    const score = r.override ? '  —  ' : `${pick.score.toFixed(3)}`;
    const cos = r.override ? '' : ` (cos ${pick.cosine.toFixed(3)})`;
    console.log(`   ${score}  ${t.title}  (${t.date})${cos}`);
  }
}

// Scores are locally scaled, not raw cosine — see SCALE_K in src/lib/kinship.js.
const bests = rows.filter((r) => !r.override).map((r) => r.best).sort((a, b) => a - b);
const med = bests[Math.floor(bests.length / 2)];
console.log(
  `\n— ${all.length} essays (${linkable.size} linkable, ${rows.filter((r) => r.override).length} hand-set) · computed top-pick: min ${bests[0].toFixed(3)}, median ${med.toFixed(3)}, max ${bests[bests.length - 1].toFixed(3)}`
);
