# Ops: git home + nightly wave snap

## Git home (SPA)

| Item | Value |
|------|--------|
| **Repo** | https://github.com/comeontheoviedo-iq/wpm-live-spa |
| **Product** | World Pickleball Magazine live scores SPA |
| **Prod** | https://live.worldpickleballmagazine.com |
| **Netlify site id** | `6b6104d9-eea8-44bf-8c47-59018c3ff4c6` |

### Hard rule

- **`comeontheoviedo-iq/wpm-live`** = Pitchline / CoComms — **do not overwrite, force-push, or treat as this SPA**.
- All SPA commits / PRs go to **`wpm-live-spa`** only.

Working tree on the box: `/workspace/wpm-live` (directory name is historical; remote is `wpm-live-spa`).

## Nightly PickleWave snap (prod, no static redeploy)

1. **Scheduled function** `netlify/functions/wave-snap-refresh.mts`
   - Cron: `0 6 * * *` (06:00 UTC)
   - Builds snap via shared `wave-snap-build.mjs` (same scrape as `scripts/refresh-wave-snap.mjs`)
   - Writes to Netlify Blobs: store **`wpm-wave`**, key **`snap`**
2. **`rankings.mts`** loads Blobs snap first (`waveMeta.snapSource: "blobs"`), else bundled `wave-snap.json` (`"bundled"`).
3. Manual / pre-deploy: `node scripts/refresh-wave-snap.mjs` still updates the bundled file for cold fallback.

### Fallback if Blobs/schedule unavailable

Keep running `node scripts/refresh-wave-snap.mjs` and redeploy functions, or confirm a weekday Grok Bot routine:

> Run `node scripts/refresh-wave-snap.mjs` in `/workspace/wpm-live`, then `netlify deploy --prod` with message noting wave snap refresh.

## Deploy reminder

```bash
cd /workspace/wpm-live
netlify deploy --prod --message "…"
```

Confirm site id in `.netlify/state.json` matches `6b6104d9-eea8-44bf-8c47-59018c3ff4c6` before prod deploys.
