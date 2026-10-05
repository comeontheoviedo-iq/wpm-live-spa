# Desk calendar / add-event — WPM LIVE

**Route:** `/calendar`  
**API:** `GET|POST /api/calendar`  
**Store:** Netlify Blobs `wpm-desk` / key `calendar-armed`  
**Auth (mutations):** `DESK_KEY` (same as `/api/scores`)  
**JS:** `wpm-20260918g` (calendar draw chips + competitions upcoming cards)  
**Intake gate:** [`coverage-intake.md`](./coverage-intake.md)

## Product

FotMob-style calendar of **GPA tournaments** (`/api/rankings` `events` slate). Desk can **arm** an event for WPM LIVE only when intake passes:

1. Name  
2. Venue  
3. Timezone (IANA)  
4. Working score path (PPA event id · Den `tournamentId` · URL/path · or none)

| Outcome | Status chip | Board |
|---------|-------------|--------|
| Full intake + connector | **live-path** · **on WPM LIVE** | Eligible for live overlay |
| Fields ok but feed dying / desk flag | **scores delayed** | Show delayed — **never** fake 0–0 |
| No score path | **results-only** | Calendar / archive only |

Shop stays closed. Tours stay labelled (APP / PPA / WC / GPA / …).

## How to use

### Public

1. Open **https://live.worldpickleballmagazine.com/calendar** (tab **Cal**, or links from Live week strip / Table).
2. Browse upcoming GPA events with status chips.
3. Armed **on WPM LIVE** events also appear as chrome pills above the home week strip.

### Desk · add-event

1. On `/calendar`, click **Add** on a row (or open `/calendar?add=<id>`).
2. Confirm **name**, **venue**, **timezone**.
3. Set **score connector**:
   - **APP / Den** → paste `tournamentId` (live: Columbus `18448`; Overland `18453` is ended)
   - **PPA** → paste ticker event UUID
   - **SportsSync** → paste a numeric `tournamentId` from sportssync.asia. Saves as **results-only**, not on LIVE. Leave Chongqing blank until organizer 1645900 lists it. **89** and **222** are KL and Penang, not Chongqing. See [`sportssync-asia.md`](./sportssync-asia.md)
   - **URL** → e.g. `/api/worldcup`
   - **none** → saves as **results-only**
4. Enter **Desk key** → **Arm / save**.
5. Optional: check **Mark scores delayed** if the path exists but is not healthy.
6. **Disarm** removes the Blobs row (GPA slate row remains, unarmed).

`POST /api/calendar` body sketch:

```json
{
  "key": "DESK_KEY",
  "action": "arm",
  "id": "gpa:app%20columbus%20open:2026-10-01",
  "name": "APP Columbus Open",
  "venue": "Pickle & Chill, Columbus, OH",
  "timezone": "America/New_York",
  "start": "2026-10-01",
  "end": "2026-10-04",
  "host": "APP",
  "tour": "app",
  "connector": { "type": "app", "denTournamentId": "18448", "scorePath": "/api/app" }
}
```

`action: "disarm"` + `id` removes. Pass `requireLive: true` to get HTTP 422 if intake fails (UI saves results-only instead).

### `GET /api/calendar`

Public JSON: GPA events merged with armed flags (`armed`, `onLive`, `status`, `connector`, `timezone`). `note` and `statusNote` are the reader line only (`Event ended`, `Scores delayed`, `Draw not published yet`, `Results will appear when available`). Desk hints (Den ids, UUIDs, `/api/ppa`, intake blockers) stay in this doc and in the function source — they are not returned on those prose fields. `armed[]` is mapped the same way. `known` connector hints remain for the desk form.

## Residual

- **APP Japan – Sendai** — **no Den id** (Tournated / JPA). Cannot live-path via `/api/app`. See `docs/app-den-ids.md`.
- **APP Columbus Open** — armed live-path. Den **18448**, Pickle & Chill, `America/New_York`, `/api/app`. GPA id `gpa:app%20columbus%20open:2026-10-01`. Code seed (`applyAppCalendarCut`) arms this row on read. Registration external id `8057937` is not the scoring id.
- **APP Overland Park** — ended 20 Sep 2026. Den `18453` disarmed, not `onLive`.
- **APP Asia Chongqing** — Den id **not found**. SportsSync id **not listed** (organizer 1645900: KL 89, Penang 222 only, 2026-09-30). Calendar/results-only. A later real SportsSync id arms `/api/sportssync` as results-only, never LIVE. APP Asia Tour, **not** MLP Asia. No fake LIVE. See [`sportssync-asia.md`](./sportssync-asia.md).
- **TPB Gijón 2026** — seeded slate, scores delayed, official draw PDF. No Den id. See `docs/slate-europe.md`.
- **PPA Barcelona Open** — ended 27 Sep 2026, UUID `1655a7c9-904a-44c9-aa29-b279fca900e8`, no scores, unparked. Do not cut `/api/ppa` there.
- **Veolia Chicago Cup** — live `/api/ppa` UUID `203e1164-b4f9-47e9-bacf-ff81f8748025`, Life Time North Shore Sport & Racquetball, Chicago, IL, `America/Chicago`. Rate Las Vegas `86926aef-…` ended 4 Oct (archive only). Not April `92d37566-…`.
- **`/api/app` follows** query / env / Blobs `wpm-app` `active-tournament` / `calendar-armed` / fallback **18448**. Stale Overland `18453` on env or blobs is skipped. LIVE only when Den matches are RUNNING.
- D-Joy Leg 3 still awaits a published live URL (`connector: djoy`).
- Cross-link: [`app-den-ids.md`](./app-den-ids.md)

## Cross-links

- Intake rule: `docs/coverage-intake.md`
- Event radar: `docs/event-radar.md`
- APP Den path: `docs/app-den-live.md`
