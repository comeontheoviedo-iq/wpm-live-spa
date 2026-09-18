# APP / Den Live score path

**Event (Sep 2026):** APP Dillons Overland Park Open · tournamentId **18453**  
**Venue:** AdventHealth Sports Park at Bluhawk, Overland Park, KS  
**Timezone:** `America/Chicago` (derived from venue; Den Live info payload has no IANA field)  
**WPM connector:** `netlify/functions/app.mts` → `/api/app` · tour chip **`app`**

## Intake (pass)

| Field | Value |
|-------|--------|
| Name | APP Dillons Overland Park Open |
| Venue | AdventHealth Sports Park at Bluhawk · Overland Park, KS |
| Timezone | America/Chicago |
| Score path | Den Live JSON proxies (below) |

If any of these fail at runtime, `/api/app` returns `{ delayed: true, message: "scores delayed", matches: [] }` — never invent lines or fake 0–0.

## Official endpoints (prefer these)

Den Live SPA (`https://denlive.pickleballden.com`) proxies Pickleball Den. No API key required on these public proxies.

| Endpoint | Purpose |
|----------|---------|
| `GET https://denlive.pickleballden.com/api/tournament-info?tournamentId={id}` | Venue, links, published metadata |
| `GET https://denlive.pickleballden.com/api/tournament-brackets?tournamentId={id}` | Bracket list (name, status, startDate/startTime, scoreFormat) |
| `GET https://denlive.pickleballden.com/api/bracket-matches?bracketId={id}&size=200` | Match list for one bracket |

Direct fallback used by Den Live when proxy fails (may need auth from some networks):

`GET https://api.pickleballden.com/api/public/brackets/{bracketId}/matches?size={n}`

WPM uses the **Den Live proxies only** (stable, keyless from our egress).

## Match payload notes

- Wrapper: `{ requestedBracketId, fetchedAt, payload: { content: Match[] } }`
- Statuses seen: `COMPLETED`, `SCHEDULED`, `WAITING_FOR_COURT`, `WAITING_FOR_OPPONENT`, `BYE`; live tokens Den maps: `RUNNING` / `IN_PROGRESS` / `STARTED` / `PLAYING`
- Scores: `scores: [{ gameNumber, team1Score, team2Score }]` — only played games (no pad 0–0 in feed so far)
- `startTime` / `endTime`: Java-style arrays `[y, M, d, H, m, s, nanos]` with **1-indexed month**, venue-local wall clock
- Teams: `team1` / `team2` with `players[].name`

## Product rules (APP on WPM LIVE)

- Tour label: **APP** (`tour: "app"`)
- Stay in-app — `watch` left empty (no bounce to Den / APPTV as the product path)
- Shop stays closed
- Do not regress WC / PPA overlays
- LIVE only from Den running statuses (or WAITING_FOR_COURT dated onto today); never clock-promote NEXT→LIVE

## Browse URL (ops)

https://denlive.pickleballden.com/?tournamentId=18453&homeView=day&browseDate=2026-09-18
