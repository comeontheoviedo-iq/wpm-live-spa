/**
 * Event radar probes — shared by scripts/event-radar.mjs and radar.mts.
 * Boards: on_board | missing | blocked_by_intake | results_only. Never invents scores.
 */

const UA = { "User-Agent": "WPM-LIVE-radar/1.0", Accept: "application/json" };

const GPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmVlZGhxaW51ZGFzbmdrcXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDkzMDIsImV4cCI6MjA3NjEyNTMwMn0.U6VPCpYEtyFkVwxQ7yMAbGf_huWORMg_8iyyd-WkADc";
const GPA = "https://prneedhqinudasngkqqi.supabase.co/rest/v1";
const DEN = "https://denlive.pickleballden.com";

/** Shipped live connectors — keep in sync with ppa.mts / app.mts / worldcup.mts */
export const WIRED = {
  ppa: {
    tour: "ppa",
    eventId: "62c01642-1bb2-4f9a-9998-599f8fdefe5c",
    name: "PPA Veolia Arizona Open \u00b7 Mesa",
    venue: "Mesa, AZ",
    tz: "America/Phoenix",
    scorePath: "/api/ppa",
  },
  app: {
    tour: "app",
    eventId: "18453",
    name: "APP Dillons Overland Park Open",
    venue: "AdventHealth Sports Park at Bluhawk, Overland Park, KS",
    tz: "America/Chicago",
    scorePath: "/api/app",
  },
  worldcup: {
    tour: "wc",
    eventId: "pwc2026-danang",
    name: "World Cup · Da Nang",
    venue: "Da Nang, Vietnam",
    tz: "Asia/Ho_Chi_Minh",
    scorePath: "/api/worldcup",
  },
};

export const KNOWN_APP_DEN_IDS = ["18453", "18442", "18454"];

const HORIZON_DAYS = 14;
const LOOKBACK_DAYS = 2;

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return ymd(new Date(Date.UTC(y, m - 1, d + n)));
}

