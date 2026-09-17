# WC ingest fix — object-bounded Sporttora parse

**Date:** 2026-09-14  
**Deploy:** not done (local verify only)  
**Files:**
- `netlify/functions/wc-parse.mjs` — shared `ingest` / `mapTies` / dedup / filter
- `netlify/functions/worldcup.mts` — thin handler (OOP then live fetch → parse → JSON)
- `scripts/verify-wc-ingest.mjs` — local before/after assertions

## Root cause
`ingest()` used ±350/450 char windows around `"discipline"`, so `tieId` / `sideA` / `sideB` / scores bled across neighboring RSC `__sub-` objects (~17% mismatch). That produced ghost NEXT 0–0 rows for five real ties and attached those scorelines to the wrong nations.

## Fix
Object-bounded ingest:
1. Find `{"id":"…__sub-…"` starts
2. Brace-balance to the matching `}`
3. `JSON.parse` that blob only
4. Read `categoryId`, `tieId`, sides, `entryA`/`entryB`, `status`, `winnerId`, `liveScore.currentGame` scores, venue/schedule **only from that object**

Winner order (tiny correctness add): `winnerId === entryA/entryB.entryId` → else name `sideOf` → else `lineDone` score compare.  
Product rules kept: no invented scores; never FT 0–0; `source: "sporttora-oop"`; `lineDone`; OOP fetch first then live; Sep 4/5 + today + LIVE allow-list unchanged.

## Local verify (`node scripts/verify-wc-ingest.mjs`)
| Check | Result |
|--------|--------|
| CT vs Brazil Masters (`…m35`) | FT **0–3** Brazil |
| India vs CT Juniors (`…m25`) | FT **3–0** India |
| NZ vs Australia Masters (`…m39`) | FT **0–3** Australia |
| USA vs Brazil Masters (`…m40`) | FT **3–0** USA |
| SA vs Samoa Seniors (`…m62`) | FT **3–0** South Africa |
| England vs Japan | FT **3–4**, Dreambreaker **16–20** Japan |
| FT `0-0` | **0** |
| Filtered counts | window **FT 152 / NEXT 5** → object **FT 158 / NEXT 1** |

The remaining NEXT is the real scheduled empty tie (e.g. USA–Mexico Masters `m34`), not a ghost of the five.

## Remaining box-off risks (not fixed here)
1. **Hardcoded date allow-list** (Sep 4/5 + today) — later WC days will not appear in `matches`.
2. **Dedup by sorted team names** (no `tieId`) — rematches / multi-round collisions possible.
3. **Vietnamese labels** still leak when not in `NAMES` (`Pháp`, `Đức`, `Séc`, `Nam Phi`, …).
4. **Brackets** still mostly `"Round"`; some empty/scheduled NEXT may remain in brackets.
5. Spot-check random tieIds after deploy for any residual side mismatches (should be gone with object bounds).
