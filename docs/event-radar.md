# Event radar — keep the owner off the calendar beat

WPM LIVE should **discover** weekly events before they go live, not rely on Chris spotting a Den/PPA link in the morning. This doc is the operating pattern; automation lives in `scripts/event-radar.mjs` and `GET /api/radar`.

## Goal

Every weekday (desk TZ `Europe/London`), produce a short **radar brief**: what’s on this week, intake status (pass/fail), and whether a live connector exists. Owner reviews exceptions only.

## Concrete weekly sources

| Source | Probe | How radar uses it | Typical lead |
|--------|-------|-------------------|--------------|
| **GPA calendar** | Supabase `tournaments` (same as `/api/rankings` events) | Horizon −2…+28 days. APP rows → live candidates; Louisville 18454 is known but not the live pin; other hosts → `results_only` until intake | Days–weeks |
| **PPA ticker** | `ppatour.com/api/ticker/` + `scores/?event=` wired UUID | Title must align with wired `EVENT` in `ppa.mts`; mismatch = P0 cut | Week-of |
| **APP / Den Live** | `denlive.pickleballden.com` `tournament-info` + `tournament-brackets` for known ids; GPA APP names without Den id = blocked | Id discovery is still manual (Den picker / tour week) | Week-of |
| **APP Asia / SportsSync** | `sportssync.asia/organizers/1645900` plus sitemap titles | Chongqing has no id (2026-10-02). KL **89** and Penang **222** are dry-run only. **390** / **391** are unresolved Taipei / Bangkok links, not Chongqing. New `/tournament/{id}` is P1 — confirm the name before arming. Results only, never LIVE | Days |
| **Sporttora WC** | Prod `/api/worldcup` | On board while feed returns matches (LIVE/NEXT/FT) | Event window |

Optional later: MLP, PPA Asia, club opens — **results_only** until intake passes.

**Do not merge labels:** MLP Asia (PPA/MLP franchise) ≠ APP Asia Tour ≠ PPA Asia.

## Watched without a live path

