/**
 * Shared mapper for the pickleball.com public match schema
 * (pickleballtournaments.com ticker and pickleballteamleagues.com tl-ticker).
 *
 * matchStatus 2 = in progress, 4 = ended, 1 = scheduled, 3 = delayed.
 * matchCompletedType 2 Forfeit, 3 Retirement, 4 Withdrawal, 5 Played.
 * Game slots of 0–0 are padding. They are not scores.
 * localDate* timestamps carry a Z suffix but are venue-local wall time,
 * the same quirk as the PPA ticker. plannedStartDate on a team matchup
 * is a real UTC instant (Tokyo 18:00 is stored as 09:00Z).
 *
 * Never invent a score. A forfeit / withdrawal / retirement with no
 * played games stays score-blank and names the outcome.
 */

import { discFromDivName } from "./app-rounds.mjs";
import { tagsForSides } from "./follow-tags.mjs";
import {
  keepPpaMatch,
  ppaCourtLabel,
  ppaGameLineScore,
  ppaListedScore,
  ppaLocalDayPrefix,
  ppaResultNote,
  ppaWallInstant,
} from "./ppa-keep.mjs";

export const LILLE = {
  id: "04a30133-11cc-4280-97f7-3027404c05b3",
  slug: "ppa-tour-europe-p125-lille",
  name: "PPA Tour Europe · P125 Lille",
  venue: "JOCO Pickleball, Villeneuve d'Ascq",
  tz: "Europe/Paris",
  tour: "ppa-eu",
  eventKey: "ev:ppa-eu:04a30133-11cc-4280-97f7-3027404c05b3",
  officialUrl: "https://pickleballtournaments.com/tournaments/ppa-tour-europe-p125-lille",
  start: "2026-11-13",
  end: "2026-11-15",
  ticker: "https://pickleballtournaments.com/api/v2/ticker",
};

export const MLP_ASIA = {
  seasonUuid: "efd7f2ff-351a-4ad4-81c8-75cc009ec39c",
  organizationUuid: "45ed4462-5f0f-429b-9b17-02e1bf9f78cd",
  teamLeagueUuid: "3a6def91-3e1c-4f81-adb5-0308a490a2b9",
  name: "MLP Asia 2026",
  venue: "Home nights — Tokyo opener",
  tz: "Asia/Tokyo",
  start: "2026-11-13",
  end: "2026-12-12",
  tour: "mlp-asia",
  eventKey: "ev:mlp-asia:efd7f2ff-351a-4ad4-81c8-75cc009ec39c",
  officialUrl: "https://pickleballteamleagues.com/team-leagues/major-league-pickleball-asia",
  recapUrl: "https://mlp-asia.com/meet-the-six-teams-draft-sign-up-and-showdown-schedule-revealed/",
  ticker: "https://pickleballteamleagues.com/api/v2/tl-ticker",
};

const COMPLETED_LABEL = {
  2: "Forfeit",
  3: "Retirement",
  4: "Withdrawal",
};

const GAME_WORDS = ["One", "Two", "Three", "Four", "Five"];

export function cleanName(raw) {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function pbStatus(raw) {
  const text = String(raw ?? "").trim();
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    if (n === 2) return "LIVE";
    if (n === 4) return "FT";
    return "NEXT";
  }
  const t = text.toUpperCase();
  if (!t) return "NEXT";
  if (/IN[_\s-]*PROGRESS|\bLIVE\b|\bSTARTED\b|\bPLAYING\b/.test(t)) return "LIVE";
  if (/COMPLETE|ENDED|FINAL|FINISHED/.test(t)) return "FT";
  return "NEXT";
}

export function pbCompletedLabel(raw) {
  const text = String(raw ?? "").trim();
  if (/^\d+$/.test(text)) return COMPLETED_LABEL[Number(text)] || "";
  const t = text.toUpperCase();
  if (/FORFEIT/.test(t)) return "Forfeit";
  if (/RETIRE/.test(t)) return "Retirement";
  if (/WITHDRAW/.test(t)) return "Withdrawal";
  return "";
}

function scoreNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hasPoints(a, b) {
  return a != null && b != null && !(a === 0 && b === 0);
}

