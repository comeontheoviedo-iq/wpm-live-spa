/**
 * Shared Web Push helpers for WPM LIVE.
 * Store: Netlify Blobs `wpm-push`
 *   sub/<sha256(endpoint)> → { endpoint, keys, follows, notified, updated }
 *   vapid → { publicKey, privateKey, subject }  (fallback if env missing)
 */
import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import webpush from "web-push";
import { matchFollowKeys } from "./follow-tags.mjs";

export const PUSH_STORE = "wpm-push";
export const NOTIFIED_TTL_MS = 6 * 60 * 60 * 1000; // ~6h
export const VAPID_BLOB_KEY = "vapid";

export function pushStore() {
  return getStore({ name: PUSH_STORE, consistency: "strong" });
}

export function endpointHash(endpoint) {
  return createHash("sha256").update(String(endpoint || "")).digest("hex").slice(0, 32);
}

export function subKey(endpoint) {
  return `sub/${endpointHash(endpoint)}`;
}

function envGet(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env?.get) {
      const v = Netlify.env.get(name);
      if (v) return v;
    }
  } catch (_) {}
  return process.env[name] || "";
}

/** Resolve VAPID keys: Netlify env first, else Blobs (generate once). */
export async function resolveVapid() {
  let publicKey = envGet("VAPID_PUBLIC_KEY");
  let privateKey = envGet("VAPID_PRIVATE_KEY");
  let subject = envGet("VAPID_SUBJECT") || "mailto:comeontheoviedo@gmail.com";
  let source = "env";

  if (publicKey && privateKey) {
    return { publicKey, privateKey, subject, source };
  }

  const store = pushStore();
  let blob = null;
  try {
    blob = await store.get(VAPID_BLOB_KEY, { type: "json" });
  } catch (_) {}

  if (blob?.publicKey && blob?.privateKey) {
    return {
      publicKey: blob.publicKey,
      privateKey: blob.privateKey,
      subject: blob.subject || subject,
      source: "blobs",
    };
  }

  // First-run fallback: generate and persist (document clearly — prefer env)
  const generated = webpush.generateVAPIDKeys();
  const record = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject,
    generatedAt: new Date().toISOString(),
  };
  await store.setJSON(VAPID_BLOB_KEY, record);
  console.warn(
    "[push] VAPID env missing — generated keypair stored in Blobs wpm-push/vapid. Prefer VAPID_* env vars."
  );
  return { ...record, source: "blobs-generated" };
}

export function configureWebPush(vapid) {
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  return webpush;
}

export function pruneNotified(notified, now = Date.now()) {
  const out = {};
  if (!notified || typeof notified !== "object") return out;
  for (const [id, ts] of Object.entries(notified)) {
    const t = typeof ts === "number" ? ts : Date.parse(String(ts));
    if (Number.isFinite(t) && now - t < NOTIFIED_TTL_MS) out[id] = t;
  }
  return out;
}

export function isMatchLive(m) {
  if (!m) return false;
  if (m.status === "LIVE") return true;
  if ((m.lines || []).some((l) => l && l.live)) return true;
  return false;
}

export function matchFollows(m, follows) {
  // Tags + name/games token match (same helper as richer board tagging)
  return matchFollowKeys(m, follows);
}

export function notifyPayload(m, who) {
  const tour =
    m.comp ||
    (m.tour === "ppa"
      ? "PPA"
      : m.tour === "app"
        ? "APP"
        : m.tour === "wc"
          ? "World Cup"
          : String(m.tour || ""));
  const div = m.div || m.round || "";
  const meta = [tour, div].filter(Boolean).join(" · ");
  const line = meta ? `${m.a} vs ${m.b} · ${meta}` : `${m.a} vs ${m.b} is live`;
  const body = `${line}\nFollowing · ${who.join(", ") || "follow"}`;
  return {
    title: "WPM LIVE",
    body,
    tag: String(m.id),
    data: { url: "/match/" + m.id },
  };
}

/** Fetch live boards from same-origin APIs (absolute URL required in scheduled fn). */
export async function fetchLiveMatches(origin) {
  const base = String(origin || "").replace(/\/$/, "");
  const paths = ["/api/ppa", "/api/app", "/api/worldcup"];
  const all = [];
  await Promise.all(
    paths.map(async (p) => {
      try {
        const res = await fetch(base + p, {
          headers: { Accept: "application/json", "User-Agent": "WPM-LIVE-push/1.0" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const matches = Array.isArray(data?.matches) ? data.matches : [];
        for (const m of matches) {
          if (m && m.id) all.push(m);
        }
      } catch (e) {
        console.warn("[push] fetch failed", p, String(e?.message || e));
      }
    })
  );
  return all;
}

export { webpush };
