/**
 * PPA board window. LIVE/FT always stay. Date TBA (9999-12-31) is not a day.
 * Never invent a calendar date for those rows.
 */

export function isPpaTbaDate(date) {
  const d = String(date || "").trim();
  return d === "9999-12-31" || d.startsWith("9999-");
}

/**
 * Ticker `plannedStart` is venue wall time with a Z suffix.
 * "2:00 PM CDT" is stored as 2026-10-07T14:00:00Z, not 19:00Z.
 * The date prefix is the event-local day. Do not pass it through UTC.
 */
export function ppaLocalDayPrefix(iso) {
  const day = String(iso || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || isPpaTbaDate(day)) return "";
  return day;
}

function addIsoDay(iso, n) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Minutes east of UTC for an IANA zone. New York in October is -240. Chicago is -300. */
export function tzOffsetMinutes(tz, instant = new Date()) {
  const d = instant instanceof Date ? instant : new Date(instant);
  if (!tz || Number.isNaN(d.getTime())) return 0;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return Math.round((asUtc - d.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function wallClockParts(ms, tz) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === "24" ? "00" : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/**
 * Ticker plannedStart is venue wall time with a Z suffix.
 * "8:00 AM EDT" is stored as 2026-10-12T08:00:00Z, which is 12:00 UTC, not 08:00 UTC.
 * "2:00 PM CDT" was stored as 2026-10-07T14:00:00Z, which is 19:00 UTC.
 * Returns a real UTC instant for sorting, countdowns, and the 48h keep window.
 * Day bucketing stays on ppaLocalDayPrefix — an evening wall clock can be the next UTC date.
 * Empty when the feed has no start, or when the zone conversion does not round-trip.
 */
export function ppaWallInstant(plannedStart, tz) {
  const s = String(plannedStart || "").trim();
  if (isPpaTbaDate(s.slice(0, 10))) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (!m || !tz) return "";
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  let offset = tzOffsetMinutes(tz, new Date(guess));
  let utc = guess - offset * 60000;
  const offset2 = tzOffsetMinutes(tz, new Date(utc));
  if (offset2 !== offset) utc = guess - offset2 * 60000;
  const wall = wallClockParts(utc, tz);
  if (
    wall.year !== m[1] ||
    wall.month !== m[2] ||
    wall.day !== m[3] ||
    wall.hour !== m[4] ||
    wall.minute !== m[5] ||
    wall.second !== String(m[6] || "00").padStart(2, "0")
  ) {
    return "";
  }
  return new Date(utc).toISOString();
}

/**
 * Board day for one row.
 * A ticker plannedStart wins: its date prefix is the venue day.
 * Otherwise the scores dateKey. On finished rows that key is often the UTC
 * filing date — rebasePpaLocalDates pulls the late-evening spill back.
 */
export function ppaBoardDate(m, now = new Date()) {
  const fromStart = ppaLocalDayPrefix(m?.plannedStart);
  if (fromStart) return fromStart;
  const dk = String(m?.dateKey || "").trim();
  if (dk && !isPpaTbaDate(dk)) return dk;
  if (isPpaTbaDate(dk)) return "9999-12-31";
  return now.toISOString().slice(0, 10);
}

/**
 * Scores dateKey on a finished row is the UTC calendar date the result was filed.
 * A US evening session crosses 00:00 UTC, so late local finishes land on the next dateKey
 * while earlier finishes of the same round keep the venue day.
 * The earliest real dateKey in that round is the event-local day.
 * Finished and LIVE rows filed on the next UTC date move back one day.
 * Scheduled rows stay — their dateKey is the planned local day and matches plannedStart.
 * Scores are not copied or changed. Zones at or east of UTC are left alone.
 */
export function rebasePpaLocalDates(matches, tz, now = new Date()) {
  const rows = Array.isArray(matches) ? matches : [];
  if (tzOffsetMinutes(tz, now) >= 0) return rows;
  const byRound = new Map();
  for (const m of rows) {
    if (!m || (m.status !== "FT" && m.status !== "LIVE")) continue;
    const round = String(m.round || "").trim();
    const day = ppaLocalDayPrefix(m.date);
    if (!round || !day) continue;
    const set = byRound.get(round) || new Set();
    set.add(day);
    byRound.set(round, set);
  }
  const pull = new Map();
  for (const [round, dates] of byRound) {
    const sorted = [...dates].sort();
    if (sorted.length < 2) continue;
    const earliest = sorted[0];
    const next = addIsoDay(earliest, 1);
    if (next && dates.has(next)) pull.set(round, { from: next, to: earliest });
  }
  if (!pull.size) return rows;
  return rows.map((m) => {
    if (!m || (m.status !== "FT" && m.status !== "LIVE")) return m;
    const rule = pull.get(String(m.round || "").trim());
    if (!rule || m.date !== rule.from) return m;
    return { ...m, date: rule.to };
  });
}

/**
 * Scores dateKey wins when it is a real day. Date TBA must not hide a ticker start.
 */
export function mergePpaDateKey(prev, incoming) {
  const fromPrev = String(prev?.dateKey || "").trim();
  const fromStart = String(incoming?.plannedStart || prev?.plannedStart || "").slice(0, 10);
  if (fromPrev && !isPpaTbaDate(fromPrev)) return fromPrev;
  if (fromStart && !isPpaTbaDate(fromStart)) return fromStart;
  if (isPpaTbaDate(fromPrev)) return "9999-12-31";
  return fromStart || fromPrev || "";
}

/** Main draw plus qualifier rows. Same id keeps the row that has a real day. */
export function ppaScoreRows(scores) {
  const main = Array.isArray(scores?.matches) ? scores.matches : [];
  const qual = Array.isArray(scores?.qualifier?.matches) ? scores.qualifier.matches : [];
  const byId = new Map();
  for (const m of [...main, ...qual]) {
    if (!m || m.id == null || m.id === "") continue;
    const prev = byId.get(m.id);
    if (!prev) {
      byId.set(m.id, m);
      continue;
    }
    const prevTba = isPpaTbaDate(prev.dateKey);
    const nextTba = isPpaTbaDate(m.dateKey);
    if (prevTba && !nextTba) byId.set(m.id, m);
  }
  return [...byId.values()];
}

function namedScoreTeams(prev) {
  const teams = Array.isArray(prev?.teams) ? prev.teams : [];
  const named = teams.some((t) =>
    (t?.players || []).some((p) => String(typeof p === "string" ? p : p?.name || "").trim())
  );
  return named ? teams : null;
}

/**
 * Ticker rows belong to the ticker tournament.
 * When the title does not match the pin, leave the scores draw alone —
 * never stamp those rows with the pinned event.
 * Smoke of a different event still ignores ticker ids missing from that draw.
 * Scores player names win over ticker abbreviations when both exist.
 */
export function applyPpaTickerRows(byId, tickerMatches, { aligned = false, smoke = false } = {}) {
  const out = byId && typeof byId === "object" ? byId : {};
  if (!aligned) return out;
  for (const m of tickerMatches || []) {
    if (!m || m.id == null || m.id === "") continue;
    if (smoke && !out[m.id]) continue;
    const prev = out[m.id] || {};
    const teams = namedScoreTeams(prev) || m.teams;
    out[m.id] = {
      ...prev,
      ...m,
      teams,
      dateKey: mergePpaDateKey(prev, m),
      tickerLive: ppaTickerLive(m.status),
    };
  }
  return out;
}

/**
 * PPA status words that may paint LIVE. upnext / scheduled stay NEXT.
 * Never clock-promote.
 */
/** Ticker live flag only. upnext / scheduled / a bare scores "live" are not this. */
export function ppaTickerLive(raw) {
  return String(raw || "").toLowerCase() === "live";
}

export function ppaStatus(raw) {
  const t = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (t === "live" || t === "running" || t === "inprogress" || t === "started" || t === "playing") return "LIVE";
  if (t === "final" || t === "completed" || t === "complete" || t === "finished" || t === "closed") return "FT";
  return "NEXT";
}

/**
 * Board status. LIVE only when the ticker row's status is the live flag.
 * A scores payload that says live without that flag stays NEXT — never a fake LIVE.
 */
export function ppaPublicStatus(rawStatus, tickerLive) {
  if (tickerLive === true) return "LIVE";
  if (ppaTickerLive(rawStatus)) return "NEXT";
  return ppaStatus(rawStatus);
}

/** Official ticker clock ("8:00 AM CDT"). Empty when the feed has no clock string. */
export function ppaClockLabel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/\d/.test(s) && /\b(AM|PM)\b/i.test(s)) return s;
  return "";
}

/** Court label only when the feed sent one. Bare numbers become "Court N". */
export function ppaCourtLabel(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^court\b/i.test(s)) return s;
  if (/^\d+$/.test(s)) return "Court " + s;
  return s;
}

