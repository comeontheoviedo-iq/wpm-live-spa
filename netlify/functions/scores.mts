import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const SEED_URL = "https://wpm-live.netlify.app/scores.json";

function store() {
  return getStore({ name: "wpm-desk", consistency: "strong" });
}

async function loadFeed() {
  const s = store();
  const existing = await s.get("feed", { type: "json" });
  if (existing && existing.matches) return existing;
  try {
    const res = await fetch(SEED_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      await s.setJSON("feed", data);
      return data;
    }
  } catch (_) {}
  return { updated: new Date().toISOString(), heroByDate: {}, matches: [] };
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const feed = await loadFeed();
    return Response.json(feed, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (req.method === "POST") {
    const key = (typeof Netlify !== "undefined" && Netlify.env?.get("DESK_KEY")) || process.env.DESK_KEY || process.env.DESK_PASSWORD || "";
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    if (!key || body.key !== key) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const feed = await loadFeed();
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
    await store().setJSON("feed", feed);
    return Response.json({ ok: true, updated: feed.updated, match: body.id || "all" });
  }

  return Response.json({ error: "method" }, { status: 405 });
};

export const config: Config = {
  path: "/api/scores",
};
