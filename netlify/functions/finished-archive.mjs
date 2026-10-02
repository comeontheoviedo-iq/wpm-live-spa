/**
 * Finished-tournament results for the reader archive.
 * Live pins stay APP Den 18448 (Columbus) and PPA 86926aef (Las Vegas).
 * This module only serves completed events, and only FT rows.
 * It never marks LIVE and never invents a score.
 */
import { discFromAppBracket, discFromDivName, isKnockoutBracket, polishAppRound } from "./app-rounds.mjs";
import { matchBoardDate } from "./app-dates.mjs";
import { rosterText, tagsFor } from "./follow-tags.mjs";
import { APP_LIVE, ENDED_APP, PPA_LIVE } from "./slate-events.mjs";

const DEN = "https://denlive.pickleballden.com";
const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };

/** Open pro draws only. Backdraw and amateur brackets stay off this archive. */
export const PRO_DRAW_NAMES = [
  "Men's Pro Singles",
  "Women's Pro Singles",
  "Men's Pro Doubles",
  "Women's Pro Doubles",
  "Mixed Pro Doubles",
];

const ARIZONA_ID = "62c01642-1bb2-4f9a-9998-599f8fdefe5c";

export const FINISHED_EVENTS = [
  {
    id: "overland",
    tour: "app",
    label: "Overland",
    name: ENDED_APP.overland.name,
    venue: ENDED_APP.overland.venue,
    tz: ENDED_APP.overland.timezone,
    start: ENDED_APP.overland.start,
    end: ENDED_APP.overland.end,
    denTournamentId: ENDED_APP.overland.denTournamentId,
    current: false,
  },
  {
    id: "arizona",
    tour: "ppa",
    label: "Arizona",
    name: "PPA Veolia Arizona Open",
    venue: "Mesa, AZ",
    tz: "America/Phoenix",
    start: "2026-09-14",
    end: "2026-09-21",
    ppaEventId: ARIZONA_ID,
    current: false,
  },
];

/** Live pins. Listed so the client can offer them once the week has actually finished. */
export const CURRENT_PINS = [
  {
    id: "columbus",
    tour: "app",
    label: "Columbus",
    name: APP_LIVE.name,
    venue: APP_LIVE.venue,
    tz: APP_LIVE.tz,
    start: APP_LIVE.start,
    end: APP_LIVE.end,
    denTournamentId: APP_LIVE.eventId,
    current: true,
  },
  {
    id: "las-vegas",
    tour: "ppa",
    label: "Las Vegas",
    name: PPA_LIVE.name,
    venue: PPA_LIVE.venue,
    tz: PPA_LIVE.tz,
    start: PPA_LIVE.start,
    // Not a guessed final day. The live feed decides "done"; this is only a backstop
    // so the past list still has Vegas after the pin moves on.
    end: "2026-10-06",
    ppaEventId: PPA_LIVE.eventId,
    current: true,
  },
];

export function catalog() {
  return [...FINISHED_EVENTS, ...CURRENT_PINS].map(publicEvent);
}

export function publicEvent(e) {
  return {
    id: e.id,
    tour: e.tour,
    label: e.label,
    name: e.name,
    venue: e.venue,
    tz: e.tz,
    start: e.start,
    end: e.end || "",
    current: !!e.current,
  };
}

export function eventById(id) {
  const key = String(id || "").trim().toLowerCase();
  return [...FINISHED_EVENTS, ...CURRENT_PINS].find((e) => e.id === key) || null;
}

