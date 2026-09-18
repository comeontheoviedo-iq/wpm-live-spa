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

## Live connectors (shipped)
- **PPA** → `/api/ppa`
- **World Cup** → `/api/worldcup`
- **APP / Den Live** → `/api/app` (see `docs/app-den-live.md`) — tour chip **APP**
