/**
 * In-process tour overlays for GET /api/scores.
 *
 * A Cloudflare Worker cannot fetch its own custom domain. Calling
 * /api/ppa, /api/app, /api/worldcup, /api/rta or /api/sportssync over
 * HTTP from this host therefore fails and the desk seed is left in
 * place. Invoke the feed handlers directly instead.
 *
 * `path` is only the URL on the Request passed into the handler, with
 * no query string, so optional pins stay on the same defaults as a
 * public GET. Nothing here performs a network request.
 */

const INTERNAL_ORIGIN = "https://scores.internal";

export async function collectFeedOverlays(feeds) {
  const overlays = {};
  await Promise.all(
    feeds.map(async (feed) => {
      overlays[feed.key] = await invokeFeed(feed.handler, feed.path);
    })
  );
  return overlays;
}

export async function invokeFeed(handler, path) {
  try {
    const res = await handler(
      new Request(INTERNAL_ORIGIN + path, {
        method: "GET",
        headers: { accept: "application/json" },
      })
    );
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.matches)) return null;
    return data;
  } catch {
    return null;
  }
}