/**
 * Played games only. Padded 0–0 slots (status 1 not started, status 5
 * unused best-of fill, status 4/9 forfeit slots) are dropped.
 * A live game with real points is kept even before it reaches 11.
 */
export function pbGameLines(raw, { live = false, sideA = "", sideB = "" } = {}) {
  const lines = [];
  for (let i = 0; i < GAME_WORDS.length; i++) {
    const word = GAME_WORDS[i];
    const a = scoreNum(raw?.[`teamOneGame${word}Score`]);
    const b = scoreNum(raw?.[`teamTwoGame${word}Score`]);
    const st = String(raw?.[`game${word}Status`] ?? "");
    const end = raw?.[`game${word}EndDate`] || "";
    const points = hasPoints(a, b);
    const markedDone = st === "5" || !!end;
    const finished = points && (markedDone || !live);
    const inProgress = live && points && !finished;
    const explicitLiveZero = live && !points && (st === "2" || /inprogress|in_progress|playing/i.test(st));
    if (!points && !explicitLiveZero) continue;
    const current = inProgress || explicitLiveZero;
    const done = finished && !current;
    lines.push({
      disc: "G" + (i + 1),
      score: explicitLiveZero ? "0–0" : ppaGameLineScore(a, b),
      winner: done && a !== b ? (a > b ? sideA : sideB) : "",
      live: current,
      court: "",
    });
  }
  return lines;
}

export function pbPerson(raw, side, slot) {
  const prefix = `${side}Player${slot}`;
  const first = cleanName(raw?.[`${prefix}FirstName`]);
  const last = cleanName(raw?.[`${prefix}LastName`]);
  const suffix = cleanName(raw?.[`${prefix}NameSuffix`]);
  const full = cleanName(raw?.[`${prefix}Name`]);
  let name = [first, last].filter(Boolean).join(" ");
  if (!name) name = full;
  if (name && suffix && !name.toLowerCase().endsWith(suffix.toLowerCase())) name = `${name} ${suffix}`;
  if (/^(tbd|tba|bye)$/i.test(name)) return "";
  return name;
}

/** Singles keep the full name. Doubles use last names, same as the PPA card. */
export function pbSide(p1, p2) {
  const names = [p1, p2].map(cleanName).filter(Boolean);
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  return names.map((n) => n.split(" ").slice(-1)[0]).join(" / ");
}

export function pbRoster(aNames, bNames) {
  const a = aNames.filter(Boolean).join(" / ");
  const b = bNames.filter(Boolean).join(" / ");
  if (!a && !b) return "";
  return `${a || "TBD"} vs ${b || "TBD"}`;
}

export function discCode(raw, divName) {
  const abbr = cleanName(raw?.matchAbbreviation).toUpperCase();
  if (/^(MS|WS|MD|WD|XD|MX1|MX2|TB)$/.test(abbr)) return abbr;
  if (abbr === "MX") return "XD";
  return discFromDivName(divName || "");
}

export function instantDay(iso, tz) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value || "";
    if (!get("year")) return "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return String(iso).slice(0, 10);
  }
}

function outcomeNote(label, winnerName, liveLine) {
  if (liveLine) return ppaResultNote({ liveLine });
  if (!label) return "";
  const who = cleanName(winnerName);
  return who ? `${label} · ${who}` : label;
}

function winnerSide(raw, a, b) {
  const w = Number(raw?.winner);
  if (w === 1) return a;
  if (w === 2) return b;
  return "";
}

/**
 * One doubles/singles match from the public ticker.
 * Returns null when both sides are blank.
 */
