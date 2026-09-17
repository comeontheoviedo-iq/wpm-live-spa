# WC box-off done — rolling dates, tieId dedup, rounds, names

**Date:** 2026-09-14  
**Deploy:** production `wpm-live`  
**Deploy id:** `6aa7b8a62ef6302d9d973b1e`  
**Production URL:** https://live.worldpickleballmagazine.com  
**Unique deploy URL:** https://6aa7b8a62ef6302d9d973b1e--wpm-live.netlify.app  
**API:** `GET /api/worldcup` · `source: "sporttora-oop"`

## Shipped

### 1. Rolling date filter (`filterMatches`)
- Removed hardcoded `2026-09-04` / `2026-09-05` allow-list.
- **Always** keep `LIVE` and **all** `FT` (finished WC slate must not vanish).
- Keep `NEXT` only if start is within the last **48h**, or start is in the future; if start missing → keep when `date >= today-1`.
- Helpers: `keepNext`, `keepForMatches` in `wc-parse.mjs`.

### 2. Dedup by `tieId` / stable `id`
- `dedupMatches` keys on `m.id` (`st-` + slugified `tieId`), not sorted team names.
- Collision preference unchanged: LIVE > FT > NEXT.

### 3. Bracket round labels
- Ingest captures `roundName` + `roundNum`.
- `roundLabel()`: prefer non-empty `roundName`, else `Round ${n}` from `roundNum`.
- `mapTies` / `buildBrackets` no longer dump everything into a single `"Round"` bucket when `roundNum` exists.
- Stale NEXT (same 48h policy) are omitted from brackets.

### 4. Expanded `NAMES`
Added / confirmed Vietnamese→English mappings seen on Sporttora boards, including:  
Pháp, Đức, Ý, Hà Lan, Nhật Bản, Thái Lan, Quần đảo Cayman, Séc, Bỉ, Nam Phi, Hy Lạp, Trung Quốc, Ả Rập Xê Út, Quần đảo Cook, Antigua và Barbuda, Ma Cao (Trung Quốc), Campuchia, Litva, etc.

### 5. Verify + prod
- `scripts/verify-wc-ingest.mjs` updated for rolling filter, id dedup, rounds, NAMES, still asserts five truths + ENG–JPN + no FT 0–0.
- Local verify: **exit 0**.
- Prod curl after deploy: **FT 317 / NEXT 0 / LIVE 0**; five truths + ENG–JPN 3–4 DB 16–20 Japan; source `sporttora-oop`; zero FT 0–0; no Vietnamese sides; bracket rounds `Round 1`…`Round 9`.

## Files touched
- `netlify/functions/wc-parse.mjs` — filter, dedup, rounds, NAMES, helpers
- `scripts/verify-wc-ingest.mjs` — new expectations
- `docs/wc-boxoff-done.md` — this note  
Handler `worldcup.mts` unchanged (still OOP then live → parse → JSON). Client JS untouched.

## Prod snapshot (2026-09-14 ~09:05 UTC)
| Check | Result |
|--------|--------|
| CT–Brazil Masters `m35` | FT **0–3** Brazil · Round 4 |
| India–CT Juniors `m25` | FT **3–0** India · Round 4 |
| NZ–Aus Masters `m39` | FT **0–3** Australia · Round 5 |
| USA–Brazil Masters `m40` | FT **3–0** USA · Round 5 |
| SA–Samoa Seniors `m62` | FT **3–0** South Africa · Round 4 |
| England–Japan Open | FT **3–4**, Dreambreaker **16–20** Japan |
| FT `0-0` | **0** |
| NEXT (filtered) | **0** (stale USA–Mexico Masters `m34` dropped by 48h policy) |
| `source` | `sporttora-oop` |

## Still open / residual risks
1. **Round semantics** — Sporttora `roundNum` → `Round N` is literal; not mapped to named stages (QF/SF/Final) if/when the tournament publishes those as empty `roundName`.
2. **AIN / rare English labels** — unmapped identity pass-through (no diacritics); fine unless product wants a display rename.
3. **Future LIVE / NEXT** — rolling filter will surface them; worth a smoke check once live ties return.
4. **Object-bounded ingest** remains the correctness foundation — do not reintroduce ±350/450 window ingest in the handler.
5. **No score invention** — cancelled/empty lines still yield NEXT only when truly unscored; never FT 0–0.
6. Spot-check rematches across rounds if Sporttora reuses team pairs (id-dedup should keep both; old name-dedup would not).
