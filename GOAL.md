# GOAL.md — jmilinovich.com Design Consistency

## Goal:
Every page of jmilinovich.com should feel like it belongs to the same site. Self-consistency is the north star — identical patterns must look identical, and the design should be understated, serif-forward, and cohesive.

## Fitness Function

### Primary: Visual consistency tests (Playwright)

```bash
npx playwright test --project="Desktop Chrome"    # run all visual + consistency tests
```

These tests use real browser rendering to verify:
1. **Screenshots** — captured for every page + a blog post, saved to `screenshots/` for human review
2. **Cross-page style assertions** — computed styles (font-family, font-size, color, spacing) are extracted from rendered DOM and compared across pages
3. **Structure assertions** — DOM patterns (h2 + date blocks) verified to be identical between writing and talks

The tests are the source of truth. If a test passes but it looks wrong in the screenshot, the test is wrong and should be updated.

### Secondary: Code-level checks

```bash
./scripts/score.sh          # human-readable
./scripts/score.sh --json   # machine-readable
```

Static grep-based checks for known anti-patterns (old fonts, wrong colors, px units). These catch regressions fast but cannot verify visual consistency — that's what Playwright is for.

**Metric Mutability:** Split — the agent can add new tests or checks but cannot weaken existing ones (cannot delete assertions or lower thresholds).

## What "good" means

### Self-consistency (highest priority)
- If two pages show a list of links, the links must look identical: same font, size, color, weight, spacing, hover behavior
- If a pattern exists on one page (e.g., blue content links), it must exist everywhere that pattern appears
- The eye test matters: generate screenshots and verify they look cohesive

### Design principles
- **Serif-forward**: Georgia for all reading content. System sans-serif only for UI chrome (nav, footer, metadata text)
- **Understated**: No flashy colors. Blue links, dark text, gray metadata. No gradients, shadows, or decorative elements
- **Consistent units**: All sizes in rem (html at 62.5% so 1rem = 10px). No px for font sizes
- **One hover pattern per link type**: Content links get underline. Nav/chrome links get opacity fade. Never mix

### Source of truth
- `STYLEGUIDE.md` defines the canonical values for fonts, colors, sizes, and spacing
- `tests/visual-comparison.spec.ts` enforces consistency via browser rendering
- `scripts/score.sh` catches code-level regressions
- When in doubt, the screenshots are the final arbiter

## Improvement Loop

1. Run `npx playwright test --project="Desktop Chrome"` to check visual consistency
2. Review screenshots in `screenshots/` — do all pages feel like the same site?
3. If a test fails: fix the source file per STYLEGUIDE.md, re-run
4. If tests pass but screenshots look wrong: update the test to catch the issue, then fix
5. Run `./scripts/score.sh` to verify no code-level regressions
6. Commit with message: `[S:NN->NN] component: what changed`

## Test Coverage

| Test | What it verifies |
|---|---|
| `h1 consistent styling` | All section page headings use same font, size, weight, color |
| `list item titles: writing vs talks` | Post titles and talk titles are styled identically |
| `list item dates: writing vs talks` | Date elements match in font-size, color, weight |
| `list item spacing` | margin-bottom is identical between writing and talks items |
| `content link colors` | Blue #1a4dc2 used consistently on writing, talks, about, projects |
| `nav links consistent font` | Navigation uses same font stack on every page |
| `body serif font` | Georgia is the body font on every page |
| `no old fonts in HTML` | Space Grotesk and Inter are not referenced anywhere |
| `DOM structure: writing vs talks` | Both use h2 headings with date blocks, not inline text |
| `screenshots` | Full-page captures of every page for human visual review |

## Operating Mode

**Converge** — Stop when all Playwright tests pass AND screenshots pass human review.

## Constraints

- Never introduce external font dependencies (no Google Fonts)
- All styles in `<style>` blocks, no inline styles
- Changes must not break the build (`npm run build`)
- Self-consistency is non-negotiable: if you change a pattern on one page, change it everywhere
- Screenshots must be regenerated and reviewed after any visual change
- STYLEGUIDE.md must be updated when design decisions change
