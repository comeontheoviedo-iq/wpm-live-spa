# WPM LIVE World Cup — Box-Off Audit

**Date:** 2026-09-14  
**Product:** FotMob-for-pickleball · https://live.worldpickleballmagazine.com  
**Source tree:** `/workspace/wpm-live`  
**API:** `GET /api/worldcup` → `netlify/functions/worldcup.mts`  
**Client:** `js/app.js` (= `wpm-20260907g.js`)  
**WC source of truth:** Sporttora OOP first (`/pwc2026/schedule?view=order-of-play`), then `/live`

---

## 1. How `worldcup.mts` builds matches / status / brackets

### Fetch + ingest
- Parallel `fetch` of Sporttora RSC payloads:
  - OOP: `https://www.sporttora.com/pwc2026/schedule?view=order-of-play&_rsc=wpm`
  - Live: `https://www.sporttora.com/pwc2026/live?_rsc=wpm`
- Headers: `RSC: 1`, `User-Agent: WPM-LIVE/1.0`
- `ingest(text, ties)` scans with regex `"discipline":"..."` and for each hit takes a **±350/450 character window**, then regex-extracts `categoryId`, `tieId`, `sideA/sideB.name`, `status`, `scoreA/B`, `winnerId`, `venueName`, `scheduledAt`, `roundName`, `groupId`, `courtName`.
- Only `categoryId` containing `"team"` is kept.
- Subs merged by discipline; `in_progress` sets `tie.live`.

### Line → winner → tie status
- `lineDone(s)` (P0 guard):
  - true if `winnerId` present; or `completed` with unequal scores; or score thresholds (FB: ≥15 & +2; else ≥20 & (+2 or ≥21)).
  - **Equal scores (incl. 0–0) are not wins.**
- Winner: `sideOf(winnerId, a, b)` (substring match on normalized names), else score compare if `lineDone`.
- Tie score = count of line winners for A vs B.
- **Status:** `LIVE` if any live line; else `FT` if `ta+tb > 0`; else **`NEXT`** (including unfinished with empty/0–0 lines). **Never emits FT 0–0.**

### Dedup, date filter, brackets, response
- Dedup key: `[divLabel, a, b].sort().join("|")` — prefers LIVE > FT > NEXT. **No round/id in key** → round collisions possible.
- **Matches filter (hardcoded, not 48h):** keep if `LIVE` **or** `date === today` **or** `date ∈ {2026-09-04, 2026-09-05}`.
- Brackets: all unique ties, keyed by division label then `round` (empty → `"Round"`).
- Response: `{ updated, source: "sporttora-oop", matches, brackets }` with `Cache-Control: public, max-age=15`.
- **No Netlify Blobs / persistence in this function.** (Blobs exist only on `scores.mts` for desk edits.) Stateless re-scrape each request.

---

## 2. Production `/api/worldcup` snapshot (2026-09-14 ~08:54 UTC)

| Field | Value |
|--------|--------|
| `source` | `sporttora-oop` |
| `updated` | `2026-09-14T08:54:26.435Z` |
| `matches` | **157** |
| Status | **FT 152 · NEXT 5 · LIVE 0** |
| Dates in matches | `2026-09-04` (121), `2026-09-05` (36) — today (09-14) empty because no LIVE and hardcoded allow-list |
| FT with score `0-0` | **0** (P0 status rule holds) |
| Lines with `0–0` | 7 (6 on FT ties as non-winning lines; 1 on USA–Brazil Masters NEXT WD) |

### Known-good check
- **England vs Japan** Open: **FT 3–4**, Dreambreaker **16–20 Japan** — matches expected.

### The 5 NEXT ties (all score `0-0`, empty/useless lines)

| API id | Shown as | Date | Games |
|--------|----------|------|-------|
| `st-masters-…-m34` | Chinese Taipei vs Brazil · Masters Round 1 | 2026-09-04 | empty disciplines |
| `st-juniors-…-m24` | India vs Chinese Taipei · Juniors | 2026-09-05 | empty |
| `st-masters-…-m38` | New Zealand vs Australia · Masters | 2026-09-05 | empty |
| `st-masters-…-m4` | USA vs Brazil · Masters | 2026-09-04 | WD `0–0` only |
| `st-seniors-…-m61` | South Africa vs Samoa · Seniors | 2026-09-04 | empty |

### Brackets shape
- Divs: `Masters`, `Seniors`, `Juniors`, `Kids`, `Open team`
- Rounds mostly collapsed to `"Round"` (empty `roundName`); one `Round 1` / `Round 3` remnant
- **19 NEXT in brackets** (includes Sep 3 Open/Seniors ghosts filtered out of `matches` by date allow-list)
- Counts (approx): Masters ~46, Seniors ~91, Juniors 25, Kids 26, Open ~128

---

## 3. Sporttora OOP/live — truth for the 5 “NEXT” pairs

