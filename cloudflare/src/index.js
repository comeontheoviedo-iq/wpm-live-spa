import app_default from "../api/app.mts";
import archive_default from "../api/archive.mts";
import ppa_default from "../api/ppa.mts";
import worldcup_default from "../api/worldcup.mts";
import scores_default from "../api/scores.mts";
import calendar_default from "../api/calendar.mts";
import rankings_default from "../api/rankings.mts";
import magazine_default from "../api/magazine.mts";
import history_default from "../api/history.mts";
import radar_default from "../api/radar.mts";
import rta_default from "../api/rta.mts";
import ppa_eu_default from "../api/ppa-eu.mts";
import mlp_asia_default from "../api/mlp-asia.mts";
import tpb_default from "../api/tpb.mts";
import push_subscribe_default from "../api/push-subscribe.mts";
import sportssync_default from "../api/sportssync.mts";
import dossier_default from "../api/dossier.mts";
import push_live_check_default from "../api/push-live-check.mts";
import wave_snap_refresh_default from "../api/wave-snap-refresh.mts";
import desk_default from "../api/desk.mts";
import finished_default from "../api/finished.mts";
import { LILLE, MLP_ASIA, loadMlpAsia, loadPpaEu } from "../api/pb-ticker.mjs";
import { officialUrlCron } from "../api/calendar.mts";
import { cachedResponse, cacheKeyFor } from "../api/_shared/edge-cache.mjs";
// Public score feeds served through the short edge cache (see edge-cache.mjs).
var CACHED_GET = new Set([
  "/api/scores",
  "/api/worldcup",
  "/api/ppa",
  "/api/app",
  "/api/sportssync",
  "/api/rta",
  "/api/ppa-eu",
  "/api/mlp-asia",
  "/api/tpb"
]);
var ROUTES = {
  "/api/app": app_default,
  "/api/archive": archive_default,
  "/api/ppa": ppa_default,
  "/api/worldcup": worldcup_default,
  "/api/scores": scores_default,
  "/api/calendar": calendar_default,
  "/api/rankings": rankings_default,
  "/api/magazine": magazine_default,
  "/api/history": history_default,
  "/api/radar": radar_default,
  "/api/rta": rta_default,
  "/api/ppa-eu": ppa_eu_default,
  "/api/mlp-asia": mlp_asia_default,
  "/api/tpb": tpb_default,
  "/api/push-subscribe": push_subscribe_default,
  "/api/sportssync": sportssync_default,
  "/api/dossier": dossier_default,
  "/api/finished": finished_default
};
// Keep finished ticker matches even when nobody has LIVE open: every 15 minutes while
// the pinned PPA Europe event or the MLP Asia season is on (a day either side).
function inWindow(pin, now) {
  const day = now.toISOString().slice(0, 10);
  const lo = new Date(Date.parse(pin.start) - 864e5).toISOString().slice(0, 10);
  const hi = new Date(Date.parse(pin.end) + 864e5).toISOString().slice(0, 10);
  return day >= lo && day <= hi;
}
async function persistTickers(now = new Date()) {
  if (now.getUTCMinutes() % 15 >= 5) return "";
  const out = [];
  for (const [pin, load] of [[LILLE, loadPpaEu], [MLP_ASIA, loadMlpAsia]]) {
    if (!inWindow(pin, now)) continue;
    try {
      const body = await load({ now });
      out.push(`${pin.tour}:${(body.matches || []).length}`);
    } catch (err) {
      out.push(`${pin.tour}:failed`);
    }
  }
  return out.join(",");
}
var CRON_HANDLERS = {
  "*/5 * * * *": async () => {
    const res = await push_live_check_default();
    const persisted = await persistTickers();
    if (persisted) console.log("[wpm-spa] finished-store", persisted);
    return res;
  },
  "0 6 * * *": async () => {
    // Daily: wave snapshot + official-URL verification (auto-hides 404/410/date-mismatch events).
    let waveText = "";
    try {
      const w = await wave_snap_refresh_default();
      waveText = await w.text();
    } catch (err) {
      waveText = "wave failed: " + String(err && err.message ? err.message : err);
    }
    const o = await officialUrlCron();
    const officialText = await o.text();
    return new Response(JSON.stringify({ wave: waveText.slice(0, 300), official: JSON.parse(officialText) }), { status: 200 });
  }
};
function corsJson(data, status = 200, extra = {}) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      ...extra
    }
  });
}
function bindEnv(env) {
  globalThis.__WPM_KV__ = env.WPM_STORE;
  globalThis.__WPM_ENV__ = {
    APP_DEN_TOURNAMENT_ID: env.APP_DEN_TOURNAMENT_ID || "",
    DEN_TOURNAMENT_ID: env.DEN_TOURNAMENT_ID || "",
    DESK_KEY: env.DESK_KEY || "",
    DESK_PASSWORD: env.DESK_PASSWORD || "",
    VAPID_PUBLIC_KEY: env.VAPID_PUBLIC_KEY || "",
    VAPID_PRIVATE_KEY: env.VAPID_PRIVATE_KEY || "",
    VAPID_SUBJECT: env.VAPID_SUBJECT || "",
    URL: env.URL || "https://wpm-live-spa-static.comeontheoviedo.workers.dev",
    DEPLOY_PRIME_URL: env.DEPLOY_PRIME_URL || "https://wpm-live-spa-static.comeontheoviedo.workers.dev"
  };
  try {
    globalThis.process = globalThis.process || { env: {} };
    globalThis.process.env = { ...globalThis.process.env, ...globalThis.__WPM_ENV__ };
  } catch {
  }
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    if (path === "/api" || path.startsWith("/api/")) {
      bindEnv(env);
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "Content-Type"
          }
        });
      }
      const handler = ROUTES[path] || (path.startsWith("/api/dossier/") ? dossier_default : void 0);
      if (handler) {
        try {
          const res = request.method === "GET" && CACHED_GET.has(path)
            ? await cachedResponse(cacheKeyFor(request.url), () => handler(request, ctx), { ctx })
            : await handler(request, ctx);
          const headers = new Headers(res.headers);
          if (!headers.has("access-control-allow-origin")) {
            headers.set("access-control-allow-origin", "*");
          }
          return new Response(res.body, { status: res.status, headers });
        } catch (err) {
          console.error("[wpm-spa]", path, err);
          return corsJson(
            {
              error: "handler_failed",
              path,
              message: String(err && err.message ? err.message : err),
              platform: "cloudflare-workers"
            },
            500
          );
        }
      }
      return corsJson(
        {
          error: "not_found",
          status: 404,
          path,
          ported: Object.keys(ROUTES)
        },
        404
      );
    }
    if (path === "/desk" || path === "/desk/feed") {
      bindEnv(env);
      try {
        const res = await desk_default(request, ctx);
        const headers = new Headers(res.headers);
        headers.set("cache-control", "no-store");
        headers.set("x-robots-tag", "noindex, nofollow");
        return new Response(res.body, { status: res.status, headers });
      } catch (err) {
        console.error("[wpm-spa] desk", err);
        return new Response("Desk error", { status: 500, headers: { "cache-control": "no-store" } });
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    bindEnv(env);
    const cron = event.cron || "";
    const handler = CRON_HANDLERS[cron];
    if (!handler) {
      console.warn("[wpm-spa] unknown cron", cron);
      return;
    }
    try {
      const res = await handler();
      const text = await res.text();
      console.log("[wpm-spa] cron", cron, res.status, text.slice(0, 500));
    } catch (err) {
      console.error("[wpm-spa] cron failed", cron, err);
      throw err;
    }
  }
};
