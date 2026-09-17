# WPM LIVE (SPA) — World Pickleball Magazine live scores

**This is the live-scores SPA** deployed at Netlify site `wpm-live`.

| | |
|---|---|
| **Prod URL** | https://live.worldpickleballmagazine.com |
| **Netlify site id** | `6b6104d9-eea8-44bf-8c47-59018c3ff4c6` |
| **GitHub** | https://github.com/comeontheoviedo-iq/wpm-live-spa |

## Do not confuse with Pitchline

**NEVER** push this tree to `comeontheoviedo-iq/wpm-live`. That repo is **Pitchline / CoComms**, a different product. This SPA lives only in **`wpm-live-spa`**.

## What it is

Static SPA (`site/`) plus Netlify Functions for scores, rankings (PickleWave Pro ELO + GPA + PPA desk), World Cup ingest, magazine, history. Rankings never invent scores; PickleWave is scraped public HTML and restyled (no iframe).

## Deploy

Manual / Netlify CLI from this repo (linked to site id above):

```bash
# optional: freshen bundled snap before deploy
node scripts/refresh-wave-snap.mjs

netlify deploy --prod --dir=site --message "…"
# or full project deploy (functions + publish dir from netlify.toml):
netlify deploy --prod --message "…"
```

Functions publish from `netlify/functions`; static from `site/` (`netlify.toml`).

## Nightly PickleWave snap

Scheduled function `wave-snap-refresh` runs **06:00 UTC**, scrapes public boards + top players, writes JSON to **Netlify Blobs** store `wpm-wave` key `snap`. `/api/rankings` reads Blobs first, then falls back to bundled `wave-snap.json`. See `docs/picklewave-ingest.md` and `docs/ops-git.md`.

## Local

```bash
npm install
# link once: netlify link --id 6b6104d9-eea8-44bf-8c47-59018c3ff4c6
netlify dev
```
