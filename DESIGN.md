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
| `glyph-thin` | `rgba(26,26,26,0.85)` | `#53d339` | substrate stroke in thin soil |
| `glyph-rich` | `rgba(20,74,44,0.85)` | `#53d339` | substrate stroke in rich soil |
| `code-bg` | `#f5f5f5` | `#1a1a1a` | code blocks; code renders monochrome in `ink` |

*Reason for `sig`:* derived from the commit chart's green but transposed off GitHub's
swatch (`#39d353` → `#53d339`), out of the mint band and toward actual P1 CRT phosphor.
The two themes are two physical materials for the same algorithm: **dark = phosphor**
(green glow on black), **light = plotter ink** (near-black hairlines on paper, moss-green
accents) — the Casey Reas print citation. `muted` values replace the old `#999`/`#777`,
which failed WCAG AA on every date on the site.

*Reason for the `glyph-thin` → `glyph-rich` ramp* (2026-07-29, via /grill-me): light mode's
substrate was grey scratches on white while dark's was a green organism — the asymmetry, not
the absence of colour, was the complaint. The substrate now draws thin soil in `glyph-thin`
and rich soil in `glyph-rich`, so **light gains a second pen of green-black ink** where the
nutrient field is dense. It is one hue per theme varying in tone, so the "no second accent
colour" rule stands untouched.

**Dark's two tokens are deliberately equal, and that duplication is the decision.** Three
contact sheets established that `#53d339` has no free variation: brighter is neon and drowns
the sig dot; dimmer spends the presence that makes dark work; desaturating at matched
luminance (`#8cb978`, measured at 0.412 relative luminance against phosphor's 0.489 — the
"equal brightness" premise was simply wrong) turns the whole organism to sage, because most
soil is thin. So the ramp collapses to one colour in dark, and dark renders byte-identical
to its pre-2026-07-29 self. The themes were never symmetric in colour anyway: dark has
carried hue since day one, and light is where the substrate had none. Same law, different
headroom — not an exception.

**Light is the default theme** (owner decision 2026-07-27): visitors without an explicit
OS dark-mode preference get plotter ink on white. An explicit OS dark preference is
respected, and the toggle's saved choice always wins over both.

**Rule:** chrome stays achromatic. Colour exists only in the drawings, `::selection`, and
`:focus-visible`. Links are underline-distinguished, never coloured.

**`color-scheme` is declared** (light on `:root`, dark under `[data-theme="dark"]` and
the no-JS dark media block). Without it Chrome's auto-dark force-darkens the light
theme — inverting the CSS but not canvas bitmaps, which leaves plotter ink invisible
on a forced-dark ground. Do not remove.

## Space & density

- Container `575px`, `2rem` side padding — kept from the current site (~68ch at 1.7rem
  serif). Single breakpoint at 767px.
- Spacious list rhythm: 0.55rem vertical padding per row (0.8rem under 767px, where rows
  wrap to two lines and become the touch target); sections separated by 4rem.
- *Reason:* the register is a quiet page with one living element; compression would fight it.

## Motion

- **Budget: settle-to-rest, with scroll as the only other energy source.** On arrival
  the substrate grows the first viewport once (~7s), then the loop is cancelled — not
  slowed, cancelled. Below the fold, growth advances only while the reader scrolls
  (the reveal target leads the eye by most of a viewport), and every region settles.
  Idle CPU is zero once caught up. Essay pages are still. Existing view transitions
  may remain.
- **The drawing is precomputed geometry, paced by time and scroll** — the same seed
  produces the identical finished organism on a 60Hz laptop, a 120Hz phone, and under
  reduced-motion. Pacing only reveals the image; it never changes it.
- Theme toggles, resizes, and mid-session reduced-motion changes re-render the drawn
  state *synchronously* — the arrival animation plays once per load, never again.
- `prefers-reduced-motion`: the fully grown organism, rendered synchronously.
  No-JS: pure typography — the substrate is the living layer and gets no taxidermied
  stand-in (v4 decision; the drawing depends on measured layout no build step can know).
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

Two primitives off one seeded PRNG, many render targets. `hash(seed) → PRNG` then either
**value-noise flow field → streamlines** (the page-scale substrate) or **differential
growth → a folding line** (everything per-essay). The split is deliberate: the substrate
is weather, the essay marks are a specimen. Corrected 2026-07-29 — this heading claimed a
single flow-field algorithm, which stopped being true when the fingerprint shipped as
differential growth on 2026-07-28.

