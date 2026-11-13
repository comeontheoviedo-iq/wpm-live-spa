import type { Config, Context } from "@netlify/functions";
import { requestAuthorized } from "./_shared/desk-auth.mjs";
import { loadDeskFeed, saveDeskFeed } from "./_shared/desk-feed.mjs";
import { composeScores } from "./_shared/scores-compose.mjs";
import { collectFeedOverlays } from "./_shared/scores-feeds.mjs";
import { forget } from "./_shared/edge-cache.mjs";
import worldcup from "./worldcup.mts";
import ppa from "./ppa.mts";
import app from "./app.mts";
import sportssync from "./sportssync.mts";
import rta from "./rta.mts";
import ppaEu from "./ppa-eu.mts";
import mlpAsia from "./mlp-asia.mts";
import tpb from "./tpb.mts";

/**
 * GET used to return the desk blob unchanged. That blob is written only by
 * POST (or a one-time seed of site/scores.json). Nothing on a schedule
 * refreshes it, so `updated` stayed on the 4 Sep 2026 seed while the tour
 * feeds kept moving.
 *
 * GET applies the same overlay the public SPA already does in pull(), by
 * calling the worldcup, ppa, app, sportssync, rta, ppa-eu, mlp-asia and tpb
 * handlers in-process. ppa-eu, mlp-asia and tpb are extra tours. They do not
 * replace /api/ppa. A feed that throws or returns no rows leaves the
 * desk copy of that tour in place.
 * An HTTP request from this handler back to its own host fails inside the
 * Cloudflare Worker that serves the custom domain, which left `updated` on
 * the 4 Sep seed. The internal Request carries no query string, matching a
 * default public GET of each route.
 */

const FEEDS = [
  { key: "wc", path: "/api/worldcup", handler: worldcup },
  { key: "ppa", path: "/api/ppa", handler: ppa },
  { key: "app", path: "/api/app", handler: app },
  { key: "sportssync", path: "/api/sportssync", handler: sportssync },
  { key: "rta", path: "/api/rta", handler: rta },
  { key: "ppa-eu", path: "/api/ppa-eu", handler: ppaEu },
  { key: "mlp-asia", path: "/api/mlp-asia", handler: mlpAsia },
  { key: "tpb", path: "/api/tpb", handler: tpb },
];

// A feed slower than this keeps its desk rows for this response only.
// RTA GraphQL takes ~7 s cold; a hung TPB widget would take its full 12 s.
const FEED_BUDGET_MS = 9000;

export default async (req: Request, context?: any) => {
  if (req.method === "GET") {
    const base = await loadDeskFeed();
    const overlays = await collectFeedOverlays(FEEDS, {
      cache: true,
      budgetMs: FEED_BUDGET_MS,
      ctx: context && typeof context.waitUntil === "function" ? context : undefined,
    });
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
    await forget("/api/scores");
    return Response.json({ ok: true, updated: feed.updated, match: body.id || "all" });
  }

  return Response.json({ error: "method" }, { status: 405 });
};

export const config: Config = {
  path: "/api/scores",
};
