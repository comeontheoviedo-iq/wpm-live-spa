# APP · Den Live tournamentId discovery

**Last hunt:** 2026-09-18 (BST) · Den Live proxies + APP site + GPA calendar  
**Rule:** never invent scores; intake needs name + venue + timezone + working Den `tournamentId`.

## Blocked APP events (radar / GPA)

| Event (GPA) | Dates | Den Live `tournamentId` | Venue / tz guess | Notes |
|-------------|-------|-------------------------|------------------|-------|
| APP Dillons Overland Park Open | Sep 17–20, 2026 | **18453** | AdventHealth Sports Park at Bluhawk · `America/Chicago` | Live on `/api/app`. APP page links `denlive…?tournamentId=18453`. |
| APP Japan – Sendai (Xebio / Asia Qualifier) | Sep 19–20, 2026 (JST site: Sep 18–20) | **not found** | Motoyama Seisakujo Aoba Arena, Sendai · `Asia/Tokyo` | **Not on Pickleball Den.** Registration / draws: Tournated `games.japanpickleball.org/tournament/11359`. No denlive link. |
| APP Columbus Open | Oct 1–4, 2026 | **not found** | Pickle & Chill, 880 W Henderson Rd, Columbus OH · `America/New_York` | APP page has **registration only**: `app.pickleballden.com/external-tournament/8057937`. External id ≠ Den Live id (8057937 → brackets 404). No `denlive…tournamentId=` on APP page yet. |
| APP Asia Chongqing Open | Oct 2–6, 2026 | **not found** | Chongqing, China · `Asia/Shanghai` (guess) | APP Asia Tour (**not MLP Asia**). APP page has **no** Den / denlive / external-tournament link. Score path unknown. |
| TPB Gijón 2026 | Sep 18–20, 2026 | **not found** | Puerto Deportivo de Gijón · `Europe/Madrid` | TOP Pickleball Tour powered by APP — **not Den Live**. Draw PDF only. See `docs/slate-europe.md`. |

## Other Den Live APP ids verified (brackets name)

| Den id | Name | Dates | tz profile |
|--------|------|-------|------------|
| 18442 | APP Detroit Open | 2026-08-19…08-23 | `America/Detroit` |
| 18453 | APP Dillons Overland Park Open | 2026-09-17…09-20 | `America/Chicago` |
| 18454 | Humana APP Louisville Open | 2026-10-15…10-18 | `America/New_York` |

## How Den Live discovery works

Den Live SPA (`denlive.pickleballden.com`) has **no public tournament list/search**. Ops enter a numeric id.

| Endpoint | Use |
|----------|-----|
| `GET /api/tournament-brackets?tournamentId={id}&size=1` | Returns `{ tournament: { tournamentId, name, startDate, endDate }, brackets… }` even when info is null |
| `GET /api/tournament-info?tournamentId={id}` | Venue/links when Den Live “info” is published (often `null` until week-of) |
| `GET /api/bracket-matches?bracketId={id}&size=200` | Match rows |

`api.pickleballden.com/api/public/tournaments*` requires an API key (403 from public egress).  
`external-tournament/{largeId}` is the **registration** Vaadin app id — **not** the Den Live scoring id.

### Hunt method that worked

1. Read GPA `/api/rankings` events + `docs/radar-log.md` for blocked names/dates.  
2. Check APP tour pages for `denlive…tournamentId=` (Overland) vs `external-tournament/` (Columbus) vs none (Chongqing/Sendai).  
3. Probe `tournament-brackets` for nearby numeric ids (APP cluster ~18442–18454).  
4. **Do not** spray Den from a single IP — production egress gets HTTP **429** and can delay `/api/app`.

## Wiring `/api/app` without a code edit per stop

`netlify/functions/app.mts` resolves the active Den id in order:

1. Query `?tournamentId=` (ops smoke)  
2. Env `APP_DEN_TOURNAMENT_ID` (or `DEN_TOURNAMENT_ID`)  
3. Blobs **`wpm-app`** / key **`active-tournament`**  
   ```json
   { "tournamentId": "18453", "name": "…", "venue": "…", "timezone": "America/Chicago" }
   ```  
4. Blobs **`wpm-desk`** / key **`calendar-armed`** — prefers in-window APP rows with `connector.type=app` + `denTournamentId`  
5. Fallback **18453**

Arming Sendai/Columbus/Chongqing on `/calendar` as **live-path** is blocked until a real Den Live id exists. Results-only calendar rows (venue + tz, no score path) are fine — never fake 0–0.

## Residual

- Re-check Columbus when APP adds a denlive link (or Den Live info publishes).  
- Sendai needs a **non-Den** connector if WPM wants live boards (Tournated / local feed) — out of scope for `/api/app`.  
- Chongqing: wait for organizer score path (APP Asia Tour, not MLP Asia).  
- Gijón is TOP Pickleball, not Den — do not hunt a Den id as if it were APP Overland. See `docs/slate-europe.md`.  
- `DESK_KEY` was not present in Netlify env at hunt time — calendar POST arming needs that secret (or direct Blobs write).

