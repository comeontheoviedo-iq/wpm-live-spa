import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { tagsFor } from "./follow-tags.mjs";
import {
  APP_ASIA_ORGANIZER_URL,
  CHONGQING,
  SPORTSSYNC_LIVE_SAFE,
  SPORTSSYNC_ORIGIN,
  applySportsSyncArm,
  countLive,
  isChongqingName,
  isDryRunSportsSyncId,
  listedSportsSyncEvent,
  mapScheduleHtml,
  mapScoresPayload,
  normalizeSportsSyncId,
} from "./sportssync-map.mjs";

const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };
const DESK_STORE = "wpm-desk";

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

async function fetchText(url: string, accept: string, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { ...UA, Accept: accept },
      signal: ctrl.signal,
      redirect: "follow",
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (e: any) {
    return { ok: false, status: 0, text: "", error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

type ArmedPick = {
  id: string;
  name: string;
  venue: string;
  tz: string;
  start: string;
  end: string;
  source: string;
};

async function readCalendarArmed(): Promise<ArmedPick | null> {
  try {
    const store = getStore({ name: DESK_STORE, consistency: "strong" });
    const data = (await store.get("calendar-armed", { type: "json" })) as {
      events?: Array<Record<string, any>>;
    } | null;
    const events = Array.isArray(data?.events) ? data!.events! : [];
    const rows = events
      .map((row) => applySportsSyncArm(row))
      .filter((row) => row?.connector?.type === "sportssync" && row.connector.sportsSyncTournamentId);
    if (!rows.length) return null;
    const today = new Date().toISOString().slice(0, 10);
    const ranked = [...rows].sort((a, b) => {
      const score = (e: any) => {
        const start = String(e.start || "");
        const end = String(e.end || start);
        return today >= start && today <= end ? 1 : 0;
      };
      return score(b) - score(a);
    });
    const best = ranked[0];
    const id = normalizeSportsSyncId(best.connector.sportsSyncTournamentId);
    if (!id) return null;
    if (isChongqingName(best.name) && isDryRunSportsSyncId(id)) return null;
    return {
      id,
      name: String(best.name || ""),
      venue: String(best.venue || ""),
      tz: String(best.timezone || best.tz || ""),
      start: String(best.start || ""),
      end: String(best.end || ""),
      source: "calendar-armed",
    };
  } catch {
    return null;
  }
}

function eventFor(id: string, armed: ArmedPick | null) {
  const listed = listedSportsSyncEvent(id);
  const name = (armed && armed.id === id && armed.name) || listed?.name || `SportsSync tournament ${id}`;
  const chongqing = isChongqingName(name);
  return {
    id,
    name: chongqing ? CHONGQING.name : name,
    venue: (armed && armed.id === id && armed.venue) || listed?.venue || (chongqing ? CHONGQING.venue : ""),
    tz: (armed && armed.id === id && armed.tz) || listed?.tz || (chongqing ? CHONGQING.tz : ""),
    startDate: (armed && armed.id === id && armed.start) || listed?.start || (chongqing ? CHONGQING.start : ""),
    endDate: (armed && armed.id === id && armed.end) || listed?.end || (chongqing ? CHONGQING.end : ""),
    tour: "app-asia",
    sportsSyncTournamentId: id,
    dryRun: isDryRunSportsSyncId(id),
    chongqing: chongqing && !isDryRunSportsSyncId(id),
    organizerUrl: APP_ASIA_ORGANIZER_URL,
    eventKey: "ev:sportssync:" + id,
    liveSafe: false,
  };
}

function unarmedBody() {
  return {
    updated: new Date().toISOString(),
    source: "sportssync",
    armed: false,
    resultsOnly: true,
    liveSafe: SPORTSSYNC_LIVE_SAFE,
    liveCount: 0,
    onLive: false,
    delayed: false,
    matches: [],
    message: "No SportsSync tournamentId armed. Chongqing is not listed yet.",
    event: {
      name: CHONGQING.name,
      venue: CHONGQING.venue,
      tz: CHONGQING.tz,
      startDate: CHONGQING.start,
      endDate: CHONGQING.end,
      tour: "app-asia",
      sportsSyncTournamentId: null,
      organizerUrl: APP_ASIA_ORGANIZER_URL,
      liveSafe: false,
    },
  };
}

export default async (req: Request) => {
  const q = new URL(req.url).searchParams.get("tournamentId");
  let id = normalizeSportsSyncId(q || "");
  let source = q ? "query" : "";
  let armed: ArmedPick | null = null;

  if (!id) {
    const envId = normalizeSportsSyncId(envGet("SPORTSSYNC_TOURNAMENT_ID"));
    if (envId) {
      id = envId;
      source = "env";
    }
  }
  if (!id) {
    armed = await readCalendarArmed();
    if (armed?.id) {
      id = armed.id;
      source = armed.source;
    }
  }

  if (!id) {
    return Response.json(unarmedBody(), { headers: { "Cache-Control": "public, max-age=30" } });
  }

  const ev = eventFor(id, armed && armed.id === id ? armed : armed);
  if (source === "query" || source === "env") {
    ev.name = listedSportsSyncEvent(id)?.name || ev.name;
  }
  const ctx = {
    tournamentId: id,
    name: ev.name,
    venue: ev.venue,
    tz: ev.tz,
    startDate: ev.startDate,
    year: String(ev.startDate || "").slice(0, 4),
  };

  const scoresUrl = `${SPORTSSYNC_ORIGIN}/tournament/api/${id}/scores`;
  const scores = await fetchText(scoresUrl, "application/json", 10000);
  let payload: any = null;
  if (scores.ok) {
    try {
      payload = scores.text ? JSON.parse(scores.text) : [];
    } catch {
      payload = null;
    }
  }

  let matches: any[] = [];
  let feed = "sportssync-scores";
  let partial = false;
  let note =
    "Results only. SportsSync has no proven in-progress status — cards are FT or NEXT, never LIVE.";
  const degraded: string[] = [];

  if (scores.ok && payload != null) {
    matches = mapScoresPayload(payload, ctx, tagsFor);
  } else {
    degraded.push(scores.ok ? "scores:bad-json" : `scores:${scores.status || scores.error || "fail"}`);
  }

  if (!matches.length) {
    const scheduleUrl = `${SPORTSSYNC_ORIGIN}/tournament/${id}/schedule/search`;
    const page = await fetchText(scheduleUrl, "text/html", 12000);
    if (page.ok && page.text) {
      const parsed = mapScheduleHtml(page.text, ctx, tagsFor);
      if (parsed.matches.length) {
        matches = parsed.matches;
        feed = "sportssync-schedule";
        partial = true;
        note += " Scores JSON had no rows; schedule search HTML supplied results (one page, often one date).";
      } else if (!scores.ok) {
        degraded.push("schedule:empty");
      }
    } else if (!scores.ok) {
      degraded.push(`schedule:${page.status || page.error || "fail"}`);
    } else {
      note += " Scores JSON was empty. Schedule page did not add rows.";
    }
  }

  matches = matches.map((m) =>
    m.status === "LIVE" ? { ...m, status: "NEXT", liveSuppressed: true, lines: (m.lines || []).map((l: any) => ({ ...l, live: false })) } : m
  );
  const liveCount = countLive(matches);
  const bothFailed = !scores.ok && !matches.length && degraded.some((d) => d.startsWith("schedule:"));

  return Response.json(
    {
      updated: new Date().toISOString(),
      source: feed,
      idSource: source,
      armed: true,
      resultsOnly: true,
      liveSafe: false,
      liveCount,
      onLive: false,
      delayed: bothFailed,
      message: bothFailed ? "scores delayed" : undefined,
      partial: partial || undefined,
      note,
      degraded: degraded.length ? degraded : undefined,
      matches,
      event: ev,
    },
    { headers: { "Cache-Control": "public, max-age=20" } }
  );
};

export const config: Config = { path: "/api/sportssync" };
