# APP round labels (Den Live)

Den emits `roundDisplayName: "Round N"` even on finals day. Do **not** map Round 6 → Final globally — bracket depth varies (Men's Pro Singles Overland `totalRounds=6`; Women's Pro Singles `=4`).

**Helper:** `netlify/functions/app-rounds.mjs` (`polishAppRound`, `discFromAppBracket`)

| Signal | Label |
|--------|--------|
| `matchType=FINAL` | Final |
| `matchType=THIRD_PLACE` | Bronze |
| Knockout `totalRounds − round` | SF / QF / R16 / R32 / R64 |
| Round Robin / pool | stay `Round N` |

Verified against live `/api/app?tournamentId=18453` + Den `bracket-matches` (2026-09-18): Men's Pro R6 Wazir vs Dussault is `FINAL`; Bower vs Camron is `THIRD_PLACE`. Scores unchanged.

`disc` (MS/WS/XD/MD/WD) is derived from Den `teamType` / bracket name for the results chips — not invented.
