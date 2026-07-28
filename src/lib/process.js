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

// ---- the instrument: a seismogram of the commit history ---------------------
// One continuous trace, 2022 → today. Calm weeks run flat; heavy weeks
// oscillate dense and tall. The only colour is the terminal dot: today.
// KEEP IN SYNC with the inline copy in src/pages/index.astro.
export function buildWave(days, seedStr, W = 575, H = 136) {
  const sorted = days.slice().sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;
  const raw = sorted.map((d) => Math.log1p(d.count));
  const sortedRaw = raw.slice().sort((a, b) => a - b);
  const p95 = Math.max(sortedRaw[Math.floor(sortedRaw.length * 0.95)] || 0, 0.001);
  const env = raw.map((_, i) => {
    let s = 0, w = 0;
    for (let k = -4; k <= 4; k++) {
      const j = i + k;
      if (j < 0 || j >= n) continue;
      const wt = 1 - Math.abs(k) / 5;
      s += raw[j] * wt; w += wt;
    }
    return Math.min(1.25, s / w / p95);
  });
  const seedInt = xmur3(seedStr)();
  const rand = mulberry32(seedInt);
  const noise = makeNoise(seedInt);
  let phase = rand() * Math.PI * 2;
  const padX = 6, baseY = H * 0.52, span = W - padX * 2;
  const pts = [];
  for (let x = 0; x <= span; x += 1) {
    const t = x / span;
    const di = Math.min(n - 1, Math.floor(t * n));
    const e = env[di];
    const amp = Math.pow(e, 1.12) * H * 0.36;
    phase += 0.18 + e * 1.1;
    const jitter = (noise(x * 0.035, 7.3) - 0.5) * 3.0 * (0.25 + e);
    pts.push([x + padX, baseY + Math.sin(phase) * amp + jitter]);
  }
  const startYear = parseInt(sorted[0].date.slice(0, 4), 10);
  const endYear = parseInt(sorted[n - 1].date.slice(0, 4), 10);
  const ticks = [];
  for (let y = startYear; y <= endYear; y++) {
    const idx = sorted.findIndex((d) => d.date >= `${y}-01-01`);
    if (idx >= 0) ticks.push({ x: padX + (idx / n) * span, label: `'${String(y).slice(2)}` });
  }
  return { pts, ticks, end: pts[pts.length - 1], baseY, W, H };
}

// Static SVG of the settled seismogram — the no-JS frame.
export function waveSvg(days, seedStr, W = 575, H = 136) {
  const { pts, ticks, end, baseY } = buildWave(days, seedStr, W, H);
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const tickMarks = ticks
    .map((t) => `<line x1="${t.x.toFixed(1)}" y1="${(baseY + 8).toFixed(1)}" x2="${t.x.toFixed(1)}" y2="${(baseY + 14).toFixed(1)}" stroke="var(--muted)" stroke-opacity="0.55" stroke-width="1"/>`)
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="display:block;width:100%;height:${H}px">
<line x1="6" y1="${baseY}" x2="${W - 6}" y2="${baseY}" stroke="var(--hairline)" stroke-width="1"/>
${tickMarks}
<path d="${d}" fill="none" stroke="var(--ink)" stroke-opacity="0.72" stroke-width="1.25" stroke-linejoin="round"/>
<circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="3" fill="var(--sig)"/>
</svg>`;
}
