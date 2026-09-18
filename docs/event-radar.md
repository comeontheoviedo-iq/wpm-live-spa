# Event radar — keep the owner off the calendar beat

WPM LIVE should **discover** weekly events before they go live, not rely on Chris spotting a Den/PPA link in the morning. This doc is the operating pattern; automation can grow into scripts/cron later.

## Goal

Every weekday (desk TZ `Europe/London`), produce a short **radar brief**: what’s on this week, intake status (pass/fail), and whether a live connector exists. Owner reviews exceptions only.

## Sources to watch (weekly)

| Source | What to scrape / poll | Typical lead time |
|--------|----------------------|-------------------|
| **GPA calendar** | GPA / rankings event list + medal history already in `/api/history` & wave snap | Days–weeks |
| **PPA** | `ppatour.com` schedule + `/api/ticker/` + `/api/scores/?event=` event UUID | Confirmed week-of |
| **APP / Den Live** | Den Live tournament picker / known APP schedule pages; `tournament-info` + `tournament-brackets` once an id is known | Week-of; ids appear when Den publishes |
| **Sporttora** | World Cup / multi-sport OOP + live RSC feeds (existing WC path) | Event window |

Optional later: MLP, PPA Asia, club opens — **results-only** until intake passes.

## Intake gate (same as `coverage-intake.md`)

An event is **on the live board** only with:

1. **Name**
2. **Venue**
3. **Timezone** (IANA or clear offset)
4. **One working score path** smoke-tested once

Fail → calendar stub / “scores delayed” only. Never fake 0–0.

## Suggested weekly loop

1. **Monday radar** — list events with start dates in the next 10 days from GPA + PPA schedule + APP tour page + Sporttora.
2. **Per event row** — fill name / venue / tz / candidate score URL; mark `intake: pass|fail|unknown`.
3. **Connector check** — if pass and no `/api/{tour}` yet, open a ship task (clone PPA/APP pattern).
4. **Day-before** — re-smoke the score path; confirm tour chip label; shop stays closed.
5. **Live day** — overlay in `pull()`; verify prod curl; note residual risks in the ship note.

## Where APP fits

APP events are scored on **Den Live** (`denlive.pickleballden.com`) with stable JSON proxies (see `docs/app-den-live.md`). Once a `tournamentId` is known, intake is usually fast: info → venue, brackets → score path, KS/venue city → `America/Chicago` (or local IANA).

## Anti-patterns

- Owner DMs as the discovery channel
- Shipping a tour chip before the score path returns real lines
- Linking out to Den/APPTV as the product experience
- Merging APP into PPA/WC filters or draws

## Output artifact (lightweight)

Keep a running `docs/radar-log.md` (optional) or Slack/desk note:

```
YYYY-MM-DD radar
- PPA … intake pass · /api/ppa
- APP Overland Park (18453) … /api/app · APP Pro/APP chips · LIVE harden `wpm-20260918b`
- GPA … results-only
- WC … /api/worldcup
```