| Event | Dates | Status | What radar watches |
|-------|-------|--------|--------------------|
| **TPB Gijón 2026** | 18–20 Sep · Europe/Madrid | scores delayed / results_only | Official page for Den/Tournated; draw PDF is the only published groups |
| **PPA P250 Barcelona Open** | 23–27 Sep · Europe/Madrid | **ended** · UUID `1655a7c9-904a-44c9-aa29-b279fca900e8` unparked · 0 scores | Do **not** cut `ppa.mts` EVENT here. Live board is Veolia Chicago Cup |
| **PPA Rate Las Vegas Open** | 28 Sep–4 Oct · America/Los_Angeles | **finished** · UUID `86926aef-0566-4fbb-87cf-a48068a9f1c6` · archive `las-vegas` current false | Scores API all final through 4 Oct. Not the live board. Not April `92d37566-…` |
| **APP Asia Chongqing Open** | 2–6 Oct · Asia/Shanghai | **unarmed** · results-only · no Den id · no SportsSync id | Hunt 2026-10-02. Organizer [1645900](https://www.sportssync.asia/organizers/1645900) still KL 89 / Penang 222. See [`sportssync-asia.md`](./sportssync-asia.md) |
| **PPA Veolia Chicago Cup** | 5–11 Oct · America/Chicago | **on board** · UUID `203e1164-b4f9-47e9-bacf-ff81f8748025` | Ticker title must stay Veolia Chicago Cup. Venue Life Time North Shore, Chicago, IL |
| **PPA Virginia Beach Open** | 12–18 Oct · America/New_York | **results-only** · UUID `429c7980-e1b9-4800-805f-dfb160781cd9` | Do not cut `/api/ppa` off Chicago |
| **Humana APP Louisville Open** | 15–18 Oct · America/New_York | **results-only** · Den **18454** known | Do not cut `/api/app` off Columbus **18448** until this window and Den is RUNNING |
| **APP Asia Bangkok Open** | 2–7 Nov · Asia/Bangkok | **results-only** · SportsSync 391 does not resolve | Official page dates. GPA had 26 Oct. Not Chongqing. Not MLP |
| **MLP Asia 2026** | 13 Nov–12 Dec · Asia/Tokyo opener | **results-only** · tour `mlp-asia` | Not APP. Pool nights then playoffs 11–12 Dec |

See [`slate-europe.md`](./slate-europe.md). Seeded in `netlify/functions/slate-events.mjs`.

## Intake checklist (gate = `coverage-intake.md`)

An event is **on the live board** only with:

1. **Name** — public title
2. **Venue** — city / venue string
3. **Timezone** — IANA (or clear offset)
4. **One working score path** — smoke-tested once (ticker, Den proxies, Sporttora, …)

Fail → calendar stub / “scores delayed” only. **Never** invent scores or fake 0–0.

Desk tick boxes before shipping a tour chip:

- [ ] Display name
- [ ] Venue + timezone
- [ ] Score connector smoke (URL or function)
- [ ] Tour chip label (PPA / APP / WC / GPA — not merged)
- [ ] Watch deep link optional; shop stays closed

## 08:30 Europe/London routine (Grok Bot + desk)

1. Run radar: `node scripts/event-radar.mjs --pretty` **or** `curl -sS https://live.worldpickleballmagazine.com/api/radar | jq`.
2. Read `summary` + `actions` only — ignore quiet `results_only` rows unless owner asks.
3. **P0** (`blocked_by_intake` on PPA/APP/PPA Europe):
   - PPA ticker title ≠ wired EVENT → cut `EVENT` in `ppa.mts` same day (see radar-log).
   - Live PPA is **Veolia Chicago Cup** `203e1164-b4f9-47e9-bacf-ff81f8748025` (Life Time North Shore Sport & Racquetball, Chicago, IL, `America/Chicago`). Not April `92d37566-…`. Not Rate Las Vegas `86926aef-…`.
   - **Rate Las Vegas Open** ended 4 Oct 2026. Archive id `las-vegas`, `current: false`. Real finals stay on `/api/archive`. Do **not** point `/api/ppa` there.
   - Barcelona `1655a7c9-…` ended 27 Sep 2026 with no scores. Unparked. Do **not** cut EVENT there.
   - **Columbus Open** Den `18448` ended 4 Oct. `/api/app` stays on **18448** until Louisville. Archive `current: false`. Overland `18453` ended — disarmed, not onLive.
   - **Chongqing** (APP Asia) has **no Den id** and **no SportsSync id** after the 2026-10-02 hunt. Watch organizer `1645900`. KL 89 and Penang 222 are not Chongqing. 390 and 391 are not Chongqing. `/api/sportssync` is results-only. Do not fake LIVE. See `docs/sportssync-asia.md`.
   - **Louisville** Den **18454** is known for 15–18 Oct. Do not cut `/api/app` off Columbus **18448**.
   - **Virginia Beach** `429c7980-…` is the next PPA. Do not cut `/api/ppa` off Chicago.
   - New APP on GPA without Den id → find `tournamentId` on Den Live → fill intake → ship `/api/app` id. Do not invent one.
4. **P1** (`missing`, or a new SportsSync id on organizer 1645900): connector/feed down, or a new `/tournament/{id}` to name-check. Do not invent lines and do not assume the new id is Chongqing.
5. Quiet **results_only**: Gijón (scores delayed + draw PDF), Barcelona ended (no scores, do not cut), Chongqing until a real SportsSync id, MLP Asia label guard. Watch; do not invent LIVE.
6. Append a one-liner to `docs/radar-log.md` when something changed; skip if no P0/P1.
7. Do **not** open shop; do **not** regress APP / Web Push. **MLP Asia ≠ APP.**

## Board statuses (script / API)

| Status | Meaning |
|--------|---------|
| `on_board` | Intake pass + live connector healthy |
| `blocked_by_intake` | Seen on calendar/ticker but missing name/venue/tz/path or id |
| `missing` | Expected feed unreachable / empty |
| `results_only` | GPA (or similar) calendar row — no live path by design yet |

## Product / calendar awareness

- SPA rankings panel already surfaces GPA `events` from `/api/rankings` (week calendar).
- Desk calendar UI: `/calendar` + `/api/calendar` (Blobs `calendar-armed`) — see `docs/desk-calendar.md`.
- Desk depth is `/api/radar` (JSON report, Blobs cache ~30 min; `?refresh=1` to bypass).
- Wired ids live in `netlify/functions/radar-lib.mjs` `WIRED` — keep in sync when cutting PPA/APP events. Barcelona is ended in `slate-events.mjs` (`ENDED_PPA`), not a parked cutover.

## Anti-patterns

- Owner DMs as the discovery channel
- Shipping a tour chip before the score path returns real lines
- Linking out to Den/APPTV as the product experience
- Merging APP into PPA/WC filters or draws
- Chipping **MLP Asia** as APP, or APP Asia Tour as MLP
- Pointing `/api/ppa` at ended Barcelona `1655a7c9-…`, finished Rate Las Vegas `86926aef-…`, or the April Las Vegas UUID `92d37566-…`

## Commands

```bash
# Local / box
node scripts/event-radar.mjs --pretty --out docs/radar-latest.json

# Prod desk
curl -sS 'https://live.worldpickleballmagazine.com/api/radar' | jq '.summary,.actions'
```
