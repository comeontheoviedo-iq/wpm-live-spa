# Same-day board wins (2026-09-18i)

Client `wpm-20260918i.js` · SW `wpm-static-20260918i`. Shop stays Coming soon. **Never invent scores.**

PR #3 already merged Sunday Finals day-filter as `wpm-20260918h.js`. This bust keeps that filter and adds court/time, event follows, SW align, and the Gijón draw CTA.

## APP court + local time

Board cards show Den `court` and scheduled local time in **`America/Chicago`** (Overland) only when Den provided them (`hasClock` from `startTime`/`scheduledTime`). Same pattern as PPA: court when the ticker has one; official `7:15 PM MST` / `America/Phoenix` when present. No bracket 09:00 painted as a match clock.

## Following events

Following box above Competitions lists **followed events** (Overland / Arizona / Gijón slate) from the same `wpm-follows` object. Keys are `ev:…`. Competitions cards and slate/calendar rows have Follow. Web Push still receives **player/team keys only**.

## SW cache align

JS, CSS query, `index.html` SW register, and `STATIC_CACHE` are all `20260918i` (18h remains the merged Sunday-filter bundle).

## Gijón Official draw

TOP Pickleball competitions / scores-delayed card: one-tap **Official draw** → the groups PDF. Not parsed into matches.

```
https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf
```

## Also kept from 18h

Sunday Finals day-filter from `app-dates.mjs`: Wazir Final / Bower Bronze date to `2026-09-20`, not Friday.

## Verify

```
node scripts/test-app-dates.mjs
node scripts/test-quick-wins.mjs
node scripts/test-slate-events.mjs
node scripts/verify-app-day-truth.mjs
```