export function mapTickerMatch(raw, pin) {
  if (!raw || raw.matchUuid == null || raw.matchUuid === "") return null;
  const moduleId = cleanName(raw.moduleUuid).toLowerCase();
  if (pin?.moduleUuid && moduleId && moduleId !== String(pin.moduleUuid).toLowerCase()) return null;

  const aNames = [pbPerson(raw, "teamOne", "One"), pbPerson(raw, "teamOne", "Two")];
  const bNames = [pbPerson(raw, "teamTwo", "One"), pbPerson(raw, "teamTwo", "Two")];
  const a = pbSide(aNames[0], aNames[1]);
  const b = pbSide(bNames[0], bNames[1]);
  if (!a && !b) return null;

  const tz = pin?.tz || "UTC";
  const status = pbStatus(raw.matchStatus);
  const live = status === "LIVE";
  const lines = pbGameLines(raw, { live, sideA: a || "TBD", sideB: b || "TBD" });
  const court = ppaCourtLabel(raw.courtTitle);
  const liveLine = lines.find((l) => l.live);
  if (liveLine && court) liveLine.court = court;
  const w0 = lines.filter((l) => l.winner && l.winner === (a || "TBD")).length;
  const w1 = lines.filter((l) => l.winner && l.winner === (b || "TBD")).length;
  const label = pbCompletedLabel(raw.matchCompletedType);
  const namedWinner = winnerSide(raw, a, b);
  const divName = cleanName(raw.eventTitle) || cleanName(raw.tournamentTitle) || pin?.name || "Draw";
  const round = cleanName(raw.roundText);
  const roster = pbRoster(aNames, bNames);
  const wall = raw.localDateMatchStart || raw.localDateMatchPlannedStart || "";
  const start = ppaWallInstant(wall, tz);
  const date =
    ppaLocalDayPrefix(raw.localDateMatchPlannedStart) ||
    ppaLocalDayPrefix(raw.localDateMatchStart) ||
    ppaLocalDayPrefix(raw.localDateMatchCompleted) ||
    "";
  const sideA = a || "TBD";
  const sideB = b || "TBD";
  return {
    id: `${pin.tour}-${raw.matchUuid}`,
    date,
    tour: pin.tour,
    comp: pin.name,
    div: [divName, round].filter(Boolean).join(" · "),
    round,
    disc: discCode(raw, divName),
    session: court,
    a: sideA,
    b: sideB,
    roster,
    tags: tagsForSides(sideA, sideB, roster),
    status,
    tickerLive: live,
    start,
    hasClock: !!start,
    clock: "",
    score: ppaListedScore(w0, w1, lines),
    games: lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · "),
    lines,
    court,
    note: outcomeNote(label, namedWinner, liveLine),
    watch: "",
    tz,
    venue: pin.venue || "",
    eventKey: pin.eventKey,
  };
}

function stopName(raw) {
  const group = cleanName(raw?.matchupGroupTitle);
  const cut = group.split(/\s+-\s+/);
  if (cut.length > 1) return cut.slice(1).join(" - ");
  return group;
}

function matchupTz(raw, pin) {
  const iana = cleanName(raw?.timezone?.ianaTzIdentifier || raw?.timezone);
  if (iana && iana.includes("/")) return iana;
  return pin?.tz || "UTC";
}

function lineDisc(raw) {
  const abbr = cleanName(raw?.matchAbbreviation).toUpperCase();
  if (abbr) return abbr;
  const round = cleanName(raw?.roundText);
  if (/tiebreaker|dream\s*breaker/i.test(round)) return "TB";
  return discCode(raw, raw?.roundText || raw?.eventTitle) || "G";
}

/**
 * One team-league matchup. Team score is the feed's teamOneScore /
 * teamTwoScore. Line games are the rubbers that were actually played.
 * An unplayed DreamBreaker (no players, no points) is omitted.
 */
