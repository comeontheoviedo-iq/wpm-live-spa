# Web Push — closed-tab follow alerts

**Slice:** 2026-10-01 · tour + player follows · client `wpm-20261001a.js` · SW `sw.js?v=20261001a`  
**Product:** ping when a followed player, team, or tour match goes LIVE even with **every tab closed**. A follow is a tour (`tour:app`, `tour:ppa`, `tour:wc`, `tour:gpa`, and the other board tours) or a player — not one tournament such as Columbus / `ev:app:18448`.

## Architecture

| Piece | Role |
|-------|------|
| **VAPID** | Application-server keypair. Public embedded in client (+ `GET /api/push-subscribe`). Private only in Netlify env (or Blobs fallback). |
| **Client** | After Notification permission + safe SW ready → `pushManager.subscribe` → `POST /api/push-subscribe` with `{ subscription, follows }`. Follows are player/team keys and tour keys (`tour:app`). On load, `migrateFollows()` rewrites `localStorage` `wpm-follows`: `ev:app:18448` and a Columbus calendar `ev:` key become `tour:app`; an unknown event key is dropped. Re-POST whenever follows change. |
| **Blobs `wpm-push`** | `sub/<sha256(endpoint)[:32]>` → subscription + follows + per-match notified map. Optional `vapid` key if env missing. |
| **`push-live-check`** | Scheduled every 5 min (`*/5 * * * *`). Fetches `/api/ppa` + `/api/app` + `/api/worldcup`, finds LIVE rows, matches via `matchFollowKeys` (tags, name tokens in `a`/`b`/`games`/`roster`, or a tour key), sends via `web-push`. |
| **SW** | `push` → `showNotification`; `notificationclick` → `/match/<id>`. Safe no-cache rules unchanged. |

Page notifications (`maybeNotify`) still run when a tab is open — complementary, not replaced.

## Env vars (Netlify)

Set on site **wpm-live** (all contexts preferred):

| Var | Purpose |
|-----|---------|
| `VAPID_PUBLIC_KEY` | URL-safe base64 public key (also in client constant) |
| `VAPID_PRIVATE_KEY` | Private key — **never** commit or embed in client |
| `VAPID_SUBJECT` | `mailto:…` or `https://…` contact URI for VAPID |

Local copy (gitignored): `.env.vapid` — regenerate with `npx web-push generate-vapid-keys --json` if rotating.

```bash
cd /workspace/wpm-live
netlify env:set VAPID_PUBLIC_KEY "…" --context production
netlify env:set VAPID_PRIVATE_KEY "…" --context production
netlify env:set VAPID_SUBJECT "mailto:comeontheoviedo@gmail.com" --context production
netlify deploy --prod --message "web push env pick-up"
```

### Fallback if env unset

`resolveVapid()` in `push-lib.mjs` reads Blobs `wpm-push` / `vapid`. If missing, generates once with `web-push.generateVAPIDKeys()` and stores there. Client prefers `GET /api/push-subscribe` public key so Blobs-generated keys still work. **Prefer env** so keys survive store wipes and stay auditable.

## API

### `GET /api/push-subscribe`
```json
{ "publicKey": "…", "source": "env"|"blobs"|"blobs-generated", "subject": "mailto:…" }
```

### `POST /api/push-subscribe`
Body:
```json
{
  "subscription": { "endpoint": "https://…", "keys": { "p256dh": "…", "auth": "…" } },
  "follows": ["Waters", "tour:app"]
}
```
- `normalizeFollowKey` runs before store. `ev:app:18448` is saved as `tour:app`. Unknown `ev:` / `gpa:` keys are dropped. A stored sub from an older client upgrades on the next POST.
- Empty `follows` → deletes the Blobs record (no spam to abandoned subs).
- Overwrites follows on each sync; preserves `notified` map (pruned to ~6h).

### Scheduled `push-live-check`
- Cron: `*/5 * * * *`
- APP LIVE only when `status === "LIVE"` **and** `denStatus` is RUNNING / IN_PROGRESS / STARTED / PLAYING (`matchCountsAsLive`). SCHEDULED, PENDING, and WAITING_FOR_COURT never push. A line flagged `live` on a non-running Den row does not push.
- Other tours: `status === "LIVE"` or any `lines[].live`. Never invent LIVE from the clock.
- Match if any follow key is in `m.tags`, appears as a name token in `m.a` / `m.b` / `m.games` / `m.roster`, **or** is a tour key whose id equals `m.tour` (`tourFollowMatches`).
- A followed tour hits every match on that tour's board. `tour:app` hits APP Columbus and any later APP event. `tour:ppa` does not hit an APP row. Legacy `ev:app:18448` is normalized to `tour:app` before the check, so an unmigrated subscription still matches, then the next POST stores `tour:app`.
- Doubles cards still show last names. `roster` keeps full Den names so a follow stored as `Anna Leigh Waters` still matches.
- De-dupe: `notified[matchId] = timestamp`; skip if set; TTL ~6h. One OS notification per match until it leaves LIVE.
- Burst: followed **players** always send. A followed **tour** sends at most 6 matches per subscription per cron run (Pro before amateur). The rest wait for the next run and are not marked sent.
- 404/410 from push service → delete subscription.

