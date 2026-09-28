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
