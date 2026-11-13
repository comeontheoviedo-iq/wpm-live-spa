/**
 * Short-lived cache for the public score feeds and /api/scores.
 *
 * Why: /api/scores and the board wait on every tour feed. Two upstreams are
 * slow (RTA GraphQL ~7 s, the TPB widget can hang to its 12 s timeout), so
 * every request paid that cost. Feeds are now cached per path:
 *   - under FRESH_MS old: served as is.
 *   - under STALE_MS old: served at once, refreshed in the background.
 *   - older, or nothing cached: fetched now (one fetch per key at a time).
 * Each body keeps its own `updated` time. Nothing here changes scores.
 * A "delayed" body with no rows does not overwrite rows fetched within
 * STALE_MS, so a single upstream timeout does not blank a live board.
 * Storage: per-isolate memory, plus the Workers Cache API when present.
 */

export const FRESH_MS = 15 * 1000;
export const STALE_MS = 5 * 60 * 1000;
const CACHE_ORIGIN = "https://live.worldpickleballmagazine.com/__wpm_edge_cache/v1";

const memory = new Map();
const inflight = new Map();

function cacheApi() {
  try {
    return typeof caches !== "undefined" && caches && caches.default ? caches.default : null;
  } catch {
    return null;
  }
}

export function cacheKeyFor(url) {
  const u = new URL(url);
  const params = [...u.searchParams.entries()].filter(([k]) => k !== "t").sort();
  const qs = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return u.pathname.replace(/\/$/, "") + (qs ? `?${qs}` : "");
}

async function readStored(key) {
  const hit = memory.get(key);
  if (hit) return hit;
  const cache = cacheApi();
  if (!cache) return null;
  try {
    const res = await cache.match(CACHE_ORIGIN + key);
    if (!res) return null;
    const at = Number(res.headers.get("x-wpm-cached-at") || 0);
    if (!at) return null;
    const entry = {
      at,
      status: res.status,
      contentType: res.headers.get("content-type") || "application/json",
      cacheControl: res.headers.get("x-wpm-cache-control") || "no-store",
      body: await res.text(),
      rows: Number(res.headers.get("x-wpm-rows") || 0),
    };
    memory.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

async function writeStored(key, entry) {
  memory.set(key, entry);
  const cache = cacheApi();
  if (!cache) return;
  try {
    await cache.put(
      CACHE_ORIGIN + key,
      new Response(entry.body, {
        status: 200,
        headers: {
          "content-type": entry.contentType,
          "cache-control": `public, max-age=${Math.ceil(STALE_MS / 1000)}`,
          "x-wpm-cached-at": String(entry.at),
          "x-wpm-cache-control": entry.cacheControl,
          "x-wpm-rows": String(entry.rows),
        },
      })
    );
  } catch {
    /* cache is best effort */
  }
}

export async function forget(key) {
  memory.delete(key);
  const cache = cacheApi();
  if (!cache) return;
  try {
    await cache.delete(CACHE_ORIGIN + key);
  } catch {
    /* best effort */
  }
}

function inspect(text) {
  try {
    const data = JSON.parse(text);
    const rows = data && Array.isArray(data.matches) ? data.matches.length : 0;
    return { rows, delayedEmpty: !!(data && data.delayed) && rows === 0 };
  } catch {
    return { rows: 0, delayedEmpty: false };
  }
}

async function refresh(key, produce, now) {
  if (inflight.has(key)) return inflight.get(key);
  const job = (async () => {
    const res = await produce();
    if (!res || res.status !== 200) {
      const fail = res
        ? {
            status: res.status,
            body: await res.text().catch(() => ""),
            contentType: res.headers.get("content-type") || "application/json",
          }
        : null;
      return { entry: null, fail };
    }
    const body = await res.text();
    const { rows, delayedEmpty } = inspect(body);
    const entry = {
      at: now(),
      status: 200,
      contentType: res.headers.get("content-type") || "application/json",
      cacheControl: res.headers.get("cache-control") || "no-store",
      body,
      rows,
    };
    const prev = await readStored(key);
    if (delayedEmpty && prev && prev.rows > 0 && entry.at - prev.at < STALE_MS) {
      // Keep the last rows until they age out. Do not refresh their timestamp.
      return { entry: prev, fail: null };
    }
    await writeStored(key, entry);
    return { entry, fail: null };
  })().finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}

function toResponse(entry, state, now) {
  return new Response(entry.body, {
    status: entry.status,
    headers: {
      "content-type": entry.contentType,
      "cache-control": entry.cacheControl,
      "x-wpm-cache": state,
      "x-wpm-cache-age": String(Math.max(0, Math.round((now() - entry.at) / 1000))),
    },
  });
}

/**
 * Serve `key` from cache, or call `produce()` (returns a Response).
 * `ctx.waitUntil` keeps background refreshes alive on Workers.
 */
export async function cachedResponse(key, produce, { ctx, now = Date.now } = {}) {
  const entry = await readStored(key);
  const age = entry ? now() - entry.at : Infinity;
  if (entry && age < FRESH_MS) return toResponse(entry, "HIT", now);
  if (entry && age < STALE_MS) {
    const bg = refresh(key, produce, now).catch(() => null);
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(bg);
    return toResponse(entry, "STALE", now);
  }
  const { entry: fresh, fail } = await refresh(key, produce, now);
  if (fresh) return toResponse(fresh, "MISS", now);
  if (!fail) return null;
  return new Response(fail.body, {
    status: fail.status,
    headers: { "content-type": fail.contentType, "cache-control": "no-store", "x-wpm-cache": "BYPASS" },
  });
}

export function _resetEdgeCache() {
  memory.clear();
  inflight.clear();
}
