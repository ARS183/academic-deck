#!/usr/bin/env bash
# Refresh upstream assets (template, fonts, scripts) and record commit pins.
# Usage: bash vendor.sh
set -euo pipefail

REDAELM_REPO="https://github.com/Redaelm47/claude-presentation-skills"
GABBER_REPO="https://github.com/Gabberflast/academic-pptx-skill"
ROOT="$(cd "$(dirname "$0")" && pwd)"
SKILL="$ROOT/skills/academic-deck"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "cloning upstreams..."
git clone --depth 1 "$REDAELM_REPO" "$TMP/redaelm" >/dev/null 2>&1
git clone --depth 1 "$GABBER_REPO" "$TMP/gabber" >/dev/null 2>&1

echo "copying theme assets..."
mkdir -p "$SKILL/themes/metropolis/reference" "$SKILL/themes/metropolis/fonts" "$SKILL/scripts"
cp "$TMP/redaelm/.claude/skills/metropolis-deck/reference/deck-template.html" \
   "$SKILL/themes/metropolis/reference/deck-template.html"
cp "$TMP/redaelm/.claude/skills/metropolis-deck/reference/build-canvases-example.js" \
   "$SKILL/themes/metropolis/reference/build-canvases-example.js"
cp "$TMP/redaelm/.claude/skills/metropolis-deck/fonts/"* "$SKILL/themes/metropolis/fonts/"

for f in mkfonts tex2svg render qa pdf chromium; do
  cp "$TMP/redaelm/.claude/skills/presentation/scripts/$f.js" "$SKILL/scripts/$f.js"
done

{
  echo "Vendored on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "redaelm  $(git -C "$TMP/redaelm" rev-parse HEAD)"
  echo "gabber   $(git -C "$TMP/gabber" rev-parse HEAD)"
} | tee "$ROOT/NOTICE.local"

echo
echo "note: content/argument.md and content/slide-patterns.md are hand-adapted."
echo "      Review upstream diffs before overwriting them."
