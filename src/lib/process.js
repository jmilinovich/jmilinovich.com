// The Process system — one deterministic generative pipeline for the whole site.
// hash(seed) → PRNG → value-noise flow field → streamlines. See DESIGN.md §Process.
// Build-time renderers (the essay glyphs) live here; the homepage substrate
// shares the same hash/PRNG/noise primitives, inlined in its page script.

export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// value noise on a hashed lattice — no arrays, fully deterministic per seed
export function makeNoise(seedInt) {
  const lattice = (ix, iy) => {
    let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seedInt, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) % 100000) / 100000;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = smooth(x - ix), fy = smooth(y - iy);
    const a = lattice(ix, iy), b = lattice(ix + 1, iy);
    const c = lattice(ix, iy + 1), d = lattice(ix + 1, iy + 1);
    return a + (b - a) * fx + (c + (d - c) * fx - (a + (b - a) * fx)) * fy;
  };
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// The homepage instrument (v4, "the substrate") runs entirely client-side in
// src/pages/index.astro — its geometry depends on measured DOM rects (text is
// stone), which no build-time renderer can know. The v3 band renderers
// (buildRoots/rootsSvg) retired with it.

// ---- the essay fingerprint: growth fold (2026-07-28, via /grill-me) -------
// A differential-growth line grown from the essay's own text — one growth
// epoch per paragraph, insertion budget ∝ paragraph words; '?' sentences
// locally raise repulsion (buckles); em-dashes strike sharp kicks the growth
// then absorbs. Faint ghosts are the same line at three earlier moments.
// Deterministic: seeded by the slug, shaped by the words. No axis, no chart.
// Rendered at build into the end-of-essay instrument (hairline + caption).

