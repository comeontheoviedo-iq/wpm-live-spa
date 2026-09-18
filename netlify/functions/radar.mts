import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildRadarReport } from "./radar-lib.mjs";

const STORE = "wpm-radar";
const KEY = "report";
const TTL_MS = 30 * 60 * 1000; // 30 min desk cache

export default async (req: Request) => {
  const force = new URL(req.url).searchParams.get("refresh") === "1";
  let store: ReturnType<typeof getStore> | null = null;
  try {
    store = getStore({ name: STORE, consistency: "strong" });
  } catch {
    store = null;
  }

  if (store && !force) {
    try {
      const hit = (await store.get(KEY, { type: "json" })) as { at?: number; report?: object } | null;
      if (hit?.report && typeof hit.at === "number" && Date.now() - hit.at < TTL_MS) {
        return Response.json(
          { ...hit.report, cache: { hit: true, ageSec: Math.round((Date.now() - hit.at) / 1000) } },
          { headers: { "Cache-Control": "public, max-age=60" } }
        );
      }
    } catch {
      /* cache miss */
    }
  }

  const report = await buildRadarReport({
    prodBase: process.env.URL || process.env.DEPLOY_PRIME_URL || "https://live.worldpickleballmagazine.com",
  });

  if (store) {
    try {
      await store.setJSON(KEY, { at: Date.now(), report });
    } catch {
      /* non-fatal */
    }
  }

  return Response.json(
    { ...report, cache: { hit: false } },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
};

export const config: Config = { path: "/api/radar" };
