/**
 * APP / Den Live day truth.
 * Match calendar date comes from Den startTime / scheduledTime (venue-local
 * Java array). WAITING_FOR_COURT is NOT rolled onto venue-today — that made
 * Sunday Finals look like Friday's slate.
 *
 * Medal matches (FINAL / THIRD_PLACE) with no match clock use Den
 * tournament.endDate (Overland: 2026-09-20). Never invent scores or a fake time.
 */

export function addDays(iso, n) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function ymdInTz(d, tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d instanceof Date ? d : new Date(d));
}

export function statusToken(raw) {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
}

export function isMedalMatchType(matchType) {
  const mt = statusToken(matchType);
  return mt === "FINAL" || mt === "THIRD_PLACE" || mt === "THIRDPLACE" || mt === "BRONZE";
}

/** Den LocalDateTime array [y, M, d, H, m, s, nanos] — month is 1-indexed. */
export function ymdFromDenValue(v) {
  if (v == null || v === "") return "";
  if (Array.isArray(v) && v.length >= 3) {
    const [y, mo, d] = v.map(Number);
    if (!y || !mo || !d) return "";
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  if (typeof v === "object") {
    const y = Number(v.year ?? v.y);
    const mo = Number(v.month ?? v.monthValue ?? v.mo);
    const d = Number(v.day ?? v.dayOfMonth ?? v.d);
    if (y && mo && d) return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    for (const k of ["dateTime", "datetime", "date", "value", "timestamp", "time"]) {
      if (v[k] != null) {
        const nested = ymdFromDenValue(v[k]);
        if (nested) return nested;
      }
    }
    return "";
  }
  const raw = String(v).trim();
  const m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return "";
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

export function denParts(v) {
  if (v == null || v === "") return null;
  if (Array.isArray(v) && v.length >= 3) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = v.map(Number);
    if (!y || !mo || !d) return null;
    return [y, mo, d, h || 0, mi || 0, s || 0];
  }
  if (typeof v === "object") {
    const y = Number(v.year ?? v.y);
    const mo = Number(v.month ?? v.monthValue ?? v.mo);
    const d = Number(v.day ?? v.dayOfMonth ?? v.d);
    const h = Number(v.hour ?? v.hours ?? 0);
    const mi = Number(v.minute ?? v.minutes ?? 0);
    const s = Number(v.second ?? v.seconds ?? 0);
    if (y && mo && d) return [y, mo, d, h || 0, mi || 0, s || 0];
    return null;
  }
  const raw = String(v).trim();
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0)];
  m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return [+m[1], +m[2], +m[3], 0, 0, 0];
  return null;
}

/**
 * Board calendar date in event tz.
 * LIVE does not overwrite the scheduled day — the client still surfaces LIVE on
 * the default "today" tab. WAITING_FOR_COURT stays on its Den day.
 */
export function matchBoardDate(m, { bracketDate, eventEndDate } = {}) {
  const fromMatch =
    ymdFromDenValue(m?.startTime) || ymdFromDenValue(m?.scheduledTime) || ymdFromDenValue(m?.endTime);
  if (fromMatch) return fromMatch;
  if (isMedalMatchType(m?.matchType) && eventEndDate) return eventEndDate;
  return bracketDate || "";
}

/** True when start ISO came from the match row, not a bracket session fallback. */
export function matchHasClock(m) {
  return !!(denParts(m?.startTime) || denParts(m?.scheduledTime));
}

/**
 * NEXT keep window: yesterday through tournament end (or today+1 if no end).
 * LIVE always. FT from yesterday onward. Future start ISO also kept.
 */
export function keepAppMatch(m, todayTz, eventEndDate) {
  if (!m) return false;
  if (m.status === "LIVE") return true;
  const yest = addDays(todayTz, -1);
  if (m.status === "FT") return !m.date || m.date >= yest;
  const horizon = eventEndDate && eventEndDate > addDays(todayTz, 1) ? eventEndDate : addDays(todayTz, 1);
  if (m.date && m.date >= yest && m.date <= horizon) return true;
  const start = m.start ? new Date(m.start) : null;
  if (start && !Number.isNaN(start.getTime())) {
    return Date.now() - start.getTime() <= 48 * 3600000;
  }
  return false;
}
