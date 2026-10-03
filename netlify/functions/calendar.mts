import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import {
  SLATE,
  APP_LIVE,
  ENDED_APP,
  ENDED_PPA,
  PARKED_PPA,
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  GIJON,
  applyAppCalendarCut,
  asCalendarRow,
  isBlockedPpaEventId,
  isParkedPpaEventId,
  isAppAsiaName,
  matchesSlateName,
  coverageSeedFor,
  LOUISVILLE,
  readerStatusLine,
  toReaderEvent,
} from "./slate-events.mjs";
import { applySportsSyncArm, CHONGQING_DESK_NOTE } from "./sportssync-map.mjs";

const GPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmVlZGhxaW51ZGFzbmdrcXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDkzMDIsImV4cCI6MjA3NjEyNTMwMn0.U6VPCpYEtyFkVwxQ7yMAbGf_huWORMg_8iyyd-WkADc";
const GPA = "https://prneedhqinudasngkqqi.supabase.co/rest/v1";

/** Known shipped live connectors — status live-path when desk arms with these ids. */
const KNOWN = {
  app18448: {
    type: "app",
    denTournamentId: APP_LIVE.eventId,
    scorePath: APP_LIVE.scorePath,
    timezone: APP_LIVE.tz,
    name: APP_LIVE.shortName,
    venue: APP_LIVE.venue,
    live: true,
  },
  app18453: {
    type: "app",
    denTournamentId: ENDED_APP.overland.denTournamentId,
    scorePath: null,
    timezone: ENDED_APP.overland.timezone,
    name: ENDED_APP.overland.name,
    live: false,
    ended: true,
  },
  app18442: {
    type: "app",
    denTournamentId: "18442",
    scorePath: "/api/app",
    timezone: "America/Detroit",
    name: "APP Detroit Open",
  },
  app18454: {
    type: "app",
    denTournamentId: "18454",
    scorePath: "/api/app",
    timezone: "America/New_York",
    name: "Humana APP Louisville Open",
  },
  ppaLasVegas: {
    type: "ppa",
    ppaEventId: PPA_LIVE_EVENT_ID,
    scorePath: "/api/ppa",
    timezone: PPA_LIVE.tz,
    name: PPA_LIVE.name,
    venue: PPA_LIVE.venue,
    live: true,
  },
  /** Ended 27 Sep 2026, no scores. Unparked — not a live path and not a cutover target. */
  ppaBarcelona: {
    type: "ppa",
    ppaEventId: ENDED_PPA.barcelona.ppaEventId,
    scorePath: null,
    timezone: ENDED_PPA.barcelona.timezone,
    name: ENDED_PPA.barcelona.name,
    live: false,
    parked: false,
    ended: true,
  },
  tpbGijon: {
    type: "none",
    scorePath: null,
    timezone: GIJON.timezone,
    name: GIJON.name,
    live: false,
    drawUrl: GIJON.drawUrl,
    officialUrl: GIJON.officialUrl,
  },
  wcDanang: {
    type: "url",
    scoreUrl: "/api/worldcup",
    scorePath: "/api/worldcup",
    timezone: "Asia/Ho_Chi_Minh",
  },
  /** Results path only. Chongqing has no id. 89 and 222 are KL and Penang, not Chongqing. */
  sportssyncAsia: {
    type: "sportssync",
    scorePath: "/api/sportssync",
    live: false,
    resultsOnly: true,
    organizerId: "1645900",
    organizerUrl: "https://www.sportssync.asia/organizers/1645900",
    listedAsOf: "2026-10-02",
    listedTournamentIds: ["89", "222"],
    unresolvedTournamentIds: ["390", "391"],
    chongqingSportsSyncId: null,
    timezone: "Asia/Shanghai",
    name: "APP Asia Chongqing Open",
  },
};

type Connector = {
  type: "none" | "app" | "ppa" | "url" | "djoy" | "sportssync";
  denTournamentId?: string;
  ppaEventId?: string;
  sportsSyncTournamentId?: string;
  scoreUrl?: string;
  scorePath?: string;
};