// Classic text stats from raw markdown — no models, no randomness.
export function essayFeatures(body) {
  let codeBlocks = 0;
  let text = body.replace(/```[\s\S]*?```/g, () => { codeBlocks++; return '\n\n'; });
  text = text.replace(/^(#{1,6})\s+(.*)$/gm, '\n\n');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  text = text.replace(/<[^>]+>/g, '').replace(/^>\s?/gm, '').replace(/[*_~`]/g, '');
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean);
  const paragraphs = [];
  let words = 0;
  for (const p of paras) {
    const parts = p.split(/(?<=[.?!])\s+(?=[A-Z"'“(])|(?<=[.?!])$/).map((s) => s.trim()).filter(Boolean);
    const sentences = parts
      .map((s) => ({
        w: (s.match(/[A-Za-z0-9''’-]+/g) || []).length,
        end: /\?$/.test(s) ? '?' : /!$/.test(s) ? '!' : /:$/.test(s) ? ':' : '.',
        dash: (s.match(/—|--/g) || []).length,
      }))
      .filter((s) => s.w > 0);
    if (!sentences.length) continue;
    const pw = sentences.reduce((a, s) => a + s.w, 0);
    paragraphs.push({ words: pw, sentences });
    words += pw;
  }
  return { words, paragraphs };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (n) => Math.round(n * 10) / 10;

// Midpoint-quadratic smoothing — the drawing grammar shared by the fingerprint's
// line, its ghosts, and the index detail, so all three read as one hand.
function smoothCommands(pts) {
  const cmds = [];
  for (let i = 1; i < pts.length - 1; i++) {
    cmds.push({ cx: pts[i].x, cy: pts[i].y, x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 });
  }
  return { start: pts[0], cmds, last: pts[pts.length - 1] };
}

// The one simulation behind BOTH per-essay marks (2026-07-29, via /grill-me).
// One organism per essay: the end-of-essay fingerprint draws the whole mature
// line, and the index/byline mark magnifies one stretch of that same line, so
// the two marks are the same object and cannot drift apart. `stopAtNodes` halts
// growth early; it is retained for experiments (capturing the line young was
// tried for the index mark and rejected — see detailPath).
function growEssayLine(slug, features, stopAtNodes = 0) {
  const W = 575, H = 136;
  const seed = xmur3(slug);
  const rand = mulberry32(seed());
  const noise = makeNoise(seed());
  // a post with no parseable prose (images-only, frontmatter-only draft) still
  // builds: grow from one small synthetic paragraph rather than crashing
  const paras = features.paragraphs.length
    ? features.paragraphs
    : [{ words: 24, sentences: [{ w: 24, end: '.', dash: 0 }] }];
  const words = Math.max(features.words, 24);
  const pc = paras.length;

  const totalW = paras.reduce((a, p) => a + p.words, 0) || 1;
  let cum = 0;
  const paraFacts = paras.map((p) => {
    const sents = p.sentences || [];
    const facts = { words: p.words, avgSent: sents.length ? p.words / sents.length : 0, questions: [], dashes: [] };
    for (const s of sents) {
      const frac = (cum + s.w / 2) / totalW;
      if (s.end === '?') facts.questions.push(frac);
      if (s.dash > 0) for (let k = 0; k < s.dash; k++) facts.dashes.push(frac);
      cum += s.w;
    }
    return facts;
  });
  const maxPW = Math.max(...paraFacts.map((f) => f.words), 1);
  const maxAS = Math.max(...paraFacts.map((f) => f.avgSent), 1);

  const N0 = 12;
  const nTarget = Math.min(600, Math.round(70 * Math.pow(Math.max(words, 60) / 152, 0.62)));
  const R = clamp(18 - 2.6 * Math.log2(Math.max(words, 60) / 152), 9.5, 18);
  const budgets = paraFacts.map((f) => Math.max(0, Math.round((nTarget - N0) * f.words / totalW)));

  const cx = W * 0.36, cy = H * (0.46 + rand() * 0.12);
  const tilt = (rand() - 0.5) * 0.9;
  const len0 = 60 + rand() * 18;
  const nodes = [];
  for (let i = 0; i < N0; i++) {
    const t = i / (N0 - 1) - 0.5;
    const bow = Math.sin(t * Math.PI) * (6 + rand() * 5);
    nodes.push({ x: cx + Math.cos(tilt) * t * len0 - Math.sin(tilt) * bow, y: cy + Math.sin(tilt) * t * len0 + Math.cos(tilt) * bow, e: 0 });
  }

  const ML = 30, MR = 40, MT = 16, MB = 18;
  const kAttract = 0.34, kRepel = 0.6, maxStep = 2.2, nz = 0.018;
  let lastInserted = nodes[nodes.length - 1];

  function insertNode(epoch) {
    let bi = 0, bl = -1;
    for (let i = 0; i < nodes.length - 1; i++) {
      const dx = nodes[i + 1].x - nodes[i].x, dy = nodes[i + 1].y - nodes[i].y;
      const l = dx * dx + dy * dy;
      if (l > bl) { bl = l; bi = i; }
    }
    const a = nodes[bi], b = nodes[bi + 1];
    const n = { x: (a.x + b.x) / 2 + (rand() - 0.5) * 1.2, y: (a.y + b.y) / 2 + (rand() - 0.5) * 1.2, e: epoch };
    nodes.splice(bi + 1, 0, n);
    lastInserted = n;
  }

  function relax(buckleWins, iters) {
    for (let it = 0; it < iters; it++) {
      const n = nodes.length;
      const fx = new Float64Array(n), fy = new Float64Array(n);
      for (let i = 1; i < n - 1; i++) {
        fx[i] += ((nodes[i - 1].x + nodes[i + 1].x) / 2 - nodes[i].x) * kAttract;
        fy[i] += ((nodes[i - 1].y + nodes[i + 1].y) / 2 - nodes[i].y) * kAttract;
      }
      for (let i = 0; i < n; i++) {
        let mulI = 1;
        for (const w of buckleWins) if (Math.abs(i - w.idx) <= w.half) mulI = w.mul;
        const Ri = R * (mulI > 1 ? 1.35 : 1);
        for (let j = i + 2; j < n; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          if (Math.abs(dx) + Math.abs(dy) > Ri * 1.5) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > Ri * Ri || d2 === 0) continue;
          const d = Math.sqrt(d2);
          let mulJ = 1;
          for (const w of buckleWins) if (Math.abs(j - w.idx) <= w.half) mulJ = w.mul;
          const f = kRepel * (1 - d / Ri) * Math.max(mulI, mulJ);
          const ux = dx / d, uy = dy / d;
          fx[i] += ux * f; fy[i] += uy * f;
          fx[j] -= ux * f; fy[j] -= uy * f;
        }
      }
      for (let i = 0; i < n; i++) {
        const a = noise(nodes[i].x * nz, nodes[i].y * nz) * Math.PI * 4;
        fx[i] += Math.cos(a) * 0.1; fy[i] += Math.sin(a) * 0.1;
        if (nodes[i].x < ML) fx[i] += (ML - nodes[i].x) * 0.12;
        if (nodes[i].x > W - MR) fx[i] -= (nodes[i].x - (W - MR)) * 0.12;
        if (nodes[i].y < MT) fy[i] += (MT - nodes[i].y) * 0.14;
        if (nodes[i].y > H - MB) fy[i] -= (nodes[i].y - (H - MB)) * 0.14;
        nodes[i].x += clamp(fx[i], -maxStep, maxStep);
        nodes[i].y += clamp(fy[i], -maxStep, maxStep);
      }
    }
  }

  const snapshots = [];
  const snapAt = new Set([0.35, 0.6, 0.82].map((f) => Math.floor(pc * f)).filter((i) => i > 0 && i < pc - 1));
  const itersPerEpoch = clamp(Math.round(200 / pc) + 8, 10, 24);

  for (let p = 0; p < pc; p++) {
    const f = paraFacts[p];
    const buckleWins = f.questions.map((frac) => ({
      idx: Math.round(frac * (nodes.length - 1)),
      half: Math.max(3, Math.round(nodes.length * 0.05)),
      mul: 2.4,
    }));
    for (const frac of f.dashes) {
      const idx = Math.round(frac * (nodes.length - 1));
      const ang = rand() * Math.PI * 2;
      const mag = 8 + rand() * 5;
      for (let o = -3; o <= 3; o++) {
        const i = idx + o;
        if (i < 0 || i >= nodes.length) continue;
        const fall = 1 - Math.abs(o) / 4;
        nodes[i].x += Math.cos(ang) * mag * fall;
        nodes[i].y += Math.sin(ang) * mag * fall;
      }
    }
    const budget = budgets[p];
    for (let it = 0; it < itersPerEpoch; it++) {
      const due = Math.round(((it + 1) / itersPerEpoch) * budget) - Math.round((it / itersPerEpoch) * budget);
      for (let k = 0; k < due; k++) insertNode(p);
      relax(buckleWins, 1);
      // The seedling: the same line the moment it first reaches the target node
      // count, settled by that iteration's relax like every other state. Keyed to
      // node count, not paragraph fraction, so density is constant across the
      // index however long the essay runs.
      if (stopAtNodes && nodes.length >= stopAtNodes) {
        return { W, H, nodes, snapshots, paraFacts, maxPW, maxAS, lastInserted };
      }
    }
    if (snapAt.has(p)) snapshots.push(nodes.map((nd) => ({ x: nd.x, y: nd.y })));
  }
  relax([], 22);
  return { W, H, nodes, snapshots, paraFacts, maxPW, maxAS, lastInserted };
}

// One full growth per slug per build — the index, the byline and the fingerprint
// all read the same organism, so it is simulated once and shared.
const grown = new Map();
function grownLine(slug, features) {
  let g = grown.get(slug);
  if (!g) { g = growEssayLine(slug, features); grown.set(slug, g); }
  return g;
}

// The index/byline mark: a DETAIL of this essay's fingerprint — the most folded
// stretch of the same mature line, cropped square and blown up. Capturing the
// line young was tried first and rejected on the contact sheet (2026-07-29): the
// simulation's frame is ~4:1 wide, so every early state normalises to a flat
// dash and the index went visually dead at every node count from 24 to 120.
// Maturity is where the folding lives, so we magnify rather than rewind.
//
// A fixed-length run keeps density constant down the index however long the
// essay runs; picking the run by total turning angle keeps the mark characterful.
// One uniform stroke — no ghosts, no sig dot, no weight ramp (owner call
// 2026-07-29). Kinship is carried by geometry, not ornament.
const DETAIL_NODES = 28;
export function detailPath(slug, features) {
  const { nodes: line } = grownLine(slug, features);
  if (!line || line.length < 4) return 'M6 12 L18 12';
  const K = Math.min(DETAIL_NODES, line.length);
  // turning angle at each interior node
  const turn = new Float64Array(line.length);
  for (let i = 1; i < line.length - 1; i++) {
    const ax = line[i].x - line[i - 1].x, ay = line[i].y - line[i - 1].y;
    const bx = line[i + 1].x - line[i].x, by = line[i + 1].y - line[i].y;
    const na = Math.hypot(ax, ay), nb = Math.hypot(bx, by);
    if (na < 1e-6 || nb < 1e-6) continue;
    turn[i] = Math.acos(clamp((ax * bx + ay * by) / (na * nb), -1, 1));
  }
  let best = 0, bestScore = -1, run = 0;
  for (let i = 0; i < K; i++) run += turn[i];
  bestScore = run; best = 0;
  for (let i = K; i < line.length; i++) {
    run += turn[i] - turn[i - K];
    if (run > bestScore) { bestScore = run; best = i - K + 1; }
  }
  const nodes = line.slice(best, best + K);
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const n of nodes) {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  }
  // Same normalisation the retired glyphPath used: uniform scale into an 18×18
  // area centred in the 24×24 viewBox, so the mark sits exactly where the old
  // one did and the rows do not reflow.
  const scale = 18 / Math.max(maxX - minX, maxY - minY, 1);
  const ox = 3 + (18 - (maxX - minX) * scale) / 2;
  const oy = 3 + (18 - (maxY - minY) * scale) / 2;
  const pts = nodes.map((n) => ({ x: (n.x - minX) * scale + ox, y: (n.y - minY) * scale + oy }));
  const { start, cmds, last } = smoothCommands(pts);
  let d = `M${r1(start.x)} ${r1(start.y)}`;
  for (const c of cmds) d += `Q${r1(c.cx)} ${r1(c.cy)} ${r1(c.x)} ${r1(c.y)}`;
  d += `L${r1(last.x)} ${r1(last.y)}`;
  return d;
}

// Convenience for call sites that hold raw markdown rather than parsed features.
export function detailFromBody(slug, body) {
  return detailPath(slug, essayFeatures(body || ''));
}

export function growthFoldSvg(slug, features, year) {
  const { W, H, nodes, snapshots, paraFacts, maxPW, maxAS, lastInserted } = grownLine(slug, features);
  const ageFactor = clamp(0.78 + ((year || 2026) - 2012) * (0.22 / 14), 0.7, 1.0);
  const parts = [];
  snapshots.forEach((snap, gi) => {
    const sampled = snap.filter((_, i) => i % 2 === 0 || i === snap.length - 1);
    if (sampled.length < 3) return;
    const { start, cmds, last } = smoothCommands(sampled);
    let d = `M${r1(start.x)} ${r1(start.y)}`;
    for (const c of cmds) d += `Q${r1(c.cx)} ${r1(c.cy)} ${r1(c.x)} ${r1(c.y)}`;
    d += `L${r1(last.x)} ${r1(last.y)}`;
    const op = clamp((0.2 + gi * 0.05) * ageFactor, 0.2, 0.35);
    parts.push(`<path d="${d}" fill="none" stroke="var(--glyph)" stroke-width="0.5" stroke-opacity="${op.toFixed(2)}" stroke-linecap="round"/>`);
  });

  const { start, cmds, last } = smoothCommands(nodes);
  const CHUNK = 22;
  let prev = start;
  for (let a = 0; a < cmds.length; a += CHUNK) {
    const seg = cmds.slice(a, a + CHUNK);
    let d = `M${r1(prev.x)} ${r1(prev.y)}`;
    for (const c of seg) d += `Q${r1(c.cx)} ${r1(c.cy)} ${r1(c.x)} ${r1(c.y)}`;
    if (a + CHUNK >= cmds.length) d += `L${r1(last.x)} ${r1(last.y)}`;
    let sumE = 0, cnt = 0;
    for (let i = a + 1; i <= Math.min(a + CHUNK, nodes.length - 1); i++) { sumE += nodes[i].e; cnt++; }
    const f = paraFacts[clamp(Math.round(sumE / Math.max(1, cnt)), 0, paraFacts.length - 1)];
    const sw = clamp(0.9 + 1.4 * Math.pow(f.words / maxPW, 0.6), 0.5, 2.5);
    const op = clamp((0.5 + 0.35 * (f.avgSent / maxAS)) * ageFactor, 0.3, 0.9);
    parts.push(`<path d="${d}" fill="none" stroke="var(--glyph)" stroke-width="${sw.toFixed(1)}" stroke-opacity="${op.toFixed(2)}" stroke-linecap="round"/>`);
    prev = seg.length ? seg[seg.length - 1] : prev;
  }
  parts.push(`<circle cx="${r1(lastInserted.x)}" cy="${r1(lastInserted.y)}" r="2.7" fill="var(--sig)"/>`);

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:auto" aria-hidden="true">\n${parts.join('\n')}\n</svg>`;
}