export function mapTeamMatchup(raw, pin) {
  if (!raw || raw.uuid == null || raw.uuid === "") return null;
  const a = cleanName(raw.teamOneTitle);
  const b = cleanName(raw.teamTwoTitle);
  if (!a && !b) return null;
  const sideA = a || "TBD";
  const sideB = b || "TBD";
  const tz = matchupTz(raw, pin);
  const status = pbStatus(raw.matchupStatus);
  const live = status === "LIVE";
  const lines = [];
  for (const row of raw.matches || []) {
    if (!row) continue;
    const rowLive = live && pbStatus(row.matchStatus) === "LIVE";
    const games = pbGameLines(row, { live: rowLive, sideA, sideB });
    if (!games.length) continue;
    const disc = lineDisc(row);
    const score = games.map((g) => g.score).join(" ");
    const rowWinner = winnerSide(row, sideA, sideB);
    const finished = pbStatus(row.matchStatus) === "FT" || games.every((g) => !g.live && g.winner);
    lines.push({
      disc,
      score,
      winner: finished ? rowWinner || games.find((g) => g.winner)?.winner || "" : "",
      live: games.some((g) => g.live),
      court: ppaCourtLabel(row.courtTitle || row.playedOnCourtTitle),
    });
  }
  const sa = scoreNum(raw.teamOneScore);
  const sb = scoreNum(raw.teamTwoScore);
  let score = "";
  if (sa != null && sb != null && (sa || sb)) score = `${sa}-${sb}`;
  else if (!score) score = ppaListedScore(
    lines.filter((l) => l.winner === sideA).length,
    lines.filter((l) => l.winner === sideB).length,
    lines
  );
  const liveLine = lines.find((l) => l.live);
  const label = pbCompletedLabel(raw.matchupCompletedType);
  const namedWinner = winnerSide(raw, sideA, sideB);
  const stop = stopName(raw);
  const division = cleanName(raw.divisionTitle);
  const div = [stop, division].filter(Boolean).join(" · ") || pin?.name || "";
  const venue = typeof raw.venue === "string" ? cleanName(raw.venue) : pin?.venue || "";
  const startIso = cleanName(raw.plannedStartDate);
  const start = startIso && !Number.isNaN(new Date(startIso).getTime()) ? new Date(startIso).toISOString() : "";
  const date = instantDay(startIso, tz) || ppaLocalDayPrefix((raw.matches || [])[0]?.localDateMatchPlannedStart) || "";
  const roster = `${sideA} vs ${sideB}`;
  return {
    id: `${pin.tour}-${raw.uuid}`,
    date,
    tour: pin.tour,
    comp: pin.name,
    div,
    round: stop,
    disc: "",
    session: venue,
    a: sideA,
    b: sideB,
    roster,
    tags: tagsForSides(sideA, sideB, roster),
    status,
    tickerLive: live,
    start,
    hasClock: !!start,
    clock: "",
    score,
    games: lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · "),
    lines,
    court: liveLine?.court || "",
    note: outcomeNote(label, score ? "" : namedWinner, liveLine),
    watch: "",
    tz,
    venue: venue || pin?.venue || "",
    eventKey: pin.eventKey,
  };
}

