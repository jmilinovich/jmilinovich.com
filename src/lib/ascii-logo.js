// The mili wordmark as a lit 3D object, drawn in characters. Used by the 404 page.
//
// The wordmark's SVG paths are extruded, lit, rendered with WebGL, and read back
// through three.js' AsciiEffect, which swaps each cell of the frame for the glyph
// whose ink matches its brightness.
//
// Motion follows DESIGN.md §Motion: it turns in once and comes to rest, and the
// frame loop is cancelled, not slowed. After that the only thing that moves is
// the living logo's own vocabulary (blink, squint, glance, the smile's moods —
// timings from logo-animations/src/living-logo.js), and frames are drawn only
// while one of those is mid-gesture. Dragging turns it; letting go returns it.

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Euler,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';

const CHARSET = ' .:-=+*#%@';
const FONT = '"Berkeley Mono", monospace';

const VIEW = { w: 3109, h: 2091 };            // the SVG viewBox
const WIDTH = 5.4;                            // world units across the wordmark
const UNIT = WIDTH / VIEW.w;
const HEIGHT = VIEW.h * UNIT;
const DEPTH = 260;                            // SVG units, before the bevel
const BEVEL = 24;
const FOV = 30;
const FIT = { w: 0.84, h: 0.78 };              // share of the stage the mark may fill

// transform-origins of the living parts, from logo-animations/src/living-logo.css
const ORIGINS = { 'eye-left': [1576, 101], 'eye-right': [2689, 101], smile: [2179, 1860] };

// Where it comes to rest: a little off front, so the side walls still read.
const REST = { pitch: 0.07, yaw: -0.3, light: -2.4 };
// Where it arrives from: the other three-quarter view, light on the far side.
const FROM = { pitch: 0.16, yaw: 0.78, light: 3.6 };
const ARRIVE_MS = 2600;

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  return (x) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(slope) < 1e-6) break;
      t -= (((ax * t + bx) * t + cx) * t - x) / slope;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const easeInOut = bezier(0.42, 0, 0.58, 1);
const standard = bezier(0.4, 0, 0.2, 1);
const arrive = bezier(0.22, 0.8, 0.2, 1);

const between = (a, b) => a + Math.random() * (b - a);