/** Game line. Null slots stay a dash — never coerced to 0–0. */
export function ppaGameLineScore(a, b) {
  const empty = (v) => v == null || v === "";
  if (empty(a) || empty(b)) return "–";
  return `${Number(a)}–${Number(b)}`;
}

/**
 * Match score from games won. Blank when nothing was played.
 * A live 0–0 with no points stays blank — never a fake 0–0.
 * Games-won 0-0 is only used once a live line has a real point.
 */
export function ppaListedScore(winsA, winsB, lines) {
  const w0 = Number(winsA) || 0;
  const w1 = Number(winsB) || 0;
  if (w0 || w1) return `${w0}-${w1}`;
  const pointsPlayed = (lines || []).some((l) => {
    if (!l || !l.live) return false;
    const pts = String(l.score || "").split(/[–-]/);
    if (pts.length < 2) return false;
    return (Number(pts[0]) || 0) > 0 || (Number(pts[1]) || 0) > 0;
  });
  return pointsPlayed ? "0-0" : "";
}

/** Walkover / withdrawal / retirement. Names the winner when the feed has one. */
export function ppaResultNote({ outcome, winnerName, time, liveLine } = {}) {
  if (liveLine) {
    const sc = liveLine.score && liveLine.score !== "–" ? " " + liveLine.score : "";
    return `In play ${liveLine.disc || "G1"}${sc}`;
  }
  const o = String(outcome || "").toLowerCase();
  let label = "";
  if (o === "walkover") label = "Walkover";
  else if (o === "withdrawal" || o === "withdrawn") label = "Withdrawal";
  else if (o === "retirement" || o === "retired") label = "Retirement";
  if (label) {
    const who = String(winnerName || "").trim();
    return who ? `${label} · ${who}` : label;
  }
  return time || "";
}

export function keepPpaMatch(m, now = new Date()) {
  if (m.status === "LIVE" || m.status === "FT") return true;
  // Official "Date TBA" placeholder. Not today's board and not a fake day chip.
  if (isPpaTbaDate(m.date)) return false;
  const start = m.start ? new Date(m.start) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const ageMs = now.getTime() - start.getTime();
    return ageMs <= 48 * 3600000;
  }
  const y = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  return !m.date || m.date >= y;
}
