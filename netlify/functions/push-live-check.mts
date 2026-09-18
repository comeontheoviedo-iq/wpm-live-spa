/**
 * Scheduled Web Push: every 5 min, find LIVE matches matching stored follows.
 * One push per match id per subscription (de-dupe in Blobs, TTL ~6h).
 */
import type { Config } from "@netlify/functions";
import {
  pushStore,
  resolveVapid,
  configureWebPush,
  pruneNotified,
  isMatchLive,
  matchFollows,
  notifyPayload,
  fetchLiveMatches,
  NOTIFIED_TTL_MS,
} from "./push-lib.mjs";

const ORIGIN =
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://live.worldpickleballmagazine.com";

export default async () => {
  const started = Date.now();
  const vapid = await resolveVapid();
  const webpush = configureWebPush(vapid);
  const store = pushStore();

  const matches = await fetchLiveMatches(ORIGIN);
  const live = matches.filter(isMatchLive);
  const liveById = new Map(live.map((m) => [String(m.id), m]));

  let listed: { blobs: { key: string }[] } = { blobs: [] };
  try {
    listed = await store.list({ prefix: "sub/" });
  } catch (e) {
    console.error("[push-live-check] list failed", e);
    return new Response(
      JSON.stringify({ ok: false, error: "list failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const keys = (listed.blobs || []).map((b) => b.key).filter((k) => k.startsWith("sub/"));
  let scanned = 0;
  let sent = 0;
  let skipped = 0;
  let gone = 0;
  let errors = 0;

  for (const key of keys) {
    scanned++;
    let rec: any = null;
    try {
      rec = await store.get(key, { type: "json" });
    } catch (_) {
      continue;
    }
    if (!rec?.endpoint || !rec?.keys?.p256dh || !rec?.keys?.auth) continue;

    const follows = Array.isArray(rec.follows) ? rec.follows : [];
    if (!follows.length) {
      try {
        await store.delete(key);
      } catch (_) {}
      continue;
    }

    const now = Date.now();
    const notified = pruneNotified(rec.notified || {}, now);
    let dirty = Object.keys(notified).length !== Object.keys(rec.notified || {}).length;
    const subscription = {
      endpoint: rec.endpoint,
      keys: { p256dh: rec.keys.p256dh, auth: rec.keys.auth },
    };

    for (const m of live) {
      const who = matchFollows(m, follows);
      if (!who.length) continue;
      const mid = String(m.id);
      if (notified[mid]) {
        skipped++;
        continue;
      }

      const payload = notifyPayload(m, who);
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload),
          { TTL: 3600, urgency: "high" }
        );
        notified[mid] = now;
        dirty = true;
        sent++;
      } catch (e: any) {
        const status = e?.statusCode || e?.status;
        if (status === 404 || status === 410) {
          gone++;
          try {
            await store.delete(key);
          } catch (_) {}
          dirty = false;
          break;
        }
        errors++;
        console.warn("[push-live-check] send fail", mid, status, String(e?.message || e));
      }
    }

    // Also drop notified entries for matches no longer LIVE (allows re-alert later)
    for (const mid of Object.keys(notified)) {
      if (!liveById.has(mid)) {
        // keep until TTL — do not clear immediately so a flap doesn't re-spam
        // TTL prune already handled above
      }
    }

    if (dirty) {
      try {
        await store.setJSON(key, {
          ...rec,
          notified,
          updated: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("[push-live-check] save fail", key, e);
      }
    }
  }

  const summary = {
    ok: true,
    live: live.length,
    subs: keys.length,
    scanned,
    sent,
    skipped,
    gone,
    errors,
    vapidSource: vapid.source,
    notifiedTtlMs: NOTIFIED_TTL_MS,
    ms: Date.now() - started,
  };
  console.log("[push-live-check]", summary);
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
