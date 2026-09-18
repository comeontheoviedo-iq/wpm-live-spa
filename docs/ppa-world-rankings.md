# PPA World Pickleball Rankings (live)

**Product:** WPM LIVE · labelled board next to GPA and Pro ELO — never merged into one fake world #1.  
**Official page:** https://www.ppatour.com/rankings  
**Composite weights:** men's/women's doubles **50%** · mixed doubles **35%** · singles **15%** (last 52 weeks of Carvana PPA Tour points).

## Endpoint

| Item | Value |
|------|--------|
| Upstream | `GET https://www.ppatour.com/api/rankings/` |
| Shape | `{ divisions: [{ key: "men"\|"women", entries: [{ rank, name, points, … }] }], source }` |
| WPM API | `/api/rankings` → `ppaWorld`, `ppaWorldUpdated`, `source.ppaWorld` |

Same origin family as ticker/scores (`/api/ticker/`, `/api/scores/`). No HTML scrape required while this JSON stays public.

## Runtime (`netlify/functions/rankings.mts`)

1. **Blobs cache** — store `wpm-ppa`, key `world`, TTL **1 hour** (`at` + `board` + `updated`).
2. **Live fetch** — User-Agent `WPM-LIVE/1.0`; map top **100** men + women to `{ rank, name, points }` (points rounded to 1 decimal to match the official board).
3. **Stale Blobs** — if live fetch fails but a prior blob exists, serve it and label `source.ppaWorld` accordingly.
4. **Static fallback** — embedded `PPA_WORLD_FALLBACK` snapshot only when live + Blobs both unavailable (`ppaWorldUpdated: null`).

`source.ppaWorld` strings:

- `ppatour.com/api/rankings (live)`
- `ppatour.com/api/rankings (blobs cache ≤1h)`
- `ppatour.com/api/rankings (stale blobs)`
- `ppatour.com/rankings (static snapshot fallback)`

## Client

Existing PPA World tab / profile ranking cards already consume `data.ppaWorld`. Server-only change — no cache-bust required unless UI starts showing `ppaWorldUpdated`.

## Constraints

- Do **not** invent ranks or invent points.
- Do **not** merge PPA World with GPA or Pro ELO / PickleWave.
- Shop stays closed (Coming soon).
- Leave `wavePlayers` / GPA paths unchanged.
