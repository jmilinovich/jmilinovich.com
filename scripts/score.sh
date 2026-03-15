#!/usr/bin/env bash
# Style consistency scorer for jmilinovich.com
set -uo pipefail

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)/src"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
JSON_MODE=false
if [[ "${1:-}" == "--json" ]]; then JSON_MODE=true; fi

score=0
max_score=0
results=()

check() {
  local name="$1" points="$2" pass="$3" note="$4"
  max_score=$((max_score + points))
  local pts=0
  if [[ "$pass" == "true" ]]; then
    pts=$points
    score=$((score + points))
    results+=("PASS|$name|$pts|$points|$note")
  else
    results+=("FAIL|$name|0|$points|$note")
  fi
}

safe_count() {
  local count
  count=$(grep -r "$@" 2>/dev/null | wc -l | tr -d ' ')
  echo "${count:-0}"
}

safe_count_files() {
  local count
  count=$(grep -rl "$@" 2>/dev/null | wc -l | tr -d ' ')
  echo "${count:-0}"
}

# ── 1. No Space Grotesk references (15 pts) ──
c=$(safe_count_files "Space Grotesk" "$SRC_DIR" --include="*.astro" --include="*.css")
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "no-space-grotesk" 15 "$pass" "Found $c files referencing Space Grotesk"

# ── 2. No Inter font references (10 pts) ──
c=$(safe_count_files "'Inter'" "$SRC_DIR" --include="*.astro" --include="*.css")
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "no-inter-font" 10 "$pass" "Found $c files referencing Inter font"

# ── 3. No Google Fonts loading (10 pts) ──
c=$(safe_count_files "fonts.googleapis.com" "$SRC_DIR" --include="*.astro")
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "no-google-fonts" 10 "$pass" "Found $c files loading Google Fonts"

# ── 4. No #FF1A75 pink accent color (10 pts) ──
c=$(safe_count_files "FF1A75" "$SRC_DIR" --include="*.astro" --include="*.css")
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "no-pink-accent" 10 "$pass" "Found $c files using pink accent"

# ── 5. Content links use #1a4dc2 blue consistently (15 pts) ──
blue_pass=0
blue_missing=""
for f in components/PostCard.astro pages/talks.astro pages/about.astro pages/projects.astro; do
  if grep -q "1a4dc2" "$SRC_DIR/$f" 2>/dev/null; then
    blue_pass=$((blue_pass + 1))
  else
    blue_missing="$blue_missing $f"
  fi
done
pass="false"; [[ "$blue_pass" == "4" ]] && pass="true"
check "content-links-blue" 15 "$pass" "$blue_pass/4 use blue.${blue_missing:+ Missing:$blue_missing}"

# ── 6. No px font-sizes (10 pts) ──
c=$(safe_count "font-size:.*[0-9]px" "$SRC_DIR" --include="*.astro" --include="*.css" -n)
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "no-px-font-sizes" 10 "$pass" "Found $c font-size declarations using px"

# ── 7. Consistent content text size (10 pts) ──
c=$(safe_count "font-size: 1\.6rem" "$SRC_DIR/pages" --include="*.astro" -n)
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "fluid-content-text" 10 "$pass" "Found $c pages using static 1.6rem"

# ── 8. UI text uses sans-serif stack (10 pts) ──
c=$(grep -c "sans-serif" "$SRC_DIR/components/Footer.astro" 2>/dev/null | tr -d '[:space:]' || echo "0")
pass="false"; [[ "$c" -gt 0 ]] 2>/dev/null && pass="true"
check "ui-text-sans-serif" 10 "$pass" "Footer sans-serif: $c references"

# ── 9. Consistent paragraph margins (5 pts) ──
c=$(safe_count "margin-bottom: 1\.6rem" "$SRC_DIR" --include="*.astro" -n)
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "consistent-p-margins" 5 "$pass" "Found $c uses of 1.6rem margin (should be 1.5rem)"

# ── 10. Consistent list padding (5 pts) ──
c=$(safe_count "padding-left: 2\.4rem" "$SRC_DIR" --include="*.astro" -n)
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "consistent-list-padding" 5 "$pass" "Found $c uses of 2.4rem padding (should be 2rem)"

# ── 11. No unused transitions (5 pts) ──
c=$(grep -A5 "\.post-card-link {" "$SRC_DIR/components/PostCard.astro" 2>/dev/null | grep -c "transition: opacity" 2>/dev/null || true)
c="${c:-0}"
c=$(echo "$c" | tr -d '[:space:]')
pass="false"; [[ "$c" == "0" ]] && pass="true"
check "no-unused-transitions" 5 "$pass" "$c orphaned opacity transitions in PostCard"

# ── 12. Build succeeds (15 pts) ──
if (cd "$PROJECT_DIR" && npm run build >/dev/null 2>&1); then
  check "build-succeeds" 15 "true" "Build passed"
else
  check "build-succeeds" 15 "false" "Build FAILED"
fi

# ── Output ──
if $JSON_MODE; then
  json_components=""
  for r in "${results[@]}"; do
    IFS='|' read -r status name pts mx note <<< "$r"
    p="true"; [[ "$status" == "FAIL" ]] && p="false"
    entry="{\"name\":\"$name\",\"points\":$pts,\"max\":$mx,\"pass\":$p,\"note\":\"$note\"}"
    if [[ -n "$json_components" ]]; then
      json_components="$json_components,$entry"
    else
      json_components="$entry"
    fi
  done
  echo "{\"score\":$score,\"max\":$max_score,\"pct\":$(( score * 100 / max_score )),\"components\":[$json_components]}"
else
  echo ""
  echo "═══════════════════════════════════════"
  echo "  Style Consistency Score: $score / $max_score ($(( score * 100 / max_score ))%)"
  echo "═══════════════════════════════════════"
  echo ""
  for r in "${results[@]}"; do
    IFS='|' read -r status name pts mx note <<< "$r"
    if [[ "$status" == "PASS" ]]; then
      printf "  ✓ %-26s %2s/%2s  %s\n" "$name" "$pts" "$mx" "$note"
    else
      printf "  ✗ %-26s %2s/%2s  %s\n" "$name" "$pts" "$mx" "$note"
    fi
  done
  echo ""
fi
