# PPA rolling date filter

**Date:** 2026-09-15  
**Slice:** `wpm-20260914b` · function `ppa.mts` `keepPpaMatch`

## Policy (`keepPpaMatch(m, now)`)

| Status | Keep? |
|--------|--------|
| `LIVE` | Always |
| `FT` | Always (event-scoped feed; finished results must not vanish when the calendar day rolls) |
| `NEXT` | Keep if `start` is within the last **48h** **or** in the future. If `start` missing, keep if `date >= today-1` |

Hardcoded `2026-09-04` board pin removed.

## LIVE authority (client)

`effectiveStatus` prefers API / ticker:

- `status === "LIVE"` or any `lines[].live` → LIVE
- `status === "FT"` → FT
- Do **not** promote PPA `NEXT`→`LIVE` from start-time age alone (ticker said `upnext`)
- Soft start/end window remains only for non-`ppa` tours that supply an explicit `end`

## APP (2026-09-18 h)

APP Overland uses the same rolling-date idea on the **client day tabs**, but date truth is event-tz from Den — see [`app-day-truth.md`](./app-day-truth.md). Sunday Finals must not land on Friday's today board.

## Non-goals

- No invented scores
- Pad-zero / `gameComplete` (11 win-by-2) unchanged
- Shop / WC ingest untouched
