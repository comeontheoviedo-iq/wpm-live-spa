/**
 * Shared PickleWave snap builder for deploy script + nightly scheduled function.
 * Never invents scores — only public HTML scrape via wave-parse.
 */
import {
  fetchWave,
  parseWaveBoard,
  collectWaveTargets,
  fetchWavePlayer,
  mapPool,
  WAVE_SEED,
} from "./wave-parse.mjs";

/**
 * @param {{ topN?: number, enrichScores?: boolean, concurrency?: number, log?: (msg: string) => void }} [opts]
 * @returns {Promise<{ snap: object, ok: boolean, error?: string }>}
 */
export async function buildWaveSnap(opts = {}) {
  const topN = opts.topN ?? 10;
  const enrichScores = opts.enrichScores !== false;
  const concurrency = opts.concurrency ?? 3;
  const log = opts.log || (() => {});

  log("Fetching rankings boards…");
  const [sRes, mdRes] = await Promise.all([
    fetchWave("/rankings/all-singles"),
    fetchWave("/rankings/mens-doubles"),
  ]);
  const singles = sRes.ok ? parseWaveBoard(sRes.html) : [];
  const mensDoubles = mdRes.ok ? parseWaveBoard(mdRes.html) : [];
  if (!singles.length) {
    return {
      ok: false,
      error: "Failed to scrape singles board — aborting (will not overwrite with empty).",
      snap: null,
    };
  }
  log(`singles=${singles.length} mensDoubles=${mensDoubles.length}`);

  const targets = collectWaveTargets(singles, { topN });
  log(`Players to scrape: ${targets.length}`);

  const players = {};
  const rows = await mapPool(targets, concurrency, async (t) => {
    log(`  player ${t.id} ${t.name}`);
    const live = await fetchWavePlayer(t.id, t.name, { enrichScores });
    return {
      id: t.id,
      name: live.name || t.name,
      elo: t.elo ?? null,
      dupr: t.dupr || "",
      rank: t.rank ?? null,
      seed: t.seed || null,
      recent: live.recent || [],
      watch: live.watch || [],
      notes: live.notes || [],
      scrapedAt: live.scrapedAt,
    };
  });
  for (const p of rows) {
    if (p) players[p.id] = p;
  }

  const snap = {
    updated: new Date().toISOString(),
    seed: WAVE_SEED,
    singles,
    mensDoubles,
    players,
    notes: [
      "Pro ELO boards from /rankings/all-singles and /rankings/mens-doubles",
      "Player recent from /players/{id}-{slug}/ppa match cards (W/L + set score from match ld+json when present)",
      "Anonymous /recent-matches-table turbo-frame is empty — game-by-game lines not public",
      "Bright id 128780 from public boards",
      enrichScores ? "Set scores enriched at snap build" : "Set scores not enriched this run",
    ],
  };

  return { ok: true, snap };
}

export { WAVE_SEED };
