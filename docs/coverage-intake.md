# Coverage intake rule — WPM LIVE

An event is **on WPM LIVE** only when all of the following exist:

1. **Name** — public event title (e.g. PPA Austin, GPA D-Joy Open)
2. **Venue** — city / venue string good enough for the desk
3. **Timezone** — IANA tz or clear UTC offset for start times
4. **One working score path** — live API, official ticker, or desk-verified feed that can return real lines

## If the feed dies
Show **“scores delayed”** (or hide LIVE).  
**Never** invent scores. **Never** fake FT 0–0.

## Desk checklist (add-event)
- [ ] Display name
- [ ] Venue + timezone
- [ ] Score connector (URL or function name) smoke-tested once
- [ ] Tour chip / label (PPA / WC / GPA / other — labelled, not merged)
- [ ] Watch deep link (optional)

## Out of scope until intake passes
MLP, PPA Asia, club opens as **live** boards. GPA calendar / history may show them as **results-only** without live path.

**MLP Asia ≠ APP.** MLP Asia is the PPA/MLP franchise. APP Asia Tour is APP (Chongqing / Taipei / …) and stays labelled APP Asia — never chip MLP Asia as APP.

**Europe slate (no live path yet):** TPB Gijón 2026 (scores delayed + [official draw PDF](https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf)); PPA Barcelona Open UUID parked (`1655a7c9-904a-44c9-aa29-b279fca900e8`) — `/api/ppa` stays Arizona until ticker cutover. See [`slate-europe.md`](./slate-europe.md).

## Live connectors (shipped)
- **PPA** → `/api/ppa`
- **World Cup** → `/api/worldcup`
- **APP / Den Live** → `/api/app` (see `docs/app-den-live.md`) — tour chip **APP**

## Desk calendar

Arm GPA slate events from **`/calendar`** (Blobs `calendar-armed`). See [`desk-calendar.md`](./desk-calendar.md). Status chips: **live-path** / **scores delayed** / **results-only**.
