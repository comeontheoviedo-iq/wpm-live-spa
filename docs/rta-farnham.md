# RTA2000 Farnham

Own tour chip **RTA2000** (`rta`). Not APP. Not PPA. Do not cut Columbus Den **18448** or Rate Las Vegas **86926aef-0566-4fbb-87cf-a48068a9f1c6**.

| | |
|--|--|
| Event | RTA2000 Farnham |
| Dates | 2–4 Oct 2026 |
| Venue | Hurlands Pickleball + Padel Club, Farnham, England |
| TZ | `Europe/London` |
| Tournament | Tournated **8510** |
| Draw | https://play.rtapickleballtour.com/tournament/8510/draws?category=34477&segment=MD |
| Board | `/api/rta` |

## Feed

`POST https://play.rtapickleballtour.com/api/graphql` operation **`drawsDetail`** (`drawsDetailPublic`).

Filter: `{ tournament: 8510, tournamentCategory, segment }`.

Segments queried: **MD** (Tournated’s main-draw code, not men’s doubles), **consolation**, **Q**. On 3 Oct 2026 only segment MD had a draw. Consolation and Q returned no draws.

Categories (setting ids):

| Code | Id | Discipline |
|--|--|--|
| WS | 34474 | Women's singles |
| MS | 34475 | Men's singles |
| WD | 34476 | Women's doubles |
| MD | 34477 | Men's doubles |
| MX | 34478 | Mixed doubles |

The public UI can say “No results found” on a category tab while `drawsDetail` still has matches. Trust the payload.

## Scores

`score` is game points, for example `11:2 11:1`. Seeds, ranks, and DUPR ratings on the same entry are not scores.

- `status: completed` with a parsed score → **FT** and games won (`2-0`).
- `status: inProgress` or `isMatchInProgress: true` → **LIVE**.
- LIVE with no points, or only `0:0`, → blank score. Never `0-0`.
- `matchStatus` `Specific Time` and `Followed By` are schedule types, not live/finished.
- A side missing or TBD is a bye or an empty slot and is left off the board.
- The date field is the local calendar day stored as UTC midnight (`2026-10-03T00:00:00.000Z` is 3 Oct). `time` is Europe/London wall clock.

Checked 3 Oct 2026: women’s and men’s singles already had finished game scores (Friday). Men’s doubles had finished games and in-progress matches. Women’s doubles and mixed doubles had named matches and no game scores yet.
