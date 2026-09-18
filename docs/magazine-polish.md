# Magazine rail polish (2026-09-18c)

**Product:** WPM LIVE · `/magazine`  
**JS:** `wpm-20260918c.js`  
**API:** `netlify/functions/magazine.mts` → `/api/magazine`

## What changed

- **Featured images** from WordPress `_embed` featured media (with Yoast `og_image` fallback).
- **Kicker** from desk-ish categories (World Cup / APP / PPA Tour / MLP / Equipment / …) — not player-name categories.
- **Card layout:** cover story (first item) + grid cards with cover image, kicker · date, title, standfirst.
- **Placeholders:** navy/gold gradient + WPM mark when an image is missing.
- **Live feed preferred** over hardcoded `STORIES` stubs whenever `/api/magazine` returns rows.
- Match + player “From the magazine” panels use compact teases with thumbs (same image source).

## Reading links

Article cards open `worldpickleballmagazine.com` (new tab). Issue chips stay on the magazine site. In-app navigation remains for Live / Mag / Rankings / etc.

## Non-goals

- No invented scores · shop stays closed · APP/PPA/push/radar untouched.