## How to verify

1. Hard refresh https://live.worldpickleballmagazine.com — JS `wpm-20261001a.js`, SW `20261001a`.
2. DevTools → Application → Service Workers: safe SW only; Cache Storage has no `/`, `/js/*`, `/api/*`, `*.json`.
3. Follow **Waters** (player profile or the match Follow button) and **APP** (Follow APP on the competition card, or Following → Tours). There is no Follow Columbus / `ev:app:18448` control. Following → **Turn on live alerts** → Allow. Network: `POST /api/push-subscribe` 200 with `follows` containing `Waters` and `tour:app`. Application → Push Messaging / subscription present. If `localStorage` `wpm-follows` still has `ev:app:18448`, reload once — it becomes `tour:app`.
4. Confirm Blobs: Netlify UI → Blobs → `wpm-push` → `sub/…` includes `Waters` and `tour:app`, not `ev:app:18448`. Empty follows deletes the record.
5. Before first serve (Den still SCHEDULED / NEXT, `liveCount` 0): invoke `/.netlify/functions/push-live-check`. Expect `sent: 0`. No OS notification. Do not treat a clock time as LIVE.
6. When a followed player or any match on a followed tour is actually RUNNING / IN_PROGRESS / STARTED / PLAYING: close **all** tabs. Wait for the 5-minute cron, or invoke `push-live-check`. Expect one OS notification for that match (`Following · Waters` and/or `Following · APP`). Click → `/match/<id>`.
7. Re-run the check while that match is still LIVE → `skipped` increments, no second push.
8. If many courts on a followed tour flip in one cron, a player hit goes out, then at most 6 tour-only pings. The next run continues the rest. An open tab uses the same idea (player hits immediately, tour hits capped, 5-minute hold in `sessionStorage` `wpm-event-notify-hold`).

Local: `node scripts/test-match-day.mjs`.

## Chicago LIVE starts (2026-10-05b)

PPA push fires only when `/api/ppa` sets `status: "LIVE"` and `tickerLive: true`. That flag is the ticker row's `status === "live"`. `upnext`, a scores-only `live`, and a line flag do not send. Cards tag seed last names plus every player last name on the Chicago match (`D. Denardo` → `Denardo`), so a followed player who is not on the seed list still matches. `tour:ppa` matches `m.tour === "ppa"` for every real LIVE start on that board. The 6-per-run tour cap and the 6-hour de-dupe are unchanged.

## Tag coverage (2026-09-18e)

- Shared `netlify/functions/follow-tags.mjs`: `SEED_FOLLOW_TAGS` (~40 high-signal last names) + `tagsFor(a,b)` used by **PPA** and **APP** match mapping.
- Token-equality only (not substring) so **Johns ≠ Johnson** and **Fu ≠ Fuller**.
- Also tags any last-name token that matches a seed key case-insensitively when it appears in `a`/`b`.
- Client `followsMatch` / `matchedFollowsFor` and push `matchFollows` both use the same tags-or-name-token rule — older sparse-tag rows still fire if the follow key is visible in the side names.
- WC left as team tags only (Vietnam / USA / India) — no invented country tags on APP/PPA doubles.

## Residual gaps

- Seed list is finite (~40). Full names on doubles live in `roster` so a multi-word follow still matches when the card shows last names. A follow key that is neither a tag, a name token, nor a tour key still does not fire.
- First push after subscribe can lag up to ~5 minutes (cron).
- iOS Safari needs Add to Home Screen / recent iOS for Web Push.
- Rotating VAPID requires new client subscribe (old PushSubscriptions invalidate).
- Client + server may both notify when a tab is open (different channels); SW `tag` = match id limits duplicate OS banners somewhat.
- **Tour follows** (`tour:app`, `tour:ppa`, `tour:wc`, `tour:gpa`, plus `tour:npl`, `tour:asia`, `tour:ppa-eu`, `tour:app-asia`, `tour:mlp-asia`, `tour:tpb`) are stored with player keys and POSTed by `followPushList()`. Legacy event keys upgrade on the client and again on `POST /api/push-subscribe`. `push-live-check` fires when a match on that tour flips to a real Den LIVE status. Player hits are not dropped to make room for the tour cap of 6.

## Non-goals

- No fake scores · no shop changes · no third-party push vendor · safe SW board no-cache rules unchanged.
