import type { Config, Context } from "@netlify/functions";
import { rosterText, tagsFor } from "./follow-tags.mjs";
import { bracketIndexEntry, discFromAppBracket, isKnockoutBracket, polishAppRound } from "./app-rounds.mjs";
import { addDays, denListedScore, denUnscoredNote, keepAppMatch, matchBoardDate, matchHasClock, ymdInTz as ymdInTzShared } from "./app-dates.mjs";
import {
  APP_LIVE,
  APP_NEXT,
  ENDED_APP,
  applyAppCalendarCut,
  appBoardPhase,
  denStatusToken,
  isDenLiveStatus,
  isDenRunningBracket,
  isEndedAppDenId,
  isPreparedNextDenId,
} from "./slate-events.mjs";
import { getStore } from "@netlify/blobs";

/** APP (Association of Pickleball Professionals) via Den Live proxies. */
const DEN = "https://denlive.pickleballden.com";
const FALLBACK_ID = APP_LIVE.eventId; // APP Columbus Open presented by The James
const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };
const BLOB_STORE = "wpm-app";
const DESK_STORE = "wpm-desk";

/** Static intake profiles for known Den tournamentIds (tz derived — Den info has no IANA). */
const PROFILES: Record<
  string,
  { name: string; venue: string; tz: string }
> = {
  [APP_LIVE.eventId]: {
    name: APP_LIVE.name,
    venue: APP_LIVE.venue,
    tz: APP_LIVE.tz,
  },
  [ENDED_APP.overland.denTournamentId]: {
    name: ENDED_APP.overland.name,
    venue: ENDED_APP.overland.venue,
    tz: ENDED_APP.overland.timezone,
  },
  "18442": {
    name: "APP Detroit Open",
    venue: "Detroit, MI",
    tz: "America/Detroit",
  },
  [APP_NEXT.eventId]: {
    name: APP_NEXT.name,
    venue: APP_NEXT.venue,
    tz: APP_NEXT.tz,
  },
};

type ActiveEvent = {
  id: string;
  name: string;
  venue: string;
  tz: string;
  source: string;
  startDate?: string;
  endDate?: string;
};

function envGet(key: string): string {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env?.get) {
      const v = Netlify.env.get(key);
      if (v) return String(v);
    }
  } catch {
    /* ignore */
  }
  return String(process.env[key] || "");
}

function ymdToday(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function inWindow(start: string, end: string, today: string, padDays = 1): boolean {
  if (!start) return false;
  const e = end || start;
  // pad: arm a day early / keep a day after
  const padStart = (() => {
    const [y, m, d] = start.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d - padDays)).toISOString().slice(0, 10);
  })();
  const padEnd = (() => {
    const [y, m, d] = e.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + padDays)).toISOString().slice(0, 10);
  })();
  return today >= padStart && today <= padEnd;
}

function profileFor(id: string, armed?: { name?: string; venue?: string; timezone?: string }): ActiveEvent {
  const p = PROFILES[id];
  return {
    id,
    name: (armed?.name || p?.name || `APP tournament ${id}`).trim(),
    venue: (armed?.venue || p?.venue || "").trim() || p?.venue || "",
    tz: (armed?.timezone || p?.tz || "UTC").trim() || "UTC",
    source: "profile",
  };
}

async function readAppConfig(): Promise<ActiveEvent | null> {
  try {
    const store = getStore({ name: BLOB_STORE, consistency: "strong" });
    const cfg = (await store.get("active-tournament", { type: "json" })) as {
      tournamentId?: string;
      denTournamentId?: string;
      name?: string;
      venue?: string;
      timezone?: string;
      tz?: string;
    } | null;
    const id = String(cfg?.tournamentId || cfg?.denTournamentId || "").replace(/\D/g, "");
    // Louisville 18454 can sit in blobs ahead of the cut. It is not the pin until APP_LIVE moves.
    if (!id || isPreparedNextDenId(id)) return null;
    const base = profileFor(id, {
      name: cfg?.name,
      venue: cfg?.venue,
      timezone: cfg?.timezone || cfg?.tz,
    });
    return { ...base, source: "wpm-app:active-tournament" };
  } catch {
    return null;
  }
}

