# Europe slate — results-only + draw links

Gijón has **no working live score path**. Barcelona’s window **ended 27 Sep 2026 with no scores** and is **unparked** — do not cut `/api/ppa` to it. Shop stays Coming soon. **Never invent scores. Never fake LIVE.**

`/api/ppa` is **PPA Rate Las Vegas Open** (`86926aef-0566-4fbb-87cf-a48068a9f1c6`), Darling Tennis Center, Las Vegas, `America/Los_Angeles`. Not the April Las Vegas UUID `92d37566-…`. Not Mesa `62c01642-…`.

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

Tour chip is **TOP Pickleball (`tpb`)**, not APP Den. Powered-by-APP is sponsorship, not `/api/app`. Groups are the official PDF only (not parsed into fake match scores). Competitions / scores-delayed card has a one-tap **Official draw** CTA to that PDF (`wpm-20260928a.js`).

## PPA Tour Europe · P250 Barcelona Open

| | |
|--|--|
| Dates | 23–27 Sep 2026 |
| Venue | Tennis Despí, Sant Joan Despí, Spain |
| TZ | `Europe/Madrid` |
| PPA UUID | `1655a7c9-904a-44c9-aa29-b279fca900e8` |
| Status | **ended** / unparked |
| Scores | Official scores API returned **0** matches |
| Live board | **Do not** point `/api/ppa` here |

The ticker moved to Rate Las Vegas Open. Radar must not raise a cutover to Barcelona.

## Radar honesty

- Watch **Gijón** for Den / Tournated / any score widget on the official page.
- **Barcelona** is ended. Report the scores count. Do not cut `EVENT`.
- **MLP Asia ≠ APP.** MLP Asia is the PPA/MLP franchise. APP Asia Tour (Chongqing / Taipei / Bangkok / HCMC / India) stays on the **APP Asia** chip.

## Code

- Seed: `netlify/functions/slate-events.mjs`
- Calendar merge: `netlify/functions/calendar.mts`
- Radar: `netlify/functions/radar-lib.mjs`
- UI: competitions empty cards + **Official draw** CTA + calendar follow (`wpm-20260928a.js`)

Intake rule unchanged: name + venue + timezone + **working** score path. An ended UUID is not a working path.
