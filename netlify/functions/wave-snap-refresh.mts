/**
 * Nightly PickleWave snap → Netlify Blobs (store wpm-wave, key snap).
 * Cron: 06:00 UTC. Rankings reads Blobs first, then bundled wave-snap.json.
 */
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { buildWaveSnap } from "./wave-snap-build.mjs";

export default async () => {
  const started = Date.now();
  const { ok, snap, error } = await buildWaveSnap({
    enrichScores: true,
    log: (m) => console.log("[wave-snap-refresh]", m),
  });

  if (!ok || !snap) {
    console.error("[wave-snap-refresh] abort:", error);
    return new Response(JSON.stringify({ ok: false, error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore("wpm-wave");
  await store.setJSON("snap", snap);

  const summary = {
    ok: true,
    updated: snap.updated,
    singles: snap.singles?.length ?? 0,
    mensDoubles: snap.mensDoubles?.length ?? 0,
    players: Object.keys(snap.players || {}).length,
    ms: Date.now() - started,
    store: "wpm-wave",
    key: "snap",
  };
  console.log("[wave-snap-refresh] wrote blob", summary);
  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config: Config = {
  schedule: "0 6 * * *",
};