// Width of one glyph, so the grid can be made exact.
function advance(px) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${px}px ${FONT}`;
  return ctx.measureText('@'.repeat(64)).width / 64;
}

/**
 * Draw the wordmark in `stage`. `svg` is the wordmark's markup; its paths carry
 * the living logo's class names. Resolves to a teardown function. Throws if
 * WebGL is unavailable — the caller keeps the flat wordmark.
 */
export async function mountAsciiLogo(stage, svg) {
  await document.fonts.load(`10px ${FONT}`).catch(() => {});

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const listeners = new AbortController();
  const on = (target, type, fn) => target.addEventListener(type, fn, { signal: listeners.signal });

  // ── Scene ────────────────────────────────────────────────────────────────

  const renderer = new WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);

  const scene = new Scene();
  scene.background = new Color(0x000000);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);

  // A low key light rakes across the letters, so the ramp runs along the word;
  // the rim catches side walls; the fill keeps the far end legible.
  const key = new PointLight(0xffffff, 13, 0, 2);
  key.position.set(REST.light, 1.6, 3.4);
  const rim = new PointLight(0xffffff, 18, 0, 1.6);
  rim.position.set(-6, -3, -2);
  const fill = new DirectionalLight(0xffffff, 0.85);
  fill.position.set(0, 0, 1);
  scene.add(key, rim, fill, new AmbientLight(0xffffff, 0.1));

  const material = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1, flatShading: true });
  const logo = new Group();
  logo.scale.set(UNIT, -UNIT, UNIT);          // SVG is y-down
  const part = {};

  for (const path of new SVGLoader().parse(svg).paths) {
    const name = path.userData.node.getAttribute('class');
    const [ox, oy] = ORIGINS[name] ?? [VIEW.w / 2, VIEW.h / 2];
    const geometry = new ExtrudeGeometry(path.toShapes(), {
      depth: DEPTH,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelOffset: -BEVEL,                    // keep the drawn outline as the widest point
      bevelSegments: 2,
    });
    geometry.translate(-ox, -oy, -DEPTH / 2);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(ox - VIEW.w / 2, oy - VIEW.h / 2, 0);
    mesh.userData.home = mesh.position.clone();
    logo.add(mesh);
    part[name] = mesh;
  }
  if (!part.smile || !part['eye-left'] || !part['eye-right']) throw new Error('wordmark is missing its eyes or smile');

  const pivot = new Group();
  pivot.add(logo);
  scene.add(pivot);

  // ── Characters ───────────────────────────────────────────────────────────

  let effect;
  let resolution;

  // The grid gets finer as the mark gets smaller, so the letters keep enough
  // cells to read at phone width.
  const resolutionFor = (w) => (w < 420 ? 0.32 : 0.25);

  function buildEffect() {
    effect?.domElement.remove();
    resolution = resolutionFor(stage.clientWidth);

    // AsciiEffect reads the frame back every tick; tell its 2D canvas so.
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      return getContext.call(this, type, type === '2d' ? { ...options, willReadFrequently: true } : options);
    };
    try {
      effect = new AsciiEffect(renderer, CHARSET, { invert: true, resolution });
    } finally {
      HTMLCanvasElement.prototype.getContext = getContext;
    }

    // To a screen reader this is one picture, not ten thousand glyphs.
    effect.domElement.className = 'ascii';
    effect.domElement.style.cursor = '';
    effect.domElement.setAttribute('role', 'img');
    effect.domElement.setAttribute('aria-label', 'The mili wordmark, drawn in characters');
    stage.prepend(effect.domElement);

    // One cell is 1/resolution px wide; close the gap to the glyph's advance.
    stage.style.setProperty('--ls', `${1 / resolution - advance(2 / resolution)}px`);
    fit();
  }

  function fit() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const span = 2 * Math.tan(MathUtils.degToRad(FOV / 2));
    camera.aspect = w / h;
    camera.position.z = Math.max(HEIGHT / (FIT.h * span), WIDTH / (FIT.w * span * camera.aspect));
    camera.updateProjectionMatrix();
    effect.setSize(w, h);
  }

  // ── Living vocabulary ────────────────────────────────────────────────────

  let clock = 0;                              // ms of animated time
  const queue = [];
  const after = (ms, fn) => queue.push({ at: clock + ms, fn });

  const channel = (...rest) => ({ rest, now: [...rest], from: [...rest], to: [...rest], t0: 0, ms: 0, ease: standard, live: false });
  function go(c, to, ms, ease = standard) {
    c.from = [...c.now];
    c.to = to;
    c.t0 = clock;
    c.ms = ms;
    c.ease = ease;
    c.live = true;
  }
  function settle(c) {
    const p = c.ms > 0 ? Math.min(1, (clock - c.t0) / c.ms) : 1;
    const e = c.ease(p);
    for (let i = 0; i < c.now.length; i++) c.now[i] = c.from[i] + (c.to[i] - c.from[i]) * e;
    if (p >= 1) c.live = false;
  }

  const eyeL = channel(1, 0);                 // scaleY, translateX
  const eyeR = channel(1, 0);
  const mouth = channel(0, 0, 1, 1, 0);       // translateX, translateY, scaleX, scaleY, rotate°
  const channels = [eyeL, eyeR, mouth];

  function blinkOnce() {
    go(eyeL, [0.05, 0], 150, easeInOut);
    after(between(30, 70), () => go(eyeR, [0.05, 0], 150, easeInOut));
    after(between(180, 300), () => {
      go(eyeL, [1, 0], 150, easeInOut);
      after(between(30, 70), () => go(eyeR, [1, 0], 150, easeInOut));
    });
  }
  function blink() {
    blinkOnce();
    if (Math.random() < 0.2) after(400, blinkOnce);
  }
  function squint() {
    const amount = between(0.45, 0.7);
    go(eyeL, [amount, 0], 400);
    go(eyeR, [amount + between(-0.05, 0.05), 0], 400);
    after(between(1000, 3000), () => {
      go(eyeL, [1, 0], 150, easeInOut);
      go(eyeR, [1, 0], 150, easeInOut);
    });
  }
  function glance() {
    const shift = (Math.random() < 0.5 ? 1 : -1) * between(20, 50);
    go(eyeL, [1, shift], 400);
    go(eyeR, [1, shift], 400);
    after(between(800, 2000), () => {
      go(eyeL, [1, 0], 400);
      go(eyeR, [1, 0], 400);
    });
  }
  function eyes() {
    const roll = Math.random();
    if (roll < 0.55) blink();
    else if (roll < 0.75) squint();
    else glance();
    after(between(2500, 7000), eyes);
  }

  const MOODS = [
    // tx, ty, sx, sy, rotate°, ms
    [0, 0, 1, 1, 0, 1800],                    // resting
    [0, 12, 1.04, 1.1, 0, 1600],              // content
    [0, 20, 1.07, 1.18, 0, 1400],             // happy
    [0, 26, 1.09, 1.22, 0, 1200],             // very happy
    [0, -8, 0.92, 0.85, 0, 2000],             // pondering
    [20, -10, 0.88, 0.8, 1.5, 2200],          // hmm, right
    [-20, -10, 0.88, 0.8, -1.5, 2200],        // hmm, left
    [10, -5, 0.95, 0.9, 0.8, 2000],           // slight thinking
    [25, 8, 1.03, 1.06, 1.2, 2000],           // smirk right
    [-25, 8, 1.03, 1.06, -1.2, 2000],         // smirk left
    [0, 3, 1.01, 1.02, 0, 2200],              // barely there
  ];
  function mood() {
    const [tx, ty, sx, sy, r, ms] = MOODS[Math.floor(Math.random() * MOODS.length)];
    go(mouth, [tx, ty, sx, sy, r], ms);
    after(between(6000, 12000), mood);        // the logo's moods at a slower cadence, so it mostly rests
  }
  function wake() {
    after(between(1500, 3000), eyes);
    after(2000, mood);
  }

  // Grabbing it is hovering it: the grin, and the eyes cross.
  function hold(held) {
    queue.length = 0;                         // nothing scheduled may undo the reaction
    go(mouth, held ? [0, 30, 1.12, 1.28, 0] : [...mouth.rest], held ? 400 : 600);
    go(eyeL, [1, held ? 30 : 0], 400);
    go(eyeR, [1, held ? -30 : 0], 400);
    if (!held) wake();
  }

  function pose() {
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].at <= clock) queue.splice(i, 1)[0].fn();
    }
    for (const c of channels) settle(c);

    for (const [mesh, c] of [[part['eye-left'], eyeL], [part['eye-right'], eyeR]]) {
      mesh.scale.y = c.now[0];
      mesh.position.x = mesh.userData.home.x + c.now[1];
    }
    const [tx, ty, sx, sy, r] = mouth.now;
    const smile = part.smile;
    smile.position.set(smile.userData.home.x + tx, smile.userData.home.y + ty, 0);
    smile.scale.set(sx, sy, 1);
    smile.rotation.z = MathUtils.degToRad(r);
  }

  // ── Motion ───────────────────────────────────────────────────────────────

  const euler = new Euler();
  const user = new Quaternion();              // what dragging has added on top
  const HOME = new Quaternion();
  const nudge = new Quaternion();
  const axis = new Vector3();
  const spin = { yaw: 0, pitch: 0 };          // radians per frame, carried after release
  const drag = { on: false, x: 0, y: 0, dx: 0, dy: 0 };
  let arrived = still ? ARRIVE_MS : 0;        // ms into the arrival
  let homeAt = 0;

  // Trackball: turn about the screen's own axes, whatever way the mark faces.
  function turn(yaw, pitch) {
    axis.set(pitch, yaw, 0);
    const angle = axis.length();
    if (angle < 1e-6) return;
    user.premultiply(nudge.setFromAxisAngle(axis.normalize(), angle));
  }

  // Advance by dt and draw. Returns whether anything is still moving.
  function step(dt) {
    clock += dt;
    let moving = false;

    if (arrived < ARRIVE_MS) {
      arrived = Math.min(ARRIVE_MS, arrived + dt);
      moving = true;
    }
    const a = arrive(arrived / ARRIVE_MS);

    if (drag.on) {
      const yaw = drag.dx * 0.006;
      const pitch = drag.dy * 0.006;
      drag.dx = drag.dy = 0;
      turn(yaw, pitch);
      spin.yaw += (yaw - spin.yaw) * 0.5;
      spin.pitch += (pitch - spin.pitch) * 0.5;
      moving = true;
    } else if (!still) {
      // Coast on what the drag left, then turn back and stop.
      const coasting = Math.hypot(spin.yaw, spin.pitch);
      if (coasting > 1e-4) {
        turn(spin.yaw, spin.pitch);
        spin.yaw *= 0.94;
        spin.pitch *= 0.94;
        moving = true;
      }
      const away = user.angleTo(HOME);
      if (away > 0) {
        if (clock > homeAt && coasting < 0.01) {
          if (away < 0.002) user.identity();
          else user.slerp(HOME, 0.06);
        }
        moving = true;
      }
    }

    euler.set(FROM.pitch + (REST.pitch - FROM.pitch) * a, FROM.yaw + (REST.yaw - FROM.yaw) * a, 0, 'XYZ');
    pivot.quaternion.setFromEuler(euler).premultiply(user);
    key.position.x = FROM.light + (REST.light - FROM.light) * a;

    pose();
    effect.render(scene, camera);
    return moving || channels.some((c) => c.live);
  }

  // ── Loop: runs only while something moves ────────────────────────────────

  let raf = 0;
  let timer = 0;
  let last = 0;

  function frame(now) {
    raf = 0;
    if (last && now - last < 32) {            // ~30fps on any refresh rate
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = last ? Math.min(now - last, 100) : 0;
    last = now;
    if (step(dt)) raf = requestAnimationFrame(frame);
    else doze();
  }

  // Nothing is moving: stop drawing until the next blink or mood is due.
  function doze() {
    last = 0;
    if (!queue.length) return;
    const next = Math.min(...queue.map((q) => q.at));
    timer = setTimeout(() => {
      timer = 0;
      clock = Math.max(clock, next);
      kick();
    }, Math.max(0, next - clock));
  }

  function kick() {
    if (raf || document.hidden) return;
    clearTimeout(timer);
    timer = 0;
    raf = requestAnimationFrame(frame);
  }

  on(document, 'visibilitychange', () => {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    raf = timer = last = 0;
    kick();
  });

  // ── Dragging ─────────────────────────────────────────────────────────────

  on(stage, 'pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    drag.on = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    drag.dx = drag.dy = 0;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('grab');
    if (!still) hold(true);
    kick();
  });
  on(stage, 'pointermove', (e) => {
    if (!drag.on) return;
    drag.dx += e.clientX - drag.x;
    drag.dy += e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  function release() {
    if (!drag.on) return;
    drag.on = false;
    stage.classList.remove('grab');
    homeAt = clock + 1200;
    if (!still) hold(false);
    kick();
  }
  on(stage, 'pointerup', release);
  on(stage, 'pointercancel', release);

  // ── Go ───────────────────────────────────────────────────────────────────

  const resized = new ResizeObserver(() => {
    if (!stage.clientWidth) return;
    if (resolutionFor(stage.clientWidth) === resolution) fit();
    else buildEffect();
    if (raf) return;
    clearTimeout(timer);                      // redraw in place; kick() re-arms the doze
    timer = 0;
    kick();
  });

  buildEffect();
  step(0);
  if (!still) wake();
  resized.observe(stage);
  kick();

  return () => {
    listeners.abort();
    resized.disconnect();
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    effect.domElement.remove();
    stage.classList.remove('grab');
    for (const mesh of Object.values(part)) mesh.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