Parsed with **object-bounded** extraction (not the ±350 window). **Do not invent scores; these are what Sporttora shows.**

| Claimed NEXT pair | True Sporttora `tieId` | Sporttora result | Verdict |
|-------------------|------------------------|------------------|---------|
| Chinese Taipei–Brazil Masters | `masters_…_m35` | WD 17–20, MD 19–20, XD#1 13–20 Brazil; XD#2/FB cancelled | **Should be FT Brazil 3–0** |
| India–Chinese Taipei Juniors | `juniors_…_m25` | WD 20–12, MD 20–13, XD#1 20–10 India; XD#2/FB cancelled | **Should be FT India 3–0** |
| NZ–Australia Masters | `masters_…_m39` | WD 17–20, MD 12–20, XD#1 17–20 Australia; XD#2/FB cancelled | **Should be FT Australia 3–0** |
| USA–Brazil Masters | `masters_…_m40` | WD 20–13, MD 20–12, XD#1 20–15 USA; XD#2/FB cancelled | **Should be FT USA 3–0** |
| SA–Samoa Seniors | `seniors_…_m62` | WD 20–6, MD 20–10, XD#1 20–15 SA; XD#2/FB cancelled | **Should be FT South Africa 3–0** |

### What production attached instead (same scores, wrong teams)
Regex bleed kept scores on the true `tieId` but **wrong `sideA`/`sideB` from a neighboring object**:

| True result | Production row (wrong sides) |
|-------------|------------------------------|
| CT–Brazil Masters 0–3 | `m35` = South Korea vs Philippines FT **0–2** (scores 17–20 / 19–20 / 13–20) |
| India–CT Juniors 3–0 | `m25` = USA vs Hong Kong FT **3–0** (20–12 / 20–13 / 20–10) |
| NZ–Aus Masters 0–3 | `m39` = Vietnam vs Cayman FT **0–3** (17–20 / 12–20 / 17–20) |
| USA–Brazil Masters 3–0 | `m40` = South Korea vs Singapore FT **3–0** (20–13 / 20–12 / 20–15) |
| SA–Samoa Seniors 3–0 | `m62` = Brazil vs Séc FT **3–0** (20–6 / 20–10 / 20–15) |

True IDs for the **ghost** NEXT rows on Sporttora are different matches entirely (e.g. `m34` = USA vs Mexico **scheduled** empty; `m24` = Vietnam vs Australia completed with winnerIds but often null scores; `m4` = Vietnam vs Cayman with WD 0–0; etc.).

**Root cause measured:** worldcup-style window ingest mismatches true sides on **~17%** of team discipline rows (634/3702 in a combined OOP+live scrape).

---

## 4. Client `app.js` — how WC is consumed

- `pull()` loads `/scores.json`, then **overlays** `/api/worldcup` (tour `wc`) and `/api/ppa`.
- Overlay: drop existing matches with `tour === tour` or colliding ids, then concat API matches; store `data.brackets` → `state.wcBrackets`.
- **No client-side drop of “old” WC matches** beyond whatever the API returns.
- **Date chips:** `datesAvailable()` = union of `m.date` from `state.matches` + today/yest/tom. Board filters with `m.date !== state.date` → if API only returns Sep 4/5, those are the only WC day chips with content.
- Results / Matches / Live modes use `effectiveStatus()`:
  - Trusts API `FT`.
  - Can promote non-FT to **LIVE** if `start` within last 3h and no `end` — not the cause of these Sep 4/5 ghosts (age ~210h+).
- Draw board reads `state.wcBrackets`; shows score unless status NEXT.
- `cleanLines()` only rewrites **PPA** lines, not WC.
- Poll every 12s.

---

## 5. BOX-OFF checklist

### Already done (keep)
- [x] Sporttora OOP + live as sole WC source (`source: "sporttora-oop"`)
- [x] `lineDone` prevents incomplete / 0–0 games counting as wins
- [x] Status rule never emits **FT 0–0**
- [x] England vs Japan FT 3–4 / DB 16–20 Japan present and correct
- [x] Vietnamese→English name map (partial)
- [x] Short CDN cache (15s); no WC blob store (good for live scrape)
- [x] Client overlay of `/api/worldcup` into board + draw

### Broken (block box-off)
1. **P0 — RSC ingest window bleed** mixes `tieId` / sides / scores / winner across adjacent JSON objects → wrong pairings, ghost NEXT 0–0, real results attributed to wrong nations.
2. **P0 — Five named ties stuck NEXT** while Sporttora has FT results under **adjacent** tieIds (table above).
3. **P1 — Hardcoded match date allow-list** (`today` + `2026-09-04` + `2026-09-05`) — will hide later WC days; not a rolling 48h window.
4. **P1 — Dedup by sorted team names only** can collapse distinct rounds / rematches.
5. **P2 — Incomplete name map** (`Pháp`, `Nam Phi`, `Đức`, `Quần đảo Cayman`, `Séc`, …) leaks Vietnamese labels into UI.
6. **P2 — Brackets round labels** mostly empty → giant `"Round"` buckets; Sep 3 NEXT ghosts still in brackets.
7. **P2 — `winnerId` without scores:** if sides correct, `sideOf` can still FT from winnerId alone; after ingest fix, prefer matching `winnerId` to `entryA.entryId` / `entryB.entryId` (more reliable than display-name substring).