async function readCalendarArmed(): Promise<ActiveEvent | null> {
  try {
    const store = getStore({ name: DESK_STORE, consistency: "strong" });
    const data = (await store.get("calendar-armed", { type: "json" })) as {
      events?: Array<{
        name?: string;
        venue?: string;
        timezone?: string;
        start?: string;
        end?: string;
        onLive?: boolean;
        status?: string;
        connector?: { type?: string; denTournamentId?: string };
      }>;
    } | null;
    const raw = Array.isArray(data?.events) ? data!.events! : [];
    const events = applyAppCalendarCut(raw);
    const appRows = events.filter((e) => {
      const id = String(e?.connector?.denTournamentId || "").replace(/\D/g, "");
      if (!id || isPreparedNextDenId(id)) return false;
      return e?.connector?.type === "app";
    });
    if (!appRows.length) return null;

    // Prefer in-window live-path / onLive, else any live-path, else first with den id
    const ranked = [...appRows].sort((a, b) => {
      const idA = String(a.connector?.denTournamentId || "");
      const tzA = a.timezone || PROFILES[idA]?.tz || "UTC";
      const today = ymdToday(tzA);
      const score = (e: typeof a) => {
        const id = String(e.connector?.denTournamentId || "");
        const tz = e.timezone || PROFILES[id]?.tz || "UTC";
        const t = ymdToday(tz);
        let s = 0;
        if (e.onLive || e.status === "live-path") s += 10;
        if (inWindow(String(e.start || ""), String(e.end || ""), t, 1)) s += 20;
        return s;
      };
      return score(b) - score(a);
    });

    const best = ranked[0];
    const id = String(best.connector!.denTournamentId!).replace(/\D/g, "");
    if (isEndedAppDenId(id)) return null;
    const base = profileFor(id, {
      name: id === APP_LIVE.eventId ? APP_LIVE.name : best.name,
      venue: best.venue,
      timezone: best.timezone,
    });
    const rawHadLive = raw.some((e) => {
      const den = String(e?.connector?.denTournamentId || "").replace(/\D/g, "");
      return den === id && (e.onLive || e.status === "live-path");
    });
    return { ...base, source: rawHadLive ? "calendar-armed" : "app-live-seed" };
  } catch {
    return null;
  }
}

/**
 * Resolve active Den tournamentId.
 * Priority: ?tournamentId= → env APP_DEN_TOURNAMENT_ID → Blobs wpm-app active-tournament
 * → Blobs wpm-desk calendar-armed (APP connector, code-seeds Columbus) → fallback 18448.
 * Ended Overland 18453 is ignored on env and blobs so a stale pin cannot keep the live path.
 * Prepared next pin Louisville 18454 is ignored on env and blobs until APP_LIVE = APP_NEXT.
 * Query still accepts 18453 and 18454 for smoke. LIVE only from Den RUNNING statuses.
 */
async function resolveActive(req?: Request): Promise<ActiveEvent> {
  const q = req ? new URL(req.url).searchParams.get("tournamentId") : null;
  if (q && /^\d+$/.test(q)) {
    return { ...profileFor(q), source: "query" };
  }
  const envId = envGet("APP_DEN_TOURNAMENT_ID") || envGet("DEN_TOURNAMENT_ID");
  if (envId && /^\d+$/.test(envId.trim()) && !isEndedAppDenId(envId) && !isPreparedNextDenId(envId)) {
    return { ...profileFor(envId.trim()), source: "env" };
  }
  const fromApp = await readAppConfig();
  if (fromApp && !isEndedAppDenId(fromApp.id) && !isPreparedNextDenId(fromApp.id)) return fromApp;
  const fromCal = await readCalendarArmed();
  if (fromCal && !isEndedAppDenId(fromCal.id) && !isPreparedNextDenId(fromCal.id)) return fromCal;
  return { ...profileFor(FALLBACK_ID), source: "fallback" };
}

