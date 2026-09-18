# Europe slate — results-only + draw links (2026-09-18)

Gijón and Barcelona have **no working live score path** on WPM LIVE yet. They are on the desk calendar / competitions slate as **results-only** or **scores delayed**. Shop stays Coming soon. **Never invent scores. Never fake LIVE.**

`/api/ppa` stays on **PPA Veolia Arizona Open** (`62c01642-1bb2-4f9a-9998-599f8fdefe5c`). Barcelona’s UUID is **parked** for cutover only.

## TPB Gijón 2026

| | |
|--|--|
| Event | TOP Pickleball Tour powered by APP · Gijón |
| Dates | 18–20 Sep 2026 |
| Venue | Puerto Deportivo de Gijón (+ aux Mieres), Spain |
| TZ | `Europe/Madrid` |
| Official | https://toppickleballtour.com/tour/gijon/ |
| Draw | [Groups PDF](https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf) |
| Status | **scores delayed** / results-only |
| Live id | **None** — no Den Live `tournamentId`, no Tournated, no live API found |

Tour chip is **TOP Pickleball (`tpb`)**, not APP Den. Powered-by-APP is sponsorship, not `/api/app`. Groups are the official PDF only (not parsed into fake match scores).

## PPA Tour Europe · P250 Barcelona Open

| | |
|--|--|
| Dates | 23–27 Sep 2026 |
| Venue | Tennis Despí, Sant Joan Despí, Spain |
| TZ | `Europe/Madrid` |
| PPA UUID | `1655a7c9-904a-44c9-aa29-b279fca900e8` |
| Status | **results-only / upcoming** until ticker + brackets are Barcelona |
| Live board | **Do not** point `/api/ppa` here while Arizona is the single EVENT |

When the official ticker title is Barcelona, radar raises **P0** to cut `EVENT` in `ppa.mts` to this UUID. Until then Arizona stays live.

## Radar honesty

- Watch **Gijón** for Den / Tournated / any score widget on the official page.
- Watch **Barcelona** parked UUID vs ticker title.
- **MLP Asia ≠ APP.** MLP Asia is the PPA/MLP franchise. APP Asia Tour (Chongqing / Taipei / Bangkok / HCMC / India) stays on the **APP Asia** chip.

## Code

- Seed: `netlify/functions/slate-events.mjs`
- Calendar merge: `netlify/functions/calendar.mts`
- Radar: `netlify/functions/radar-lib.mjs`
- UI: competitions empty cards + calendar draw/official chips (`wpm-20260918g.js`)

Intake rule unchanged: name + venue + timezone + **working** score path. A parked UUID is not a working path.
