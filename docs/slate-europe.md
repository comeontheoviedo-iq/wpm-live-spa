# Europe slate — results-only + draw links

Gijón has **no working live score path**. Barcelona’s window **ended 27 Sep 2026 with no scores** and is **unparked** — do not cut `/api/ppa` to it. Shop stays Coming soon. **Never invent scores. Never fake LIVE.**

`/api/ppa` is **Veolia Chicago Cup** (`203e1164-b4f9-47e9-bacf-ff81f8748025`), Life Time North Shore Sport & Racquetball, Chicago, IL, `America/Chicago`, 5–11 Oct 2026. Not Rate Las Vegas `86926aef-…` (finished 4 Oct, archive only). Not the April Las Vegas UUID `92d37566-…`. Not Mesa `62c01642-…`.

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

Tour chip is **TOP Pickleball (`tpb`)**, not APP Den. Powered-by-APP is sponsorship, not `/api/app`. Groups are the official PDF only (not parsed into fake match scores). Competitions / scores-delayed card has a one-tap **Official draw** CTA to that PDF (`wpm-20260929a.js`). The reader card says **Scores delayed** — the Den/Tournated detail stays in this doc and on radar.

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

The ticker moved to Veolia Chicago Cup. Radar must not raise a cutover to Barcelona or back to Rate Las Vegas.

## Radar honesty

- Watch **Gijón** for Den / Tournated / any score widget on the official page.
- **Barcelona** is ended. Report the scores count. Do not cut `EVENT`.
- **MLP Asia ≠ APP.** MLP Asia is the PPA/MLP franchise. APP Asia Tour (Chongqing / Taipei / Bangkok / HCMC / India) stays on the **APP Asia** chip.

## Code

- Seed: `netlify/functions/slate-events.mjs`
- Calendar merge: `netlify/functions/calendar.mts`
- Radar: `netlify/functions/radar-lib.mjs`
- UI: competitions empty cards + **Official draw** CTA + calendar follow (`wpm-20260929a.js`)
- Reader board (`readerStatusLine` / `toReaderEvent`): **Event ended**, **Scores delayed**, **Draw not published yet**, or **Results will appear when available**. One sentence. Desk `note` / UUID / `/api/ppa` stay off the card.
- A live-armed tour with nothing in progress (Columbus before first serve, or only NEXT) uses **Play starts soon** on the empty Live board. That line is not a LIVE chip, and it does not disarm the event.

Intake rule unchanged: name + venue + timezone + **working** score path. An ended UUID is not a working path.
