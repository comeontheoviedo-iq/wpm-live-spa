# Draw wall — APP

`/draw?tour=app` uses `/api/app` `brackets` plus `bracketIndex` (published Den bracket list: name, phase, pool number, playoff phrase, pending / in-progress / complete). Default phase is **Elimination**. Columbus pro draws (Men's Pro Singles and the other Pro brackets) sit there. Skill-rating round robins sit under **Pools**.

Pending brackets with no players stay a directory, not a wall of empty slots. No TBD/BYE columns. No invented scores. A pending bracket is never a LIVE chip.

## Phases

| Phase | What Den published | Wall |
|-------|--------------------|------|
| **Elimination** | Single / double elimination (`bracketType` contains elimination) | QF / SF / Final / Bronze / R16… when both sides exist. Final stays **Final**. |
| **Pools** | Round robin / double round robin | **Round N** only. Chip **Pool 2** when Den sends `poolNumber`. |

A pool bracket’s `playoffType` is a label only (`then seeded playoff`, `then top 4`). The playoff is not drawn until Den has sides, and those rounds show under Elimination.

Pool columns stay visible when elimination rounds in the same division already have sides. Ghost NEXT rows (one side TBD/BYE) and a bare `Round` bucket are dropped. Early R64/R32 hide once QF–Final exist, unless that early round is still NEXT or LIVE.

## Deep links

- `/draw?tour=app&div=Men's%20Pro%20Singles&phase=elim`
- `/draw?tour=app&div=Men's%20Singles%204.5%2F5.0%3A%207-34%2B%2C35%2B&phase=pool&pool=2`
- Match pages pass tour, division, phase, and pool (`m.format`, `m.pool`).

## Before first serve (Columbus 18448)

Den brackets are Pending and `totalRounds` is 0 on the elimination draws. The wall shows the phase toggle, the division chips, and **Play starts soon**. It does not invent a bracket.

PPA + WC behaviour unchanged. Radar intake for other APP stops is out of scope. Round math: [`app-rounds.md`](./app-rounds.md).
