# APP day truth (Overland Park)

**Date:** 2026-09-18  
**Slice:** `wpm-20260918h` · `app-dates.mjs` + client day tabs

## Why Friday looked like finals day

Den Men's/Women's Pro Singles Final and Bronze are `WAITING_FOR_COURT` with **`startTime` / `scheduledTime` = null**. WPM rolled that status onto venue-today and inherited the Thursday bracket `09:00` as `start`. The board listed Wazir–Dussault (Final) and Bower–Camron (Bronze) as NEXT with blank scores on Friday.

Chris / Den: **finals are Sunday 20 Sep 2026** (`America/Chicago`). Den `tournament.endDate` is `2026-09-20`.

## Policy

| Signal | Board date | Start clock |
|--------|------------|-------------|
| `startTime` / `scheduledTime` array | that local Y-M-D | ISO from the array |
| LIVE / RUNNING | scheduled day (unchanged) | match clock if present |
| Medal `FINAL` / `THIRD_PLACE` with no clock | `tournament.endDate` | none (do not invent 09:00) |
| Other NEXT with no clock | bracket `startDate` | bracket session time only if same local day |

WAITING_FOR_COURT is **not** dated onto today.

Default **Today** tab = calendar day in event tz, plus LIVE always. Future Finals sit on the Sunday day tab (PPA-style rolling dates). Draw wall still shows Final slots from `/api/app` `brackets`.

## Verify

```
node scripts/test-app-dates.mjs
node scripts/verify-app-day-truth.mjs
```

Against live Den 18453: Wazir Final + Bower Bronze → `2026-09-20`, not `2026-09-18`. On Sunday they belong on today's board.

Residual: Den 429 soft-fail. Never invent scores. Shop Coming soon.
