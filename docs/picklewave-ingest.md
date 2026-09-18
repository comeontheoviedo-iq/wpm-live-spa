# PickleWave ingest (WPM LIVE)

**Product:** https://live.worldpickleballmagazine.com  
**Rule:** Never iframe PickleWave. Scrape public HTML and restyle into WPM. Label Pro ELO / tour pool as PickleWave public boards. Never invent scores.

## What is public (2026-09-15)

| Surface | Path | Parseable |
|---------|------|-----------|
| Pro ELO boards | `/rankings/all-singles`, `/rankings/mens-doubles` | rank, name, id, ELO, DUPR |
| Player profile | `/players/{id}-{slug}` | name, watch (YouTube), partners teaser, tournament list |
| Tour recent | `/players/{id}-{slug}/ppa` | match cards: event, round, category, date, sides, **W/L** |
| Match page | `/matches/{id}-…` | ld+json `Final score: N - M` (sets). Game-by-game lines not relied on. |
| Recent turbo-frame | `/players/…/recent-matches-table` | **Empty for anonymous clients** — degraded; do not treat as live feed |

Bright’s PickleWave id: **`128780`** (seen on singles / women’s doubles boards). Seeds: Waters `477702`, Johns `367397`.

## Code

- `netlify/functions/wave-parse.mjs` — fetch + parsers + `fetchWavePlayer`
- `netlify/functions/rankings.mts` — live boards → `elo`; seed + top ~10 singles → `wavePlayers`
- `netlify/functions/wave-snap-build.mjs` — shared snap builder
- `netlify/functions/wave-snap-refresh.mts` — nightly cron → Blobs
- `netlify/functions/wave-snap.json` — bundled fallback (boards + `players`)
- `scripts/refresh-wave-snap.mjs` — manual/deploy refresh of bundled snap

## API (`GET /api/rankings`)

```json
{
  "elo": { "singles": [...], "mensDoubles": [...] },
  "wavePlayers": {
    "477702": {
      "name": "Anna Leigh Waters",
      "elo": 2398,
      "dupr": "6.57",
      "recent": [
        {
          "matchId": "731010",
          "event": "2026 PPA Atlanta Championships",
          "round": "Finals",
          "category": "Womens Singles",
          "date": "May 3, 2026",
          "result": "W",
          "score": "2-0",
          "opponent": [{ "id": "284026", "name": "Kate Fahey" }],
          "partner": []
        }
      ],
      "watch": [{ "title": "…", "youtubeId": "…", "url": "https://www.youtube.com/watch?v=…" }]
    }
  },
  "waveMeta": { "liveBoards": true, "scraped": 12, "degraded": [], "seed": { "Waters": "477702", "…": "…" } },
  "source": {
    "elo": "picklewave.com public rankings",
    "wavePlayers": "picklewave.com public player + /ppa tabs (restyled; no iframe)",
    "gpa": "gpapickleball.org",
    "ppaWorld": "ppatour.com/api/rankings (live|blobs|fallback)"
  },
  "ppaWorldUpdated": "ISO-8601 or null"
}
```

`score` is the **set** score from match ld+json when present. If missing, UI shows W/L only — never fabricates game scores.

## Client

`/player/Waters|Johns|Bright` (and any profile whose Pro ELO id is in `wavePlayers`) shows **Recent (Pro tour pool)** — WPM-styled rows with opponent links, optional watch chips. Follow unchanged.

## Ops

- Runtime function **does not write** `wave-snap.json` (read-only deploy FS).
- **Nightly (prod):** `wave-snap-refresh.mts` cron `0 6 * * *` (06:00 UTC) scrapes via `wave-snap-build.mjs` and stores JSON in **Netlify Blobs** (`wpm-wave` / `snap`) — **no static redeploy required**.
- **`rankings.mts`:** Blobs snap first → bundled `wave-snap.json` fallback. `waveMeta.snapSource` is `"blobs"` or `"bundled"`; `waveMeta.snapUpdated` when available.
- Runtime request path: live Pro ELO boards + **seed trio** player scrapes; top-~10 pool served from snap.
- Set scores enriched in nightly Blobs job / `scripts/refresh-wave-snap.mjs` and merged onto live W/L rows when matchIds match.
- Before prod deploys (optional fresher bundled fallback): `node scripts/refresh-wave-snap.mjs`
- Shared builder: `netlify/functions/wave-snap-build.mjs`
- Function timeout for `rankings` and `wave-snap-refresh` set to 26s in `netlify.toml`.
- Git home + more ops: `docs/ops-git.md` → https://github.com/comeontheoviedo-iq/wpm-live-spa

## Explicit non-goals

- No PickleWave iframe / link-out wall as the primary UI
- No invented scores or collapsed “world #1”
- Do not regress WC Sporttora ingest or PPA pad/rolling-date desk work
