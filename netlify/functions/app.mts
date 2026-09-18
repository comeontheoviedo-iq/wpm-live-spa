import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

/** APP (Association of Pickleball Professionals) via Den Live proxies. */
const DEN = "https://denlive.pickleballden.com";
const FALLBACK_ID = "18453"; // APP Dillons Overland Park Open — last known live stop
const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };
const BLOB_STORE = "wpm-app";
const DESK_STORE = "wpm-desk";

/** Static intake profiles for known Den tournamentIds (tz derived — Den info has no IANA). */
const PROFILES: Record<
  string,
  { name: string; venue: string; tz: string }
> = {
  "18453": {
    name: "APP Dillons Overland Park Open",
    venue: "AdventHealth Sports Park at Bluhawk, Overland Park, KS",
    tz: "America/Chicago",
  },
  "18442": {
    name: "APP Detroit Open",
    venue: "Detroit, MI",
    tz: "America/Detroit",
  },
  "18454": {
    name: "Humana APP Louisville Open",
    venue: "Louisville, KY",
    tz: "America/New_York",
  },
};

type ActiveEvent = {
  id: string;
  name: string;
  venue: string;
  tz: string;
  source: string;
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
    if (!id) return null;
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
    const events = Array.isArray(data?.events) ? data!.events! : [];
    const appRows = events.filter(
      (e) =>
        e?.connector?.type === "app" &&
        String(e?.connector?.denTournamentId || "").replace(/\D/g, "")
    );
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
    const base = profileFor(id, {
      name: best.name,
      venue: best.venue,
      timezone: best.timezone,
    });
    return { ...base, source: "calendar-armed" };
  } catch {
    return null;
  }
}

/**
 * Resolve active Den tournamentId.
 * Priority: ?tournamentId= → env APP_DEN_TOURNAMENT_ID → Blobs wpm-app active-tournament
 * → Blobs wpm-desk calendar-armed (APP connector) → fallback 18453.
 */
async function resolveActive(req?: Request): Promise<ActiveEvent> {
  const q = req ? new URL(req.url).searchParams.get("tournamentId") : null;
  if (q && /^\d+$/.test(q)) {
    return { ...profileFor(q), source: "query" };
  }
  const envId = envGet("APP_DEN_TOURNAMENT_ID") || envGet("DEN_TOURNAMENT_ID");
  if (envId && /^\d+$/.test(envId.trim())) {
    return { ...profileFor(envId.trim()), source: "env" };
  }
  const fromApp = await readAppConfig();
  if (fromApp) return fromApp;
  const fromCal = await readCalendarArmed();
  if (fromCal) return fromCal;
  return { ...profileFor(FALLBACK_ID), source: "fallback" };
}

/** Align with Den Live isRunningMatch — never clock-promote. */
const LIVE_STATUSES = new Set(["RUNNING", "IN_PROGRESS", "INPROGRESS", "STARTED", "PLAYING"]);
const SKIP_STATUSES = new Set(["BYE", "WAITING_FOR_OPPONENT", "WAITINGFOROPPONENT"]);
const BRACKET_FETCH_CONCURRENCY = 6;
const BRACKET_FETCH_MS = 8000;
const BLOB_TTL_MS = 45_000;

function ymdInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function statusToken(raw: any): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
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

function tagsFor(a: string, b: string) {
  const blob = (a + " " + b).toLowerCase();
  const tags: string[] = [];
  for (const t of ["Waters", "Johns", "Bright", "Jardim", "Devilliers", "Fu"]) {
    if (blob.includes(t.toLowerCase())) tags.push(t);
  }
  return tags;
}

/**
 * Map Den match status → WPM LIVE | FT | NEXT.
 * LIVE only from Den running tokens (RUNNING / IN_PROGRESS / …); WAITING_FOR_COURT stays NEXT.
 * Never invent LIVE from the clock.
 */
