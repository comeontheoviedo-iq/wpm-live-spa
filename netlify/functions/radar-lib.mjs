/**
 * Event radar probes — shared by scripts/event-radar.mjs and radar.mts.
 * Boards: on_board | missing | blocked_by_intake | results_only. Never invents scores.
 */

import {
  APP_LIVE,
  ENDED_APP,
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  ENDED_PPA,
  PARKED_PPA,
  GIJON,
  MLP_ASIA_NOTE,
  ARIZONA_APP,
  LOUISVILLE,
  PPA_VIRGINIA_BEACH,
  coverageSeedFor,
  isAppAsiaName,
  matchesSlateName,
  ppaTickerTitleAligned,
  staticWatchEvents,
} from "./slate-events.mjs";
import {
  APP_ASIA_ORGANIZER_URL,
  CHONGQING_DESK_NOTE,
  SPORTSSYNC_UNRESOLVED,
  extractSportsSyncTournamentIds,
  summarizeOrganizerListing,
} from "./sportssync-map.mjs";

const UA = { "User-Agent": "WPM-LIVE-radar/1.0", Accept: "application/json" };

const GPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmVlZGhxaW51ZGFzbmdrcXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDkzMDIsImV4cCI6MjA3NjEyNTMwMn0.U6VPCpYEtyFkVwxQ7yMAbGf_huWORMg_8iyyd-WkADc";
const GPA = "https://prneedhqinudasngkqqi.supabase.co/rest/v1";
const DEN = "https://denlive.pickleballden.com";

