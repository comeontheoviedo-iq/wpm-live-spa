# Web Push — closed-tab follow alerts

**Slice:** 2026-09-18 · tag coverage · client `wpm-20260918e.js` · SW `sw.js?v=20260918e`  
**Product:** ping when a followed player/team goes LIVE even with **every tab closed**.

## Architecture

| Piece | Role |
|-------|------|
| **VAPID** | Application-server keypair. Public embedded in client (+ `GET /api/push-subscribe`). Private only in Netlify env (or Blobs fallback). |
| **Client** | After Notification permission + safe SW ready → `pushManager.subscribe` → `POST /api/push-subscribe` with `{ subscription, follows }`. Re-POST whenever `wpm-follows` changes. |
| **Blobs `wpm-push`** | `sub/<sha256(endpoint)[:32]>` → subscription + follows + per-match notified map. Optional `vapid` key if env missing. |
| **`push-live-check`** | Scheduled every 5 min (`*/5 * * * *`). Fetches `/api/ppa` + `/api/app` + `/api/worldcup`, finds LIVE rows, matches via `matchFollowKeys` (tags **or** name tokens in `a`/`b`/`games`), sends via `web-push`. |
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
  "follows": ["Waters", "Johns"]
}
```
- Empty `follows` → deletes the Blobs record (no spam to abandoned subs).
- Overwrites follows on each sync; preserves `notified` map (pruned to ~6h).

### Scheduled `push-live-check`
- Cron: `*/5 * * * *`
- LIVE = `status === "LIVE"` or any `lines[].live` — **never** invent LIVE from clock (same FotMob rule as client for PPA/APP).
- Match if any follow key is in `m.tags` **or** appears as a name token in `m.a` / `m.b` / `m.games` (`follow-tags.mjs` → `matchFollowKeys`).
- De-dupe: `notified[matchId] = timestamp`; skip if set; TTL ~6h.
- 404/410 from push service → delete subscription.

## How to verify

1. Hard refresh https://live.worldpickleballmagazine.com — JS `wpm-20260918e.js`, SW `20260918e`.
2. DevTools → Application → Service Workers: safe SW only; Cache Storage has no `/`, `/js/*`, `/api/*`, `*.json`.
3. Following → **Turn on live alerts** → Allow. Network: `POST /api/push-subscribe` 200; Application → Push Messaging / subscription present.
4. Confirm Blobs: Netlify UI → Blobs → `wpm-push` → `sub/…` with your follows.
5. Close **all** tabs (or Chrome → Application → Service Workers → “Update on reload” off, close tab). Wait for a followed LIVE, or invoke `/.netlify/functions/push-live-check` while a followed match is LIVE — expect one OS notification; click → `/match/<id>`.
6. Re-run check while still LIVE → `skipped` increments, no second push.

## Tag coverage (2026-09-18e)

- Shared `netlify/functions/follow-tags.mjs`: `SEED_FOLLOW_TAGS` (~40 high-signal last names) + `tagsFor(a,b)` used by **PPA** and **APP** match mapping.
- Token-equality only (not substring) so **Johns ≠ Johnson** and **Fu ≠ Fuller**.
- Also tags any last-name token that matches a seed key case-insensitively when it appears in `a`/`b`.
- Client `followsMatch` / `matchedFollowsFor` and push `matchFollows` both use the same tags-or-name-token rule — older sparse-tag rows still fire if the follow key is visible in the side names.
- WC left as team tags only (Vietnam / USA / India) — no invented country tags on APP/PPA doubles.

## Residual gaps

- Seed list is finite (~40). Dynamic profile follows still rely on name-token match in `a`/`b`/`games` when the server did not emit that tag.
- First push after subscribe can lag up to ~5 minutes (cron).
- iOS Safari needs Add to Home Screen / recent iOS for Web Push.
- Rotating VAPID requires new client subscribe (old PushSubscriptions invalidate).
- Client + server may both notify when a tab is open (different channels); SW `tag` = match id limits duplicate OS banners somewhat.

## Non-goals

- No fake scores · no shop changes · no third-party push vendor · safe SW board no-cache rules unchanged.