1. **Homepage substrate** — the whole page as petri dish (v4, 2026-07-28, via
   /grill-me; v3's bounded left→right band was judged a legacy of the commit axis and
   repealed — the terrarium died, the organism got the page). A curtain of roots
   descends from the top edge of the document behind the content; **text is stone** —
   growth measures the DOM rects of every text block and flows around them, hugging
   margins and gutters, threading section gaps, never crossing a word. Taproot
   hierarchy: a few thick primaries ramify into hairline rootlets. Fed by commit
   density with **no time axis** — daily counts (inline at build, ~1.7KB base36) are
   scattered through the soil as a seed-placed nutrient field; roots ramify and
   thicken where the mass landed. The data feeds the form silently (owner call
   2026-07-28: the caption makes no data claim). Arrival grows the first viewport
   once; the reader's scroll grows the rest (owner call: curtain origins across the
   whole top edge, not a single seed point — immersion over origin-story). Thin soil
   on mobile — but **"the gutters are the lanes" is repealed** (2026-07-30). Measured, that
   doctrine meant two 11px lanes down a 4432px document, 5.6% of the width navigable,
   because `main .writing-section` is a single 3346px stone that swallows every channel
   between rows. Three seeds in eight rendered essentially nothing on a phone and one
   rendered **zero segments** — a blank page — at 360, 390 and 430px alike. Below 767px
   the stones are therefore **individual lines of text**: the channels that opens contain
   no words, so it reads "text is stone" more literally than the section rects ever did,
   and the roots thread the ragged right edge of every title. Chosen from a measured
   five-way bake-off (per-row, minimal, bold-and-sparse and a canvas-bleed family were
   built and rejected; bleed lost outright once the metric stopped counting off-screen
   ink). Two supporting mechanisms: **origins are placed into measured free lanes**
   (`freeLanes`) rather than guessed at — the blank page was origin *placement* failing,
   not roots dying, since five origins retried a random x twelve times against 22px of
   lane and then gave up on a blocked one — and thin-soil contact stops being lethal,
   because on a phone the lanes are the only ground there is. Ramification is damped to
   0.45 so the masonry reads as line rather than thicket. Worst-seed coverage went 0 →
   6,088px and the blank seed 114 → 13,910. **Everything is scoped to ≤767px and desktop
   renders byte-identically** (117,519px worst seed, unchanged), because desktop's gutters
   are ~350px and it never had the problem. Per-line granularity takes the stone count
   from 11 to ~200, so `blocked()` reads a depth-bucketed index rather than the whole list.
   **The nutrient field also drives tone**
   (2026-07-29): each root's tone lags the field beneath it (`TONE_LAG`), so hue drifts
   across ~100px into coherent regions rather than mottling per segment, and `TONE_GAMMA`
   (>1) holds ordinary soil at the ink floor so only genuinely rich patches reach
   `glyph-rich`. **Hue lives in the fine structure:** hairline rootlets take the full
   ramp, tier-0 primaries only 35% of it. Without that gain a bold taproot crossing a
   rich patch becomes one unmistakably green line — colour in a single stroke, which is
   the bar this had to clear ("visible in the mass, invisible per stroke", owner call).
   It is also the honest biology: fine roots absorb, primaries are structural. Light
   mode's alpha floor is `0.22` against dark's `0.14`, because phosphor glows at low
   alpha and plotter ink on white just disappears; the ceiling is unchanged, so
   width-as-depth survives. The `sig` dot at the deepest tip remains the most saturated
   point on the page — roots draw at 0.14–0.74 alpha against the dot's 1.0, so its
   primacy needs no clamp, and the tier gain keeps the deepest primary in near-black
   ink for it to read against. **A new random seed every load** (owner decision:
   the drawing should feel different each visit); the provenance line at the bottom
   of the soil shows the full 8-hex seed — nothing else — and `?seed=<hex>` replays
   any organism: determinism preserved per seed, surprise preserved per visit.
   Growth is iteration-based, so the finished organism is identical at any refresh
   rate.