type ArmedEvent = {
  id: string;
  name: string;
  venue: string;
  timezone: string;
  tour: string;
  host: string;
  tier: string;
  start: string;
  end: string;
  connector: Connector;
  status: "live-path" | "delayed" | "results-only";
  onLive: boolean;
  note: string;
  armedAt: string;
  gpaName?: string;
  gpaStart?: string;
};

function store() {
  return getStore({ name: "wpm-desk", consistency: "strong" });
}

function eventId(name: string, start: string) {
  const n = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const s = String(start || "").slice(0, 10);
  return `gpa:${encodeURIComponent(n)}:${s}`;
}

function deskKey() {
  return (
    (typeof Netlify !== "undefined" && Netlify.env?.get("DESK_KEY")) ||
    process.env.DESK_KEY ||
    process.env.DESK_PASSWORD ||
    ""
  );
}

function hasScorePath(c: Connector | null | undefined): boolean {
  if (!c || c.type === "none") return false;
  if (c.type === "app") return Boolean(c.denTournamentId && String(c.denTournamentId).trim());
  if (c.type === "ppa") {
    const id = c.ppaEventId && String(c.ppaEventId).trim();
    // Ended Barcelona and the April Las Vegas UUID are not a working live path.
    if (!id || isParkedPpaEventId(id) || isBlockedPpaEventId(id)) return false;
    return true;
  }
  if (c.type === "url" || c.type === "djoy")
    return Boolean((c.scoreUrl || c.scorePath) && String(c.scoreUrl || c.scorePath).trim());
  if (c.type === "sportssync") return Boolean(String(c.sportsSyncTournamentId || "").trim());
  return false;
}

function resolveScorePath(c: Connector): string | null {
  if (!hasScorePath(c)) return null;
  if (c.type === "app") return c.scorePath || "/api/app";
  if (c.type === "ppa") return c.scorePath || "/api/ppa";
  if (c.type === "sportssync") return c.scorePath || "/api/sportssync";
  return c.scorePath || c.scoreUrl || null;
}

/** Intake gate — see docs/coverage-intake.md */
function intakeStatus(input: {
  name: string;
  venue: string;
  timezone: string;
  connector: Connector;
  delayed?: boolean;
}): { status: ArmedEvent["status"]; onLive: boolean; intake: Record<string, boolean> } {
  const nameOk = Boolean(input.name && input.name.trim());
  const venueOk = Boolean(input.venue && input.venue.trim());
  const tzOk = Boolean(input.timezone && input.timezone.trim());
  const pathOk = hasScorePath(input.connector);
  const intake = { name: nameOk, venue: venueOk, timezone: tzOk, scorePath: pathOk };
  if (nameOk && venueOk && tzOk && pathOk) {
    if (input.delayed) return { status: "delayed", onLive: false, intake };
    return { status: "live-path", onLive: true, intake };
  }
  if (nameOk && venueOk && !pathOk) {
    return { status: "results-only", onLive: false, intake };
  }
  // Partial intake with a path claimed but missing venue/tz → delayed, never live
  if (pathOk) return { status: "delayed", onLive: false, intake };
  return { status: "results-only", onLive: false, intake };
}

async function loadArmed(): Promise<{ updated: string | null; events: ArmedEvent[] }> {
  try {
    const s = store();
    const data = (await s.get("calendar-armed", { type: "json" })) as {
      updated?: string;
      events?: ArmedEvent[];
    } | null;
    if (data && Array.isArray(data.events)) {
      return { updated: data.updated || null, events: data.events };
    }
  } catch {
    /* blobs unavailable locally */
  }
  return { updated: null, events: [] };
}

async function saveArmed(events: ArmedEvent[]) {
  const s = store();
  const payload = { updated: new Date().toISOString(), events };
  await s.setJSON("calendar-armed", payload);
  return payload;
}