/** True when every row is final and the latest real date is before today. */
export function weekIsFinished(matches, today) {
  const rows = Array.isArray(matches) ? matches : [];
  const day = String(today || "").slice(0, 10);
  if (!rows.length || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  let latest = "";
  for (const m of rows) {
    const st = String(m && (m.status || "")).toLowerCase();
    if (st !== "ft" && st !== "final") return false;
    const d = String((m && (m.date || m.dateKey)) || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d > latest) latest = d;
  }
  return !!(latest && latest < day);
}

export function pinEnded(end, today) {
  const e = String(end || "").slice(0, 10);
  const t = String(today || "").slice(0, 10);
  return !!(e && t && t > e);
}

export function selectProBrackets(brackets) {
  const wanted = new Set(PRO_DRAW_NAMES);
  return (brackets || []).filter((b) => wanted.has(String(b && b.bracketName || "").trim()));
}

function ymdToday(tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function fetchJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function sideName(team) {
  if (!team) return "TBD";
  if (team.bye) return "BYE";
  const ps = team.players || [];
  const names = ps
    .map((p) => (typeof p === "string" ? p : p?.name || p?.playerName || p?.displayName || ""))
    .filter(Boolean);
  if (!names.length) return team.teamName || "TBD";
  if (names.length === 1) return names[0];
  return names.map((n) => n.split(/\s+/).slice(-1)[0]).join(" / ");
}

function gameComplete(a, b) {
  const hi = Math.max(Number(a), Number(b));
  const lo = Math.min(Number(a), Number(b));
  return hi >= 11 && hi - lo >= 2;
}

function appLines(m, aName, bName) {
  const scores = Array.isArray(m.scores) ? [...m.scores] : [];
  scores.sort((x, y) => (x.gameNumber || 0) - (y.gameNumber || 0));
  const lines = [];
  for (const g of scores) {
    const ga = g.team1Score;
    const gb = g.team2Score;
    if (ga == null || gb == null || ga === "" || gb === "") continue;
    const na = Number(ga);
    const nb = Number(gb);
    if (na === 0 && nb === 0) continue;
    if (!gameComplete(na, nb)) continue;
    lines.push({
      disc: "G" + (g.gameNumber || lines.length + 1),
      score: `${na}–${nb}`,
      winner: na > nb ? aName : nb > na ? bName : "",
      live: false,
    });
  }
  return lines;
}

export function mapAppArchiveMatch(m, bracket, ev) {
  if (!m) return null;
  const token = String(m.status || m.matchStatus || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  const completed =
    !!m.completed || token === "COMPLETED" || token === "COMPLETE" || token === "FINISHED" || token === "CLOSED";
  if (!completed) return null;
  const a = sideName(m.team1);
  const b = sideName(m.team2);
  if (!a || !b || a === "TBD" || b === "TBD" || a === "BYE" || b === "BYE") return null;
  const lines = appLines(m, a, b);
  const w0 = lines.filter((l) => l.winner === a).length;
  const w1 = lines.filter((l) => l.winner === b).length;
  const round = polishAppRound({
    round: m.round,
    roundDisplayName: m.roundDisplayName,
    matchType: m.matchType,
    totalRounds: bracket.totalRounds,
    bracketType: bracket.bracketType,
    hasThirdPlaceMatch: bracket.hasThirdPlaceMatch,
  });
  const roster = rosterText([m.team1, m.team2]);
  const date = matchBoardDate(m, { bracketDate: bracket.startDate, eventEndDate: ev.end }) || ev.start || "";
  return {
    id: "app-" + m.matchId,
    date,
    tour: "app",
    tier: "pro",
    comp: ev.name,
    div: [bracket.bracketName, round].filter(Boolean).join(" · "),
    round: round || "",
    disc: discFromAppBracket(bracket),
    format: isKnockoutBracket(bracket.bracketType) ? "ko" : "pool",
    a,
    b,
    roster,
    tags: tagsFor(`${a} ${b} ${roster}`),
    status: "FT",
    denStatus: "COMPLETED",
    start: "",
    hasClock: false,
    score: !w0 && !w1 ? "" : `${w0}-${w1}`,
    games: lines.map((l) => `${l.disc} ${l.score}`).join(" · "),
    lines,
    court: "",
    note: lines.length ? "" : "Result recorded (no game scores)",
    eventKey: "archive:app:" + ev.id,
    venue: ev.venue,
    tz: ev.tz,
    archive: true,
  };
}

function isPadZero(a, b) {
  const na = a == null || a === "" ? null : Number(a);
  const nb = b == null || b === "" ? null : Number(b);
  if (na === null && nb === null) return true;
  return na === 0 && nb === 0;
}

function ppaLines(m, aName, bName) {
  const t0 = (m.teams || [])[0] || {};
  const t1 = (m.teams || [])[1] || {};
  const g0 = t0.games || [];
  const g1 = t1.games || [];
  const n = Math.max(g0.length, g1.length, 0);
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = g0[i];
    const b = g1[i];
    if (isPadZero(a, b)) continue;
    if ((a == null || a === "") && (b == null || b === "")) continue;
    const na = Number(a);
    const nb = Number(b);
    if (!gameComplete(na, nb)) continue;
    lines.push({
      disc: "G" + (i + 1),
      score: `${na}–${nb}`,
      winner: na > nb ? aName : nb > na ? bName : "",
      live: false,
    });
  }
  return lines;
}

export function mapPpaArchiveMatch(m, ev) {
  if (!m || String(m.status || "").toLowerCase() !== "final") return null;
  const t0 = (m.teams || [])[0] || {};
  const t1 = (m.teams || [])[1] || {};
  const a = sideName(t0);
  const b = sideName(t1);
  if (!a || !b || a === "TBD" || b === "TBD") return null;
  const lines = ppaLines(m, a, b);
  const w0 = lines.filter((l) => l.winner === a).length;
  const w1 = lines.filter((l) => l.winner === b).length;
  const roster = rosterText([t0, t1]);
  const date = String(m.dateKey || "").slice(0, 10);
  const round = m.roundLabel || m.round || "";
  return {
    id: "ppa-" + m.id,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    tour: "ppa",
    tier: "pro",
    comp: ev.name,
    div: [m.division || m.divisionLabel, round].filter(Boolean).join(" · "),
    round,
    disc: discFromDivName(m.division || m.divisionLabel || ""),
    a,
    b,
    roster,
    tags: tagsFor(`${a} ${b} ${roster}`),
    status: "FT",
    start: "",
    hasClock: false,
    score: !w0 && !w1 ? "" : `${w0}-${w1}`,
    games: lines.map((l) => `${l.disc} ${l.score}`).join(" · "),
    lines,
    court: m.court ? "Court " + m.court : "",
    note: m.dateLabel || "",
    eventKey: "archive:ppa:" + ev.id,
    venue: ev.venue,
    tz: ev.tz,
    archive: true,
  };
}

async function loadAppFinished(ev) {
  const today = ymdToday(ev.tz);
  if (ev.current && !pinEnded(ev.end, today)) {
    return { ...pack(ev), finished: false, matches: [], reader: "" };
  }
  const brRes = await fetchJson(`${DEN}/api/tournament-brackets?tournamentId=${encodeURIComponent(ev.denTournamentId)}`);
  const brackets = selectProBrackets(brRes?.brackets?.content || []);
  const settled = await Promise.all(
    brackets.map(async (b) => {
      const payload = await fetchJson(
        `${DEN}/api/bracket-matches?bracketId=${encodeURIComponent(String(b.bracketId))}&size=200`
      );
      const content = payload?.payload?.content || payload?.content || [];
      return { bracket: b, matches: content };
    })
  );
  const matches = settled
    .flatMap(({ bracket, matches: rows }) => rows.map((m) => mapAppArchiveMatch(m, bracket, ev)).filter(Boolean))
    .filter((m) => m.status === "FT");
  return { ...pack(ev), finished: true, matches };
}

async function loadPpaFinished(ev) {
  const today = ymdToday(ev.tz);
  const scores = await fetchJson("https://www.ppatour.com/api/scores/?event=" + encodeURIComponent(ev.ppaEventId));
  const raw = Array.isArray(scores?.matches) ? scores.matches : [];
  const finished = ev.current ? weekIsFinished(raw, today) || pinEnded(ev.end, today) : true;
  if (ev.current && !finished) {
    return { ...pack(ev), finished: false, matches: [], reader: "" };
  }
  const matches = raw.map((m) => mapPpaArchiveMatch(m, ev)).filter(Boolean);
  return { ...pack(ev), finished: true, matches };
}

function pack(ev) {
  return {
    id: ev.id,
    event: publicEvent(ev),
    source: ev.tour === "app" ? "den-live" : "ppa-scores",
    updated: new Date().toISOString(),
  };
}

export async function loadFinished(id) {
  const ev = eventById(id);
  if (!ev) return { unknown: true, id: String(id || ""), matches: [], finished: false };
  try {
    if (ev.tour === "app" && ev.denTournamentId) return await loadAppFinished(ev);
    if (ev.tour === "ppa" && ev.ppaEventId) return await loadPpaFinished(ev);
    return { ...pack(ev), finished: false, matches: [], unavailable: true, reader: "Results will appear when available" };
  } catch (e) {
    return {
      ...pack(ev),
      finished: !ev.current,
      matches: [],
      unavailable: true,
      reader: "Results will appear when available",
      error: String(e?.message || e),
    };
  }
}