/** Align with Den Live isRunningMatch — never clock-promote. Pending is not LIVE. */
const SKIP_STATUSES = new Set(["BYE", "WAITING_FOR_OPPONENT", "WAITINGFOROPPONENT"]);
const BRACKET_FETCH_CONCURRENCY = 6;
const BRACKET_FETCH_MS = 8000;
const BLOB_TTL_MS = 45_000;

function ymdInTz(d: Date, tz: string): string {
  return ymdInTzShared(d, tz);
}

function statusToken(raw: any): string {
  return denStatusToken(raw);
}

/** Pro brackets name "Pro"; skill-rating / Amateur brackets are amateur. */
function bracketTier(bracketName: string): "pro" | "amateur" {
  const n = String(bracketName || "");
  if (/\bAmateur\b/i.test(n)) return "amateur";
  if (/\bPro\b/i.test(n)) return "pro";
  return "amateur";
}

async function fetchJson(url: string, timeoutMs = BRACKET_FETCH_MS) {
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

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }
  const n = Math.min(Math.max(1, limit), Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

function blobStore() {
  try {
    return getStore({ name: BLOB_STORE, consistency: "strong" });
  } catch {
    return null;
  }
}

async function cachedBracketMatches(tournamentId: string, bracketId: string): Promise<{ content: any[]; fromCache: boolean; error?: string }> {
  const key = `bracket-matches:${tournamentId}:${bracketId}`;
  const store = blobStore();
  if (store) {
    try {
      const hit = (await store.get(key, { type: "json" })) as { at?: number; content?: any[] } | null;
      if (hit && typeof hit.at === "number" && Array.isArray(hit.content) && Date.now() - hit.at < BLOB_TTL_MS) {
        return { content: hit.content, fromCache: true };
      }
    } catch {
      /* ignore blob read errors — fetch live */
    }
  }
  try {
    const payload = await fetchJson(
      `${DEN}/api/bracket-matches?bracketId=${encodeURIComponent(bracketId)}&size=200`
    );
    const content = payload?.payload?.content || payload?.content || [];
    if (store) {
      try {
        await store.setJSON(key, { at: Date.now(), content });
      } catch {
        /* ignore blob write */
      }
    }
    return { content, fromCache: false };
  } catch (e: any) {
    // Soft fail: serve stale blob if present
    if (store) {
      try {
        const hit = (await store.get(key, { type: "json" })) as { at?: number; content?: any[] } | null;
        if (hit && Array.isArray(hit.content)) {
          return { content: hit.content, fromCache: true, error: String(e?.message || e) };
        }
      } catch {
        /* ignore */
      }
    }
    return { content: [], fromCache: false, error: String(e?.message || e) };
  }
}

function sideName(team: any): string {
  if (!team) return "TBD";
  if (team.bye) return "BYE";
  const ps = team.players || [];
  const names = ps
    .map((p: any) => (typeof p === "string" ? p : p?.name || p?.playerName || p?.displayName || ""))
    .filter(Boolean);
  if (!names.length) return team.teamName || "TBD";
  if (names.length === 1) return names[0];
  const short = names.map((n: string) => n.split(/\s+/).slice(-1)[0]);
  return short.join(" / ");
}

/**
 * Map Den match status → WPM LIVE | FT | NEXT.
 * LIVE only from Den running tokens (RUNNING / IN_PROGRESS / …); WAITING_FOR_COURT stays NEXT.
 * Never invent LIVE from the clock.
 */
function mapStatus(raw: string, completed: boolean): "LIVE" | "FT" | "NEXT" {
  const s = statusToken(raw);
  if (isDenLiveStatus(s) && !completed) return "LIVE";
  if (completed || s === "COMPLETED" || s === "COMPLETE" || s === "FINISHED" || s === "CLOSED") return "FT";
  return "NEXT";
}

/** Den match startTime is a Java-style LocalDateTime array: [y, M, d, H, m, s, nanos] (month 1-indexed, venue local). */
function localArrayToIso(arr: any, tz: string): string | null {
  if (!Array.isArray(arr) || arr.length < 5) return null;
  const [y, mo, d, h = 0, mi = 0, s = 0] = arr;
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(guess).map((p) => [p.type, p.value]));
  const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const wanted = Date.UTC(y, mo - 1, d, h, mi, s);
  return new Date(guess.getTime() + (wanted - asLocal)).toISOString();
}

