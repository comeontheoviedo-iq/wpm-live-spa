# Desk calendar / add-event — WPM LIVE

**Route:** `/calendar`  
**API:** `GET|POST /api/calendar`  
**Store:** Netlify Blobs `wpm-desk` / key `calendar-armed`  
**Auth (mutations):** `DESK_KEY` (same as `/api/scores`)  
**JS:** `wpm-20260918d`  
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
   - **APP / Den** → paste `tournamentId` (e.g. Overland Park `18453`)
   - **PPA** → paste ticker event UUID
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
  "name": "APP Overland Park Open",
  "venue": "Overland Park, KS",
  "timezone": "America/Chicago",
  "start": "2026-09-17",
  "end": "2026-09-20",
  "host": "APP",
  "tour": "app",
  "connector": { "type": "app", "denTournamentId": "18453" }
}
```

`action: "disarm"` + `id` removes. Pass `requireLive: true` to get HTTP 422 if intake fails (UI saves results-only instead).

### `GET /api/calendar`

Public JSON: GPA events merged with armed flags (`armed`, `onLive`, `status`, `connector`, `timezone`, `note`). Also returns raw `armed[]` and `known` connector hints.

## Residual

- **APP Japan – Sendai** (Sep 19–20) — still needs Den `tournamentId` + timezone smoke before live-path.
- **APP Columbus / Chongqing / …** — same; calendar shows results-only until desk arms with a path.
- Arming does **not** auto-rewire `/api/app` or `/api/ppa` event ids — connector functions remain code-owned; calendar records desk intent + intake status for chrome and ops.
- D-Joy Leg 3 still awaits a published live URL (`connector: djoy`).

## Cross-links

- Intake rule: `docs/coverage-intake.md`
- Event radar: `docs/event-radar.md`
- APP Den path: `docs/app-den-live.md`
