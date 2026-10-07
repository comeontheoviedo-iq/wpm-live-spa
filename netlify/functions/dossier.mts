import type { Config } from "@netlify/functions";

/**
 * Same-origin proxy for the Fantasy research dossier.
 * Read-only. Never merged into LIVE scores or WPR.
 * Ids change when Fantasy rebuilds; callers cache by search_name, not id.
 */
const UPSTREAM = "https://pickleball-fantasy-league.comeontheoviedo.workers.dev";

export default async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  const id = last !== "dossier" ? last : "";
  const upstream = id
    ? `${UPSTREAM}/api/dossier/${encodeURIComponent(id)}${url.search}`
    : `${UPSTREAM}/api/dossier${url.search}`;
  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json", "User-Agent": "WPM-LIVE/1.0" },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
};

export const config: Config = { path: ["/api/dossier", "/api/dossier/*"] };