function bracketStartIso(startDate: string, startTime: string | null, tz: string): string {
  const [hh = "08", mm = "00", ss = "00"] = (startTime || "08:00:00").split(":");
  const [y, mo, d] = startDate.split("-").map(Number);
  return localArrayToIso([y, mo, d, +hh, +mm, +ss, 0], tz) || `${startDate}T${hh}:${mm}:${ss}Z`;
}

function gameComplete(a: number, b: number) {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return hi >= 11 && hi - lo >= 2;
}

function linesFrom(m: any, aName: string, bName: string, st: string) {
  const scores = Array.isArray(m.scores) ? [...m.scores] : [];
  scores.sort((x: any, y: any) => (x.gameNumber || 0) - (y.gameNumber || 0));
  const lines: any[] = [];
  for (const g of scores) {
    const ga = g.team1Score;
    const gb = g.team2Score;
    if (ga == null || gb == null || ga === "" || gb === "") continue;
    const na = Number(ga);
    const nb = Number(gb);
    // Never surface pad/phantom 0–0 unless the match is LIVE (in progress game 1).
    if (na === 0 && nb === 0 && st !== "LIVE") continue;
    const done = st === "FT" && gameComplete(na, nb);
    const live = st === "LIVE" && !done && g === scores[scores.length - 1];
    lines.push({
      disc: "G" + (g.gameNumber || lines.length + 1),
      score: `${na}–${nb}`,
      winner: done ? (na > nb ? aName : nb > na ? bName : "") : "",
      live,
      court: live ? courtLabel(m) : "",
    });
  }
  // LIVE with no score lines yet: show in-progress without inventing 0–0.
  if (st === "LIVE" && !lines.length) {
    lines.push({ disc: "G1", score: "–", winner: "", live: true, court: courtLabel(m) });
  }
  return lines;
}

function courtLabel(m: any): string {
  const n = String(m?.courtName || "").trim();
  const num = m?.courtNumber != null && String(m.courtNumber).trim() !== "" ? String(m.courtNumber).trim() : "";
  if (n && num && !new RegExp(`\\b${num}\\b`).test(n)) return `${n} ${num}`.trim();
  return n || (num ? "Court " + num : "");
}