async function fetchJson(url, headers = {}, timeoutMs = 14000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { ...UA, ...headers }, signal: ctrl.signal });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { ok: res.ok, status: res.status, body, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: 0, body: null, error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function intake({ name, venue, tz, scoreOk }) {
  const fields = {
    name: Boolean(name && String(name).trim()),
    venue: Boolean(venue && String(venue).trim()),
    timezone: Boolean(tz && String(tz).trim()),
    scorePath: Boolean(scoreOk),
  };
  const pass = fields.name && fields.venue && fields.timezone && fields.scorePath;
  return {
    ...fields,
    status: pass ? "pass" : fields.name || fields.venue ? "fail" : "unknown",
  };
}

async function probeGpa(today) {
  const from = addDays(today, -LOOKBACK_DAYS);
  const to = addDays(today, HORIZON_DAYS);
  const r = await fetchJson(
    `${GPA}/tournaments?select=name,tournament_date,end_date,location,tier,host,prize_pool,venue,registration_url&order=tournament_date.asc&limit=40`,
    { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY }
  );
  if (!r.ok || !Array.isArray(r.body)) {
    return { ok: false, error: r.error, events: [], window: { from, to } };
  }
  const events = [];
  for (const row of r.body) {
    const start = row.tournament_date || "";
    const end = row.end_date || start;
    if (!start || end < from || start > to) continue;
    const host = String(row.host || "");
    const name = row.name || "";
    const venue = row.venue || row.location || "";
    const isApp = host.toUpperCase() === "APP" || /\bAPP\b/i.test(name);
    const isWiredApp = isApp && /Overland Park/i.test(name);

    if (isApp) {
      const scoreOk = isWiredApp;
      const tz = isWiredApp ? WIRED.app.tz : "";
      const inn = intake({ name, venue, tz, scoreOk });
      events.push({
        tour: "app",
        name,
        start,
        end,
        venue,
        host,
        tier: row.tier || "",
        source: "gpa-tournaments",
        denId: isWiredApp ? WIRED.app.eventId : null,
        scorePath: isWiredApp ? WIRED.app.scorePath : null,
        intake: inn,
        board: isWiredApp ? "on_board" : "blocked_by_intake",
        note: isWiredApp
          ? "GPA row matches wired Den " + WIRED.app.eventId
          : "APP on GPA calendar — need Den tournamentId + tz + score smoke before live board",
      });
    } else {
      const inn = intake({ name, venue: venue || host || "n/a", tz: "", scoreOk: false });
      inn.timezone = false;
      inn.scorePath = false;
      inn.status = "fail";
      events.push({
        tour: (host || "other").toLowerCase(),
        name,
        start,
        end,
        venue,
        host,
        tier: row.tier || "",
        source: "gpa-tournaments",
        scorePath: null,
        intake: inn,
        board: "results_only",
        note: "GPA calendar / results-only — no live connector until intake passes",
      });
    }
  }
  return { ok: true, events, window: { from, to } };
}

async function probePpa() {
  const wired = WIRED.ppa;
  const tick = await fetchJson("https://www.ppatour.com/api/ticker/");
  const scores = await fetchJson(`https://www.ppatour.com/api/scores/?event=${wired.eventId}`);
  const title = tick.body?.tournament?.title || tick.body?.tournament?.name || "";
  const tickN = Array.isArray(tick.body?.matches) ? tick.body.matches.length : 0;
  const scoreN = Array.isArray(scores.body?.matches) ? scores.body.matches.length : 0;
  const titleAligned = !title || /arizona/i.test(title) || /veolia/i.test(title) || /mesa/i.test(title);

  const inn = intake({
    name: title || wired.name,
    venue: wired.venue,
    tz: wired.tz,
    scoreOk: tick.ok && scores.ok,
  });

  let board = "missing";
  let note = "";
  if (!tick.ok) {
    board = "missing";
    note = `PPA ticker ${tick.error}`;
  } else if (!titleAligned) {
    board = "blocked_by_intake";
    note = `ticker "${title}" ≠ wired ${wired.name} (${wired.eventId}) — cut EVENT in ppa.mts`;
  } else if (!scores.ok) {
    board = "blocked_by_intake";
    note = `scores ${scores.error} for ${wired.eventId}`;
  } else {
    board = "on_board";
    note = `wired ${wired.scorePath} · ticker ${tickN} · scores ${scoreN}`;
  }

  return {
    ok: tick.ok,
    event: {
      tour: "ppa",
      name: title || wired.name,
      wiredName: wired.name,
      eventId: wired.eventId,
      venue: wired.venue,
      tz: wired.tz,
      source: "ppa-ticker+scores",
      tickerMatches: tickN,
      scoreMatches: scoreN,
      titleAligned,
      scorePath: wired.scorePath,
      intake: inn,
      board,
      note,
    },
  };
}

async function probeAppDen() {
  const wired = WIRED.app;
  const info = await fetchJson(
    `${DEN}/api/tournament-info?tournamentId=${encodeURIComponent(wired.eventId)}`
  );
  const brackets = await fetchJson(
    `${DEN}/api/tournament-brackets?tournamentId=${encodeURIComponent(wired.eventId)}`
  );
  const venueName = info.body?.info?.venue?.name || wired.venue;
  const rawBrackets =
    brackets.body?.brackets ||
    brackets.body?.payload?.brackets ||
    brackets.body?.payload ||
    brackets.body?.data ||
    brackets.body;
  const bl = Array.isArray(rawBrackets)
    ? rawBrackets
    : Array.isArray(rawBrackets?.content)
      ? rawBrackets.content
      : [];
  const bracketCount = Array.isArray(bl)
    ? bl.length
    : typeof rawBrackets?.totalElements === "number"
      ? rawBrackets.totalElements
      : 0;

  const discovered = [];
  for (const id of KNOWN_APP_DEN_IDS) {
    if (id === wired.eventId) continue;
    const r = await fetchJson(`${DEN}/api/tournament-info?tournamentId=${encodeURIComponent(id)}`);
    const v = r.body?.info?.venue?.name;
    if (r.ok && v) discovered.push({ tournamentId: id, venue: v });
  }

  const ok = info.ok && brackets.ok;
  const inn = intake({ name: wired.name, venue: venueName, tz: wired.tz, scoreOk: ok });

  return {
    ok: info.ok,
    event: {
      tour: "app",
      name: wired.name,
      eventId: wired.eventId,
      denId: wired.eventId,
      venue: venueName,
      tz: wired.tz,
      source: "den-live",
      bracketCount,
      scorePath: wired.scorePath,
      intake: inn,
      board: ok ? "on_board" : "blocked_by_intake",
      note: ok
        ? `wired ${wired.scorePath} · ${bracketCount} brackets`
        : `Den info ${info.error || info.status} brackets ${brackets.error || brackets.status}`,
      discoveredExtra: discovered,
    },
  };
}

async function probeWorldCup(prodBase) {
  const wired = WIRED.worldcup;
  const r = await fetchJson(`${prodBase.replace(/\/$/, "")}/api/worldcup`, {}, 22000);
  const matches = Array.isArray(r.body?.matches) ? r.body.matches : [];
  const live = matches.filter((m) => m.status === "LIVE").length;
  const next = matches.filter((m) => m.status === "NEXT").length;
  const ft = matches.filter((m) => m.status === "FT").length;
  const inn = intake({
    name: wired.name,
    venue: wired.venue,
    tz: wired.tz,
    scoreOk: r.ok && matches.length > 0,
  });
  const active = live + next > 0;
  return {
    ok: r.ok,
    event: {
      tour: "wc",
      name: matches[0]?.comp || wired.name,
      venue: wired.venue,
      tz: wired.tz,
      source: r.body?.source || "worldcup-api",
      matchCount: matches.length,
      live,
      next,
      ft,
      active,
      scorePath: wired.scorePath,
      intake: inn,
      board: r.ok && matches.length ? "on_board" : "missing",
      note: !r.ok
        ? `worldcup ${r.error}`
        : active
          ? `WC active · LIVE ${live} NEXT ${next} FT ${ft}`
          : matches.length
            ? `WC feed up · all complete (FT ${ft}) — still wired`
            : "WC feed empty",
    },
  };
}

/**
 * @param { now?: Date, prodBase?: string } [opts]
 */
export async function buildRadarReport(opts = {}) {
  const now = opts.now || new Date();
  const today = ymd(now);
  const prodBase = opts.prodBase || "https://live.worldpickleballmagazine.com";

  const [gpa, ppa, app, wc] = await Promise.all([
    probeGpa(today),
    probePpa(),
    probeAppDen(),
    probeWorldCup(prodBase),
  ]);

  const events = [];
  if (ppa.event) events.push(ppa.event);
  if (app.event) events.push(app.event);
  if (wc.event) events.push(wc.event);

  for (const e of gpa.events || []) {
    if (e.tour === "app" && (e.denId === WIRED.app.eventId || /Overland Park/i.test(e.name))) continue;
    events.push(e);
  }

  const summary = {
    on_board: events.filter((e) => e.board === "on_board").length,
    missing: events.filter((e) => e.board === "missing").length,
    blocked_by_intake: events.filter((e) => e.board === "blocked_by_intake").length,
    results_only: events.filter((e) => e.board === "results_only").length,
  };

  const actions = [];
  for (const e of events) {
    if (e.board === "blocked_by_intake") {
      actions.push({
        priority: e.tour === "ppa" || e.tour === "app" ? "P0" : "P1",
        tour: e.tour,
        name: e.name,
        action: e.note,
      });
    } else if (e.board === "missing") {
      actions.push({
        priority: "P1",
        tour: e.tour,
        name: e.name,
        action: e.note,
      });
    }
  }

  return {
    generatedAt: now.toISOString(),
    deskTz: "Europe/London",
    horizonDays: HORIZON_DAYS,
    gpaWindow: gpa.window || null,
    sources: {
      gpa: gpa.ok,
      gpaError: gpa.error || null,
      ppaTicker: ppa.ok,
      denLive: app.ok,
      worldcup: wc.ok,
    },
    wired: WIRED,
    summary,
    events,
    actions,
    routine: {
      schedule: "weekdays 08:30 Europe/London",
      steps: [
        "Run `node scripts/event-radar.mjs` or GET /api/radar",
        "Escalate P0 actions only (blocked_by_intake on PPA/APP)",
        "If PPA ticker title ≠ wired EVENT → cut ppa.mts EVENT same day",
        "If new APP on GPA → find Den tournamentId → intake checklist → ship /api/app id",
        "Never invent scores; shop stays closed; do not regress APP/Web Push",
      ],
    },
  };
}
