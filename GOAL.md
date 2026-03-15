# GOAL.md — jmilinovich.com Style Consistency

## Goal:
Maintain visual and code-level consistency across all pages of jmilinovich.com, ensuring the design system defined in STYLEGUIDE.md is applied uniformly.

## Fitness Function

```bash
./scripts/score.sh          # human-readable
./scripts/score.sh --json   # machine-readable
```

**Metric Mutability:** Split — the agent can improve the measurement instrument (add new checks) but cannot weaken the definition of good (cannot lower passing thresholds or remove existing checks).

## Score Components (120 points)

| Component | Points | What it measures |
|---|---|---|
| no-space-grotesk | 15 | No references to the old Space Grotesk font |
| no-inter-font | 10 | No references to the old Inter font |
| no-google-fonts | 10 | No external Google Fonts loading |
| no-pink-accent | 10 | No #FF1A75 pink accent color |
| content-links-blue | 15 | All content link files use #1a4dc2 blue |
| no-px-font-sizes | 10 | All font-sizes use rem, not px |
| fluid-content-text | 10 | Content text uses clamp() fluid sizing |
| ui-text-sans-serif | 10 | UI chrome (footer, etc.) uses system sans-serif |
| consistent-p-margins | 5 | Paragraph margins are 1.5rem everywhere |
| consistent-list-padding | 5 | List padding is 2rem everywhere |
| no-unused-transitions | 5 | No orphaned CSS transitions |
| build-succeeds | 15 | Site builds without errors |

## Improvement Loop

1. Run `./scripts/score.sh` to measure baseline
2. Identify lowest-scoring component
3. Fix the source files per STYLEGUIDE.md
4. Re-run scorer to confirm improvement
5. If score did not improve, revert
6. Commit with message: `[S:NN->NN] component: what changed`

## Operating Mode

**Converge** — Stop when all components pass (120/120).

## Constraints

- Never introduce new external font dependencies
- Never use inline styles — all styles in `<style>` blocks
- Changes must not break the build
- STYLEGUIDE.md is the source of truth for design decisions
- Atomic commits only — one logical change per commit
