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

- Tour: `tour: "app"` + `tier: "pro"|"amateur"` · chips **APP Pro** / **APP**
- Stay in-app — `watch` left empty (no bounce to Den / APPTV as the product path)
- Shop stays closed
- Do not regress WC / PPA overlays
- LIVE only from Den running statuses (RUNNING / IN_PROGRESS / STARTED / PLAYING). WAITING_FOR_COURT is dated onto venue-today but stays NEXT. Never clock-promote NEXT→LIVE.

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

### Residual risks (addressed in hardening ship below)
- Bracket fan-out → concurrency limit + soft fail + 45s Blobs TTL (see hardening).
- Timezone still **derived** from venue city (no IANA on Den info payload).
- LIVE path unproven until first RUNNING — mapping matches Den Live SPA.
- Pro vs amateur chips shipped (APP Pro / APP); All soft-hides amateur non-LIVE.
- Direct `api.pickleballden.com` may 403 without key; we rely on Den Live proxies only.

## LIVE mapping (Den → WPM)

Den Live `isRunningMatch`: `!completed && status ∈ {RUNNING, IN_PROGRESS, INPROGRESS, STARTED, PLAYING}`.

| Den status | WPM | Notes |
|------------|-----|-------|
| RUNNING / IN_PROGRESS / STARTED / PLAYING | **LIVE** | Only when `completed` is false |
| COMPLETED / COMPLETE / FINISHED | **FT** | Walkover / empty `scores` → score-blank (no phantom 0–0) |
| WAITING_FOR_COURT | **NEXT** | Date rolled to venue-today so on-deck shows on the desk |
| SCHEDULED / PENDING | **NEXT** | |
| BYE / WAITING_FOR_OPPONENT | skipped | |

Never clock-promote NEXT→LIVE. Client `effectiveStatus` also refuses clock promotion for `tour === "app"`.

## Chips (Pro vs Amateur)

Server tags each match `tier: "pro" | "amateur"` from bracket name (`\bPro\b` → pro; else amateur, including explicit Amateur).

| Chip | Filter | Board |
|------|--------|-------|
| **APP Pro** | `app-pro` | Pro brackets only |
| **APP** | `app` | Amateur / skill-rating brackets |
| **All** | `all` | APP Pro always; APP amateur only when **LIVE** (keeps All from flooding) |

## Hardening — timeouts / concurrency

`netlify/functions/app.mts`:
- Bracket fan-out via `mapPool` concurrency **6** (Running brackets sorted first)
- Per-bracket fetch timeout **8s** (`AbortController`); info/brackets **10s**
- Fail soft per bracket → partial payload with `note` / `degraded` / `partial` (HTTP 200, never 504 for partial)
- Short Blobs TTL **45s** on store `wpm-app` key `bracket-matches:{tournamentId}:{bracketId}` — serve stale on fetch error
- Function timeout remains **26s** in `netlify.toml`

## Ship note — APP LIVE hardening · 2026-09-18 (BST)

| | |
|--|--|
| Event | APP Dillons Overland Park Open (Den `18453`) |
| Client | `wpm-20260918b.js` · SW `20260918b` |
| Deploy | `6aace96a4f95d1b5fc52fc9b` (client chip sync; prior `6aace91a3a7df1388e2c671a` had API harden) |
| Verify (prod `/api/app`) | 256 matches · liveCount 0 · tier pro 87 / amateur 169 · FT 201 / NEXT 55 · 0 phantom 0–0 · coordinated with Web Push on same `b` hash |
| Verify (pre-deploy Den scan) | 256 keepable rows · **0 LIVE** (no RUNNING yet) · 201 FT · 55 NEXT today (27 pro / 28 am) · 0 phantom 0–0 game lines · 6 score-blank FT (walkover OK) |
| Sample NEXT (pro on deck) | Wazir vs Dussault · Bower vs Camron (Men's Pro Singles, WAITING_FOR_COURT) · Stewart vs Turkovic · Policare vs Mendez (Women's Pro Singles) |
| Sample FT | Hastings def Murphy 15–7 · Ball lost to Chapman 11–15 |

### Residual
- LIVE path still waiting on first Den `RUNNING` row today (CT morning / early session); mapping matches Den Live SPA.
- Blobs cache needs prod Netlify Blobs; cold local has no store — fetches still fail soft.
- Web Push + APP Pro chips merged into the same client bust `wpm-20260918b.js` (2026-09-18).


## Configurable tournamentId (2026-09-18)

`/api/app` no longer hardcodes only `18453`. Resolution order: query `tournamentId` → env `APP_DEN_TOURNAMENT_ID` → Blobs `wpm-app`/`active-tournament` → Blobs `wpm-desk`/`calendar-armed` (APP connector) → fallback `18453`. See [`app-den-ids.md`](./app-den-ids.md).
