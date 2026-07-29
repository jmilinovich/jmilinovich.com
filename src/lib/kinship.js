// Kinship — which essays sit next to which, decided by the essays themselves.
//
// The same principle the fingerprint runs on: the text is the seed. No tags to
// backfill, no `related:` field to maintain, no model. TF-IDF over the corpus,
// cosine similarity, top three. Post 47 wires itself up.
//
// Deterministic by construction: same corpus → same neighbours, every build.
// Quality gate (DESIGN.md): `node scripts/kinship-sheet.mjs` prints every
// essay's picks for human review. Computed picks get the same contact sheet
// every generated drawing gets.

// Function words plus the filler that survives them. Terms appearing in over
// half the corpus are dropped anyway (see DF_MAX) — this list is for the ones
// too frequent to be signal but too rare to be caught by that cut.
const STOP = new Set(
  `a about above across after again against all almost along already also although always am among an and another any anyone anything are aren't around as at away back be became because become becomes been before began begin behind being below best better between both but by came can cannot come comes could couldn't did didn't do does doesn't doing don't done down during each either else enough even ever every everyone everything few first for from further get gets getting go goes going gone good got great had hadn't half has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's however i i'd i'll i'm i've if in inside instead into is isn't it it's its itself just keep kept knew know known lately least less let let's like liked likely little long look looked looking lot lots made make makes making many may maybe me mean means might mine more most much must mustn't my myself near need needs never new next no nobody nor not nothing now of off often old on once one only onto or other others ought our ours ourselves out outside over own part perhaps put quite rather really right said same saw say says see seen seems shan't she she'd she'll she's short should shouldn't since small so some someone something sometimes soon still such take takes taken than that that's the their theirs them themselves then there there's these they they'd they'll they're they've thing things think third this those though thought three through thus to together too took toward turn turned two under until up upon us use used uses using very want wanted was wasn't way ways we we'd we'll we're we've well went were weren't what what's when when's where where's whether which while who who's whole whom why why's will with within without won't would wouldn't yet you you'd you'll you're you've your yours yourself yourselves`.split(
    /\s+/
  )
);

// Terms in more than this share of the corpus carry no discriminating power on
// a 46-essay archive — every essay here is about products and technology.
const DF_MAX = 0.5;
// A term in exactly one essay can never create kinship; dropping it keeps the
// vectors small and the norms honest.
const DF_MIN = 2;
// Titles are the human summary of an essay; count them like a paragraph of body.
const TITLE_WEIGHT = 3;
// Local scaling (Zelnik-Manor & Perona, adapted to similarity): divide each
// pair's score by both essays' own local density, measured as their K-th best
// match. Raw cosine has a hubness problem — long, vocabulary-broad essays are
// everyone's nearest neighbour, and the first contact sheet proved it: URX's YC
// story was recommended by 12 of 44 essays and four hubs took a third of every
// slot on the site. Scaling by local density spreads that back out without
// hand-tuning a blocklist.
const SCALE_K = 7;

// Markdown → prose. Link *targets* go: two essays both citing canva.com are not
// thereby related, and URL tokens were the loudest false signal in testing.
function prose(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^>\s?/gm, ' ')
    .replace(/[*_~`#]/g, ' ');
}

// Crude, deliberate stemming: fold plurals and possessives so "agents" and
// "agent" are one term. Anything cleverer starts mangling real words.
function stem(w) {
  if (w.length > 4 && w.endsWith("'s")) w = w.slice(0, -2);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('sses')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is|as)$/.test(w)) return w.slice(0, -1);
  return w;
}

function tokens(text) {
  const out = [];
  const words = text.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z][a-z'-]{2,}/g) || [];
  for (const raw of words) {
    const w = raw.replace(/^-+|-+$/g, '');
    if (w.length < 3 || STOP.has(w)) continue;
    const s = stem(w);
    if (s.length < 3 || STOP.has(s)) continue;
    out.push(s);
  }
  return out;
}

function counted(list) {
  const m = new Map();
  for (const t of list) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

/**
 * Build every essay's neighbours in one pass.
 *
 * @param docs  [{ id, title, body }] — every essay to vectorise, including
 *              unlisted ones (they deserve a foot too).
 * @param opts.linkable  Set of ids allowed to be recommended. Unlisted and
 *              draft essays are deliberately off every listing, so they are
 *              never anyone's neighbour.
 * @param opts.count  How many neighbours per essay.
 * @returns Map<id, {id, score}[]> — scores included so the contact sheet can
 *          show a weak pick as a weak number instead of leaving it to be guessed.
 */
export function kinship(docs, { linkable, count = 3 } = {}) {
  const n = docs.length;
  const tfs = docs.map((d) => {
    const title = tokens(d.title || '');
    const all = tokens(prose(d.body || ''));
    for (let k = 0; k < TITLE_WEIGHT; k++) all.push(...title);
    return counted(all);
  });

  const df = new Map();
  for (const tf of tfs) for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);

  const idf = new Map();
  for (const [t, d] of df) {
    if (d < DF_MIN || d > n * DF_MAX) continue;
    idf.set(t, Math.log((n + 1) / (d + 1)) + 1);
  }

  // Sublinear tf, l2-normalised, so a long essay is not automatically everyone's
  // neighbour and a short one is not exiled.
  const vecs = tfs.map((tf) => {
    const v = new Map();
    let sq = 0;
    for (const [t, c] of tf) {
      const w = idf.get(t);
      if (!w) continue;
      const x = (1 + Math.log(c)) * w;
      v.set(t, x);
      sq += x * x;
    }
    const norm = Math.sqrt(sq) || 1;
    for (const [t, x] of v) v.set(t, x / norm);
    return v;
  });

  const sim = (a, b) => {
    // walk the shorter vector
    const [s, l] = a.size <= b.size ? [a, b] : [b, a];
    let dot = 0;
    for (const [t, x] of s) {
      const y = l.get(t);
      if (y) dot += x * y;
    }
    return dot;
  };

  // Full similarity matrix — 44 essays is 946 pairs, so measure everything once
  // and let local scaling read the whole picture.
  const raw = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = sim(vecs[i], vecs[j]);
      raw[i][j] = s;
      raw[j][i] = s;
    }
  }

  // Each essay's local density: its K-th best match anywhere in the corpus.
  // A hub — close to everything — gets a large sigma and is discounted for it.
  const sigma = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const others = Array.from(raw[i]).filter((_, j) => j !== i).sort((a, b) => b - a);
    sigma[i] = Math.max(others[Math.min(SCALE_K, others.length) - 1] || 0, 1e-4);
  }

  const map = new Map();
  for (let i = 0; i < n; i++) {
    const scored = [];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      if (linkable && !linkable.has(docs[j].id)) continue;
      scored.push({
        id: docs[j].id,
        score: raw[i][j] / Math.sqrt(sigma[i] * sigma[j]),
        cosine: raw[i][j],
      });
    }
    // Ties break on id so the build is byte-identical run to run.
    scored.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    map.set(docs[i].id, scored.slice(0, count));
  }
  return map;
}
