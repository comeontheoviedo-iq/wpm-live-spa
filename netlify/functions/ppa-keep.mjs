/**
 * PPA board window. LIVE/FT always stay. Date TBA (9999-12-31) is not a day.
 * Never invent a calendar date for those rows.
 */

export function isPpaTbaDate(date) {
  const d = String(date || "").trim();
  return d === "9999-12-31" || d.startsWith("9999-");
}

/** Real dateKey, else plannedStart day, else the TBA sentinel, else today. */
export function ppaBoardDate(m, now = new Date()) {
  const dk = String(m?.dateKey || "").trim();
  if (dk && !isPpaTbaDate(dk)) return dk;
  const fromStart = String(m?.plannedStart || "").slice(0, 10);
  if (fromStart && !isPpaTbaDate(fromStart)) return fromStart;
  if (isPpaTbaDate(dk)) return "9999-12-31";
  return now.toISOString().slice(0, 10);
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
 * PPA status words that may paint LIVE. upnext / scheduled stay NEXT.
 * Never clock-promote.
 */
export function ppaStatus(raw) {
  const t = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (t === "live" || t === "running" || t === "inprogress" || t === "started" || t === "playing") return "LIVE";
  if (t === "final" || t === "completed" || t === "complete" || t === "finished" || t === "closed") return "FT";
  return "NEXT";
}

/** Game line. Null slots stay a dash — never coerced to 0–0. */
export function ppaGameLineScore(a, b) {
  const empty = (v) => v == null || v === "";
  if (empty(a) || empty(b)) return "–";
  return `${Number(a)}–${Number(b)}`;
}

/**
 * Match score from games won. Blank when nothing was played.
 * A live line whose source scores are numeric 0–0 may stay 0-0.
 */
export function ppaListedScore(winsA, winsB, lines) {
  const w0 = Number(winsA) || 0;
  const w1 = Number(winsB) || 0;
  if (w0 || w1) return `${w0}-${w1}`;
  const realZero = (lines || []).some((l) => {
    if (!l || !l.live) return false;
    const pts = String(l.score || "").split(/[–-]/);
    if (pts.length < 2) return false;
    if (String(pts[0]).trim() === "" || String(pts[1]).trim() === "") return false;
    return Number(pts[0]) === 0 && Number(pts[1]) === 0;
  });
  return realZero ? "0-0" : "";
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
