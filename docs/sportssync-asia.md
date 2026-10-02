# SportsSync — APP Asia results path

APP Asia software is **SportsSync** (`sportssync.asia`), not Den Live.  
WPM connector: `netlify/functions/sportssync.mts` → **`/api/sportssync`**. Tour chip **`app-asia`**.

**Truth (2026-10-02):** results only. Cards are **FT** or **NEXT**. `liveCount` is 0. Shop stays Coming soon. No DNS changes.

## Hunt 2026-10-02 — Chongqing id not found

| Surface | Result |
|---------|--------|
| Organizer [1645900](https://www.sportssync.asia/organizers/1645900) | Still only **89** (KL) and **222** (Penang) |
| Sitemap `sportssync.asia/sitemap.xml` | 246 tournament ids, 91–471. Titles fetched. No Chongqing. APP-related hits were KL spectator **166**, Penang **222**, Paramount Cup qualifier **358** |
| Id gaps 360–519 not in the sitemap | Pages that resolve are club events. **390** and **391** redirect to `/tournament/index` |
| `theapp.asia` calendar | **390** labeled Taipei, **391** labeled Bangkok. Neither is Chongqing |
| `theapp.global` schedule | No Chongqing card. Bangkok register link is **391**. Event URL for Chongqing **404** |
| Den `tournament-brackets` | Prior scan ~18455–18670 empty. This pass 18671–18712 until HTTP 429. Named rows: Shootout 18672/18673, Lien Doan Chi Lang 18684, Pioneer Picklefest 18692. Not Chongqing |
| Scores `GET /tournament/api/{id}/scores` | `[]` for any id, including 99999. An empty list is not proof a tournament exists |

Do not arm 89, 222, 390, or 391 as Chongqing. Those ids are stripped. A new id that is actually named Chongqing can still be saved as results-only.

## Chongqing is not armed

| | |
|--|--|
| Event | APP Asia Chongqing Open |
| Dates | 2026-10-02 – 2026-10-06 |
| Venue / tz guess | Chongqing, China · `Asia/Shanghai` |
| Den Live id | **none** |
| SportsSync `tournamentId` | **none — do not invent one** |

Organizer page: https://www.sportssync.asia/organizers/1645900

Checked 2026-09-30 and again 2026-10-02. That page lists two tournaments only:

| Id | Event | Use |
|----|--------|-----|
| **89** | Leapmotor APP Kuala Lumpur Open 2026 | Dry-run fixture. Not Chongqing. |
| **222** | Leapmotor APP Asia Penang Open 2026 | Dry-run fixture. Not Chongqing. |

Calendar rows for Chongqing stay **results-only**, `onLive` false, connector empty. Arming Chongqing with `89` or `222` is stripped. A guessed Den id on that row is stripped too.

## What the feed actually shows

| Surface | Observed 2026-09-30 |
|---------|---------------------|
| `GET https://www.sportssync.asia/tournament/api/{id}/scores` | HTTP 200, `[]`, no auth header required, for **89** and **222** |
| `GET /tournament/{id}/schedule` | Redirects to `/tournament/{id}/schedule/search` |
| Schedule status filter | **`scheduled`** and **`completed`** only |
| Schedule badge | **Completed** (green) on finished KL rows. Score text like `11-8` |

No in-progress / playing / live status was in the scores JSON (the body was an empty list) or in the schedule filter. **LIVE stays off** until a scores row shows a status this file is updated to trust. `SPORTSSYNC_LIVE_SAFE` in `sportssync-map.mjs` is `false`. The handler never opts in.

An `in_progress` / `LIVE` / `playing` token, if one appears, is stored as **NEXT** with `liveSuppressed: true`. It is not FT and not LIVE. The reader board only paints **FT**.

`0–0` is dropped. A completed row with no games is score-blank (`Result recorded (no game scores)`).

## `/api/sportssync`

Id resolution, first hit wins. There is **no fallback id**.

1. `?tournamentId=` — explicit smoke, including dry-run 89 or 222  
2. Env `SPORTSSYNC_TOURNAMENT_ID` — only if desk sets it on purpose  
3. Blobs `wpm-desk` / `calendar-armed` connector `type: "sportssync"`  
4. Otherwise `{ armed: false, matches: [], event.sportsSyncTournamentId: null }`

Scores JSON is mapped when it has rows. An empty list falls through to **one** schedule-search HTML page (often a single date) and the response is `partial: true`. That page is a results supplement, not a full draw.

Match cards use the same shape as APP (`id`, `tour`, `a`/`b`, `status`, `lines`, `games`, `score`, `date`, `court`). `tour` is `app-asia`. `watch` is empty — stay in the app. `end` is empty so the client cannot clock-promote NEXT into LIVE.

Smoke (does not arm Chongqing):

```bash
curl -sS 'https://live.worldpickleballmagazine.com/api/sportssync?tournamentId=89' | jq '{liveCount,resultsOnly,liveSafe,n:(.matches|length),statuses:([.matches[].status]|unique)}'
```

Expect `liveCount: 0`, `liveSafe: false`, statuses only `FT` and/or `NEXT`.

## How to arm when Chongqing appears

1. Open https://www.sportssync.asia/organizers/1645900 (radar also probes this page).  
2. Find a tournament card whose **name** is the Chongqing Open. The id is the number in `/tournament/{id}`.  
3. If the only ids are still **89** and **222**, stop. Those are KL and Penang.  
4. Smoke `/api/sportssync?tournamentId={that id}`. Confirm real names and scores, `liveCount` 0, no phantom `0-0`.  
5. On `/calendar`, edit the Chongqing row (or POST):

```json
{
  "key": "DESK_KEY",
  "action": "arm",
  "id": "gpa:app%20asia%20chongqing%20open:2026-10-02",
  "name": "APP Asia Chongqing Open",
  "venue": "Chongqing, China",
  "timezone": "Asia/Shanghai",
  "start": "2026-10-02",
  "end": "2026-10-06",
  "host": "APP",
  "tour": "app-asia",
  "connector": {
    "type": "sportssync",
    "sportsSyncTournamentId": "THE_REAL_ID",
    "scorePath": "/api/sportssync"
  }
}
```

The Cal form has a SportsSync id field (client `wpm-20260930c.js`). Leave it blank until step 2 is true.

Saved status is **results-only**. `onLive` stays false. `requireLive: true` returns 422. FT rows can show on the Results tab for that date. The Live tab does not get a LIVE chip.

6. Do not point `/api/app` at Chongqing. Columbus stays Den **18448**.

## Intake checklist (APP Asia)

- [ ] Display name matches the SportsSync card (Chongqing, not KL/Penang)
- [ ] Venue + IANA timezone (`Asia/Shanghai` until the page says otherwise)
- [ ] Numeric SportsSync id copied from `/tournament/{id}` on organizer 1645900
- [ ] `/api/sportssync?tournamentId=` smoke: real lines, zero LIVE, no phantom 0–0
- [ ] Tour chip **APP Asia**, not MLP Asia, not APP Den
- [ ] Shop still Coming soon

Fail any box → calendar stub only. **Never** invent the id, a score, or a LIVE chip.

## Radar

`GET /api/radar` and `node scripts/event-radar.mjs` fetch the organizer HTML and list `/tournament/{id}` links.

- Known baseline: 89, 222. Chongqing id in the report is always null.  
- A **new** id raises a **P1** action: open the card, confirm the name, then arm. The id is not assumed to be Chongqing.  
- Board status stays `results_only`.

See [`event-radar.md`](./event-radar.md) and [`coverage-intake.md`](./coverage-intake.md).
