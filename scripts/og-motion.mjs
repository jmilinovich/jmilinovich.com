/**
 * The living logo, choreographed for og:video (DESIGN.md §Process, OG cards).
 *
 * On the site the logo performs forever with Math.random(); a share preview needs
 * the same performance as a deterministic, seamless loop that starts and ends at
 * rest, so the og:image poster, the first frame and the last frame are one image.
 * The vocabulary — blink depth, transform origins, the eleven smile moods, the
 * breath — is read from the logo-animations package itself so the video cannot
 * drift from the live logo; only the cadence is compressed to fit the loop.
 * Seeded by the page slug: same page, same performance; two mili.dev links in one
 * chat thread never blink in sync.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { xmur3, mulberry32 } from '../src/lib/process.js';

const require = createRequire(import.meta.url);
const pkgDir = require.resolve('logo-animations/living-logo').replace(/living-logo\.js$/, '');
const js = readFileSync(pkgDir + 'living-logo.js', 'utf8');
const css = readFileSync(pkgDir + 'living-logo.css', 'utf8');

const num = '(-?[\\d.]+)';
const MOODS = [...js.matchAll(new RegExp(`\\{ sx: ${num},\\s*sy: ${num},\\s*ty: ${num},\\s*tx: ${num},\\s*r:\\s*${num},\\s*dur: '${num}s' \\}`, 'g'))]
  .map((m) => ({ sx: +m[1], sy: +m[2], ty: +m[3], tx: +m[4], r: +m[5], dur: +m[6] }));
const origin = (cls) => {
  const m = css.match(new RegExp(`\\.${cls}\\s*\\{\\s*transform-origin:\\s*${num}px ${num}px`));
  return m && [+m[1], +m[2]];
};
const EYE_L = origin('eye-left'), EYE_R = origin('eye-right'), SMILE = origin('smile');
const BLINK = +(css.match(/\.blink\s*\{\s*transform:\s*scaleY\(([\d.]+)\)/)?.[1] ?? NaN);
const BREATH = +(css.match(/50%\s*\{\s*transform:\s*scale\(([\d.]+)\)/)?.[1] ?? NaN) - 1;
const BREATH_PERIOD = +(css.match(/animation:\s*breathe\s+([\d.]+)s/)?.[1] ?? NaN);
// Fail loudly: a package update that renames any of this must not silently
// ship a video that no longer matches the logo on the site.
if (MOODS.length < 5 || MOODS[0].sx !== 1 || !EYE_L || !EYE_R || !SMILE || !(BLINK > 0) || !(BREATH > 0) || !(BREATH_PERIOD > 0)) {
  throw new Error('og-motion: could not read the living-logo vocabulary from logo-animations');
}

export const FPS = 30;
// Two breaths. A whole number of breath periods is what makes the loop seamless.
export const DURATION = BREATH_PERIOD * 2;
export const FRAMES = Math.round(DURATION * FPS);

// CSS timing functions, solved exactly as the browser does.
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 30 && Math.abs(sx(t) - x) > 1e-7; i++) {
      if (sx(t) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const EASE_IN_OUT = bezier(0.42, 0, 0.58, 1);
const STANDARD = bezier(0.4, 0, 0.2, 1); // the package's squint / smile curve

// A CSS transition track: each change starts from wherever the value is when it
// fires, which is how the browser retargets an interrupted transition.
function track(rest) {
  const steps = [];
  const at = (t) => {
    let v = rest;
    for (const s of steps) {
      if (s.t > t) break;
      const k = s.ease(Math.min(1, (t - s.t) / s.dur));
      v = Object.fromEntries(Object.keys(rest).map((p) => [p, s.from[p] + (s.to[p] - s.from[p]) * k]));
    }
    return v;
  };
  const to = (t, target, dur, ease) => {
    steps.push({ t, from: at(t), to: { ...rest, ...target }, dur, ease });
  };
  return { at, to };
}

/** Build the deterministic performance for one page. */
export function choreography(slug) {
  const seed = xmur3(`og-video:${slug}`);
  const rand = mulberry32(seed());
  const range = (a, b) => a + rand() * (b - a);

  const eyeRest = { sy: 1, tx: 0 };
  const L = track(eyeRest), R = track(eyeRest);
  const smile = track({ tx: 0, ty: 0, sx: 1, sy: 1, r: 0 });

  // Eye actions keep the package's 55 / 20 / 25 blink / squint / glance odds and
  // its timings; two fit the loop. At least one is a blink — the blink is the
  // gesture the site is known for (DESIGN.md: it "blinks on every page").
  const blink = (t) => {
    const lag = range(0.03, 0.07), open = range(0.18, 0.3);
    L.to(t, { sy: BLINK }, 0.15, EASE_IN_OUT);
    R.to(t + lag, { sy: BLINK }, 0.15, EASE_IN_OUT);
    L.to(t + open, {}, 0.15, EASE_IN_OUT);
    R.to(t + open + range(0.03, 0.07), {}, 0.15, EASE_IN_OUT);
    let end = t + open + 0.3;
    if (rand() < 0.2) {
      const t2 = t + 0.4, open2 = range(0.18, 0.3);
      L.to(t2, { sy: BLINK }, 0.15, EASE_IN_OUT);
      R.to(t2 + range(0.03, 0.07), { sy: BLINK }, 0.15, EASE_IN_OUT);
      L.to(t2 + open2, {}, 0.15, EASE_IN_OUT);
      R.to(t2 + open2 + range(0.03, 0.07), {}, 0.15, EASE_IN_OUT);
      end = t2 + open2 + 0.3;
    }
    return end;
  };
  const squint = (t) => {
    const amt = range(0.45, 0.7), hold = range(1, 2.2);
    L.to(t, { sy: amt }, 0.4, STANDARD);
    R.to(t, { sy: amt + range(-0.05, 0.05) }, 0.4, STANDARD);
    // class and style clear together, so the release uses the base 0.15s curve
    L.to(t + hold, {}, 0.15, EASE_IN_OUT);
    R.to(t + hold, {}, 0.15, EASE_IN_OUT);
    return t + hold + 0.15;
  };
  const glance = (t) => {
    const shift = (rand() < 0.5 ? 1 : -1) * range(20, 50), hold = range(0.8, 1.6);
    L.to(t, { tx: shift }, 0.4, STANDARD);
    R.to(t, { tx: shift }, 0.4, STANDARD);
    L.to(t + hold, {}, 0.4, STANDARD);
    R.to(t + hold, {}, 0.4, STANDARD);
    return t + hold + 0.4;
  };
  const pick = () => { const r = rand(); return r < 0.55 ? blink : r < 0.75 ? squint : glance; };

  let first = pick(), second = pick();
  if (first !== blink && second !== blink) { if (rand() < 0.5) first = blink; else second = blink; }
  const t1 = range(0.8, 1.4);
  const end1 = first(t1);
  second(Math.max(end1 + 0.9, range(3.6, 4.6)));

  // The smile drifts to one mood and back to resting, which is mood 0.
  const mood = MOODS[1 + Math.floor(rand() * (MOODS.length - 1))];
  const tA = range(1.6, 2.2);
  smile.to(tA, mood, mood.dur, STANDARD);
  const tRest = tA + range(2.4, 3.2);
  smile.to(tRest, MOODS[0], MOODS[0].dur, STANDARD);

  return { L, R, smile };
}

