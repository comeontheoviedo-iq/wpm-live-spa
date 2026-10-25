import type { Config, Context } from "@netlify/functions";
import { requestAuthorized } from "./_shared/desk-auth.mjs";
import { loadDeskFeed, saveDeskFeed } from "./_shared/desk-feed.mjs";
import { composeScores } from "./_shared/scores-compose.mjs";

/**
 * GET used to return the desk blob unchanged. That blob is written only by
 * POST (or a one-time seed of site/scores.json). Nothing on a schedule
 * refreshes it, so `updated` stayed on the 4 Sep 2026 seed while /api/ppa,
 * /api/app, /api/worldcup, /api/rta and /api/sportssync kept moving.
 * GET now applies the same overlay the public SPA already does in pull().
 */

const FEEDS = [
  ["wc", "/api/worldcup"],
  ["ppa", "/api/ppa"],
  ["app", "/api/app"],
  ["sportssync", "/api/sportssync"],
  ["rta", "/api/rta"],
];

function siteOrigin(req: Request) {
  const fallback = (
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://live.worldpickleballmagazine.com"
  ).replace(/\/$/, "");
  try {
    const u = new URL(req.url);
    const host = u.hostname;
    const usable =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".netlify.app") ||
      host === "live.worldpickleballmagazine.com" ||
      host.endsWith(".worldpickleballmagazine.com");
    if ((u.protocol === "http:" || u.protocol === "https:") && usable) return u.origin;
  } catch (_) {}
  return fallback;
}

async function fetchFeed(origin: string, path: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(origin + path, {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "WPM-LIVE-scores/1.0" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.matches)) return null;
    return data;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const base = await loadDeskFeed();
    const origin = siteOrigin(req);
    const pairs = await Promise.all(FEEDS.map(async ([key, path]) => [key, await fetchFeed(origin, path)] as const));
    const overlays: Record<string, any> = {};
    for (const [key, data] of pairs) overlays[key] = data;
    const feed = composeScores(base, overlays);
    return Response.json(feed, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (req.method === "POST") {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    if (!(await requestAuthorized(req, body.key))) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const feed = await loadDeskFeed();
    if (body.heroByDate) feed.heroByDate = { ...feed.heroByDate, ...body.heroByDate };
    if (Array.isArray(body.matches) && body.replaceAll) {
      feed.matches = body.matches;
    } else if (body.id) {
      const i = (feed.matches || []).findIndex((m: any) => m.id === body.id);
      if (i < 0) return Response.json({ error: "match not found" }, { status: 404 });
      const keep = feed.matches[i];
      feed.matches[i] = {
        ...keep,
        status: body.status ?? keep.status,
        score: body.score ?? keep.score,
        games: body.games ?? keep.games,
        note: body.note ?? keep.note,
        a: body.a ?? keep.a,
        b: body.b ?? keep.b,
      };
    } else {
      return Response.json({ error: "need id or replaceAll" }, { status: 400 });
    }
    feed.updated = new Date().toISOString();
    await saveDeskFeed(feed);
    return Response.json({ ok: true, updated: feed.updated, match: body.id || "all" });
  }

  return Response.json({ error: "method" }, { status: 405 });
};

export const config: Config = {
  path: "/api/scores",
};
