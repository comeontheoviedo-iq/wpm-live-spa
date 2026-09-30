/**
 * Followable player tags for PPA/APP match mapping + push matching.
 * Token-equality only (not substring) so Johns≠Johnson and Fu≠Fuller.
 * Keep SEED_FOLLOW_TAGS maintainable (~20–40 high-signal last names).
 */
export const SEED_FOLLOW_TAGS = [
  // Core desk follows
  "Waters",
  "Johns",
  "Bright",
  // PPA World / Pro ELO high-signal
  "Fahey",
  "Parenteau",
  "Alshon",
  "Tardio",
  "Staksrud",
  "Johnson", // JW Johnson (+ other Johnsons — last-name follow key)
  "Patriquin",
  "Todd",
  "Christian",
  "Sock",
  "Haworth",
  "McGuffin",
  "Newman",
  "Black",
  "Sewing",
  "Oncins",
  "Daescu",
  "Klinger",
  "Garnett",
  "Frazier",
  "Bellamy",
  "Truong",
  "Vich",
  "Goins",
  "Sleeth",
  "Rohrabacher",
  "Pisnik",
  "Schneemann",
  "Buckner",
  "Wei",
  "Yang",
  "Bar",
  "Diamond",
  "Acevedo",
  "Humberg",
  "Castillo",
  // APP seed leftovers
  "Jardim",
  "Devilliers",
  "Fu",
];

function nameTokens(s) {
  return String(s || "")
    .split(/[^A-Za-z0-9']+/)
    .filter((t) => t.length > 0);
}

/** Tag sides a/b when a last-name token matches a seed follow key (case-insensitive). */
export function tagsFor(a, b) {
  const tokSet = new Set(nameTokens(`${a || ""} ${b || ""}`).map((t) => t.toLowerCase()));
  const tags = [];
  const seen = new Set();
  for (const tag of SEED_FOLLOW_TAGS) {
    if (!tokSet.has(tag.toLowerCase())) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

export function isEventFollowKey(k) {
  return String(k || "").startsWith("ev:");
}

/**
 * Event follow hits this match.
 * Exact eventKey, shared Den id (18448), or a calendar key that names the event.
 * Calendar dates contain years — 2020–2035 are not tournament ids.
 * Kept in sync with client eventFollowHit.
 */
export function eventFollowMatches(m, key) {
  const k = String(key || "");
  if (!isEventFollowKey(k) || !m) return false;
  const ek = String(m.eventKey || "");
  if (ek && ek === k) return true;
  let decoded = k;
  try {
    decoded = decodeURIComponent(k);
  } catch (_) {}
  const kl = decoded.toLowerCase();
  const hay = `${m.comp || ""} ${m.venue || ""} ${ek}`.toLowerCase();
  const ids = (kl.match(/\d{4,6}/g) || []).filter((id) => {
    const n = Number(id);
    return !(n >= 2020 && n <= 2035);
  });
  const ekIds = ek.match(/\d{4,6}/g) || [];
  if (ids.some((id) => ekIds.includes(id))) return true;
  if (kl.includes("columbus") && hay.includes("columbus")) return true;
  if (kl.includes("overland") && hay.includes("overland")) return true;
  if (
    (kl.includes("las vegas") || kl.includes("86926aef")) &&
    (hay.includes("las vegas") || hay.includes("86926aef") || ek === "ev:ppa" || ek.startsWith("ev:ppa:"))
  ) {
    return true;
  }
  if (kl.includes("gij") && hay.includes("gij")) return true;
  if (k === "ev:wc" && m.tour === "wc") return true;
  if (k === "ev:ppa" && m.tour === "ppa") return true;
  if (k === "ev:app" && m.tour === "app") return true;
  return false;
}

/** Full player names for tag/push matching when the card shows last names only. */
export function rosterText(teams) {
  const parts = [];
  for (const team of teams || []) {
    const ps = (team && team.players) || [];
    const names = ps
      .map((p) => (typeof p === "string" ? p : p?.name || p?.playerName || p?.displayName || ""))
      .filter(Boolean);
    if (names.length) parts.push(names.join(" / "));
  }
  return parts.join(" vs ");
}

/**
 * Which follow keys match a match: tags hit, name token in a/b/games/roster,
 * or an event follow (ev:app:18448 / Columbus calendar key).
 * Shared by push-live-check and kept in sync with client matchedFollowsFor.
 */
export function matchFollowKeys(m, follows) {
  const keys = (follows || []).map(String).filter(Boolean);
  if (!keys.length || !m) return [];
  const tagSet = new Set((m.tags || []).map(String));
  const hay = `${m.a || ""} ${m.b || ""} ${m.games || ""} ${m.roster || ""}`;
  const hayTokens = new Set(nameTokens(hay).map((t) => t.toLowerCase()));
  const hayLower = hay.toLowerCase();
  const hit = [];
  for (const k of keys) {
    if (isEventFollowKey(k)) {
      if (eventFollowMatches(m, k)) hit.push(k);
      continue;
    }
    if (tagSet.has(k)) {
      hit.push(k);
      continue;
    }
    const kl = k.toLowerCase();
    if (!kl) continue;
    if (hayTokens.has(kl)) {
      hit.push(k);
      continue;
    }
    if (kl.includes(" ") && hayLower.includes(kl)) {
      hit.push(k);
      continue;
    }
  }
  return hit;
}
