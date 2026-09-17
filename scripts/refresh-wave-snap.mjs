#!/usr/bin/env node
/**
 * Build-time / manual refresh of netlify/functions/wave-snap.json from live PickleWave HTML.
 * Prod also refreshes nightly into Netlify Blobs (see wave-snap-refresh.mts).
 *
 * Usage: node scripts/refresh-wave-snap.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildWaveSnap, WAVE_SEED } from "../netlify/functions/wave-snap-build.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../netlify/functions/wave-snap.json");

async function main() {
  const { ok, snap, error } = await buildWaveSnap({
    enrichScores: true,
    log: (m) => console.log(m),
  });
  if (!ok || !snap) {
    console.error(error || "buildWaveSnap failed");
    process.exit(1);
  }

  writeFileSync(outPath, JSON.stringify(snap));
  console.log("Wrote", outPath);
  console.log(
    "Seed recent counts:",
    Object.entries(WAVE_SEED)
      .map(([k, id]) => `${k}:${(snap.players[id]?.recent || []).length}`)
      .join(" ")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