export function sortBoard(matches) {
  return (matches || []).slice().sort((a, b) => {
    const live = Number(b.status === "LIVE") - Number(a.status === "LIVE");
    if (live) return live;
    const ta = a.start ? Date.parse(a.start) : 0;
    const tb = b.start ? Date.parse(b.start) : 0;
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function buildMatchBoard(rows, pin, now = new Date()) {
  const mapped = [];
  for (const row of rows || []) {
    const m = mapTickerMatch(row, { ...pin, moduleUuid: pin.moduleUuid || pin.id });
    if (m && keepPpaMatch(m, now)) mapped.push(m);
  }
  return sortBoard(mapped);
}

export function buildMatchupBoard(rows, pin, now = new Date()) {
  const mapped = [];
  for (const row of rows || []) {
    const m = mapTeamMatchup(row, pin);
    if (m && keepPpaMatch(m, now)) mapped.push(m);
  }
  return sortBoard(mapped);
}

export function bracketsFromMatches(matches) {
  const brackets = {};
  for (const m of matches || []) {
    const div = (m.div || "").split(" · ")[0] || "Draw";
    const round = m.round || (m.div || "").split(" · ")[1] || "Round";
    const rec = (brackets[div] ||= {});
    (rec[round] ||= []).push({
      id: m.id,
      a: m.a,
      b: m.b,
      score: m.score,
      status: m.status,
      games: m.games,
      date: m.date,
      disc: m.disc,
    });
  }
  return brackets;
}

export function eventBlock(pin) {
  return {
    id: pin.id || pin.seasonUuid || "",
    name: pin.name,
    venue: pin.venue,
    tz: pin.tz,
    startDate: pin.start || "",
    endDate: pin.end || "",
    eventKey: pin.eventKey,
    tour: pin.tour,
    officialUrl: pin.officialUrl,
    ppaEventId: pin.tour === "ppa-eu" ? pin.id : undefined,
  };
}

const memory = { "ppa-eu": null, "mlp-asia": null };

export function resetTickerCache() {
  memory["ppa-eu"] = null;
  memory["mlp-asia"] = null;
}

function browserHeaders(referer) {
  return {
    "User-Agent":
      "Mozilla/5.0 (compatible; WPM-LIVE/1.0; +https://live.worldpickleballmagazine.com)",
    Accept: "application/json",
    Referer: referer || "https://pickleballtournaments.com/",
  };
}

/**
 * Page through current_page until the feed is exhausted.
 * A later page that fails keeps the pages already read.
 * Page 1 failing is an error. Duplicate ids are dropped.
 */
export async function fetchPaged(urlForPage, listKey, { fetchImpl = fetch, referer = "", timeoutMs = 12000 } = {}) {
  const out = [];
  const seen = new Set();
  let total = Infinity;
  for (let page = 1; page <= 20; page++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(urlForPage(page), { headers: browserHeaders(referer), signal: ctrl.signal });
    } catch (e) {
      if (page === 1) return { ok: false, rows: [], error: String(e?.message || e) };
      break;
    } finally {
      clearTimeout(timer);
    }
    if (!res || !res.ok) {
      if (page === 1) return { ok: false, rows: [], error: `HTTP ${res?.status || 0}` };
      break;
    }
    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      if (page === 1) return { ok: false, rows: [], error: "invalid json" };
      break;
    }
    const data = json && typeof json === "object" && json.data && typeof json.data === "object" ? json.data : json || {};
    const batch = Array.isArray(data[listKey]) ? data[listKey] : [];
    const reported = Number(data.totalRecords);
    if (Number.isFinite(reported)) total = reported;
    let added = 0;
    for (const row of batch) {
      const id = row && (row.matchUuid || row.uuid);
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      out.push(row);
      added += 1;
    }
    if (!batch.length || added === 0 || out.length >= total) break;
  }
  return { ok: true, rows: out };
}

function cachedOrEmpty(key, pin, source) {
  const prev = memory[key];
  if (prev && Array.isArray(prev.matches)) {
    return { ...prev, delayed: true, reader: "Scores delayed" };
  }
  return {
    updated: new Date().toISOString(),
    source,
    delayed: true,
    reader: "Scores delayed",
    matches: [],
    brackets: {},
    event: eventBlock(pin),
  };
}

export async function loadPpaEu({ fetchImpl = fetch, now = new Date() } = {}) {
  const pin = LILLE;
  const fetched = await fetchPaged(
    (page) => `${pin.ticker}?current_page=${page}&tournament_slug=${pin.slug}`,
    "matches",
    { fetchImpl, referer: pin.officialUrl }
  );
  if (!fetched.ok) return cachedOrEmpty("ppa-eu", pin, "pickleballtournaments-ticker");
  const matches = buildMatchBoard(fetched.rows, pin, now);
  const body = {
    updated: new Date().toISOString(),
    source: "pickleballtournaments-ticker",
    delayed: false,
    reader: "",
    liveCount: matches.filter((m) => m.status === "LIVE").length,
    matches,
    brackets: bracketsFromMatches(matches),
    event: eventBlock(pin),
  };
  memory["ppa-eu"] = body;
  return body;
}

export async function loadMlpAsia({ fetchImpl = fetch, now = new Date() } = {}) {
  const pin = MLP_ASIA;
  const q = new URLSearchParams({
    season_uuid: pin.seasonUuid,
    organization_uuid: pin.organizationUuid,
    team_league_uuid: pin.teamLeagueUuid,
  });
  const fetched = await fetchPaged(
    (page) => `${pin.ticker}?current_page=${page}&${q}`,
    "matchups",
    { fetchImpl, referer: pin.officialUrl }
  );
  if (!fetched.ok) return cachedOrEmpty("mlp-asia", pin, "pickleballteamleagues-ticker");
  const matches = buildMatchupBoard(fetched.rows, pin, now);
  const body = {
    updated: new Date().toISOString(),
    source: "pickleballteamleagues-ticker",
    delayed: false,
    reader: "",
    liveCount: matches.filter((m) => m.status === "LIVE").length,
    matches,
    event: eventBlock(pin),
  };
  memory["mlp-asia"] = body;
  return body;
}