2. **Per-essay index mark** — a *detail* of that essay's own fingerprint: the most folded
   28-node stretch of the same mature growth line, cropped square and magnified into a
   ~20×20 inline SVG (`detailPath`). One organism per essay, shown at two magnifications —
   the mark in the list, the whole line after the last paragraph (2026-07-29, via
   /grill-me). A fixed-length run keeps density constant down the index however long the
   essay runs; the run is chosen by total turning angle so the mark has character. One
   uniform stroke — no ghosts, no sig dot, no weight ramp: at 20px the ghosts are invisible
   and a green dot per row would turn the index into a column of dots. Kinship is carried
   by geometry, not ornament. **Capturing the line young was tried first and rejected on
   the contact sheet**: the simulation's frame is ~4:1 wide, so every early state
   normalises to a flat dash — dead at 24, 40, 60, 85 and 120 nodes alike. Maturity is
   where the folding lives, so magnify rather than rewind. Seeded by the slug and shaped by
   the text: same text, same mark; editing the essay regrows it, exactly as the fingerprint
   already behaved. The retired `glyphPath` flow-field streamline predates this.
3. **Essay pressmark + fingerprint** — the pressmark opens, the fingerprint closes
   (2026-07-28, via /grill-me; the 28px end-mark glyph retired in its favor). The essay's
   index mark appears small (20px) beside the date in the byline — the same detail the
   list shows, so the page opens on the fragment and closes on the whole; after the last
   line sits the
   **fingerprint**: a differential-growth line grown at build time from the essay's own
   text (`growthFoldSvg` in `src/lib/process.js`) — one growth epoch per paragraph,
   insertion budget ∝ paragraph words, question sentences buckling the line, em-dashes
   striking kicks it absorbs; faint ghosts show three earlier growth states; the sig dot
   rests where growth ended. It lives in the instrument container (hairline frame, mono
   caption) — the v3 frame reborn at essay scale — and the caption says one quiet number
   (`N words`), the gentlest decoder ring (owner call: craft over decodability; the
   mapping is feelable — more words, more folding — not labeled). Static, no JS, chosen
   from a five-system rendered contact sheet (streamline-family, core-sample,
   cadence-thread, silhouette-ghost were built and rejected). Essays still open with
   their first sentence — *nothing large before words*; the fingerprint is decoration
   AFTER words, the specimen of what was just read. Deterministic: same text, same
   drawing; editing the essay regrows it.
4. **The essay foot** — three onward essays after the fingerprint (2026-07-29, via
   /grill-me). Reaching the last line used to be a cul-de-sac: the fingerprint, then a
   footer strip of four links that all left the site. The homepage's stated job — get a
   second essay opened — actually falls here, so this is where it happens. Three `row`s
   (glyph + serif title + mono date, the same object every list on the site uses) under a
   `KEEP READING` eyebrow, closing with a left-aligned mono `All writing →` — the rows'
   own terminal option. It sits **after** the fingerprint so the essay still closes on its
   own specimen; the marks are kept because the fingerprint has just taught the reader what
   they are, and three siblings at 20px are the payoff of that lesson.
   **Picks are computed from the text** (`src/lib/kinship.js`) — TF-IDF over the corpus,
   cosine similarity, local scaling, top three. The same principle as the fingerprint: the
   essay's own words decide, so post 47 wires itself up and there is no `tags:` field to
   backfill (there never was one — 0 of 46 essays carried tags) and no relevance metadata
   to rot. *Local scaling is load-bearing:* raw cosine has a hubness problem, and the first
   contact sheet proved it — URX's YC story was recommended by 12 of 44 essays and four
   long, vocabulary-broad posts took a third of every slot on the site. Dividing each pair
   by both essays' own local density (their K-th best match) spread that back out and
   produced the mutual pairings raw cosine missed.
   **`related:` in frontmatter overrides the computation**, and is set on exactly two
   essays — the two the contact sheet showed computation losing: *The courage to remove*
   (181 words is too little vocabulary to compute from) and *Quantified me* (a 2012
   vocabulary that shares almost nothing with the archive). This is the escape hatch this
   file said to build only once a sheet turned up a dud worth overriding. An unknown slug
   in `related:` fails the build rather than silently dropping a link.
   Static, no JS, no cards. Unlisted essays get a foot of their own but are never anyone's
   neighbour. **A new essay wires itself up in both directions and needs no frontmatter** —
   it gets a foot, and it becomes a candidate for every other essay's foot, so adding a post
   re-picks the whole site. Verified by probe 2026-07-29.
   Gates: `scripts/check-essay-foot.mjs` runs as `postbuild`, so a missing, self-referential,
   dead, or draft onward link fails the build and cannot reach production — it is enforced,
   not advisory. `node scripts/kinship-sheet.mjs` (add `weakest` for the loosest twelve) is
   the contact sheet and stays manual by nature: it is human review, and it is what should be
   run after publishing a new essay, and especially after publishing a short one — under
   roughly 200 words there is too little vocabulary to compute from and the picks go noisy
   (the failure mode that earned both `related:` overrides).
   **A sticky or scroll-up-revealing desktop header remains rejected** (owner decision,
   restated 2026-07-29) — the fixed auto-hiding header is mobile-only by construction. The
   dead end was real; a bar over a page designed to be still was not the fix. The footer
   strip gained a single `Home` link instead, which is the global escape at any scroll
   depth on every page; `Writing` was tried there and cut, because a reader scrolling down
   from mid-essay meets `All writing →` before the footer and the homepage carries the
   whole archive anyway.
