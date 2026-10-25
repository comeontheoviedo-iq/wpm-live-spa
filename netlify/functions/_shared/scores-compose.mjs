/**
 * Build the public /api/scores document from the manual desk feed plus the
 * live tour feeds. Overlay order matches the SPA pull():
 * world cup, PPA, and RTA replace that tour when the feed has rows;
 * APP always replaces (an empty board is real);
 * SportsSync keeps FT rows only when a tournament is armed, otherwise clears app-asia.
 * A feed that fails to load leaves that tour's desk rows in place.
 *
 * Top-level keys stay updated, heroByDate, matches.
 */

function asFeed(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.matches)) return null;
  return data;
}

function applyOverlay(matches, data, tour, mode) {
  const feed = asFeed(data);
  if (!feed) return { matches, applied: false };
  let incoming = feed.matches;
  if (mode === "if-any" && incoming.length === 0) return { matches, applied: false };
  if (mode === "ft-only") {
    incoming = feed.armed ? incoming.filter((m) => m && m.status === "FT") : [];
  }
  const ids = new Set(incoming.map((m) => m && m.id).filter(Boolean));
  const next = matches.filter((m) => m && m.tour !== tour && !ids.has(m.id)).concat(incoming);
  return { matches: next, applied: true, updated: typeof feed.updated === "string" ? feed.updated : "" };
}

export function composeScores(base, overlays, now = new Date()) {
  const seed = base && typeof base === "object" ? base : {};
  let matches = Array.isArray(seed.matches) ? seed.matches.slice() : [];
  const heroByDate = {
    ...(seed.heroByDate && typeof seed.heroByDate === "object" && !Array.isArray(seed.heroByDate)
      ? seed.heroByDate
      : {}),
  };
  let updated = typeof seed.updated === "string" ? seed.updated : "";
  const sources = overlays && typeof overlays === "object" ? overlays : {};

  const steps = [
    ["wc", "wc", "if-any"],
    ["ppa", "ppa", "if-any"],
    ["app", "app", "always"],
    ["sportssync", "app-asia", "ft-only"],
    ["rta", "rta", "if-any"],
  ];

  let freshest = "";
  let appliedAny = false;
  for (const [key, tour, mode] of steps) {
    const result = applyOverlay(matches, sources[key], tour, mode);
    matches = result.matches;
    if (!result.applied) continue;
    appliedAny = true;
    if (result.updated && result.updated > freshest) freshest = result.updated;
  }

  if (appliedAny) updated = freshest || now.toISOString();

  if (appliedAny) {
    const liveN = matches.filter((m) => m && m.status === "LIVE").length;
    const appQuiet = !!(sources.app && sources.app.preServe) && liveN === 0;
    const today = (freshest || now.toISOString()).slice(0, 10);
    heroByDate[today] = liveN
      ? `${liveN} live now across the board.`
      : appQuiet
        ? "Play starts soon."
        : "Nothing live right now.";
  }

  return {
    updated: updated || now.toISOString(),
    heroByDate,
    matches,
  };
}
