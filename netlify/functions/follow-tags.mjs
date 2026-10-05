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

const SKIP_LAST = new Set(["tbd", "tba", "bye", "winner", "loser", "vs", "court"]);

/**
 * Last-name token from each side. Skips initials ("D" in "D. Denardo") and placeholders.
 * Used so a followed player who is not on the seed list still tags a PPA card.
 */
export function lastNameTags(text) {
  const parts = String(text || "").split(/\s+vs\s+|\s*\/\s*/i);
  const tags = [];
  const seen = new Set();
  for (const part of parts) {
    const toks = nameTokens(part).filter((t) => t.length >= 2 && !SKIP_LAST.has(t.toLowerCase()));
    if (!toks.length) continue;
    const last = toks[toks.length - 1];
    const key = last.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(last);
  }
  return tags;
}

/**
 * Seed follow tags plus every player last name on the card.
 * Does not add a tour key — tour follows match `m.tour` (`tour:ppa`).
 */
export function tagsForSides(a, b, roster) {
  const blob = `${a || ""} ${b || ""} ${roster || ""}`;
  const tags = tagsFor(blob);
  const seen = new Set(tags.map((t) => t.toLowerCase()));
  for (const tag of lastNameTags(blob)) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

/** Tour-level follows. Not a single tournament (no ev:app:18448). */
export const TOUR_IDS = ["app", "ppa", "wc", "gpa", "npl", "asia", "ppa-eu", "app-asia", "mlp-asia", "tpb", "rta"];

export function isTourFollowKey(k) {
  const s = String(k || "");
  return s.startsWith("tour:") && TOUR_IDS.includes(s.slice(5));
}

export function isLegacyEventFollowKey(k) {
  const s = String(k || "");
  return s.startsWith("ev:") || s.startsWith("gpa:");
}

/**
 * Finished event names that used to be follow targets (Overland, Arizona, Gijón).
 * Not a person. Kept in sync with the client looksLikeStoredEvent.
 */
export function looksLikeStoredEvent(raw) {
  const s = String(raw || "").trim();
  if (!s || s.startsWith("tour:")) return false;
  if (s.startsWith("slate:") || s.startsWith("ev:") || s.startsWith("gpa:")) return true;
  if (/^(overland|arizona|gij[oó]n|gijon|columbus|las vegas|barcelona|mesa|chicago cup)$/i.test(s)) return true;
  if (/\b(overland park|gij[oó]n|arizona open|las vegas open|columbus open|barcelona open|chicago cup|veolia chicago)\b/i.test(s)) return true;
  if (/^(APP|PPA|TPB|GPA|MLP)\b/.test(s) && /\b(open|tour|asia)\b/i.test(s)) return true;
  if (/\brta2000\b/i.test(s)) return true;
  if (/\brta\b/i.test(s) && /farnham/i.test(s)) return true;
  return false;
}

/** Map an event-shaped key to a tour. Unknown event keys drop (empty string). */
export function tourFromEventBlob(raw) {
  let decoded = String(raw || "");
  try {
    decoded = decodeURIComponent(decoded);
  } catch (_) {}
  const blob = decoded.toLowerCase();
  if (/rta2000|farnham|^ev:rta\b|slate:rta/.test(blob)) return "tour:rta";
  if (/app-asia|chongqing|taipei|bangkok|ho chi minh|india open/.test(blob)) return "tour:app-asia";
  if (/\bmlp\b|mlp-asia/.test(blob)) return "tour:mlp-asia";
  if (/gij|tpb|top pickleball/.test(blob)) return "tour:tpb";
  if (/barcelona|ppa-eu|ppa europe/.test(blob)) return "tour:ppa-eu";
  if (/ppa asia|ppa-asia/.test(blob)) return "tour:asia";
  if (/\bapp\b/.test(blob) && /arizona/.test(blob) && !/\bppa\b/.test(blob)) return "tour:app";
  if (/arizona|mesa|62c01642|las vegas|86926aef|veolia chicago|chicago cup|203e1164|^ev:ppa\b|\bppa\b/.test(blob)) return "tour:ppa";
  if (/^ev:wc\b|world cup/.test(blob)) return "tour:wc";
  if (/overland|columbus|18448|18453|^ev:app\b|\bapp\b/.test(blob)) return "tour:app";
  if (/\bnpl\b/.test(blob)) return "tour:npl";
  if (/\bgpa\b|d-joy|djoy/.test(blob)) return "tour:gpa";
  return "";
}

/**
 * Player/team keys pass through. tour:app stays.
 * Legacy event keys and bare event names (Overland, Arizona, Gijón) upgrade to a tour or drop.
 * Kept in sync with the client normalizeFollowKey.
 */
export function normalizeFollowKey(raw) {
  const k = String(raw || "").trim();
  if (!k) return "";
  if (k.startsWith("tour:")) return isTourFollowKey(k) ? k : "";
  if (isLegacyEventFollowKey(k) || k.startsWith("slate:") || looksLikeStoredEvent(k)) {
    return tourFromEventBlob(k);
  }
  return k;
}

/** A followed tour hits every match on that tour's board. Not one tournament id. */
export function tourFollowMatches(m, key) {
  const nk = normalizeFollowKey(key);
  if (!isTourFollowKey(nk) || !m) return false;
  return String(m.tour || "") === nk.slice(5);
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
 * Which follow keys match a match: player tags / name tokens, or a followed tour.
 * Legacy ev:app:18448 upgrades to tour:app before the check.
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
  const seen = new Set();
  for (const raw of keys) {
    const k = normalizeFollowKey(raw);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    if (isTourFollowKey(k)) {
      if (tourFollowMatches(m, k)) hit.push(k);
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