function toMatch(m: any, bracket: any, ev: ActiveEvent) {
  const a = sideName(m.team1);
  const b = sideName(m.team2);
  if (a === "TBD" || b === "TBD" || a === "BYE" || b === "BYE") return null;
  const raw = m.status || m.matchStatus || m.state || "";
  if (SKIP_STATUSES.has(statusToken(raw))) return null;
  const st = mapStatus(raw, !!m.completed);
  // Day truth: Den match clock, else medal → tournament.endDate. Never roll WAITING_FOR_COURT to today.
  const date = matchBoardDate(m, { bracketDate: bracket.startDate, eventEndDate: ev.endDate }) || ev.startDate || "";
  const matchStart = localArrayToIso(m.startTime, ev.tz) || localArrayToIso(m.scheduledTime, ev.tz);
  const hasClock = matchHasClock(m) && !!matchStart;
  // Bracket session start is a real Den field only when the match sits on that same local day.
  // Sunday Finals in a Thursday-started singles draw must not inherit Thursday 09:00.
  // Client only paints local time when hasClock — never invent a scheduled clock.
  const start =
    matchStart ||
    (date && date === bracket.startDate
      ? bracketStartIso(bracket.startDate || date, bracket.startTime || null, ev.tz)
      : "");
  const lines = linesFrom(m, a, b, st);
  const w0 = lines.filter((l) => l.winner === a).length;
  const w1 = lines.filter((l) => l.winner === b).length;
  const liveLine = lines.find((l) => l.live);
  const games = lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · ");
  const court = courtLabel(m);
  const winnerId = m.winningTeamId;
  const winnerName =
    winnerId != null && winnerId !== ""
      ? m.team1 && m.team1.teamId === winnerId
        ? a
        : m.team2 && m.team2.teamId === winnerId
          ? b
          : ""
      : "";
  const roster = rosterText([m.team1, m.team2]);
  const round = polishAppRound({
    round: m.round,
    roundDisplayName: m.roundDisplayName,
    matchType: m.matchType,
    totalRounds: bracket.totalRounds,
    bracketType: bracket.bracketType,
    hasThirdPlaceMatch: bracket.hasThirdPlaceMatch,
  });
  const tier = bracketTier(bracket.bracketName || "");
  const disc = discFromAppBracket(bracket);
  const format = isKnockoutBracket(bracket.bracketType) ? "ko" : "pool";
  const poolNum = Number(bracket.poolNumber);
  const poolCount = Number(bracket.poolCount);
  const pool = Number.isFinite(poolNum) && poolNum > 0 ? poolNum : null;
  return {
    id: "app-" + m.matchId,
    date,
    tour: "app",
    tier,
    comp: ev.name,
    div: [bracket.bracketName, pool ? "Pool " + pool : "", round].filter(Boolean).join(" · "),
    round,
    disc,
    format,
    pool,
    poolCount: Number.isFinite(poolCount) && poolCount > 1 ? poolCount : null,
    session: court ? court : "",
    a,
    b,
    roster,
    tags: tagsFor(`${a} ${b} ${roster}`),
    status: st,
    denStatus: statusToken(raw),
    start,
    // Never emit phantom 0-0. A dash-only in-progress line is not a score.
    score: denListedScore(w0, w1, lines),
    games,
    lines,
    court,
    hasClock,
    eventKey: ev.id ? "ev:app:" + ev.id : "ev:app",
    note: liveLine
      ? `In play ${liveLine.disc}${liveLine.score && liveLine.score !== "–" ? " " + liveLine.score : ""}`
      : st === "FT" && !lines.length
        ? denUnscoredNote(m.incompleteReason, winnerName)
        : court || "",
    watch: "", // stay in-app — no bounce to Den/APPTV as product path
    venue: ev.venue,
    tz: ev.tz,
  };
}

