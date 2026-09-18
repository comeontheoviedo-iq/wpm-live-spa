# Follow notifications — milestone 6

**Slice:** 2026-09-17 · page alerts · **Web Push:** 2026-09-18 · client `wpm-20260918e.js` · SW `sw.js?v=20260918e` — see `docs/web-push.md`  
**Product:** ping when a followed player/team goes LIVE (“follow fires when that player walks on”).

## What shipped

### Safe service worker
- Replaces the old naive cache SW.
- On activate: delete **all** caches, `skipWaiting`, `clients.claim`.
- **Never** caches `/`, `/index.html`, `/js/*`, `/api/*`, `*.json`, navigations, or extensionless SPA routes — always `fetch(..., { cache: "no-store" })`.
- Optional network-first only for `/icon.svg`, `/manifest.json`, `/css/*`.
- `notificationclick` focuses an open client or opens `/match/<id>` (from `data.url`), else `/`.

### Registration / migration
- `index.html` no longer blanket-unregisters every SW.
- Registers `/sw.js?v=20260918b` only.
- One-time migration: unregister any registration whose `scriptURL` does not include `20260918b` (kills stale-board poison SWs).
- Client also calls `ensureSafeSW()` on follow and when enabling alerts.

### Client alerts (`maybeNotify`)
- Runs on each poll/`render` for newly LIVE followed matches.
- Body includes tour/comp (+ div) and `Following · <tags>`.
- Options: `tag` = match id, `data: { url }`, `renotify: false`.
- Prefer `registration.showNotification` (click-through via SW); fall back to `new Notification(...)`.
- Notified ids persisted in `sessionStorage` (`wpm-notified-live`) so refresh does not spam; cleared when the match leaves LIVE.
- Following page CTA: **Turn on live alerts** when permission is `default`; guidance when `denied` / `granted`.

## How to verify
1. Hard refresh https://live.worldpickleballmagazine.com (confirm JS `wpm-20260918b.js`, SW `20260918b`).
2. DevTools → Application → Service Workers: only the safe SW; Cache Storage empty or only `wpm-static-20260918b` with icon/manifest/css — **no** HTML/JS/API entries.
3. Follow **Waters** (or any seed). Allow notifications when prompted (or Following → **Turn on live alerts**).
4. Wait until a followed match goes LIVE on the board, **or** simulate: in console, temporarily mark a followed match LIVE and call `render()` / wait for the 12s poll — expect one notification, no spam on refresh while still LIVE, and re-alert only after it leaves LIVE then returns.
5. Click the notification → should focus/open `/match/<id>`.

## Residual gaps
- **Web Push shipped 2026-09-18** — see `docs/web-push.md`. Closed-tab alerts require Notification permission + successful `POST /api/push-subscribe` (follows synced to Blobs `wpm-push`). Cron every 5 min.
- Page `maybeNotify` still used when a tab is open (12s poll).
- OS / browser may still suppress notifications when permission is denied or Do Not Disturb is on.
- Tag coverage expanded 2026-09-18e (`follow-tags.mjs` + name-token match) — see `docs/web-push.md`.

## Non-goals (unchanged)
- No fake scores · no shop · no WC/PPA ingest changes · no third-party push vendor.
