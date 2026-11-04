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
 * A real scores dateKey is the venue day (America/Chicago for Worlds),
 * whether the row is final or still scheduled. A ticker plannedStart must
 * not move it. plannedStart supplies the day only when dateKey is missing
 * or Date TBA, which is how ticker-only rows get a day.
 */
export function ppaBoardDate(m, now = new Date()) {
  const dk = String(m?.dateKey || "").trim();
  if (dk && !isPpaTbaDate(dk)) return dk;
  const fromStart = ppaLocalDayPrefix(m?.plannedStart);
  if (fromStart) return fromStart;
  if (isPpaTbaDate(dk)) return "9999-12-31";
  return now.toISOString().slice(0, 10);
}

/**
 * dateKey is the event-local day. Worlds dateLabel matches it
 * ("Tue, Nov 3" is 2026-11-03). Do not pull a later day back onto an
 * earlier round label: "Round 64" is shared across divisions and across
 * real session days (Men's Doubles Round 64 is both Nov 3 and Nov 4).
 * Scores are not copied or changed.
 */
export function rebasePpaLocalDates(matches, tz, now = new Date()) {
  void tz;
  void now;
  return Array.isArray(matches) ? matches : [];
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

/**
 * The scores API can answer two requests with different slices (one had
 * only Men's Singles finals, another only Women's Doubles). Union by id.
 * ppaScoreRows then keeps the finished row when a shell duplicates it.
 */
export function mergePpaScorePayloads(payloads, eventId = "") {
  const matches = [];
  const qualifier = [];
  let tournamentId = "";
  let divisions = [];
  const want = String(eventId || "").trim().toLowerCase();
  for (const p of payloads || []) {
    if (!p || typeof p !== "object") continue;
    const id = String(p.tournamentId || "").trim().toLowerCase();
    if (want && id && id !== want) continue;
    if (!tournamentId && p.tournamentId) tournamentId = p.tournamentId;
    if (Array.isArray(p.divisions) && p.divisions.length > divisions.length) divisions = p.divisions;
    if (Array.isArray(p.matches)) matches.push(...p.matches);
    const q = p.qualifier;
    if (Array.isArray(q)) qualifier.push(...q);
    else if (Array.isArray(q?.matches)) qualifier.push(...q.matches);
  }
  return { tournamentId, divisions, matches, qualifier };
}

function qualifierRows(scores) {
  const q = scores?.qualifier;
  if (Array.isArray(q)) return q;
  if (Array.isArray(q?.matches)) return q.matches;
  return [];
}

/**
 * Main draw plus qualifier rows.
 * The same id can show up as a scheduled shell and as a finished result.
 * Keep the finished row (real games and winner). Otherwise keep the row
 * that has a real day rather than Date TBA.
 */
export function ppaScoreRows(scores) {
  const main = Array.isArray(scores?.matches) ? scores.matches : [];
  const byId = new Map();
  for (const m of [...main, ...qualifierRows(scores)]) {
    if (!m || m.id == null || m.id === "") continue;
    const prev = byId.get(m.id);
    if (!prev) {
      byId.set(m.id, m);
      continue;
    }
    const prevTerm = ppaScoresTerminal(prev);
    const nextTerm = ppaScoresTerminal(m);
    if (nextTerm && !prevTerm) byId.set(m.id, m);
    else if (!prevTerm && !nextTerm && isPpaTbaDate(prev.dateKey) && !isPpaTbaDate(m.dateKey)) byId.set(m.id, m);
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
 * Scores status final / completed. A ticker "upnext" must not clear it.
 * tickerLive on the row means the ticker is the authority for LIVE, so that
 * row is not treated as a finished scores result.
 */
export function ppaScoresTerminal(m) {
  if (!m || m.tickerLive === true) return false;
  return ppaStatus(m.status) === "FT";
}

/**
 * Ticker rows belong to the ticker tournament.
 * When the title does not match the pin, leave the scores draw alone —
 * never stamp those rows with the pinned event.
 * Smoke of a different event still ignores ticker ids missing from that draw.
 * Scores player names win over ticker abbreviations when both exist.
 * A scores row that is already final keeps that status, its games, its winner,
 * its round, and its dateKey. The ticker can still say "upnext" for an id
 * whose result is already on the scores feed; copying that status would
 * take the row off the FT board and onto the ticker's day.
 */
export function applyPpaTickerRows(byId, tickerMatches, { aligned = false, smoke = false } = {}) {
  const out = byId && typeof byId === "object" ? byId : {};
  if (!aligned) return out;
  for (const m of tickerMatches || []) {
    if (!m || m.id == null || m.id === "") continue;
    if (smoke && !out[m.id]) continue;
    const prev = out[m.id] || {};
    const teams = namedScoreTeams(prev) || m.teams;
    if (ppaScoresTerminal(prev)) {
      out[m.id] = {
        ...prev,
        teams,
        court: prev.court || m.court || "",
        dateKey: mergePpaDateKey(prev, m),
        tickerLive: false,
      };
      continue;
    }
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