async function gpaEvents() {
  const res = await fetch(
    `${GPA}/tournaments?select=name,tournament_date,end_date,location,tier,host,prize_pool,venue,registration_url&order=tournament_date.asc&limit=60`,
    { headers: { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY } }
  );
  if (!res.ok) return [];
  return await res.json();
}

function guessTour(host: string, name: string): string {
  const h = String(host || "").toUpperCase();
  const n = String(name || "");
  if (h === "MLP" || /\bMLP\b/i.test(n)) return "mlp-asia"; // never APP
  if (/RTA2000|\bRTA\b|Farnham/i.test(n + " " + h)) return "rta";
  if (/Gij[oó]n/i.test(n) || /TOP Pickleball|\bTPB\b/i.test(n)) return "tpb";
  if (/Barcelona/i.test(n) && /PPA/i.test(n + h)) return "ppa-eu";
  if (isAppAsiaName(n) || (h === "APP" && /Asia/i.test(n))) return "app-asia";
  if (h === "APP" || /\bAPP\b/i.test(n)) return "app";
  if (h === "PPA" || /PPA/i.test(n)) return "ppa";
  if (h === "DJOY" || /D-JOY|DJOY/i.test(n)) return "gpa";
  if (/world cup/i.test(n)) return "wc";
  if (h === "NPL") return "npl";
  return (host || "gpa").toLowerCase();
}

function mergeCalendar(gpaRows: any[], armed: ArmedEvent[]) {
  const byId: Record<string, ArmedEvent> = {};
  for (const a of armed) byId[a.id] = a;

  const today = new Date().toISOString().slice(0, 10);
  const events = (gpaRows || []).map((e: any) => {
    let start = String(e.tournament_date || "").slice(0, 10);
    let end = String(e.end_date || start).slice(0, 10);
    const name = e.name || "";
    const id = eventId(name, start);
    const armedRow = byId[id];
    let venue = e.venue || e.location || "";
    const host = e.host || "";
    const tour = guessTour(host, name);
    let status: "live-path" | "delayed" | "results-only" | "ended" = "results-only";
    let onLive = false;
    let connector: Connector | null = null;
    let timezone = "";
    let note = "";
    let armedAt: string | null = null;

    if (armedRow) {
      status = armedRow.status;
      onLive = armedRow.onLive;
      connector = armedRow.connector;
      timezone = armedRow.timezone;
      note = armedRow.note || "";
      armedAt = armedRow.armedAt;
    } else {
      // Soft hints. Columbus is code-armed above. Overland is ended. Chongqing has no Den id.
      if (/Overland Park/i.test(name) && tour === "app") {
        note =
          "Ended 20 Sep 2026. Den 18453 is disarmed (not onLive). Live APP is Columbus Open 18448.";
        status = "ended";
        onLive = false;
        connector = null;
        timezone = timezone || ENDED_APP.overland.timezone;
      } else if (/Louisville/i.test(name) && tour === "app") {
        note = LOUISVILLE.note;
        timezone = timezone || LOUISVILLE.timezone;
        if (!venue || /^usa$/i.test(venue)) venue = LOUISVILLE.venue;
        status = "results-only";
        onLive = false;
        connector = null;
      } else if (/Detroit/i.test(name) && tour === "app") {
        note = "Known Den id 18442 (past) — Den Live brackets verified";
      } else if (/Sendai/i.test(name)) {
        note =
          "No Den Live tournamentId — hosted on Tournated/Japan pickleball (games.japanpickleball.org/11359), not Den";
        status = "results-only";
      } else if (/Chongqing/i.test(name)) {
        note = CHONGQING_DESK_NOTE;
        timezone = timezone || "Asia/Shanghai";
        status = "results-only";
        onLive = false;
        connector = null;
      } else if (isAppAsiaName(name)) {
        note =
          "APP Asia Tour — not MLP Asia. No Den Live id. SportsSync /api/sportssync is results-only once a real tournamentId is listed. Do not fake LIVE.";
        status = "results-only";
        onLive = false;
        connector = null;
      }
    }

    const seedHit = coverageSeedFor(name);
    if (seedHit && !armedRow) {
      timezone = timezone || seedHit.timezone;
      if (!venue || /^usa$/i.test(venue)) venue = seedHit.venue || venue;
      if (seedHit.dateAuthority === "official" && seedHit.start && seedHit.end) {
        start = seedHit.start;
        end = seedHit.end;
        note = seedHit.note;
      } else {
        note = note || seedHit.note;
      }
      if (seedHit.status === "delayed") status = "delayed";
      else if (status !== "live-path") status = seedHit.status;
      if (seedHit.onLive === false) onLive = false;
    }
    return {
      id,
      name,
      start,
      end,
      venue: (armedRow && armedRow.venue) || venue || seedHit?.venue || "",
      location: e.location || "",
      tier: e.tier || "",
      host,
      tour: seedHit?.tour || tour,
      prize_pool: e.prize_pool ?? null,
      registration_url: e.registration_url || seedHit?.officialUrl || "",
      armed: Boolean(armedRow),
      onLive,
      status: armedRow ? status : status === "ended" ? "ended" : end < today ? "results-only" : status,
      timezone,
      connector,
      note,
      armedAt,
      upcoming: end >= today,
      officialUrl: seedHit?.officialUrl || "",
      drawUrl: seedHit?.drawUrl || "",
    };
  });

  // Armed rows that no longer appear on GPA slate still surface
  const gpaIds = new Set(events.map((e: any) => e.id));
  for (const a of armed) {
    if (gpaIds.has(a.id)) continue;
    events.push({
      id: a.id,
      name: a.name,
      start: a.start,
      end: a.end,
      venue: a.venue,
      location: a.venue,
      tier: a.tier,
      host: a.host,
      tour: a.tour,
      prize_pool: null,
      registration_url: "",
      armed: true,
      onLive: a.onLive,
      status: a.status,
      timezone: a.timezone,
      connector: a.connector,
      note: a.note,
      armedAt: a.armedAt,
      upcoming: a.end >= today,
      orphan: true,
      officialUrl: "",
      drawUrl: "",
    });
  }

  // Seeded events that GPA does not list (Gijón, Barcelona Europe, …)
  for (const seed of SLATE) {
    const exists = events.some(
      (e: any) => e.id === seed.id || matchesSlateName(e.name, seed.name)
    );
    if (exists) continue;
    events.push(asCalendarRow(seed, today));
  }

  events.sort((a: any, b: any) => String(a.start).localeCompare(String(b.start)));
  return events.map((e: any) => applySportsSyncArm(e));
}

