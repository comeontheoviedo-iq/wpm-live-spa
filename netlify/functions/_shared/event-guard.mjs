import { getStore } from "@netlify/blobs";

/**
 * Event verification guards (added 4 Nov 2026 after the phantom "APP Asia Bangkok Open").
 *
 * Rules:
 *  1. SUPPRESSED events never surface anywhere (dead official page / not scheduled).
 *  2. The daily official-URL check (cron 0 6 * * *) fetches every upcoming/current
 *     event's officialUrl. 404/410 or dates that no longer match => auto-hidden, reason in KV.
 *  3. An event may appear in today / live / "on now" only if it has a verified score
 *     connector, OR its official page returned 200 within the last 24h with matching dates.
 *  4. GPA-calendar-only rows (no official confirmation) are never live: they are
 *     labelled "unconfirmed" and kept out of today's views.
 */

export const USER_AGENT =
  "WPM-Live-OfficialCheck/1.0 (+https://live.worldpickleballmagazine.com; chris@worldpickleball.media)";
export const CHECK_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const KEY = "official-checks";

/** Hard suppressions: name regex + reason. Never shown in any view. */
export const SUPPRESSED = [
  {
    match: /\bbangkok\b/i,
    reason:
      "APP Asia Bangkok Open: official page theapp.global/tour-schedule/2026-app-bangkok-open returns 404 (checked 2026-11-04); not scheduled anywhere. Removed.",
  },
  {
    // Specific enough not to match World Cup "Chinese Taipei" team names.
    match: /(?:tci\s+)?app(?:\s+asia)?\s+taipei|taipei\s+city\s+open|taipei\s+open|slate:app-asia-taipei/i,
    reason:
      "TCI APP Asia Taipei City Open (12–15 Nov 2026) was cancelled (confirmed 2026-11-14). Removed from the LIVE calendar, featured events and Today board.",
  },
];

export function suppressionFor(e) {
  const blob = `${e?.name || ""} ${e?.id || ""}`;
  return SUPPRESSED.find((s) => s.match.test(blob)) || null;
}

function store() {
  return getStore({ name: "wpm-desk", consistency: "strong" });
}

export async function loadChecks() {
  try {
    const d = await store().get(KEY, { type: "json" });
    if (d && d.results) return d;
  } catch {}
  return { checkedAt: null, results: {} };
}

export async function saveChecks(d) {
  await store().setJSON(KEY, d);
}