### Exact code changes needed (do not deploy in this audit)

#### A. `netlify/functions/worldcup.mts` — replace window `ingest` (highest priority)
**Approach:** For each `"id":"<tieId>__sub-…"` (or brace-balance from `{"id":`), parse **one JSON object** and read `tieId`, `sideA`, `sideB`, `entryA.entryId`, `entryB.entryId`, `discipline`, `status`, `scoreA/B`, `winnerId`, `scheduledAt`, etc. **only from that object**.

```text
ingest:
  find /{"id":"[^"]+__sub-[^"]+"/g
  brace-balance to object end
  JSON.parse or field-extract within blob only
  skip if categoryId lacks "team"
  merge into ties[tieId] as today
```

Winner resolution order:
1. `winnerId === entryA/entryB.entryId` → side A/B  
2. else `sideOf(winnerId, a, b)`  
3. else score via `lineDone`  
Never invent scores; cancelled lines without winner/score stay non-wins.

#### B. Same file — date filter
Replace hardcoded Sep 4/5 with rolling window, e.g. last N days + today + future scheduled, **or** always include LIVE/FT with any date and only soft-filter NEXT older than ~48h. Keep brackets broader than the matches strip if desired.

#### C. Same file — dedup
Key by `tieId` (stable id), not sorted team names. Optionally secondary merge only when identical id.

#### D. Same file — names
Extend `NAMES` for remaining Vietnamese labels seen in prod (`Pháp`→France, `Nam Phi`→South Africa, `Đức`→Germany, `Ý`→Italy, `Hà Lan`→Netherlands, `Quần đảo Cayman`→Cayman Islands, `Séc`→Czechia, `Nhật Bản`→Japan, `Thái Lan`→Thailand, …).

#### E. Client (optional for box-off)
- `js/app.js`: do not treat multi-day-old NEXT as LIVE (`effectiveStatus` 3h rule is OK if start is old).
- No need to drop old matches client-side if API date policy is fixed.
- Consider showing WC date chips even when selecting “Today” empty — product call.

### Verification plan (after fix, still no inventing)

```bash
curl -sS https://live.worldpickleballmagazine.com/api/worldcup -o /tmp/wc.json
```

**Must pass:**
1. `source === "sporttora-oop"`; no FT with score `0-0`.
2. England vs Japan still FT `3-4` with Dreambreaker `16–20`.
3. These five are **FT with Sporttora scores** (not NEXT ghosts):
   - Chinese Taipei vs Brazil Masters → `0-3` (or `3-0` Brazil), lines 17–20 / 19–20 / 13–20
   - India vs Chinese Taipei Juniors → `3-0`, lines 20–12 / 20–13 / 20–10
   - New Zealand vs Australia Masters → `0-3` Australia, lines 17–20 / 12–20 / 17–20
   - USA vs Brazil Masters → `3-0`, lines 20–13 / 20–12 / 20–15
   - South Africa vs Samoa Seniors → `3-0`, lines 20–6 / 20–10 / 20–15
4. Production must **not** show those scorelines on SK–Philippines / USA–HK / Vietnam–Cayman / SK–Singapore / Brazil–Séc for those tieIds.
5. Spot-check: object-bounded local scrape vs API for 20 random tieIds → side names match.
6. Client: WC filter on Sep 4 and Sep 5 shows the five as FT; draw board matches.

### Out of scope / non-goals this box-off
- Deploy (explicitly forbidden here)
- Inventing or hardcoding the five scorelines in the client
- Changing PPA / scores blob desk flow

---

## 6. Priority order to implement

1. **Object-bounded ingest in `worldcup.mts`** (fixes wrong nations + ghost NEXT + misattributed FTs)
2. Rolling date filter (replace hardcoded Sep 4/5)
3. Dedup by `tieId`
4. Expand `NAMES`
5. Harden `winnerId` → entryId mapping
6. Light client date-chip UX if still needed

---

## Appendix — key code refs

- Status: `worldcup.mts` ~L182 `liveLine ? "LIVE" : ta + tb > 0 ? "FT" : "NEXT"`
- Date filter: ~L199–200
- `lineDone`: ~L48–56
- Client overlay: `app.js` `pull()` / `overlay("/api/worldcup","wc")` ~L857–881
- Client date filter: `filteredList()` ~L191–193
