# FotMob path — WPM LIVE north star

**Product:** WPM LIVE · https://live.worldpickleballmagazine.com  
**Not:** PickleLive  
**Slice date:** 2026-09-17 · JS `wpm-20260917b` · git `wpm-live-spa`

WPM LIVE should feel like FotMob for pickleball: live truth first, then identity (player/team pages you can follow), then richer competition surfaces. Rankings stay **labelled** (GPA vs WPR vs PPA World) — never one fake world #1. Shop stays Coming soon until tags/disclosure are ready.

## Ordered roadmap

| # | Milestone | Status | Notes |
|---|-----------|--------|--------|
| 1 | **Live truth · World Cup** | ✓ Done | Sporttora OOP ingest, rolling date filter, tieId dedup, rounds, English names. Box-off complete. |
| 2 | **PPA truth** | ✓ Done | Overlay + desk writes. Rolling dates (`keepPpaMatch`). LIVE from ticker only. No invented scores. Pad-zero fixed. |
| 3 | **Player / follow identity** | ✓ Done | `/player/Waters` · `/player/Johns` · `/player/Bright` · `/team/Vietnam` (+ USA/India). Alias resolution, labelled ranking cards, stronger match association, magazine filter, follow keys preserved. |
| 4 | **PickleWave ingest** | ✓ Done | `wavePlayers` on `/api/rankings` — identity + recent tour cards + watch from public PW HTML. Restyled in-app (no iframe). Snap refresh script. See `docs/picklewave-ingest.md`. |
| 5 | **Draw QF / SF / F** | ✓ Done | Knockout clarity on `/draw` for PPA + WC; R64/R32/R16/QF/SF/F/Bronze; hide junk Round dumps; deep links. See `docs/draw-polish.md`. |
| 6 | **Notifications** | ✓ Done | Safe SW + in-app/PWA LIVE alerts on follow. See `docs/follow-notifications.md`. Residual: needs open tab (no push server yet). |
| 7 | **Shop** | Locked · Coming soon (see docs/shop-disclosure.md) | Affiliate SKUs closed until ready. Keep Coming soon. |

## Identity layer (current)

- Seed follow keys: `Waters`, `Johns`, `Bright`, `Vietnam`, `USA`, `India`.
- URLs accept short key **or** full/abbrev name (`/player/Anna%20Leigh%20Waters`, `/player/A.%20Waters`) and resolve to the same profile + follow key.
- Profile: header + Follow · ranking cards (GPA / Pro ELO / PPA World) · **Recent (Pro tour pool)** from `wavePlayers` · Today · Recent results · magazine hits · archive medals.
- Ranking table names link to `/player/<Name>` (short key when known).
- Pro ELO / tour pool labelled as PickleWave public boards — never merged with GPA or PPA World.
- **PPA World** is live from `ppatour.com/api/rankings` (1h Blobs cache + static fallback). See `docs/ppa-world-rankings.md`.

## Explicit non-goals (this slice)

- Do not reintroduce WC window ingest.
- Do not open the shop.
- Do not invent scores or collapse ranking boards into a single #1.
- Do not iframe PickleWave.

## Magazine surface (2026-09-18c)

`/magazine` is a desk rail, not a plain list: featured/cover image, kicker, title, standfirst from `/api/magazine` (WP featured + Yoast og fallback). Stubs only until feed loads. See `docs/magazine-polish.md`.

## Desk calendar (2026-09-18d)

`/calendar` + `GET|POST /api/calendar` — GPA slate with intake-gated add-event. See `docs/desk-calendar.md`.
