---
name: mili-dev-ui
description: >
  Build or change ANY user-facing surface on mili.dev (jmilinovich.com) — pages, components,
  styles, typography, colors, motion, images, OG cards. Invoke BEFORE writing UI code so the
  change follows the committed "Process" design direction instead of drifting to defaults.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# mili.dev UI — build from the committed direction

This site has a decided, committed design direction: **Process** (2026-07-27). It is not
a suggestion. Before touching any surface, read:

1. **`DESIGN.md`** — the authority: thesis, type roles, colour table, motion budget,
   the Process system, component vocabulary, anti-patterns. Every rule carries its reason.
2. **`design-tokens.json`** — the exact values (type scale, both palettes, space, motion).

## The direction in one paragraph

Quiet reading site; one deterministic generative system ("Process": `hash(seed) → flow
field → streamlines`, code in `src/lib/process.ts`) supplies all the site's life — index
glyphs, essay pressmarks/end-marks, the homepage instrument. Human words in Source Serif 4;
machine output (nav, dates, seeds, captions, code) in Berkeley Mono. Chrome is achromatic;
`--sig` (moss/phosphor) appears only in drawings, `::selection`, and `:focus-visible`.
Dark = phosphor on black, light = plotter ink on paper.

## Hard rules (violations get reverted)

- **Compose from the existing vocabulary first**: `logo` (Logo.astro — the living wordmark,
  the one allowed infinite animation), `row` (PostCard.astro), `eyebrow`, `instrument`,
  `facts`, `footer strip`. Do not reach for shadcn/Tailwind/component libraries.
- **Tokens only** — `--paper --ink --ink-strong --muted --hairline --code-bg --sig --glyph`
  (defined in `BaseLayout.astro`). Never a raw hex in a component; never `#39d353` outside
  the /commits chart.
- **No new fonts, no CDN assets, no AI-generated imagery, no gradients/cards/shadows.**
- **Motion budget is spent.** The homepage instrument is the one animated moment (840-step
  settle, then the loop is cancelled). Essay pages stay still. Anything animated must pause
  on hidden, tear down on `astro:before-swap`, and honor `prefers-reduced-motion`.
- **Determinism is law**: same seed → same drawing, at any refresh rate, in both themes.
  If you touch `src/lib/process.ts` or the instrument script, keep their math in sync and
  re-render all glyphs for review (see GOAL.md's glyph gate).
- **No self-scoreboards or "called it" marks** — owner decision, see DESIGN.md.
- Muted text ≥ 4.5:1 both themes; links carry visible `--muted` underlines; 44px touch
  targets; `:focus-visible` in `--sig`.

## Verify before claiming done

`npm run build` must pass; then screenshot the changed surface in BOTH themes (dark =
phosphor, light = plotter ink) and check it against DESIGN.md §Anti-patterns.
