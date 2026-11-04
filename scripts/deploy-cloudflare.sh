#!/usr/bin/env bash
# Canonical Cloudflare deploy for live.worldpickleballmagazine.com (Worker wpm-live-spa-static).
# Source of truth is THIS repo (main). Builds a staging dir: cloudflare/ wrapper +
# netlify/functions -> api/ + site/ -> site/, then wrangler deploy. Never deploys wpmag-preview.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.cf-build"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r "$ROOT/cloudflare/src" "$ROOT/cloudflare/shims" "$ROOT/cloudflare/wrangler.toml" "$OUT/"
cp -r "$ROOT/netlify/functions" "$OUT/api"
cp -r "$ROOT/site" "$OUT/site"
cp "$ROOT/package.json" "$ROOT/package-lock.json" "$OUT/"
cd "$OUT"
grep -q '^name = "wpm-live-spa-static"' wrangler.toml || { echo "refusing: wrong worker name"; exit 1; }
npm ci --silent
npx wrangler deploy "$@"
