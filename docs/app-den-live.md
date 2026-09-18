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


## Ship note — 2026-09-18 (BST)

**Miss owned:** APP was live on Den and absent from WPM LIVE; connector shipped same day.

| | |
|--|--|
| Event | APP Dillons Overland Park Open (Den `18453`) |
| Venue / tz | AdventHealth Sports Park at Bluhawk · `America/Chicago` |
| Deploy | `6aace76d39613170516c43d9` · `wpm-20260918a.js` |
| Verify | `/api/app` → 256 matches (55 on 2026-09-18 NEXT, 201 FT 2026-09-17); 0 phantom 0–0; PPA/WC unchanged |

**Sample lines (FT):** Brooker def Roberson 15–8 · Shackelford lost to Price 5–15 · Price def Brooker 15–4  

**Sample today (NEXT / on deck):** Men's Pro Singles waiting on court (Wazir/Dussault, Bower/Camron); Mixed Pro Doubles Gibson/Gibson vs Rivas/Goodburn scheduled.

### Residual risks
- Den bracket list is large (~50); function fans out in parallel — watch Netlify duration if Den slows.
- Timezone is **derived** from venue city (no IANA on Den info payload).
- No LIVE rows at verify time (early CT); LIVE path is unproven until a RUNNING match appears — status map covers Den live tokens.
- Amateur + pro share one tour chip; board can be noisy on All / APP filter.
- Direct `api.pickleballden.com` may 403 without key; we rely on Den Live proxies only.