const breathAt = (t) => {
  const p = (t % BREATH_PERIOD) / BREATH_PERIOD;
  return 1 + BREATH * (p < 0.5 ? EASE_IN_OUT(p * 2) : 1 - EASE_IN_OUT((p - 0.5) * 2));
};

const f = (n) => +n.toFixed(4);
const isRest = (o) => Object.entries(o).every(([k, v]) => Math.abs(v - (k.startsWith('s') ? 1 : 0)) < 1e-4);

/**
 * The logo's paths at time t, keyed by class, as transform attributes in the
 * logo's own 3109×2091 user space ('' at rest, so the rest frame is the very same
 * markup as the poster). Mirrors the CSS: transform-origin is in view-box units.
 */
export function poseAt(perf, t) {
  const pose = { breath: '', eyeLeft: '', eyeRight: '', smile: '' };
  if (!perf) return pose;
  const b = breathAt(t);
  if (Math.abs(b - 1) > 1e-6) pose.breath = `translate(1554.5 1045.5) scale(${f(b)}) translate(-1554.5 -1045.5)`;
  const eye = (s, [ox, oy]) => isRest(s) ? '' : `translate(${f(ox + s.tx)} ${oy}) scale(1 ${f(s.sy)}) translate(${-ox} ${-oy})`;
  pose.eyeLeft = eye(perf.L.at(t), EYE_L);
  pose.eyeRight = eye(perf.R.at(t), EYE_R);
  const m = perf.smile.at(t);
  if (!isRest(m)) {
    const [ox, oy] = SMILE;
    pose.smile = `translate(${f(ox + m.tx)} ${f(oy + m.ty)}) scale(${f(m.sx)} ${f(m.sy)}) rotate(${f(m.r)}) translate(${-ox} ${-oy})`;
  }
  return pose;
}
