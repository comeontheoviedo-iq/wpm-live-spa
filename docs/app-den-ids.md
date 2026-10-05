# APP · Den Live tournamentId discovery

**Last hunt:** 2026-10-02 · Den Live `tournament-brackets` widened past 18670 until HTTP 429; SportsSync sitemap titles 91–471  
**Rule:** never invent scores; intake needs name + venue + timezone + working Den `tournamentId`. LIVE only when Den matches are RUNNING. No phantom 0–0. Shop stays Coming soon.

## Blocked APP events (radar / GPA)

| Event (GPA) | Dates | Den Live `tournamentId` | Venue / tz guess | Notes |
|-------------|-------|-------------------------|------------------|-------|
| APP Columbus Open presented by The James | Oct 1–4, 2026 | **18448** | Pickle & Chill, Columbus, OH · `America/New_York` | **Still `/api/app`.** Window ended 4 Oct. Archive `columbus` is `current: false`. Do not cut to Den **18454** yet. Registration external id `8057937` is **not** the scoring id. |
| APP Dillons Overland Park Open | Sep 17–20, 2026 | **18453** | AdventHealth Sports Park at Bluhawk · `America/Chicago` | **Ended.** Disarmed / not `onLive`. Was the September live path. |
| APP Japan – Sendai (Xebio / Asia Qualifier) | Sep 19–20, 2026 (JST site: Sep 18–20) | **not found** | Motoyama Seisakujo Aoba Arena, Sendai · `Asia/Tokyo` | **Not on Pickleball Den.** Registration / draws: Tournated `games.japanpickleball.org/tournament/11359`. No denlive link. |
| APP Asia Chongqing Open | Oct 2–6, 2026 | **not found** | Chongqing, China · `Asia/Shanghai` | APP Asia Tour (**not MLP Asia**). **No Den id. No SportsSync id** after the 2026-10-02 hunt (organizer 1645900 still KL 89 / Penang 222; sitemap titles have no Chongqing; 390/391 unresolved). Calendar/results-only. Do not invent either id. Do not fake LIVE. See [`sportssync-asia.md`](./sportssync-asia.md). |
| TPB Gijón 2026 | Sep 18–20, 2026 | **not found** | Puerto Deportivo de Gijón · `Europe/Madrid` | TOP Pickleball Tour powered by APP — **not Den Live**. Draw PDF only. See `docs/slate-europe.md`. |

## Other Den Live APP ids verified (brackets name)

| Den id | Name | Dates | tz profile |
|--------|------|-------|------------|
| 18442 | APP Detroit Open | 2026-08-19…08-23 | `America/Detroit` |
| 18448 | APP Columbus Open presented by The James | 2026-10-01…10-04 | `America/New_York` |
| 18453 | APP Dillons Overland Park Open | 2026-09-17…09-20 | `America/Chicago` |
| 18454 | Humana APP Louisville Open | 2026-10-15…10-18 | `America/New_York` · Kentucky International Convention Center | **Ready next pin** (`APP_NEXT`). Not selected until `APP_LIVE = APP_NEXT`. |

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
2. Check APP tour pages for `denlive…tournamentId=` (Columbus **18448**, previously Overland) vs `external-tournament/` (registration only — not the scoring id) vs none (Chongqing/Sendai).  
3. Probe `tournament-brackets` for nearby numeric ids (APP cluster ~18442–18454).  
4. **Do not** spray Den from a single IP — production egress gets HTTP **429** and can delay `/api/app`.

## Wiring `/api/app` without a code edit per stop

`netlify/functions/app.mts` resolves the active Den id in order:

1. Query `?tournamentId=` (ops smoke)  
2. Env `APP_DEN_TOURNAMENT_ID` (or `DEN_TOURNAMENT_ID`)  
3. Blobs **`wpm-app`** / key **`active-tournament`**  
   ```json
   { "tournamentId": "18448", "name": "APP Columbus Open presented by The James", "venue": "Pickle & Chill, Columbus, OH", "timezone": "America/New_York" }
   ```  
4. Blobs **`wpm-desk`** / key **`calendar-armed`** — prefers in-window APP rows with `connector.type=app` + `denTournamentId`. Code seeds Columbus `18448` and drops ended Overland `18453`.  
5. Fallback **18448**

Ended **18453** on env or in those blobs is skipped (query `?tournamentId=18453` still smokes the old event). At the 30 Sep 2026 cut, prod `idSource` was `wpm-app:active-tournament` pinned to `18453`. Code no longer uses that pin. A post-deploy blob write is **not required** for `/api/app` to leave Overland; write the JSON above so the store matches Columbus.

Arming Chongqing (or Sendai) on `/calendar` as **live-path** stays blocked — no Den Live id. Results-only calendar rows are the only honest state. Never fake 0–0. Never mark LIVE unless Den matches are RUNNING.

## Residual

## Louisville week — what still has to flip

`APP_NEXT` is Humana APP Louisville Open, Den **18454**, 15–18 Oct 2026, Kentucky International Convention Center, `America/New_York`. `/api/app` does **not** use it yet. Columbus **18448** stays the pin (archive `current: false`).

One code change when the week opens: in `netlify/functions/slate-events.mjs`, set `export const APP_LIVE = APP_NEXT`. That also lets env and blob pins of 18454 through. Until then those pins are ignored. `?tournamentId=18454` still smokes the profile.

Still to do on that cut, not in this PR:

- Confirm Den brackets for 18454 answer before the flip (`/api/app?tournamentId=18454`). Do not mark LIVE until a match is RUNNING / IN_PROGRESS / STARTED / PLAYING.
- Point the armed calendar row at 18454 after `APP_LIVE` moves. Do not arm Louisville `onLive` while Columbus is the pin.
- Leave Columbus in the archive as `current: false`. Do not invent a Louisville archive week early.
- Bump the client cache letter again. Push follows `/api/app` on its own once the pin moves.
- Do not change DNS, Netlify site settings, or Cloudflare.

- Columbus Den Live **info** payload was still `null` at cut (venue/tz from the profile, name from `tournament-brackets`). Brackets were Pending with 0 matches — board stays empty until real rows exist.  
- Sendai needs a **non-Den** connector if WPM wants live boards (Tournated / local feed) — out of scope for `/api/app`.  
- Chongqing: **still no Den id, and no SportsSync id** (2026-10-02). Calendar/results-only only. Do not invent a Den id, a SportsSync id, or a LIVE chip. APP Asia Tour, not MLP Asia. Louisville **18454** is the next known APP Den id and is not the live pin while Columbus **18448** is on. When a real SportsSync id is on the organizer page, arm `/api/sportssync` as results-only — see [`sportssync-asia.md`](./sportssync-asia.md).  
- Gijón is TOP Pickleball, not Den — do not hunt a Den id as if it were APP Columbus. See `docs/slate-europe.md`.  
- `DESK_KEY` was not present in Netlify env at the September hunt — calendar POST arming needs that secret (or direct Blobs write). The Columbus arm for this cut is in code (`applyAppCalendarCut`), not a desk POST.

