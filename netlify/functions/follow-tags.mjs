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

/**
 * Which follow keys match a match: tags hit OR follow key appears as a name token
 * in a/b/games (multi-word keys: substring on the haystack).
 * Shared by push-live-check and kept in sync with client followsMatch.
 */
export function matchFollowKeys(m, follows) {
  const keys = (follows || []).map(String).filter(Boolean);
  if (!keys.length || !m) return [];
  const tagSet = new Set((m.tags || []).map(String));
  const hay = `${m.a || ""} ${m.b || ""} ${m.games || ""}`;
  const hayTokens = new Set(nameTokens(hay).map((t) => t.toLowerCase()));
  const hayLower = hay.toLowerCase();
  const hit = [];
  for (const k of keys) {
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
