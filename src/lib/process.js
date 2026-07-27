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

// The instrument's no-JS fallback: a simplified settled frame as inline SVG.
export function settledFrameSvg(seed, amplitude) {
  const W = 575, H = 136;
  const rand = mulberry32(xmur3(seed)());
  const noise = makeNoise(xmur3(seed)());
  const lines = [];
  for (let i = 0; i < 80; i++) {
    let x = rand() * W, y = H * 0.12 + rand() * H * 0.76;
    const pts = [`${x.toFixed(0)},${y.toFixed(0)}`];
    for (let s = 0; s < 55; s++) {
      const bpos = Math.max(0, Math.min(46.999, (x / W) * 47));
      const bi = Math.floor(bpos), bf = bpos - bi;
      const amp = amplitude[bi] * (1 - bf) + amplitude[bi + 1] * bf;
      const a = (noise(x * 0.011, y * 0.011 * 2.2) - 0.5) * Math.PI * 2.6 * amp;
      x += Math.cos(a) * 2.1 + 0.8;
      y += Math.sin(a) * 2.1 * amp;
      if (x > W + 2 || y < -2 || y > H + 2) break;
      pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
    }
    if (pts.length > 6) lines.push(`<polyline points="${pts.join(' ')}"/>`);
  }
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="display:block;width:100%;height:136px" fill="none" stroke="var(--glyph)" stroke-opacity="0.28" stroke-width="1">${lines.join('')}</svg>`;
}

// Commit history → 48 amplitude buckets, behind DESIGN.md's 30-day freshness guard.
export function commitAmplitude(days, todayIso) {
  const sorted = days.slice().sort((a, b) => a.date.localeCompare(b.date));
  const lastDataDate = sorted[sorted.length - 1]?.date ?? '1970-01-01';
  const dataAgeDays = Math.floor((Date.parse(todayIso) - Date.parse(lastDataDate)) / 86400000);
  const fresh = dataAgeDays <= 30;
  const B = 48;
  let amplitude;
  if (fresh) {
    const buckets = new Array(B).fill(0);
    sorted.forEach((d, i) => { buckets[Math.min(B - 1, Math.floor((i / sorted.length) * B))] += d.count; });
    const maxB = Math.max(...buckets, 1);
    amplitude = buckets.map((v) => +(0.25 + 0.75 * Math.sqrt(v / maxB)).toFixed(3));
  } else {
    amplitude = new Array(B).fill(1); // stale → pure date-seed field, no data claim
  }
  const totalCommits = sorted.reduce((s, d) => s + d.count, 0);
  return { amplitude, fresh, totalCommits };
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
