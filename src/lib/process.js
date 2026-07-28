// The Process system — one deterministic generative pipeline for the whole site.
// hash(seed) → PRNG → value-noise flow field → streamlines. See DESIGN.md §Process.
// Build-time renderers live here; the homepage instrument's runtime uses the same
// math inlined in its page script (keep them in sync — the glyph promise depends on it).

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

// One streamline per essay, seeded by its slug. Same slug → same mark, forever.
export function glyphPath(slug) {
  const seedInt = xmur3(slug)();
  const rand = mulberry32(seedInt);
  const noise = makeNoise(seedInt);
  const freq = 0.055 + rand() * 0.05;
  const turb = 1.7 + rand() * 1.1;
  const S = 40, STEPS = 84;
  let best = { pts: [], span: 0 };
  for (let c = 0; c < 8; c++) {
    let x = 6 + rand() * (S - 12), y = 6 + rand() * (S - 12);
    const pts = [[x, y]];
    let minX = x, maxX = x, minY = y, maxY = y;
    for (let i = 0; i < STEPS; i++) {
      const a = (noise(x * freq, y * freq) - 0.5) * Math.PI * 2 * turb;
      x += Math.cos(a) * 0.85;
      y += Math.sin(a) * 0.85;
      if (x < 1 || x > S - 1 || y < 1 || y > S - 1) break;
      pts.push([x, y]);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const span = (maxX - minX) * (maxY - minY) + pts.length;
    if (span > best.span) best = { pts, span };
  }
  const pts = best.pts;
  if (pts.length < 4) return 'M6 12 L18 12';
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const [px, py] of pts) {
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  }
  const scale = 18 / Math.max(maxX - minX, maxY - minY, 1);
  const ox = 3 + (18 - (maxX - minX) * scale) / 2, oy = 3 + (18 - (maxY - minY) * scale) / 2;
  return pts
    .map(([px, py], i) =>
      `${i === 0 ? 'M' : 'L'}${((px - minX) * scale + ox).toFixed(1)} ${((py - minY) * scale + oy).toFixed(1)}`)
    .join('');
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// ---- the instrument: rootwork --------------------------------------------
// Branching growth, left → right across the years: roots creep and ramify
// where the commit history is dense. New random seed every load; the only
// colour is the terminal dot at the furthest tip. KEEP IN SYNC with the
// inline copy in src/pages/index.astro.
export function envFromCounts(counts) {
  const n = counts.length;
  const raw = counts.map((c) => Math.log1p(c));
  const sortedRaw = raw.slice().sort((a, b) => a - b);
  const p95 = Math.max(sortedRaw[Math.floor(sortedRaw.length * 0.95)] || 0, 0.001);
  return raw.map((_, i) => {
    let s = 0, wt = 0;
    for (let k = -4; k <= 4; k++) {
      const j = i + k;
      if (j < 0 || j >= n) continue;
      const g = 1 - Math.abs(k) / 5;
      s += raw[j] * g; wt += g;
    }
    return Math.min(1.25, s / wt / p95);
  });
}

export function buildRoots(counts, seedInt, W = 575, H = 136, lofi = false) {
  const env = envFromCounts(counts);
  const n = counts.length;
  const envAt = (t) => env[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  const rand = mulberry32(seedInt);
  const noise = makeNoise(seedInt);
  const STEP = lofi ? 3.4 : 1.7;
  const CAP = lofi ? 60 : 190;
  const tips = [];
  for (let i = 0; i < 6; i++) {
    tips.push({ x: -2, y: H * 0.15 + rand() * H * 0.7, a: 0, wd: 1.5, born: Math.round(i * 14 * (1.7 / STEP)), alive: true, path: [] });
  }
  let total = tips.length;
  let far = { x: 0, y: H / 2 };
  const iters = [];
  const maxIter = Math.round(700 / STEP * 1.7);
  for (let it = 0; it < maxIter; it++) {
    const segs = [];
    let anyAlive = false;
    const spawned = [];
    for (const t of tips) {
      if (!t.alive || t.born > it) { if (t.alive) anyAlive = true; continue; }
      anyAlive = true;
      const e = envAt(t.x / W);
      t.a += (noise(t.x * 0.012, t.y * 0.02) - 0.5) * (0.35 + e * 0.55);
      t.a = Math.max(-0.62, Math.min(0.62, t.a));
      const nx = t.x + Math.cos(t.a) * STEP, ny = t.y + Math.sin(t.a) * STEP;
      segs.push([t.x, t.y, nx, ny, t.wd]);
      if (lofi) { if (!t.path.length) t.path.push([t.x, t.y]); t.path.push([nx, ny]); }
      t.x = nx; t.y = ny;
      if (t.x > far.x) far = { x: t.x, y: t.y };
      if (t.x > W - 3) { t.alive = false; continue; }
      if (t.y < 3 || t.y > H - 3) { t.y = Math.max(3, Math.min(H - 3, t.y)); t.a = -t.a * 0.7; }
      if (total < CAP && rand() < (0.013 + e * 0.06 * rand()) * (STEP / 1.7)) {
        spawned.push({ x: t.x, y: t.y, a: t.a + (rand() < 0.5 ? -1 : 1) * (0.3 + rand() * 0.35), wd: Math.max(0.6, t.wd * 0.8), born: it + 1, alive: true, path: [] });
        total++;
      }
    }
    tips.push(...spawned);
    iters.push(segs);
    if (!anyAlive) break;
  }
  return { iters, tips, far: { x: Math.min(far.x, W - 4), y: far.y }, W, H };
}

// Static SVG of the finished rootwork — the no-JS frame (low fidelity to stay small).
export function rootsSvg(counts, seedInt, W = 575, H = 136) {
  const { tips, far } = buildRoots(counts, seedInt, W, H, true);
  const paths = tips
    .filter((t) => t.path.length > 2)
    .map((t) => {
      const d = t.path.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(0)} ${y.toFixed(0)}`).join('');
      return `<path d="${d}" stroke-width="${t.wd.toFixed(1)}"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="display:block;width:100%;height:${H}px" fill="none" stroke="var(--ink)" stroke-opacity="0.4" stroke-linecap="round">
${paths}
<circle cx="${far.x.toFixed(0)}" cy="${far.y.toFixed(0)}" r="3" fill="var(--sig)" stroke="none"/>
</svg>`;
}
