# Draw wall — APP

`/draw?tour=app` uses `/api/app` `brackets` (same wall as PPA). Default chip is the live APP event’s first **Pro** knockout draw (Overland: Men's Pro Singles).

- Round labels: see `docs/app-rounds.md` (Final / SF / QF from Den `matchType` + `totalRounds`).
- Deep link: `/draw?tour=app&div=Men's%20Pro%20Singles` (match pages already pass `m.tour`).
- **Empty state** when Den has no sides (TBD/BYE skipped, pending doubles): “never invent a bracket.”
- Pool / Round Robin divisions stay Round N columns — not fake QF/SF.

PPA + WC behaviour unchanged. Radar intake for other APP stops is out of scope.