export default async (req: Request, _context?: Context) => {
  const degraded: string[] = [];
  const active = await resolveActive(req);
  const TOURNAMENT_ID = active.id;
  let COMP = active.name;
  let VENUE = active.venue;
  let TZ = active.tz;
  try {
    const [infoRes, brRes] = await Promise.all([
      fetchJson(`${DEN}/api/tournament-info?tournamentId=${TOURNAMENT_ID}`, 10000),
      fetchJson(`${DEN}/api/tournament-brackets?tournamentId=${TOURNAMENT_ID}`, 10000),
    ]);
    const denName = brRes?.tournament?.name;
    if (denName) COMP = denName;
    const venueName = infoRes?.info?.venue?.name || VENUE;
    if (venueName) VENUE = venueName;
    // refresh active snapshot used by toMatch
    active.name = COMP;
    active.venue = VENUE;
    active.startDate = brRes?.tournament?.startDate || active.startDate || "";
    active.endDate = brRes?.tournament?.endDate || active.endDate || "";
    const brackets: any[] = brRes?.brackets?.content || [];
    const bracketIndex = brackets.map((b) => bracketIndexEntry(b)).filter(Boolean);
    const todayTz = ymdInTz(new Date(), TZ);
    const eventPayload = {
      id: TOURNAMENT_ID,
      name: COMP,
      venue: venueName,
      tz: TZ,
      startDate: active.startDate,
      endDate: active.endDate,
      idSource: active.source,
      eventKey: "ev:app:" + TOURNAMENT_ID,
    };
    if (!brackets.length) {
      const phase = appBoardPhase({
        liveCount: 0,
        matches: [],
        brackets: [],
        startDate: active.startDate,
        endDate: active.endDate,
        today: todayTz,
        delayed: false,
      });
      // Upcoming event with no bracket list yet is pre-serve, not a broken live board.
      if (phase.preServe) {
        return Response.json(
          {
            updated: new Date().toISOString(),
            source: "den-live",
            delayed: false,
            preServe: true,
            reader: phase.reader,
            liveCount: 0,
            matches: [],
            brackets: {},
            bracketIndex,
            event: eventPayload,
          },
          { headers: { "Cache-Control": "public, max-age=15" } }
        );
      }
      return Response.json(
        {
          updated: new Date().toISOString(),
          source: "den-live",
          delayed: true,
          message: "scores delayed",
          matches: [],
          brackets: {},
          bracketIndex,
          degraded: ["brackets:empty"],
          event: eventPayload,
        },
        { headers: { "Cache-Control": "public, max-age=15" } }
      );
    }

    const window = new Set([addDays(todayTz, -1), todayTz, addDays(todayTz, 1)]);
    const selected = brackets
      .filter((b) => isDenRunningBracket(b.status) || window.has(b.startDate))
      // Prefer running brackets first so LIVE lands even if later fetches time out.
      .sort((a, b) => Number(isDenRunningBracket(b.status)) - Number(isDenRunningBracket(a.status)));

    const settled = await mapPool(selected, BRACKET_FETCH_CONCURRENCY, async (b) => {
      const { content, fromCache, error } = await cachedBracketMatches(TOURNAMENT_ID, String(b.bracketId));
      if (error) degraded.push(`bracket:${b.bracketId}:${content.length ? "stale" : "fail"}`);
      return { bracket: b, matches: content, error: error || null, fromCache };
    });

    const hardFail = settled.filter((s) => s.error && !s.matches.length).length;
    const staleOk = settled.filter((s) => s.error && s.matches.length).length;
    const softNotes: string[] = [];
    if (hardFail) softNotes.push(`${hardFail} bracket(s) unavailable`);
    if (staleOk) softNotes.push(`${staleOk} bracket(s) served from short cache after fetch error`);
    const failNotes = degraded.slice();

    const all = settled
      .flatMap(({ bracket, matches }) => matches.map((m: any) => toMatch(m, bracket, active)))
      .filter(Boolean) as any[];

    const matches = all
      .filter((m) => keepAppMatch(m, todayTz, active.endDate))
      .sort((a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE"));

    const bracketsOut: Record<string, any> = {};
    for (const m of all) {
      const div = (m.div || "").split(" · ")[0] || "Draw";
      const round = m.round || (m.div || "").split(" · ")[1] || "Round";
      const rec = (bracketsOut[div] ||= {});
      (rec[round] ||= []).push({
        id: m.id,
        a: m.a,
        b: m.b,
        score: m.score,
        status: m.status,
        games: m.games,
        date: m.date,
        tier: m.tier,
        disc: m.disc,
        format: m.format,
        pool: m.pool || null,
      });
    }

    const liveCount = matches.filter((m) => m.status === "LIVE" && isDenLiveStatus(m.denStatus)).length;
    const phase = appBoardPhase({
      liveCount,
      matches,
      brackets,
      startDate: active.startDate,
      endDate: active.endDate,
      today: todayTz,
      delayed: false,
    });
    const partial = hardFail > 0 && matches.length > 0;

    return Response.json(
      {
        updated: new Date().toISOString(),
        source: "den-live",
        matches,
        brackets: bracketsOut,
        bracketIndex,
        liveCount,
        preServe: phase.preServe,
        reader: phase.reader || undefined,
        degraded: failNotes.length ? failNotes : undefined,
        note: softNotes.length ? softNotes.join(" · ") : undefined,
        partial: partial || undefined,
        event: eventPayload,
      },
      { headers: { "Cache-Control": "public, max-age=15" } }
    );
  } catch (e: any) {
    return Response.json(
      {
        updated: new Date().toISOString(),
        source: "den-live",
        delayed: true,
        message: "scores delayed",
        matches: [],
        degraded: ["fatal:" + String(e?.message || e)],
        error: String(e?.message || e),
      },
      { status: 200, headers: { "Cache-Control": "public, max-age=10" } }
    );
  }
};

export const config: Config = { path: "/api/app" };