function normalizeConnector(raw: any): Connector {
  const type = String(raw?.type || "none").toLowerCase();
  const c: Connector = {
    type: (["none", "app", "ppa", "url", "djoy", "sportssync"].includes(type) ? type : "none") as Connector["type"],
  };
  if (raw?.denTournamentId) c.denTournamentId = String(raw.denTournamentId).trim();
  if (raw?.ppaEventId) c.ppaEventId = String(raw.ppaEventId).trim();
  if (raw?.sportsSyncTournamentId) {
    const ss = String(raw.sportsSyncTournamentId).replace(/\D/g, "");
    if (ss) c.sportsSyncTournamentId = ss;
  }
  if (raw?.scoreUrl) c.scoreUrl = String(raw.scoreUrl).trim();
  if (raw?.scorePath) c.scorePath = String(raw.scorePath).trim();
  // Convenience: numeric den id with type omitted
  if (c.type === "none" && c.denTournamentId) c.type = "app";
  if (c.type === "none" && c.ppaEventId) c.type = "ppa";
  if (c.type === "none" && c.sportsSyncTournamentId) c.type = "sportssync";
  if (c.type === "none" && (c.scoreUrl || c.scorePath)) c.type = "url";
  const path = resolveScorePath(c);
  if (path) c.scorePath = path;
  return c;
}

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const [gpa, armedStore] = await Promise.all([
      gpaEvents().catch(() => []),
      loadArmed(),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const armedEvents = applyAppCalendarCut(armedStore.events).map((row) => applySportsSyncArm(row));
    const events = mergeCalendar(gpa, armedEvents).map(toReaderEvent);
    return Response.json(
      {
        updated: new Date().toISOString(),
        armedUpdated: armedStore.updated,
        events,
        armed: armedEvents.map((row) => toReaderEvent(row)),
        intake: {
          rule: "name + venue + timezone + working score path",
          doc: "/docs/coverage-intake.md",
          neverFakeScores: true,
        },
        known: KNOWN,
        slate: SLATE.map((s) => toReaderEvent(asCalendarRow(s, today))),
        parkedPpa: PARKED_PPA,
        endedPpa: {
          barcelona: {
            ...ENDED_PPA.barcelona,
            note: readerStatusLine({ status: "ended", ended: true }),
          },
        },
        ppaLiveEventId: PPA_LIVE_EVENT_ID,
        neverFakeScores: true,
      },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }

  if (req.method === "POST") {
    const key = deskKey();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    if (!key || body.key !== key) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const action = String(body.action || "arm").toLowerCase();
    const { events: current } = await loadArmed();

    if (action === "disarm") {
      const id = String(body.id || "");
      if (!id) return Response.json({ error: "need id" }, { status: 400 });
      const next = current.filter((e) => e.id !== id);
      const saved = await saveArmed(next);
      return Response.json({ ok: true, updated: saved.updated, events: saved.events });
    }

    // arm / update
    const name = String(body.name || "").trim();
    const venue = String(body.venue || "").trim();
    const timezone = String(body.timezone || "").trim();
    const start = String(body.start || body.tournament_date || "").slice(0, 10);
    const end = String(body.end || body.end_date || start).slice(0, 10);
    const host = String(body.host || "").trim();
    const tier = String(body.tier || "").trim();
    const tour = String(body.tour || guessTour(host, name)).trim().toLowerCase();
    const note = String(body.note || "").trim();
    const normalized = normalizeConnector(body.connector || {});
    const delayed = Boolean(body.delayed);
    const guarded = applySportsSyncArm({
      name,
      tour,
      connector: normalized,
      status: "results-only",
      onLive: false,
    });
    const connector = (guarded.connector || { type: "none" }) as Connector;

    if (!name || !start) {
      return Response.json({ error: "need name and start date" }, { status: 400 });
    }

    const id = String(body.id || eventId(name, start));
    const gate = intakeStatus({ name, venue, timezone, connector, delayed });
    // SportsSync can return results, but it is not a LIVE board. Chongqing stays off LIVE.
    let status = gate.status;
    let onLive = gate.onLive;
    if (connector.type === "sportssync" || /chongqing/i.test(name)) {
      onLive = false;
      if (status === "live-path") status = delayed ? "delayed" : "results-only";
    }

    // Refuse claiming onLive without full intake — store as results-only / delayed instead
    if (body.requireLive && !onLive) {
      return Response.json(
        {
          error: "intake_failed",
          message:
            "Event is on WPM LIVE only when name, venue, timezone, and a working score path all pass. SportsSync stays results-only until an in-progress signal is proven. Missing score path → results-only or scores delayed — never fake 0–0.",
          intake: gate.intake,
          status,
        },
        { status: 422 }
      );
    }

    const row: ArmedEvent = {
      id,
      name,
      venue,
      timezone,
      tour,
      host,
      tier,
      start,
      end,
      connector,
      status,
      onLive,
      note,
      armedAt: new Date().toISOString(),
      gpaName: name,
      gpaStart: start,
    };

    const idx = current.findIndex((e) => e.id === id);
    const next = [...current];
    if (idx >= 0) next[idx] = row;
    else next.push(row);

    const saved = await saveArmed(next);
    return Response.json({
      ok: true,
      updated: saved.updated,
      event: row,
      intake: gate.intake,
      events: saved.events,
    });
  }

  return Response.json({ error: "method" }, { status: 405 });
};

export const config: Config = { path: "/api/calendar" };
