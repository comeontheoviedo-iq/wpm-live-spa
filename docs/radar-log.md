
## 2026-09-18 radar (Europe/London ~08:40)

- **P0** PPA Veolia Arizona Open (Mesa, AZ · Sep 14–20 · QF day) — ticker live as `PPA Tour: Veolia Arizona Open`; `/api/ppa` was still Cary Nationals (`b177c3be-…`). Cut to event `62c01642-1bb2-4f9a-9998-599f8fdefe5c`, comp label Mesa. Score path smoke: scores 200 matches ∩ ticker 20 QF.
- APP Dillons Overland Park Open (Den `18453`) — `/api/app` healthy (256 matches; 201 FT 09-17, 55 NEXT 09-18; 0 LIVE at scan — Chicago morning).
- WC Da Nang — boxed off, all FT via `/api/worldcup` sporttora-oop.
- GPA calendar near-term: APP Japan Sendai Sep 19–20 (no Den id / live path yet — calendar only); APP Columbus Oct 1–4.
- PPA Grand Rapids Challenger Sep 18–20 — no main ticker presence; intake fail for live board (no working score path).
- Shop locked.

## 2026-09-18 08:48 BST (script)

- summary: on_board=3 blocked=3 missing=0 results_only=0
- **on_board** ppa PPA Tour: Veolia Arizona Open · /api/ppa · wired /api/ppa · ticker 20 · scores 200
- **on_board** app APP Dillons Overland Park Open · /api/app · wired /api/app · 0 brackets
- **on_board** wc World Cup · Da Nang · /api/worldcup · WC feed up · all complete (FT 317) — still wired
- **P0** app APP Japan – Sendai — APP on GPA calendar — need Den tournamentId + tz + score smoke before live board
- **P0** app APP Columbus Open — APP on GPA calendar — need Den tournamentId + tz + score smoke before live board
- **P0** app APP Asia Chongqing Open — APP on GPA calendar — need Den tournamentId + tz + score smoke before live board
- Shop locked.

## 2026-09-18 ~09:30 BST — APP Den id hunt

- Overland Park **18453** — still the only blocked-window event with a published Den Live id.
- Sendai — **not found** on Den (Tournated 11359).
- Columbus — registration external **8057937**; Den Live id **not found**.
- Chongqing — **not found**.
- Side finds: Detroit **18442**, Louisville **18454**.
- `/api/app` made configurable (calendar-armed / wpm-app blob / env / query). Details: `docs/app-den-ids.md`.

## 2026-09-18 ~afternoon BST — Europe slate (no live path)

- **TPB Gijón 2026** (18–20 Sep, Puerto Deportivo de Gijón, Europe/Madrid) — no Den Live / Tournated / live API. **Scores delayed**. Official groups PDF only. Not APP Den.
- **PPA P250 Barcelona Open** (23–27 Sep, Tennis Despí) — UUID `1655a7c9-904a-44c9-aa29-b279fca900e8` **parked**. `/api/ppa` remains Arizona `62c01642-…`.
- **MLP Asia ≠ APP Asia Tour** — never chip MLP Asia as APP.
- Shop locked. Details: `docs/slate-europe.md`.

## 2026-09-28 — PPA cut to Rate Las Vegas Open

- Ticker title `PPA Tour: Rate Las Vegas Open`. First-serve rows `8:00 AM PDT` (`plannedStart` `2026-09-28T08:00:00Z` is the API timestamp; the board clock is the ticker string).
- `/api/ppa` EVENT cut from finished Mesa `62c01642-1bb2-4f9a-9998-599f8fdefe5c` to `86926aef-0566-4fbb-87cf-a48068a9f1c6`. Venue Darling Tennis Center, Las Vegas. TZ `America/Los_Angeles`.
- Not the April Las Vegas UUID `92d37566-…`.
- Scores feed for the new UUID: scheduled draw rows with `dateKey` `9999-12-31` (Date TBA) and null games. Those stay off the day board. No phantom 0–0. LIVE only when the ticker says `live`.
- **PPA P250 Barcelona Open** `1655a7c9-904a-44c9-aa29-b279fca900e8` window ended 27 Sep. Scores API **0** matches. Marked ended / unparked. Do not cut `/api/ppa` there.
- Client `wpm-20260928a.js` · SW `wpm-static-20260928a`. Shop stays Coming soon.

## 2026-09-29 — Reader cards, desk notes stay on radar

- Public board no longer prints radar/intake prose. PPA Europe card: **Event ended** (once). Columbus-style results-only rows: **Results will appear when available**. Gijón: **Scores delayed** + official draw PDF.
- Desk detail (Barcelona UUID, Columbus `external-tournament/8057937`, `/api/ppa` cutover) stays in this log, `docs/slate-europe.md`, and `FILTER_COPY` / seed `note` fields. `GET /api/calendar` maps `note` / `statusNote` / `blurb` / `detail` / `description` through `toReaderEvent`.
- Client `wpm-20260929a.js` · SW `wpm-static-20260929a`. Shop stays Coming soon. No fake LIVE. No phantom 0–0.

## 2026-09-30 — APP cut to Columbus Open (Den 18448)

- Event radar: Den Live `tournamentId` **18448** is APP Columbus Open presented by The James (1–4 Oct 2026, Pickle & Chill, Columbus OH, `America/New_York`). GPA short name “APP Columbus Open”, row `gpa:app%20columbus%20open:2026-10-01`.
- `/api/app` default, `WIRED.app`, and the code-armed calendar row move off ended Overland **18453** onto **18448**. Overland is disarmed (`onLive` false, status ended).
- Smoke before the cut: `GET /api/app?tournamentId=18448` returns the event. Brackets Pending, 0 matches. Not LIVE. No phantom 0–0.
- Prod `/api/app` at cut time was still Overland via Blobs `wpm-app` / `active-tournament` (`idSource: wpm-app:active-tournament`). Code skips ended `18453` on that blob and on `calendar-armed`. A blob rewrite is not required for the cut; write this so the store matches:

```json
{ "tournamentId": "18448", "name": "APP Columbus Open presented by The James", "venue": "Pickle & Chill, Columbus, OH", "timezone": "America/New_York" }
```

- **APP Asia Chongqing Open** — Den id still **not found**. Calendar/results-only only. No fake LIVE.
- Client `wpm-20260930a.js` · SW `wpm-static-20260930a`. Shop stays Coming soon.

## 2026-09-30 — SportsSync results scaffold (Chongqing still unarmed)

- APP Asia scoring site is SportsSync. Organizer `1645900` lists **KL 89** and **Penang 222** only. Chongqing is not on that page. No id invented.
- Scores `GET /tournament/api/{id}/scores` for 89 and 222 returned `[]`. Schedule filter is `scheduled` | `completed` only. **No trustworthy in-progress signal.** `/api/sportssync` maps FT/NEXT and does not mark LIVE.
- Calendar can store `connector.type=sportssync` once a real id exists. Chongqing + 89/222 is stripped. `onLive` stays false.
- Client `wpm-20260930c.js` (desk field + FT-only overlay). Shop stays Coming soon.

