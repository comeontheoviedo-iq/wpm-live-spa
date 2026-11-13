/**
 * In-process tour overlays for GET /api/scores.
 *
 * A Cloudflare Worker cannot fetch its own custom domain. Calling
 * /api/ppa, /api/app, /api/worldcup, /api/rta, /api/sportssync,
 * /api/ppa-eu, /api/mlp-asia or /api/tpb over
 * HTTP from this host therefore fails and the desk seed is left in
 * place. Invoke the feed handlers directly instead.
 *
 * `path` is only the URL on the Request passed into the handler, with
 * no query string, so optional pins stay on the same defaults as a
 * public GET. Nothing here performs a network request.
 */

import { cachedResponse } from "./edge-cache.mjs";

const INTERNAL_ORIGIN = "https://scores.internal";

/**
 * Options (used by GET /api/scores on the Worker):
 *   cache: reuse the same short cache as the public feed routes (edge-cache.mjs).
 *   budgetMs: stop waiting for one feed after this long. That tour then keeps
 *     its desk rows, as for any failed feed. The fetch keeps running in the
 *     background (ctx.waitUntil) and fills the cache for the next request.
 *   ctx: Worker execution context.
 */
export async function collectFeedOverlays(feeds, opts = {}) {
  const overlays = {};
  await Promise.all(
    feeds.map(async (feed) => {
      overlays[feed.key] = await invokeFeed(feed.handler, feed.path, opts);
    })
  );
  return overlays;
}

function withBudget(promise, ms, ctx) {
  if (!ms) return promise;
  if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(promise.catch(() => null));
  let timer;
  const stop = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  return Promise.race([promise, stop]).finally(() => clearTimeout(timer));
}

export async function invokeFeed(handler, path, opts = {}) {
  try {
    const run = () =>
      handler(
        new Request(INTERNAL_ORIGIN + path, {
          method: "GET",
          headers: { accept: "application/json" },
        })
      );
    const pending = opts.cache ? cachedResponse(path, run, { ctx: opts.ctx }) : Promise.resolve().then(run);
    const res = await withBudget(pending, opts.budgetMs || 0, opts.ctx);
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.matches)) return null;
    return data;
  } catch {
    return null;
  }
}
