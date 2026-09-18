/**
 * POST /api/push-subscribe — body { subscription, follows: string[] }
 * GET  /api/push-subscribe — { publicKey, source } for client subscribe
 * Stores PushSubscription + follow tags in Blobs wpm-push by endpoint hash.
 */
import type { Config, Context } from "@netlify/functions";
import {
  pushStore,
  subKey,
  resolveVapid,
  pruneNotified,
} from "./push-lib.mjs";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: cors });
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method === "GET") {
    const vapid = await resolveVapid();
    return json({
      publicKey: vapid.publicKey,
      source: vapid.source,
      subject: vapid.subject,
    });
  }

  if (req.method !== "POST") {
    return json({ error: "method" }, 405);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const sub = body?.subscription;
  const endpoint = sub?.endpoint;
  const keys = sub?.keys;
  if (!endpoint || typeof endpoint !== "string" || !keys?.p256dh || !keys?.auth) {
    return json({ error: "need subscription with endpoint + keys" }, 400);
  }

  const followsRaw = Array.isArray(body.follows) ? body.follows : [];
  const follows = [
    ...new Set(
      followsRaw
        .map((t: unknown) => String(t || "").trim())
        .filter(Boolean)
        .slice(0, 80)
    ),
  ];

  const store = pushStore();
  const key = subKey(endpoint);
  let prev: any = null;
  try {
    prev = await store.get(key, { type: "json" });
  } catch (_) {}

  const notified = pruneNotified(prev?.notified || {});
  const record = {
    endpoint,
    keys: {
      p256dh: String(keys.p256dh),
      auth: String(keys.auth),
    },
    expirationTime: sub.expirationTime ?? null,
    follows,
    notified,
    updated: new Date().toISOString(),
  };

  // Empty follows → drop subscription (user unfollowed everyone / revoked)
  if (!follows.length) {
    try {
      await store.delete(key);
    } catch (_) {}
    return json({ ok: true, stored: false, deleted: true, key });
  }

  await store.setJSON(key, record);
  return json({
    ok: true,
    stored: true,
    key,
    follows: follows.length,
  });
};

export const config: Config = { path: "/api/push-subscribe" };
