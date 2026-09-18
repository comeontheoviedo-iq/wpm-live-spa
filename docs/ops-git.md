# Ops: git home + Netlify continuous deploy + nightly wave snap

## Git home (SPA)

| Item | Value |
|------|--------|
| **Repo** | https://github.com/comeontheoviedo-iq/wpm-live-spa |
| **Product** | World Pickleball Magazine live scores SPA |
| **Prod** | https://live.worldpickleballmagazine.com |
| **Netlify site** | `wpm-live` · id `6b6104d9-eea8-44bf-8c47-59018c3ff4c6` |

### Hard rule

- **`comeontheoviedo-iq/wpm-live`** = Pitchline / CoComms — **do not overwrite, force-push, or treat as this SPA**.
- All SPA commits / PRs go to **`wpm-live-spa`** only.

Working tree on the box: `/workspace/wpm-live` (directory name is historical; remote is `wpm-live-spa`).

## Netlify ↔ GitHub continuous deploy

### Current state (2026-09-18 BST)

| Piece | Status |
|-------|--------|
| Build settings repo | `comeontheoviedo-iq/wpm-live-spa` · branch **`main`** |
| Publish / functions | `site` · `netlify/functions` (from `netlify.toml`) |
| Deploy key | Installed on GitHub repo (read-only) + attached on Netlify |
| Build hook | `wpm-live-spa-main` → triggers git builds |
| GitHub `push` webhook | Points at that build hook (continuous deploy on push to `main`) |
| Netlify GitHub **App** `installation_id` | **Still null** — native UI OAuth link not completed |

**Practical continuous deploy: YES** (push → GitHub webhook → Netlify build hook → clone via deploy key → `netlify.toml` build).

**Native Netlify↔GitHub App link: NO** — needs a one-time UI OAuth by Chris (below). Without it: no App-managed repo picker / some PR preview niceties; day-to-day main deploys still flow via hook + deploy key.

### Blocker — optional GitHub App (UI)

If you want the full Netlify UI “Linked repository” / App installation:

1. Open https://app.netlify.com/projects/wpm-live/configuration/deploys#continuous-deployment  
2. **Link repository** → GitHub → authorize Netlify GitHub App on `comeontheoviedo-iq` → select **`wpm-live-spa`**.  
3. Confirm production branch **`main`**, publish **`site`**, functions **`netlify/functions`** (or leave to `netlify.toml`).  
4. Re-check `build_settings.installation_id` is non-null:  
   `netlify api getSite --data '{"site_id":"6b6104d9-eea8-44bf-8c47-59018c3ff4c6"}'`

Until then: **do not pretend the App is linked**; keep the deploy key + build hook + GitHub webhook in place.

### Manual / fallback deploy

```bash
cd /workspace/wpm-live
netlify deploy --prod --message "…"
```

Or POST the build hook (see Netlify site → Build hooks). Confirm `.netlify/state.json` site id matches before prod CLI deploys.

### `netlify.toml` (git builds)

- `command = "echo no-build"`
- `publish = "site"`
- `functions = "netlify/functions"`
- SPA `/*` → `/index.html` **after** `/api/*` function redirects (do not reorder)

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

## Event radar (desk)

See `docs/event-radar.md`. Weekday 08:30 London: `node scripts/event-radar.mjs` or `GET /api/radar`.