5. **OG cards** — 1200×630 build-time renders: dark paper, hairline frame, serif title,
   mono provenance, and the living-logo wordmark (extracted from `Logo.astro` at build).
   Owner decision 2026-07-27: the glyph trace was tried here and rejected — out of
   context it reads as an unexplained squiggle. Glyphs stay where they have context
   (index, pressmark); the logo carries identity off-site.

**Determinism is law.** Same seed → same drawing, on every build, in both themes.
**Quality gate:** `node scripts/check-phone-soil.mjs` after a build asserts the two
invariants the phone surface can silently break — every seed × width draws (16 × 6, worst
case not average, because the mean looked survivable throughout the blank-page bug) and no
ink lands inside a text-node rect (checked per pixel; element rects are exactly what the
roots are now allowed inside, and the check caught a real violation during the bake-off).
It is a manual gate, not `postbuild`: it needs a browser, and a Netlify deploy should not
depend on one. Every new glyph set renders to a contact sheet and gets human review
before ship. Algorithmic slop is still slop — the gate earns its keep: it is what caught
the flat-dash seedling on 2026-07-29, after the idea had already been agreed. There is
**no** `seedOverride` escape hatch; this file claimed one for months and no such
frontmatter was ever implemented. Owner call 2026-07-29: build it only if a contact sheet
actually turns up a dud worth overriding.

## Component vocabulary

`logo` (the living mili wordmark, `Logo.astro`) · `row` (glyph + serif title + mono date)
· `eyebrow` (mono section label) · `substrate` (the page-wide root layer + its mono
provenance line) · `fingerprint` (the essay's growth-fold in a hairline frame + mono
caption — the contained instrument) · `facts` (the bio bullets) · `keep reading` (the
essay foot: eyebrow + three `row`s + the mono `All writing →` line, `KeepReading.astro`)
· `footer strip`.
That's the whole kit; new surfaces compose these before inventing.

## Anti-patterns (the audit checks these)

- **No AI-generated imagery anywhere.** The ChatGPT hero PNGs are scheduled for deletion.
- No gradients, no cards, no bento grids, no border-radius above 2px, no drop shadows.
  The substrate's tone ramp is field-driven and therefore patchy — regions of warmth
  where commit mass landed. **A depth-driven version of the same idea would be a vertical
  gradient and is banned**; it was considered and rejected on exactly that ground
  (2026-07-29). If the tint ever reads as a top-to-bottom fade, it has drifted — revert.
- No second accent colour; no colour in chrome; no coloured links. The substrate ramp is
  one hue per theme varying in tone, which is why it does not breach this.
- No CDN-loaded assets of any kind (fonts, CSS, JS).
- No infinite animation loops (sole exception: the living logo, see §Motion); nothing
  else animates on essay pages.
- Links are identified by a visible underline in `muted` (≥3:1), darkening on hover —
  never by colour, and never by a hairline too faint to see.
- No terminal-typing effects, no Matrix-rain framing — the substrate is data-fed,
  seed-labelled (the provenance line at the bottom of the soil), and settles to rest
  precisely so it reads as a specimen, not a screensaver. The old defense was the
  border and caption; the new one is provenance plus stillness. If it ever loops
  idly or loses its seed line, it has become wallpaper — revert.
- No self-scoreboards, badges, or "called it" marks — nothing that grades John's own
  work on his own site, and nothing that requires annual editorial upkeep to stay true.
- Muted text never falls below WCAG AA (4.5:1).
- No `#39d353` outside the `/commits` chart — the site's green is `sig`.