/** Shipped live connectors — keep in sync with ppa.mts / app.mts / worldcup.mts */
export const WIRED = {
  ppa: {
    tour: "ppa",
    eventId: PPA_LIVE.eventId,
    name: PPA_LIVE.name,
    venue: PPA_LIVE.venue,
    tz: PPA_LIVE.tz,
    scorePath: "/api/ppa",
  },
  app: {
    tour: "app",
    eventId: APP_LIVE.eventId,
    name: APP_LIVE.name,
    venue: APP_LIVE.venue,
    tz: APP_LIVE.tz,
    scorePath: APP_LIVE.scorePath,
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

/** Wired live id first. Overland 18453 stays known so radar can see it; it is ended, not live. */
export const KNOWN_APP_DEN_IDS = [APP_LIVE.eventId, ENDED_APP.overland.denTournamentId, "18442", "18454"];

/** Through late October from a 2 Oct desk day: Louisville and the GPA Bangkok row. Later stops stay on static watches. */
export const HORIZON_DAYS = 28;
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
    return { ok: res.ok, status: res.status, body, text, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: 0, body: null, text: "", error: String(e?.message || e) };
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
    const gpaStart = row.tournament_date || "";
    const gpaEnd = row.end_date || gpaStart;
    if (!gpaStart || gpaEnd < from || gpaStart > to) continue;
    const host = String(row.host || "");
    const name = row.name || "";
    let start = gpaStart;
    let end = gpaEnd;
    let venue = row.venue || row.location || "";
    const isApp = host.toUpperCase() === "APP" || /\bAPP\b/i.test(name);
    const isWiredApp = isApp && /columbus open/i.test(name) && !isAppAsiaName(name);
    const isEndedOverland = isApp && /overland park/i.test(name);
    const appAsia = isAppAsiaName(name);

    if (isApp) {
      const scoreOk = isWiredApp;
      let tz = isWiredApp ? WIRED.app.tz : isEndedOverland ? ENDED_APP.overland.timezone : "";
      const inn = intake({ name, venue, tz, scoreOk });
      let board = "blocked_by_intake";
      let note =
        "APP on GPA calendar — need Den tournamentId + tz + score smoke before live board";
      let denId = null;
      let scorePath = null;
      if (isWiredApp) {
        board = "on_board";
        denId = WIRED.app.eventId;
        scorePath = WIRED.app.scorePath;
        note = "GPA row matches wired Den " + WIRED.app.eventId;
      } else if (isEndedOverland) {
        board = "results_only";
        denId = ENDED_APP.overland.denTournamentId;
        inn.scorePath = false;
        inn.status = "fail";
        note =
          "Ended 20 Sep 2026. Den " +
          ENDED_APP.overland.denTournamentId +
          " disarmed — not onLive. Live APP is Columbus " +
          WIRED.app.eventId +
          ".";
      } else if (appAsia) {
        // APP Asia stays results-only until a verified id exists. Never fake LIVE.
        const seed = coverageSeedFor(name);
        board = "results_only";
        inn.scorePath = false;
        inn.timezone = Boolean(seed && seed.timezone);
        inn.status = "fail";
        note = seed?.note || CHONGQING_DESK_NOTE;
        if (seed?.dateAuthority === "official" && seed.start && seed.end) {
          start = seed.start;
          end = seed.end;
        }
        if (seed?.timezone) tz = seed.timezone;
        if (seed?.venue && (!venue || /^usa$/i.test(venue))) venue = seed.venue;
      } else if (/louisville/i.test(name)) {
        board = "results_only";
        denId = LOUISVILLE.denTournamentId;
        scorePath = null;
        tz = LOUISVILLE.timezone;
        if (!venue || /^usa$/i.test(venue)) venue = LOUISVILLE.venue;
        inn.scorePath = false;
        inn.timezone = true;
        inn.status = "fail";
        note = LOUISVILLE.note;
      } else if (/arizona open/i.test(name)) {
        board = "results_only";
        tz = ARIZONA_APP.timezone;
        if (!venue || /^usa$/i.test(venue)) venue = ARIZONA_APP.venue;
        inn.scorePath = false;
        inn.timezone = true;
        inn.status = "fail";
        note = ARIZONA_APP.note;
      }
      events.push({
        tour: appAsia ? "app-asia" : "app",
        name,
        start,
        end,
        venue,
        tz,
        host,
        tier: row.tier || "",
        source: "gpa-tournaments",
        denId,
        scorePath,
        intake: inn,
        board,
        note,
      });
    } else {
      const inn = intake({ name, venue: venue || host || "n/a", tz: "", scoreOk: false });
      inn.timezone = false;
      inn.scorePath = false;
      inn.status = "fail";
      const tour =
        host.toUpperCase() === "MLP" || /\bMLP\b/i.test(name)
          ? "mlp-asia"
          : (host || "other").toLowerCase();
      events.push({
        tour,
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
        note:
          tour === "mlp-asia"
            ? MLP_ASIA_NOTE
            : "GPA calendar / results-only — no live connector until intake passes",
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
  const titleAligned = ppaTickerTitleAligned(title);

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
    tickerTitle: title,
    tick,
  };
}

/** Barcelona window ended 27 Sep 2026. Report the scores count. Never cut /api/ppa here. */
async function probeEndedBarcelona(tickerTitle) {
  const ended = ENDED_PPA.barcelona;
  const scores = await fetchJson(
    `https://www.ppatour.com/api/scores/?event=${ended.ppaEventId}`
  );
  const scoreN = Array.isArray(scores.body?.matches) ? scores.body.matches.length : 0;
  const title = String(tickerTitle || "");
  const watch = staticWatchEvents().find((e) => e.tour === "ppa-eu");
  const note =
    `ended 2026-09-27 · unparked · ${scoreN} scores rows · not the live board ` +
    `(do not cut /api/ppa to ${ended.ppaEventId})`;

  return {
    event: {
      ...watch,
      tickerTitle: title,
      scoreMatches: scoreN,
      scoresOk: scores.ok,
      parked: false,
      ended: true,
      titleIsBarcelona: /barcelona/i.test(title),
      board: "results_only",
      note,
      priority: null,
    },
  };
}

/** Watch Gijón for an emerging Den / Tournated / live API. Draw PDF is the only official path today. */
async function probeGijon() {
  const watch = staticWatchEvents().find((e) => e.tour === "tpb");
  const page = await fetchJson(GIJON.officialUrl, { Accept: "text/html" }, 12000);
  const html = String(page.text || page.body || "");
  const hasDen = /denlive|tournamentId=/i.test(html);
  const hasTournated = /tournated|pickleballden/i.test(html);
  let board = "results_only";
  let note = GIJON.note;
  if (hasDen || hasTournated) {
    board = "blocked_by_intake";
    note =
      "Gijón official page now mentions Den/Tournated — hunt a working score path before LIVE. Draw PDF still the published groups.";
  } else if (!page.ok) {
    note = `Gijón official page ${page.error || page.status} — keep scores delayed. Draw PDF: ${GIJON.drawUrl}`;
  } else {
    note = `No Den Live / Tournated on official page. Scores delayed. Draw PDF published (${GIJON.drawUrl}).`;
  }
  return {
    event: {
      ...watch,
      officialOk: page.ok,
      emergingPath: hasDen || hasTournated,
      board,
      note,
      drawUrl: GIJON.drawUrl,
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

/** Watch APP Asia organizer 1645900. A new /tournament/{id} is not Chongqing until the name is checked. */
async function probeSportsSyncOrganizer() {
  const page = await fetchJson(APP_ASIA_ORGANIZER_URL, { Accept: "text/html" }, 12000);
  const ids = page.ok ? extractSportsSyncTournamentIds(page.text || "") : [];
  const listing = summarizeOrganizerListing(ids);
  const novel = listing.novel;
  let note = CHONGQING_DESK_NOTE;
  if (!page.ok) {
    note = `SportsSync organizer page ${page.error || page.status}. Chongqing id stays unknown. Do not invent one. Do not fake LIVE.`;
  } else if (novel.length) {
    note =
      `Organizer 1645900 listed new SportsSync tournament id(s) ${novel.join(", ")}. ` +
      "Open the card and confirm the name is APP Asia Chongqing Open before arming /api/sportssync. " +
      "Do not assume. Do not mark LIVE. KL 89 and Penang 222 are not Chongqing.";
  } else {
    const unresolved = SPORTSSYNC_UNRESOLVED.map((t) => `${t.id} ${t.name}`).join("; ");
    note =
      `Organizer 1645900 lists ${listing.found.join(", ") || "no tournaments"}. ` +
      "Chongqing SportsSync id is not listed. Sitemap titles through id 471 (2026-10-02) have no Chongqing. " +
      `Unresolved APP links (not Chongqing, not armed): ${unresolved}. ` +
      "/api/sportssync stays unarmed. Results-only. Do not fake LIVE.";
  }
  return {
    ok: page.ok,
    listing,
    event: {
      tour: "app-asia",
      name: "APP Asia · SportsSync organizer",
      start: "2026-10-02",
      end: "2026-10-06",
      venue: "Chongqing, China",
      tz: "Asia/Shanghai",
      source: "sportssync-organizer",
      organizerUrl: APP_ASIA_ORGANIZER_URL,
      sportsSyncTournamentId: null,
      listedTournamentIds: listing.found,
      novelTournamentIds: novel,
      scorePath: null,
      intake: {
        name: true,
        venue: true,
        timezone: true,
        scorePath: false,
        status: "fail",
      },
      board: "results_only",
      liveSafe: false,
      note,
    },
    action: novel.length
      ? {
          priority: "P1",
          tour: "app-asia",
          name: "APP Asia Chongqing Open",
          action: note,
        }
      : null,
  };
}

/** Upcoming PPA UUIDs. Scheduled scores do not move /api/ppa off Veolia Chicago Cup. */
async function probeUpcomingPpa() {
  const seeds = [PPA_VIRGINIA_BEACH];
  const out = [];
  for (const seed of seeds) {
    const scores = await fetchJson(`https://www.ppatour.com/api/scores/?event=${seed.ppaEventId}`);
    const matches = Array.isArray(scores.body?.matches) ? scores.body.matches : [];
    const liveish = matches.filter((m) =>
      /live|in_progress|inprogress|playing|running|started/i.test(String(m.status || ""))
    );
    const probe = scores.ok
      ? `${matches.length} score rows`
      : scores.error || `HTTP ${scores.status}`;
    out.push({
      ppaEventId: seed.ppaEventId,
      scoreMatches: matches.length,
      scoresOk: scores.ok,
      note:
        seed.note +
        ` Score probe: ${probe}.` +
        (liveish.length
          ? ` ${liveish.length} live-looking row(s) — still not the wired board.`
          : " Not wired. Not LIVE."),
    });
  }
  return out;
}

/**
 * @param { now?: Date, prodBase?: string } [opts]
 */
export async function buildRadarReport(opts = {}) {
  const now = opts.now || new Date();
  const today = ymd(now);
  const prodBase = opts.prodBase || "https://live.worldpickleballmagazine.com";

  const [gpa, ppa, app, wc, gijon, sportssync, upcomingPpa] = await Promise.all([
    probeGpa(today),
    probePpa(),
    probeAppDen(),
    probeWorldCup(prodBase),
    probeGijon(),
    probeSportsSyncOrganizer(),
    probeUpcomingPpa(),
  ]);
  const barcelona = await probeEndedBarcelona(ppa.tickerTitle);

  const events = [];
  if (ppa.event) events.push(ppa.event);
  if (app.event) events.push(app.event);
  if (wc.event) events.push(wc.event);
  if (gijon.event) events.push(gijon.event);
  if (barcelona.event) events.push(barcelona.event);
  if (sportssync.event) events.push(sportssync.event);
  for (const w of staticWatchEvents()) {
    if (w.tour === "tpb" || w.tour === "ppa-eu") continue;
    if (events.some((e) => matchesSlateName(e.name, w.name))) continue;
    const probed = (upcomingPpa || []).find((p) => p.ppaEventId && p.ppaEventId === w.ppaEventId);
    if (probed) {
      events.push({
        ...w,
        scoreMatches: probed.scoreMatches,
        scoresOk: probed.scoresOk,
        note: probed.note,
        board: "results_only",
        scorePath: null,
        onLive: false,
      });
    } else {
      events.push(w);
    }
  }

  for (const e of gpa.events || []) {
    if (e.tour === "app" && (e.denId === WIRED.app.eventId || /columbus open/i.test(e.name))) continue;
    // Slate seed already carries the desk row (Den id, official dates, MLP ≠ APP).
    if (events.some((have) => matchesSlateName(have.name, e.name))) continue;
    events.push(e);
  }

  const summary = {
    on_board: events.filter((e) => e.board === "on_board").length,
    missing: events.filter((e) => e.board === "missing").length,
    blocked_by_intake: events.filter((e) => e.board === "blocked_by_intake").length,
    results_only: events.filter((e) => e.board === "results_only").length,
  };

  const actions = [];
  if (sportssync.action) actions.push(sportssync.action);
  for (const e of events) {
    if (e.board === "blocked_by_intake") {
      actions.push({
        priority: e.tour === "ppa" || e.tour === "app" || e.tour === "ppa-eu" ? "P0" : "P1",
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
      gijonOfficial: gijon.event?.officialOk ?? null,
      sportssyncOrganizer: sportssync.ok,
    },
    wired: WIRED,
    parkedPpa: PARKED_PPA,
    endedPpa: ENDED_PPA,
    ppaLiveEventId: PPA_LIVE_EVENT_ID,
    summary,
    events,
    actions,
    routine: {
      schedule: "weekdays 08:30 Europe/London",
      steps: [
        "Run `node scripts/event-radar.mjs` or GET /api/radar",
        "Escalate P0 actions only (blocked_by_intake on PPA/APP/PPA Europe)",
        "If PPA ticker title ≠ wired EVENT → cut ppa.mts EVENT same day",
        "Live PPA is Veolia Chicago Cup 203e1164-… Life Time North Shore, America/Chicago",
        "Rate Las Vegas 86926aef ended 4 Oct 2026 — archive only, current false. Do not wire /api/ppa there",
        "Barcelona 1655a7c9 ended 27 Sep 2026 with no scores — unparked; do not cut /api/ppa there",
        "Do not wire the April Las Vegas UUID 92d37566-…",
        "Watch Gijón for Den/Tournated — until then scores delayed + draw PDF only",
        "APP Columbus Den 18448 ended 4 Oct. /api/app stays on 18448 until Louisville. Archive current is false. Overland 18453 ended — disarmed, not onLive.",
        "Chongqing has no Den id and no SportsSync id (hunt 2026-10-02: organizer 1645900 still 89/222; sitemap titles 91–471 have no Chongqing; 390/391 are unresolved Taipei/Bangkok links). Do not invent an id. Do not fake LIVE.",
        "When a Chongqing SportsSync id is real, arm connector type sportssync on /calendar. /api/sportssync stays results-only (FT). LIVE is unsafe until a scores row proves an in-progress status.",
        "Louisville Den 18454 is known for 15–18 Oct. Do not cut /api/app off Columbus 18448 until that window and Den is RUNNING.",
        "Upcoming PPA Virginia Beach 429c7980 stays results-only. Do not cut /api/ppa off Veolia Chicago Cup.",
        "If new APP on GPA → find Den tournamentId → intake checklist → ship /api/app id",
        "MLP Asia ≠ APP Asia Tour — never merge those chips",
        "Never invent scores; shop stays closed; do not regress APP/Web Push",
      ],
    },
  };
}