function mapStatus(raw: string, completed: boolean): "LIVE" | "FT" | "NEXT" {
  const s = statusToken(raw);
  if (LIVE_STATUSES.has(s) && !completed) return "LIVE";
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

function matchDate(m: any, bracketDate: string, st: string, todayTz: string): string {
  // Rolling: live / on-deck sit on "today" so the desk sees them without flipping dates.
  if (st === "LIVE" || statusToken(m.status || m.matchStatus || m.state) === "WAITING_FOR_COURT") return todayTz;
  const arr = m.startTime || m.endTime;
  if (Array.isArray(arr) && arr.length >= 3) {
    const [y, mo, d] = arr;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return bracketDate || todayTz;
}

function toMatch(m: any, bracket: any, todayTz: string, ev: ActiveEvent) {
  const a = sideName(m.team1);
  const b = sideName(m.team2);
  if (a === "TBD" || b === "TBD" || a === "BYE" || b === "BYE") return null;
  const raw = m.status || m.matchStatus || m.state || "";
  if (SKIP_STATUSES.has(statusToken(raw))) return null;
  const st = mapStatus(raw, !!m.completed);
  const date = matchDate(m, bracket.startDate, st, todayTz);
  const start =
    localArrayToIso(m.startTime, ev.tz) ||
    localArrayToIso(m.scheduledTime, ev.tz) ||
    bracketStartIso(bracket.startDate || date, bracket.startTime || null, ev.tz);
  const lines = linesFrom(m, a, b, st);
  const w0 = lines.filter((l) => l.winner === a).length;
  const w1 = lines.filter((l) => l.winner === b).length;
  const liveLine = lines.find((l) => l.live);
  const games = lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · ");
  const court = courtLabel(m);
  const round = m.roundDisplayName || (m.round != null ? "Round " + m.round : "");
  const tier = bracketTier(bracket.bracketName || "");
  return {
    id: "app-" + m.matchId,
    date,
    tour: "app",
    tier,
    comp: ev.name,
    div: [bracket.bracketName, round].filter(Boolean).join(" · "),
    round,
    session: court ? court : "",
    a,
    b,
    tags: tagsFor(a, b),
    status: st,
    start,
    // Never emit phantom 0-0: FT with no played games (walkover/empty Den row) stays score-blank.
    score: !w0 && !w1 && !liveLine ? "" : `${w0}-${w1}`,
    games,
    lines,
    court,
    note: liveLine
      ? `In play ${liveLine.disc}${liveLine.score && liveLine.score !== "–" ? " " + liveLine.score : ""}`
      : st === "FT" && !lines.length
        ? "Result recorded (no game scores)"
        : court || "",
    watch: "", // stay in-app — no bounce to Den/APPTV as product path
    venue: ev.venue,
    tz: ev.tz,
  };
}

function keepMatch(m: any, todayTz: string) {
  if (m.status === "LIVE" || m.status === "FT") {
    const y = addDays(todayTz, -1);
    return !m.date || m.date >= y;
  }
  // NEXT: today ± 1 day
  const y = addDays(todayTz, -1);
  const t = addDays(todayTz, 1);
  if (m.date && m.date >= y && m.date <= t) return true;
  const start = m.start ? new Date(m.start) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const ageMs = Date.now() - start.getTime();
    return ageMs <= 48 * 3600000;
  }
  return false;
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
    const brackets: any[] = brRes?.brackets?.content || [];
    if (!brackets.length) {
      return Response.json(
        {
          updated: new Date().toISOString(),
          source: "den-live",
          delayed: true,
          message: "scores delayed",
          matches: [],
          degraded: ["brackets:empty"],
          event: { id: TOURNAMENT_ID, name: COMP, venue: venueName, tz: TZ },
        },
        { headers: { "Cache-Control": "public, max-age=15" } }
      );
    }

    const todayTz = ymdInTz(new Date(), TZ);
    const window = new Set([addDays(todayTz, -1), todayTz, addDays(todayTz, 1)]);
    const selected = brackets
      .filter(
        (b) =>
          b.status === "Running" ||
          window.has(b.startDate) ||
          LIVE_STATUSES.has(statusToken(b.status))
      )
      // Prefer Running brackets first so LIVE lands even if later fetches time out.
      .sort((a, b) => Number(b.status === "Running") - Number(a.status === "Running"));

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
      .flatMap(({ bracket, matches }) => matches.map((m: any) => toMatch(m, bracket, todayTz, active)))
      .filter(Boolean) as any[];

    const matches = all
      .filter((m) => keepMatch(m, todayTz))
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
      });
    }

    const liveCount = matches.filter((m) => m.status === "LIVE").length;
    const partial = hardFail > 0 && matches.length > 0;

    return Response.json(
      {
        updated: new Date().toISOString(),
        source: "den-live",
        matches,
        brackets: bracketsOut,
        liveCount,
        degraded: failNotes.length ? failNotes : undefined,
        note: softNotes.length ? softNotes.join(" · ") : undefined,
        partial: partial || undefined,
        event: {
          id: TOURNAMENT_ID,
          name: COMP,
          venue: venueName,
          tz: TZ,
          startDate: brRes?.tournament?.startDate,
          endDate: brRes?.tournament?.endDate,
          idSource: active.source,
        },
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
