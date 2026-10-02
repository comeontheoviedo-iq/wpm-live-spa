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
const APP_ELIM_LATE = ["R16", "QF", "SF", "F", "Final", "Bronze"];
const APP_ELIM_EARLY = ["R128", "R64", "R32"];
const APP_ELIM_ORDER = ["R128", "R64", "R32", "R16", "QF", "SF", "Bronze", "F", "Final"];

function drawSideOk(name) {
  const s = String(name || "").trim();
  if (!s) return false;
  return !/^(tbd|tba|winner|loser|bye|-|—|–)$/i.test(s);
}

/** Drop bare "Round" / empty buckets. Never invent a label. */
export function appRoundUsable(raw) {
  const s = String(raw || "").trim();
  if (!s || /^round$/i.test(s) || s === "undefined" || s === "null") return "";
  return s;
}

/** Pool vs elimination for a wall slot. Format from Den wins; Round N is a pool label. */
export function appSlotPhase(m) {
  const fmt = String(m?.format || "");
  if (fmt === "pool") return "pool";
  if (fmt === "ko" || fmt === "elim") return "elim";
  const round = appRoundUsable(m?.round);
  if (/^round\s+\d+$/i.test(round)) return "pool";
  return "elim";
}

function elimRank(label) {
  const i = APP_ELIM_ORDER.indexOf(label);
  if (i >= 0) return i;
  const n = String(label).match(/^Round\s+(\d+)$/i);
  if (n) return 100 + Number(n[1]);
  return 400;
}

/**
 * Column labels that have at least one sided slot.
 * Pool rounds stay even when elimination rounds exist.
 * Ghost NEXT (TBD/BYE) and bare "Round" dumps are omitted.
 * Early R128/R64/R32 hide once QF–Final exist, unless those early rounds are still NEXT or LIVE.
 */
export function appWallBands(slots) {
  const pool = [];
  const elim = [];
  const seenP = new Set();
  const seenE = new Set();
  const elimSlots = [];
  for (const m of slots || []) {
    if (!drawSideOk(m?.a) || !drawSideOk(m?.b)) continue;
    const round = appRoundUsable(m?.round);
    if (!round) continue;
    const phase = appSlotPhase({ ...m, round });
    if (phase === "pool") {
      if (!seenP.has(round)) {
        seenP.add(round);
        pool.push(round);
      }
    } else {
      elimSlots.push({ ...m, round });
      if (!seenE.has(round)) {
        seenE.add(round);
        elim.push(round);
      }
    }
  }
  pool.sort((a, b) => {
    const na = Number((String(a).match(/\d+/) || ["999"])[0]);
    const nb = Number((String(b).match(/\d+/) || ["999"])[0]);
    return na - nb || String(a).localeCompare(String(b));
  });
  elim.sort((a, b) => elimRank(a) - elimRank(b) || String(a).localeCompare(String(b)));
  const late = elim.filter((l) => APP_ELIM_LATE.includes(l));
  const early = elim.filter((l) => APP_ELIM_EARLY.includes(l));
  const other = elim.filter((l) => !APP_ELIM_LATE.includes(l) && !APP_ELIM_EARLY.includes(l));
  let elimShow = elim;
  if (late.length) {
    const hot = early.some((r) =>
      elimSlots.some((m) => m.round === r && (m.status === "LIVE" || m.status === "NEXT"))
    );
    elimShow = (hot ? early : []).concat(late).concat(other);
    elimShow.sort((a, b) => elimRank(a) - elimRank(b) || String(a).localeCompare(String(b)));
  }
  return { pool, elim: elimShow };
}

/** Reader phrase for a pool bracket's published playoff. Empty when Den has none. */
export function playoffBlurb(playoffType) {
  const s = String(playoffType || "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!s) return "";
  if (/top\s*four/i.test(s)) return "then top 4";
  if (/seeded/i.test(s)) return "then seeded playoff";
  if (/eliminat/i.test(s)) return "then playoff";
  return "";
}

/** pool | elim from Den bracket type. Pending is still a real phase — not a filled bracket. */
export function bracketPhase(bracket) {
  const structure = String(bracket?.bracketStructureType || "");
  const type = String(bracket?.bracketType || "");
  if (/ELIMINATION/i.test(structure) || isKnockoutBracket(type)) return "elim";
  return "pool";
}

/** pending | in-progress | complete. Never LIVE — a pending bracket is not a live match. */
export function bracketReaderStatus(status) {
  const s = String(status ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  if (["RUNNING", "IN_PROGRESS", "INPROGRESS", "STARTED", "PLAYING"].includes(s)) return "in-progress";
  if (["COMPLETED", "COMPLETE", "FINISHED", "CLOSED"].includes(s)) return "complete";
  return "pending";
}

export function appStructureLine(row) {
  if (!row) return "";
  if (row.phase === "elim") return "Elimination";
  const bits = ["Pools"];
  if (row.poolNumber && row.poolCount) bits.push(`Pool ${row.poolNumber} of ${row.poolCount}`);
  else if (row.poolNumber) bits.push(`Pool ${row.poolNumber}`);
  if (row.rounds) bits.push(`${row.rounds} rounds`);
  if (row.playoff) bits.push(row.playoff);
  return bits.join(" · ");
}

/**
 * One published Den bracket for the draw index.
 * No players, no scores. Pending stays pending.
 */
export function bracketIndexEntry(bracket) {
  const name = String(bracket?.bracketName || "").trim();
  if (!name) return null;
  const phase = bracketPhase(bracket);
  const poolNumber = Number(bracket?.poolNumber);
  const poolCount = Number(bracket?.poolCount);
  const rounds = Number(bracket?.totalRounds);
  const row = {
    id: String(bracket?.bracketId || ""),
    name,
    phase,
    playoff: phase === "pool" ? playoffBlurb(bracket?.playoffType) : "",
    poolNumber: Number.isFinite(poolNumber) && poolNumber > 0 ? poolNumber : null,
    poolCount: Number.isFinite(poolCount) && poolCount > 1 ? poolCount : null,
    rounds: Number.isFinite(rounds) && rounds > 0 ? rounds : null,
    tier: /\bAmateur\b/i.test(name) ? "amateur" : /\bPro\b/i.test(name) ? "pro" : "amateur",
    status: bracketReaderStatus(bracket?.status),
    startDate: String(bracket?.startDate || ""),
  };
  row.line = appStructureLine(row);
  return row;
}

/** /draw?tour=app&div=&phase=pool|elim&pool= */
export function appDrawQuery({ div = "", phase = "", pool = "" } = {}) {
  const p = new URLSearchParams();
  p.set("tour", "app");
  if (div) p.set("div", div);
  if (phase === "pool" || phase === "elim") p.set("phase", phase);
  if (pool) p.set("pool", String(pool));
  return "/draw?" + p.toString();
}

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
