# DESIGN.md — mili.dev

**Thesis:** A quiet reading site by someone who fell in love with code watching Casey Reas —
one deterministic generative system ("Process") supplies all of the site's life, and
everything else is typography.

Decided 2026-07-27 via the full /mili:ui process (recon → frame → three directions → expert
panel → proof at `/design-proof`). This file is the design authority for the site.
`STYLEGUIDE.md` and the design sections of `GOAL.md` predate the March 2026 redesign and are
superseded by this document.

## Voice & POV

- **Writing-first.** The reader is a peer — a founder/PM/AI person who arrived from a link
  to one essay. The homepage's job is to get a second essay opened.
- **The signature is spent in exactly one place:** the Process system — flow-field drawings
  seeded by real things (essay slugs, the date, commit history). Everything around it stays
  still and quiet so the one living thing reads as identity, not decoration.
- **Credibility is timestamps, not claims — and never a scoreboard.** The dated archive
  itself is the proof of foresight; the yearly prediction essays sit in the list like
  everything else. A self-scored "record" section was built, reviewed, and rejected
  (2026-07-27): it read as ego-forward and demands annual upkeep that will inevitably
  lapse. Do not reintroduce it.
- **Willing to be bad at:** being a résumé (no case studies, no logo rows, bio stays five
  bullets) and trend coverage (no bento, no craft-demo playground — that genre belongs to
  design engineers selling interaction craft; this site's proof is dated writing).

## Typography

Two families with a strict division of labor. The opinion lives in the role split, not in
chasing a novel face.

- **Human words — Source Serif 4** (400, 600, 400-italic; SIL OFL; self-hosted woff2 in
  `public/fonts/source-serif/`). Essay titles, body text, the h1.
  *Reason:* a writing site needs a reading voice, and the site had none; SS4 is free,
  excellent at text sizes, and deliberately nobody's signature.
- **Machine output — Berkeley Mono** (licensed, self-hosted). Nav, dates, seeds, counts,
  eyebrows, code, captions.
  *Reason:* mono is the machine speaking — the split maps onto the site's actual subject,
  AI-human collaboration. Berkeley Mono is demoted from display face to instrument labels;
  as a display face it is the 2026 design-engineer uniform.
- **Deleted: Geist** (and its render-blocking jsdelivr stylesheet). No CDN fonts, no Inter.
- Scale: `html` 62.5%; body 1.7rem/1.65; h1 `clamp(3rem, 2.2rem + 1.6vw, 4.2rem)` at 600;
  essay titles one notch smaller — `clamp(2.8rem, 2.1rem + 1.4vw, 3.8rem)`/1.15 — because
  essay titles run long and share the fold with the opening paragraph; eyebrows 1.2rem
  mono uppercase `0.12em`; dates 1.2rem mono everywhere; captions 1.15rem mono.

## Colour

Tokens are named by intent. There is no `primary`.

| token | light | dark | role |
| --- | --- | --- | --- |
| `paper` | `#ffffff` | `#0a0a0a` | ground |
| `ink` | `#333333` | `#c8c8c8` | body text |
| `ink-strong` | `#111111` | `#e8e8e8` | headings, titles |
| `muted` | `#666666` | `#8a8a8a` | dates, captions, nav |
| `hairline` | `#e6e6e6` | `#222222` | borders, separators |
| `sig` | `#1a7f37` | `#53d339` | the signature colour |
| `glyph` | `rgba(26,26,26,0.85)` | `#53d339` | stroke of every drawing (plotter ink / phosphor) |
| `code-bg` | `#f5f5f5` | `#1a1a1a` | code blocks; code renders monochrome in `ink` |

*Reason for `sig`:* derived from the commit chart's green but transposed off GitHub's
swatch (`#39d353` → `#53d339`), out of the mint band and toward actual P1 CRT phosphor.
The two themes are two physical materials for the same algorithm: **dark = phosphor**
(green glow on black), **light = plotter ink** (near-black hairlines on paper, moss-green
accents) — the Casey Reas print citation. `muted` values replace the old `#999`/`#777`,
which failed WCAG AA on every date on the site.

**Rule:** chrome stays achromatic. Colour exists only in the drawings, `::selection`, and
`:focus-visible`. Links are underline-distinguished, never coloured.

## Space & density

- Container `575px`, `2rem` side padding — kept from the current site (~68ch at 1.7rem
  serif). Single breakpoint at 767px.
- Spacious list rhythm: 0.55rem vertical padding per row (0.8rem under 767px, where rows
  wrap to two lines and become the touch target); sections separated by 4rem.
- *Reason:* the register is a quiet page with one living element; compression would fight it.

## Motion

- **Budget: one settle-to-rest moment.** The homepage instrument draws itself over ~7s on
  first arrival, then the animation loop is cancelled — not slowed, cancelled. Essay pages
  are still. Existing view transitions may remain.
- **The settle is a fixed step count (840), not a wall-clock cutoff** — the same seed must
  produce the identical settled drawing on a 60Hz laptop, a 120Hz phone, and under
  reduced-motion. Time only paces the steps; it never changes their total.
- Theme toggles, resizes, and mid-session reduced-motion changes re-render the settled
  frame *synchronously* — the animation plays once per arrival, never again.
- `prefers-reduced-motion`: the same 840-step settled frame, rendered synchronously.
  No-JS: a build-time static frame (inline SVG in `<noscript>`), same seed.
- Lifecycle: pause when the document hides, resume when it returns; tear down on
  `astro:before-swap`. (The `/commits` page currently leaks listeners on every
  navigation — fix, and don't reintroduce.)
- **The one standing exception: the living logo.** John's animated mili wordmark blinks
  on every page — it is the site's oldest handmade artifact and is exempt from the
  no-infinite-loops rule by owner decision. It must still respect
  `prefers-reduced-motion` (implementation item in the logo-animations package).
- *Reason:* panel numbers — an infinite loop costs 8–15% sustained phone CPU; settling
  costs ~2s of CPU once.

## The Process system (the signature)

One algorithm, many render targets. `hash(seed) → PRNG → value-noise flow field →
streamlines`.

1. **Homepage instrument** — 136px band, hairline border, mono caption
   (`seed 2026-07-27 · 1,290 commits · 2022→26`). Seeded by the date; turbulence
   amplitude-modulated by real commit history, inlined at build (≤1KB), never fetched at
   runtime. Freshness guard: data older than 30 days → date-seed only.
2. **Per-essay glyph** — seeded by the slug, generated at build, inline SVG (~20×20 at the
   index). Deterministic forever: same slug, same mark.
3. **Essay pressmark + end-mark** — the slug's glyph appears exactly twice on its essay
   page: small (20px) beside the date in the byline, and again (28px, centered) as the
   end-mark after the last line. The AI-generated hero images are deleted and replaced by
   *nothing large* — essays open with their first sentence. *Reason:* the same mark seen
   in the index reappearing on the essay is the system revealing its determinism; a big
   generative header would recreate the hero-image problem (decoration before words, 38
   large artworks to art-direct).
4. **OG cards** — 1200×630 build-time renders: dark paper, hairline frame, serif title,
   mono provenance, and the living-logo wordmark (extracted from `Logo.astro` at build).
   Owner decision 2026-07-27: the glyph trace was tried here and rejected — out of
   context it reads as an unexplained squiggle. Glyphs stay where they have context
   (index, pressmark, end-mark); the logo carries identity off-site.

**Determinism is law.** Same seed → same drawing, on every build, in both themes.
**Quality gate:** every new glyph set renders to a contact sheet and gets human review
before ship; `seedOverride` frontmatter exists for duds. Algorithmic slop is still slop.

## Component vocabulary

`logo` (the living mili wordmark, `Logo.astro`) · `row` (glyph + serif title + mono date)
· `eyebrow` (mono section label) · `instrument` (canvas + caption) · `facts` (the bio
bullets) · `footer strip`. That's the whole kit; new surfaces compose these before
inventing.

## Anti-patterns (the audit checks these)

- **No AI-generated imagery anywhere.** The ChatGPT hero PNGs are scheduled for deletion.
- No gradients, no cards, no bento grids, no border-radius above 2px, no drop shadows.
- No second accent colour; no colour in chrome; no coloured links.
- No CDN-loaded assets of any kind (fonts, CSS, JS).
- No infinite animation loops (sole exception: the living logo, see §Motion); nothing
  else animates on essay pages.
- Links are identified by a visible underline in `muted` (≥3:1), darkening on hover —
  never by colour, and never by a hairline too faint to see.
- No terminal-typing effects, no Matrix-rain framing — the instrument is bordered,
  captioned, and data-fed precisely so it reads as an instrument, not a screensaver.
- No self-scoreboards, badges, or "called it" marks — nothing that grades John's own
  work on his own site, and nothing that requires annual editorial upkeep to stay true.
- Muted text never falls below WCAG AA (4.5:1).
- No `#39d353` outside the `/commits` chart — the site's green is `sig`.
