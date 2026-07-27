# GOAL.md — mili.dev

## Goal

Every page of mili.dev should feel like one system — the "Process" direction defined in
**`DESIGN.md`** (the design authority) and **`design-tokens.json`** (the values). Writing
first; one deterministic generative system supplies all the life; everything else is
quiet typography.

## Fitness function

### Primary: build + visual consistency (Playwright)

```bash
npm run build                                      # must pass — 45+ pages, zero errors
npx playwright test --project="Desktop Chrome"     # screenshots + cross-page style assertions
```

The Playwright suite asserts cross-page consistency (h1/title/date styles, nav font,
body font is Source Serif) and captures screenshots to `screenshots/` for human review.
If a test passes but the screenshot looks wrong, the test is wrong — update it.

### Secondary: the slop audit

Run `/mili:ui check` (or audit by hand against DESIGN.md §Anti-patterns). Hard rules:

- No AI-generated imagery. No gradients, cards, bento, shadows, radius > 2px.
- Chrome achromatic; `sig` only in drawings, `::selection`, `:focus-visible`.
- No CDN-loaded assets. No infinite animation loops except the living logo.
- Muted text ≥ 4.5:1 in both themes. Same seed → same drawing, always.

### The glyph gate

Any change to the generative system (`src/lib/process.ts` or the homepage instrument
script) requires re-rendering all essay glyphs to a contact sheet and eyeballing them
before merge — determinism means a regression ships to every essay at once.

**Metric mutability:** split — agents may add tests and checks but may not weaken or
delete existing assertions. Changing the design direction itself requires the owner and
an update to DESIGN.md first.