function ymd(s) {
  const m = String(s || "").match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

/** Pull dates from an official page when it publishes machine-readable ones. */
export function parseOfficialDates(html) {
  const s = String(html || "");
  const a = s.match(/data-event-start="([^"]+)"/);
  const b = s.match(/data-event-end="([^"]+)"/);
  if (a) return { start: ymd(a[1]), end: ymd(b ? b[1] : a[1]) };
  // JSON-LD: trust only a single distinct event on the page (listing pages carry many).
  const starts = [...new Set([...s.matchAll(/"startDate"\s*:\s*"([^"]+)"/g)].map((m) => ymd(m[1])))];
  if (starts.length !== 1) return null;
  const ld = s.match(/"startDate"\s*:\s*"([^"]+)"[\s\S]{0,400}?"endDate"\s*:\s*"([^"]+)"/);
  if (ld) return { start: ymd(ld[1]), end: ymd(ld[2]), source: "jsonld" };
  return { start: starts[0], end: starts[0], source: "jsonld" };
}

export function judgeCheck(event, httpStatus, html, now = Date.now()) {
  const base = { url: event.officialUrl, httpStatus, checkedAt: new Date(now).toISOString() };
  if (httpStatus === 404 || httpStatus === 410) {
    return { ...base, ok: false, hidden: true, reason: `official page ${httpStatus}` };
  }
  if (httpStatus !== 200) {
    return { ...base, ok: false, hidden: false, reason: `official page ${httpStatus || "unreachable"} (not verified)` };
  }
  let off = parseOfficialDates(html);
  // JSON-LD from a different edition (e.g. last year's) is stale markup, not a contradiction.
  if (off && off.source === "jsonld" && off.start.slice(0, 4) !== String(event.start || "").slice(0, 4)) off = null;
  if (off && off.start) {
    const datesMatch = off.start === event.start && (off.end || off.start) === (event.end || event.start);
    if (!datesMatch) {
      return {
        ...base, ok: false, hidden: true, datesMatch: false, officialStart: off.start, officialEnd: off.end,
        reason: `dates mismatch: official ${off.start}..${off.end} vs listed ${event.start}..${event.end}`,
      };
    }
    return { ...base, ok: true, hidden: false, datesMatch: true, officialStart: off.start, officialEnd: off.end };
  }
  // 200 but no machine-readable dates: page alive, dates not contradicted.
  return { ...base, ok: true, hidden: false, datesMatch: null, reason: "200, no machine-readable dates" };
}

export function checkKey(e) {
  return `${e.id || e.name}|${e.officialUrl}`;
}

/** Run by the daily cron. Fetches every upcoming/current event's officialUrl. */
export async function runOfficialCheck(events, { fetchImpl = fetch, now = Date.now() } = {}) {
  const today = new Date(now).toISOString().slice(0, 10);
  const prev = await loadChecks();
  const results = {};
  const seen = new Map();
  for (const e of events || []) {
    if (!e || !e.officialUrl) continue;
    if ((e.end || e.start || "") < today) continue;
    let status = 0;
    let html = "";
    const cacheKey = e.officialUrl;
    try {
      if (seen.has(cacheKey)) ({ status, html } = seen.get(cacheKey));
      else {
        const res = await fetchImpl(e.officialUrl, {
          headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
          redirect: "follow",
        });
        status = res.status;
        html = status === 200 ? (await res.text()).slice(0, 400000) : "";
        seen.set(cacheKey, { status, html });
      }
    } catch (err) {
      status = 0;
    }
    results[checkKey(e)] = { id: e.id, name: e.name, start: e.start, end: e.end, ...judgeCheck(e, status, html, now) };
  }
  const out = { checkedAt: new Date(now).toISOString(), results, previousCheckedAt: prev.checkedAt };
  await saveChecks(out);
  return out;
}

export function hasVerifiedConnector(e) {
  const c = e?.connector;
  if (!c || c.type === "none") return false;
  return Boolean(c.scorePath || c.scoreUrl || c.denTournamentId || c.sportsSyncTournamentId || c.ppaEventId) &&
    e.status === "live-path";
}

export function isGpaOnly(e) {
  return String(e?.id || "").startsWith("gpa:") && !e.officialUrl && !e.armed;
}

/**
 * Apply guards to calendar rows. Returns the filtered list.
 * Adds: verification ("connector" | "official" | "unconfirmed"), todayEligible, hiddenReason.
 */
export function applyEventGuards(events, checks, now = Date.now()) {
  const today = new Date(now).toISOString().slice(0, 10);
  const results = (checks && checks.results) || {};
  const out = [];
  for (const e of events || []) {
    if (!e) continue;
    if (suppressionFor(e)) continue;
    const chk = e.officialUrl ? results[checkKey(e)] : null;
    if (chk && chk.hidden) continue;
    const fresh = chk && chk.checkedAt && now - Date.parse(chk.checkedAt) <= CHECK_MAX_AGE_MS;
    const officialOk = Boolean(fresh && chk.ok && chk.httpStatus === 200 && chk.datesMatch !== false);
    const connectorOk = hasVerifiedConnector(e);
    const row = { ...e };
    row.verification = connectorOk ? "connector" : officialOk ? "official" : "unconfirmed";
    row.officialCheck = chk
      ? { httpStatus: chk.httpStatus, checkedAt: chk.checkedAt, datesMatch: chk.datesMatch ?? null }
      : null;
    if (!connectorOk) {
      // Only a verified connector may be live.
      row.onLive = false;
      if (row.status === "live-path") row.status = "results-only";
    }
    const current = (row.start || "") <= today && (row.end || row.start || "") >= today;
    row.todayEligible = connectorOk || officialOk;
    if (isGpaOnly(row)) {
      row.onLive = false;
      row.todayEligible = false;
      if (row.status !== "ended") row.status = "unconfirmed";
    }
    if (current && !row.todayEligible) {
      // Never on the today/live strip without verification.
      if (row.status !== "ended") row.status = "unconfirmed";
    }
    out.push(row);
  }
  return out;
}
