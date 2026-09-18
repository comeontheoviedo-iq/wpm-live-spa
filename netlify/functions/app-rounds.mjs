/**
 * APP / Den Live round + discipline helpers.
 * Knockout labels from Den matchType + totalRounds — never invent scores.
 * Round Robin stays "Round N". Do not globally map Round 6 → Final
 * (Women's Pro Singles at Overland is 4 rounds; Men's Pro is 6).
 */

const KO_FROM_END = ["Final", "SF", "QF", "R16", "R32", "R64", "R128"];

export function isKnockoutBracket(bracketType) {
  return /eliminat/i.test(String(bracketType || ""));
}

/** MS / WS / MD / WD / XD from Den teamType or bracket name. Empty if unknown. */
export function discFromAppBracket(bracket) {
  const team = String(bracket?.teamType || "").toLowerCase();
  if (team.includes("mixed")) return "XD";
  if (team.includes("womendouble") || team.includes("womensdouble") || team.includes("seniorwomensdouble")) return "WD";
  if (team.includes("mendouble") || team.includes("mensdouble") || team.includes("seniormensdouble")) return "MD";
  if (team.includes("womenssingle") || team.includes("womansingle")) return "WS";
  if (team.includes("menssingle") || team.includes("mensingle")) return "MS";
  return discFromDivName(bracket?.bracketName || bracket?.division || "");
}

export function discFromDivName(raw) {
  const s = String(raw || "").toLowerCase();
  if (!s) return "";
  if (/mixed/.test(s) || /\bxd\b/.test(s)) return "XD";
  if (/women'?s?\s*doubles|\bwd\b/.test(s)) return "WD";
  if (/men'?s?\s*doubles|\bmd\b/.test(s)) return "MD";
  if (/women'?s?\s*singles|\bws\b/.test(s)) return "WS";
  if (/men'?s?\s*singles|\bms\b/.test(s)) return "MS";
  if (/women/.test(s) && /double/.test(s)) return "WD";
  if (/men/.test(s) && /double/.test(s)) return "MD";
  if (/women/.test(s) && /single/.test(s)) return "WS";
  if (/men/.test(s) && /single/.test(s)) return "MS";
  return "";
}

/**
 * Map a Den match onto a wall label.
 * Prefer matchType FINAL / THIRD_PLACE (ground truth). Then distance from
 * bracket.totalRounds on elimination draws only.
 */
export function polishAppRound({
  round,
  roundDisplayName,
  matchType,
  totalRounds,
  bracketType,
  hasThirdPlaceMatch,
} = {}) {
  const mt = String(matchType || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  if (mt === "FINAL") return "Final";
  if (mt === "THIRD_PLACE" || mt === "THIRDPLACE" || mt === "BRONZE") return "Bronze";

  const raw = String(roundDisplayName || (round != null && round !== "" ? "Round " + round : "")).trim();
  if (!isKnockoutBracket(bracketType)) return raw;

  const n = Number(round);
  const total = Number(totalRounds);
  if (!Number.isFinite(n) || n < 1 || !Number.isFinite(total) || total < 1) return raw;

  const fromEnd = total - n;
  if (fromEnd < 0) return raw;
  if (fromEnd === 0) {
    // Last round of a bronze bracket without matchType: do not guess Final vs Bronze.
    if (hasThirdPlaceMatch || /bronze/i.test(String(bracketType || ""))) return raw || "Final";
    return "Final";
  }
  return KO_FROM_END[fromEnd] || raw;
}
