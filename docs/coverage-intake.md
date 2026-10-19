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

**Europe slate:** TPB Gijón 2026 (scores delayed + [official draw PDF](https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf)); PPA Barcelona Open (`1655a7c9-904a-44c9-aa29-b279fca900e8`) **ended 27 Sep 2026 with no scores** and is unparked — do not cut `/api/ppa` there. Live PPA board is PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026 (`c7e4fd72-d159-4211-82a2-21adbb21defe`). See [`slate-europe.md`](./slate-europe.md).

## Live connectors (shipped)
- **PPA** → `/api/ppa` — PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026 (`c7e4fd72-d159-4211-82a2-21adbb21defe`, Kai Tak Arena, Hong Kong, `Asia/Hong_Kong`, 19–25 Oct). Date TBA rows are upcoming, not LIVE, and have no invented clock. Mojo Energy Pouches Virginia Beach Open (`429c7980-…`) finished 18 Oct 2026, archive `virginia-beach`, `current: false`. Veolia Chicago Cup (`203e1164-…`) finished 11 Oct 2026, archive `chicago-cup`, `current: false`. Rate Las Vegas (`86926aef-…`) is a finished archive event, end 4 Oct 2026, `current: false`.
- **World Cup** → `/api/worldcup`
- **APP / Den Live** → `/api/app` (see `docs/app-den-live.md`) — tour chip **APP**. Humana APP Louisville Open Den **18454** ended 18 Oct 2026 (archive `louisville`, `current: false`). Default `/api/app` is between events: reader “Event ended”, no LIVE rows. Columbus **18448** and Overland **18453** stay finished. LIVE only when Den status is RUNNING. Pending brackets are not a live board. Next US APP is APP Arizona Open (12–15 Nov), no Den id.
- **RTA2000** → `/api/rta` — RTA2000 Farnham, Tournated tournament **8510**, Hurlands Pickleball + Padel Club, `Europe/London`, 2–4 Oct 2026. Tour chip **RTA2000** (`rta`). Not APP and not PPA. Window ended 4 Oct. Unplayed rows the source still marks upcoming are not shown as NEXT. See [`rta-farnham.md`](./rta-farnham.md).

**APP Asia Chongqing Open** has **no Den id** and **no SportsSync id** (2026-10-02 hunt: organizer `1645900` still KL 89 and Penang 222; sitemap titles 91–471 have no Chongqing). Calendar/results-only. `/api/sportssync` can attach a real numeric id later and still stays **FT / results-only** — do not fake LIVE or 0–0. See [`sportssync-asia.md`](./sportssync-asia.md).

**Next on the slate (not live pins):** Ottawa 125, Nanjing Challenger, College World Championship, Lille P125, and Proton Daytona Beach Open have scores-API UUIDs that returned 0 rows on 19 Oct 2026. They stay results-only. Opendoor Pickleball World Championships has no stored 2026 UUID (`f02fa839-…` is 2025 finals). APP Arizona Open has no Den id. APP Asia Bangkok / Taipei / India / HCMC results-only, MLP Asia 2026 labeled **MLP Asia**.

## Desk calendar

Arm GPA slate events from **`/calendar`** (Blobs `calendar-armed`). See [`desk-calendar.md`](./desk-calendar.md). Status chips: **live-path** / **scores delayed** / **results-only**.
