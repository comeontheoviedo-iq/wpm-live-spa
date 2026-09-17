# PPA score-truth audit (FotMob standard)

**Date:** 2026-09-14  
**Prod:** https://live.worldpickleballmagazine.com  
**Scope:** `netlify/functions/ppa.mts`, `scores.mts`, client overlay in `js/wpm-20260914a.js`  
**WC:** not touched (boxed off)

## 1. How the feeds work

### `/api/ppa` (`ppa.mts`)

| Piece | Behaviour |
|--------|-----------|
| **Sources** | Parallel fetch: `ppatour.com/api/ticker/` + `ppatour.com/api/scores/?event=b177c3be-…` (Cary Nationals) |
| **Merge** | Index by match `id`. Scores base first, then ticker spreads over (ticker wins overlapping fields). `dateKey` kept from scores when present |
| **Status map** | `live`→`LIVE`, `final`→`FT`, else `NEXT` (covers `upnext`) |
| **Lines / winners** | Per-game from `teams[].games[]`. Win only if 11+ and win-by-2 (after fix). Match score = count of line winners |
| **Board filter** | `LIVE` **or** `date === today` **or** hardcoded `2026-09-04` |
| **Brackets** | Built from **all** merged matches (not board-filtered), keyed by division → round |
| **Cache** | `Cache-Control: public, max-age=15` — no Blobs |

### `/api/scores` (`scores.mts`)

| Piece | Behaviour |
|--------|-----------|
| **Store** | Netlify Blobs `wpm-desk` / key `feed` |
| **GET** | Desk feed JSON (`no-store`); seed from `wpm-live.netlify.app/scores.json` if empty |
| **POST** | Auth via `DESK_KEY` / `DESK_PASSWORD`; patch one match by `id` or `replaceAll` |
| **PPA role** | Desk can hold manual PPA rows; **client overlay replaces** all `tour==="ppa"` with `/api/ppa` |

### Client (`pull` → `overlay("/api/ppa")`)

1. Load `/scores.json` (static seed)  
2. Overlay WC, then PPA (PPA wins IDs / tour)  
3. `cleanLines()` on render for PPA cards — recomputes winners with `gameLooksFinished` (11+ by 2)

## 2. Live curl snapshot (2026-09-14 ~09:10Z)

### `/api/ppa` (pre-fix)

- **33** board matches: **NEXT 20**, **FT 13**, **LIVE 0**
- **FT 0–0 match scores:** 0 (none)
- **NEXT with invented scores:** 0 (empty score/games — correct)
- **Brackets:** 7 divisions, no empty rounds; ~287 slot entries
- **Phantom game lines:** **9/13 FT** showed `G3 0–0` (and **193** bracket `games` strings contained `0–0`)

### `/api/scores`

- Updated `2026-09-04T10:50:00Z`, **30** matches (18 PPA stub + 12 WC)
- Desk PPA is stale seed material; live board truth comes from `/api/ppa` overlay

## 3. Official spot-check

Fetched successfully (not blocked):

- `https://www.ppatour.com/api/ticker/` → 20 `upnext`, games `[null,null,null]`
- `https://www.ppatour.com/api/scores/?event=…` → 267 matches; finals pad unplayed games as trailing **`0`**

All **13** board FT match scores (`2-0` / `2-1` / `0-2`) matched official game math.  
Official pads e.g. `[11,11,0]` vs `[7,6,0]` for a true 2–0 — our mapper was surfacing the pad as **G3 0–0**.

## 4. What’s good

- No invented **match-level** `0-0` FT scores
- NEXT qualifiers stay scoreless until play
- Merge + overlay model is sound (desk does not fight ticker for PPA IDs)
- Winner counts for real 11+ games were already correct (pads did not increment wins)
- Live-in-progress `0–0` can still be shown when `liveGame` points at that slot

## 5. Issues

### P0 — Phantom `G3 0–0` (fixed)

- **Cause:** PPA scores API pads best-of arrays with `0,0`; `linesFrom` treated `0` as a real point total; `gameComplete(..., matchFinal)` also treated any non-current slot as done when status was `final`
- **Impact:** Cards + brackets showed fake unplayed games; client `cleanLines` could even append `LIVE` onto unfinished `0–0` on FT rows
- **Fix:** `isPadZero` skip unless current live game; `gameComplete` only 11-win-by-2; client `cleanLines` drops non-live `0–0` and only marks `LIVE` from server `l.live`

### P1 — Hardcoded board date `2026-09-04`

- Keeps Cary QF results pinned on the board forever until removed
- Product call: rolling window (e.g. today ±1 / event window) vs explicit “results” shelf

### P1 — `effectiveStatus` time heuristic

- Can promote NEXT→LIVE from `start` alone (up to 3h) even if ticker says `upnext`
- Prefer ticker/PPA status as authority; time only as soft hint

### P1 — Unused / noisy desk PPA stubs

- `/api/scores` still carries fictional-ish PPA rows (`A. Waters R16 opponent`); harmless after overlay but confusing for desk ops

### Not P0

- Empty brackets: none observed  
- Live-as-won: no LIVE matches at audit time; pad path could not create wins  
- WC / `wc-parse`: no accidental dependency

## 6. Fix plan (executed for P0)

1. Patch `netlify/functions/ppa.mts` — pad skip + strict `gameComplete`
2. Harden `cleanLines` in `js/app.js` + `js/wpm-20260914a.js` (+ `site/js` copies)
3. Local verify against official finals JSON (262 finals → 0 phantom; live `0–0` retained; upnext → no lines)
4. Deploy function + static JS
5. Re-curl `/api/ppa`: FT games must not contain `0–0`; scores unchanged

## 7. Verify steps (post-deploy)

```bash
curl -sS 'https://live.worldpickleballmagazine.com/api/ppa' -o /tmp/ppa2.json
python3 -c "
import json
m=json.load(open('/tmp/ppa2.json'))
ft=[x for x in m['matches'] if x['status']=='FT']
bad=[x for x in ft if any(l.get('score') in ('0–0','0-0') for l in x.get('lines')or[])]
print('FT',len(ft),'phantom',len(bad))
print('sample',[(x['score'],x['games']) for x in ft[:3]])
br=sum(1 for d,r in (m.get('brackets')or{}).items() for rr,arr in r.items() for x in arr if '0–0' in (x.get('games')or'') or '0-0' in (x.get('games')or''))
print('bracket 0-0 games',br)
"
```

Expect: `phantom 0`, `bracket 0-0 games 0`, match scores still `2-0` / `2-1`.

## 8. Deploy decision

**Deploy P0** — clear, safe, verified locally: line pad / winner mapping only. No product ambiguity.

## 9. Post-deploy verification

- **Deploy id:** `6aa7ba9fd14a8109bf028304`
- **URL:** https://live.worldpickleballmagazine.com
- **Curl:** FT 13, phantom lines **0**; bracket `0-0` games **0**; NEXT still scoreless; match scores unchanged (`2-0` / `2-1` / `0-2`)
- Live `0–0` path retained in code for current `liveGame` only

## 10. Follow-up — rolling dates + LIVE authority (2026-09-15)

- Replaced hardcoded `2026-09-04` board filter with `keepPpaMatch` (LIVE+FT always; NEXT within 48h / future / date≥today-1).
- Client `effectiveStatus`: API/ticker authority; no clock-only LIVE for PPA. See `docs/ppa-rolling-dates.md`.
- Cache-bust: `wpm-20260914b.js`, css `?v=20260914b`.
