# Draw wall polish — milestone 5

**Slice:** 2026-09-17 · client `wpm-20260917a.js`  
**Surface:** `/draw` (also Live → Draw mode) · PPA + World Cup

## What changed

### Round labels
- **PPA:** official ticker strings map to short wall labels — `Round 64→R64`, `Round 32→R32`, `Round 16→R16`, `Quarter Finals→QF`, `Semi-Finals→SF`, `Finals→F`, `Bronze→Bronze` (also Third Place).
- **WC:** keep Sporttora `Round N`; sort numerically. Bare / empty `"Round"` / `undefined` buckets are **dropped** (never dumped as a wall column).

### Wall UI
- Clearer knockout columns (QF / SF / F / Bronze styled as knockout).
- PPA default wall shows **R16 · QF · SF · F · Bronze**; early **R64 / R32** only when those rounds still have LIVE/NEXT slots (or when knockout columns are empty).
- WC division chips ordered **Kids · Juniors · Open · Seniors · Masters** (`Open team` chip label → **Open**).
- Empty rounds hidden; ghost **NEXT** rows without both sides are not rendered as slots.

### Deep links
- Match pages link to `/draw?tour=ppa|wc&div=<Division>` (e.g. Women’s Doubles, Open team).
- Div / tour chips keep the URL in sync via `history.replaceState`.

## Non-goals (unchanged)
- No invented scores · no iframe · no shop.
- WC ingest (`wc-parse` / rolling / tieId) and PPA pad / rolling / PickleWave untouched — polish is **client display** over existing `/api/ppa` + `/api/worldcup` bracket trees.

## Residual gaps
- Sporttora does not always emit named QF/SF/F for team WC; wall stays `Round N`.
- PPA Pro Qualifier divisions still appear as chips when present in the bracket tree.
- Deep link matching for “up next” still uses name-bit overlap, not bracket graph edges.
- **APP wall:** `/draw?tour=app` — see [`draw-app.md`](./draw-app.md) + [`app-rounds.md`](./app-rounds.md).
