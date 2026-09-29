/**
 * Seeded slate events with no live score path yet.
 * Shared by calendar.mts + radar-lib.mjs + ppa.mts.
 * Never onLive for slate seeds. Never point /api/ppa at an ended or rejected UUID.
 */

/** Live /api/ppa EVENT — Rate Las Vegas Open (Darling Tennis Center). */
export const PPA_LIVE_EVENT_ID = "86926aef-0566-4fbb-87cf-a48068a9f1c6";

/** April Las Vegas Open. Not this September event — never wire /api/ppa to it. */
export const PPA_APRIL_LAS_VEGAS_PREFIX = "92d37566";

export const PPA_LIVE = {
  eventId: PPA_LIVE_EVENT_ID,
  name: "PPA Rate Las Vegas Open",
  venue: "Darling Tennis Center, Las Vegas",
  tz: "America/Los_Angeles",
  start: "2026-09-28",
  firstServe: "8:00 AM PDT",
};

/**
 * Barcelona window closed 27 Sep 2026. Official scores API returned no matches.
 * Unparked: not a cutover target. Do not point /api/ppa here.
 */
export const ENDED_PPA = {
  barcelona: {
    ppaEventId: "1655a7c9-904a-44c9-aa29-b279fca900e8",
    name: "PPA Tour Europe \u00b7 P250 Barcelona Open",
    venue: "Tennis Desp\u00ed, Sant Joan Desp\u00ed, Spain",
    timezone: "Europe/Madrid",
    start: "2026-09-23",
    end: "2026-09-27",
    officialUrl: "https://ppatour.com/tournament/2026/ppa-spain-p250-barcelona/",
    ended: true,
    parked: false,
    note:
      "Window ended 27 Sep 2026 with no scores on the official PPA scores API. Unparked \u2014 do not cut /api/ppa to this UUID. Live board is Rate Las Vegas Open (" +
      PPA_LIVE_EVENT_ID +
      ").",
  },
};

/** Nothing is parked for cutover. Kept so older readers see an empty set. */
export const PARKED_PPA = {};

export const GIJON = {
  id: "slate:tpb-gijon-2026",
  name: "TPB Gij\u00f3n 2026",
  venue: "Puerto Deportivo de Gij\u00f3n (+ aux Mieres), Spain",
  timezone: "Europe/Madrid",
  tour: "tpb",
  host: "TOP Pickleball Tour",
  tier: "",
  start: "2026-09-18",
  end: "2026-09-20",
  status: "delayed",
  onLive: false,
  officialUrl: "https://toppickleballtour.com/tour/gijon/",
  drawUrl:
    "https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf",
  note:
    "TOP Pickleball Tour powered by APP \u2014 not APP Den Live. No Den tournamentId / Tournated / live API. Scores delayed. Official draw PDF only; never invent match scores or fake LIVE.",
  connector: { type: "none" },
};

export const BARCELONA = {
  id: "slate:ppa-barcelona-2026",
  name: ENDED_PPA.barcelona.name,
  venue: ENDED_PPA.barcelona.venue,
  timezone: ENDED_PPA.barcelona.timezone,
  tour: "ppa-eu",
  host: "PPA Tour Europe",
  tier: "P250",
  start: ENDED_PPA.barcelona.start,
  end: ENDED_PPA.barcelona.end,
  status: "ended",
  onLive: false,
  officialUrl: ENDED_PPA.barcelona.officialUrl,
  drawUrl: "",
  note: ENDED_PPA.barcelona.note,
  // UUID kept so desk can see which event ended. type none — not a live path.
  connector: { type: "none", ppaEventId: ENDED_PPA.barcelona.ppaEventId },
};

export const SLATE = [GIJON, BARCELONA];

/** MLP Asia is the PPA/MLP franchise. APP Asia Tour is APP. Never merge the chips. */
export const MLP_ASIA_NOTE =
  "MLP Asia \u2260 APP. MLP Asia is the PPA/MLP franchise. APP Asia Tour (Chongqing / Taipei / Bangkok / HCMC / India) stays on the APP Asia chip \u2014 never chip MLP Asia as APP.";

/** Desk / radar copy. Never send these strings on the public board. */
export const FILTER_COPY = {
  tpb: "TOP Pickleball Tour (powered by APP, not APP Den). Scores delayed \u2014 no live path. Official draw PDF only.",
  "ppa-eu":
    "PPA Tour Europe. Barcelona window ended 27 Sep 2026 with no scores. Not the live board \u2014 Rate Las Vegas Open is /api/ppa.",
  "app-asia": "APP Asia Tour \u2014 not MLP Asia. No Den Live id yet. Results-only.",
  "mlp-asia": MLP_ASIA_NOTE,
  asia: "PPA Asia \u2014 results-only until a working ticker is wired. Not APP Asia, not MLP Asia.",
  gpa: "GPA calendar. Live only when intake passes (name \u00b7 venue \u00b7 tz \u00b7 score path).",
};

/** The only prose the reader board may show on a results-only / ended / parked card. */
export const READER_LINES = {
  ended: "Event ended",
  delayed: "Scores delayed",
  draw: "Draw not published yet",
  results: "Results will appear when available",
};

export const READER_FILTER_COPY = {
  tpb: READER_LINES.delayed,
  "ppa-eu": READER_LINES.ended,
  "app-asia": READER_LINES.results,
  "mlp-asia": READER_LINES.results,
  asia: READER_LINES.results,
  gpa: READER_LINES.results,
};

const READER_LINE_VALUES = new Set(Object.values(READER_LINES));
const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const DESK_JARGON_RE =
  /\b(blocker|intake|radar|tournamentid|uuid|external-tournament|den live|den id)\b|\/api\/ppa\b/i;

export function textHasDeskJargon(value) {
  const s = String(value || "");
  if (!s) return false;
  if (UUID_RE.test(s)) return true;
  if (DESK_JARGON_RE.test(s)) return true;
  if (/\b(note|reason)\b/i.test(s) && /den|api|uuid|intake|radar|blocker|tournament/i.test(s))
    return true;
  return false;
}

/**
 * One short status for a results-only, ended, or calendar-parked card.
 * Live-path rows stay quiet — the status chip already says they are live.
 * Desk notes are an input only (draw-not-published detection). They are never returned.
 */
export function readerStatusLine(row) {
  if (!row || typeof row !== "object") return "";
  const status = String(row.status || "").toLowerCase();
  if (row.onLive || status === "live-path") return "";
  if (row.ended || status === "ended") return READER_LINES.ended;
  if (status === "delayed") return READER_LINES.delayed;
  const blob = [row.note, row.statusNote, row.blurb, row.detail, row.description]
    .filter(Boolean)
    .join(" ");
  const drawMissing =
    !row.drawUrl &&
    /draw/i.test(blob) &&
    /not published|unpublished|no official/i.test(blob);
  if (drawMissing) return READER_LINES.draw;
  return READER_LINES.results;
}

/**
 * Public calendar row. Replaces note / statusNote / blurb / detail / description
 * with the reader line and drops desk-only prose keys.
 */
export function toReaderEvent(row) {
  if (!row || typeof row !== "object") return row;
  const statusNote = readerStatusLine(row);
  const next = { ...row, note: statusNote, statusNote };
  for (const key of ["blurb", "detail", "description"]) {
    if (Object.prototype.hasOwnProperty.call(row, key)) next[key] = statusNote;
  }
  delete next.blocker;
  delete next.reason;
  delete next.deskNote;
  delete next.radar;
  return next;
}

export function isReaderStatusLine(value) {
  return READER_LINE_VALUES.has(String(value || "").trim());
}

export const SLATE_FILTERS = ["tpb", "ppa-eu", "app-asia", "mlp-asia", "asia", "gpa"];

/** No UUID is parked for a future cut. Barcelona is ended, not waiting. */
export function isParkedPpaEventId(_id) {
  return false;
}

export function isEndedPpaEventId(id) {
  const s = String(id || "").trim().toLowerCase();
  return s === ENDED_PPA.barcelona.ppaEventId;
}

/** April Las Vegas prefix, or any ended Europe UUID. Not a working /api/ppa path. */
export function isBlockedPpaEventId(id) {
  const s = String(id || "").trim().toLowerCase();
  if (!s) return false;
  if (isEndedPpaEventId(s)) return true;
  return s.startsWith(PPA_APRIL_LAS_VEGAS_PREFIX);
}

export function isLivePpaEventId(id) {
  return String(id || "").trim() === PPA_LIVE_EVENT_ID;
}

/** Ticker title must be Rate Las Vegas. A bare "Las Vegas" title is not this event. */
export function ppaTickerTitleAligned(title) {
  const t = String(title || "").trim();
  if (!t) return true;
  return /rate/i.test(t) && /las vegas/i.test(t);
}

/** APP Asia Tour names on GPA \u2014 still APP, never MLP. */
export function isAppAsiaName(name) {
  const n = String(name || "");
  if (!/\bAPP\b/i.test(n) && !/APP Asia/i.test(n)) return false;
  return /Asia|Chongqing|Taipei|Bangkok|Ho Chi Minh|India Open/i.test(n);
}

export function matchesSlateName(rowName, seedName) {
  const a = String(rowName || "").toLowerCase();
  const b = String(seedName || "").toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;
  if (/gij[oó]n/i.test(a) && /gij[oó]n/i.test(b)) return true;
  if (/barcelona/i.test(a) && /barcelona/i.test(b)) return true;
  return false;
}

export function asCalendarRow(seed, today) {
  const end = seed.end || seed.start;
  return {
    id: seed.id,
    name: seed.name,
    start: seed.start,
    end,
    venue: seed.venue,
    location: seed.venue,
    tier: seed.tier || "",
    host: seed.host,
    tour: seed.tour,
    prize_pool: null,
    registration_url: seed.officialUrl || "",
    armed: false,
    onLive: false,
    status: seed.status,
    timezone: seed.timezone,
    connector: seed.connector || { type: "none" },
    note: seed.note || "",
    armedAt: null,
    upcoming: end >= today,
    seeded: true,
    officialUrl: seed.officialUrl || "",
    drawUrl: seed.drawUrl || "",
  };
}

export function staticWatchEvents() {
  return [
    {
      tour: "tpb",
      name: GIJON.name,
      start: GIJON.start,
      end: GIJON.end,
      venue: GIJON.venue,
      tz: GIJON.timezone,
      source: "slate-seed",
      denId: null,
      ppaEventId: null,
      officialUrl: GIJON.officialUrl,
      drawUrl: GIJON.drawUrl,
      scorePath: null,
      intake: {
        name: true,
        venue: true,
        timezone: true,
        scorePath: false,
        status: "fail",
      },
      board: "results_only",
      note: GIJON.note,
    },
    {
      tour: "ppa-eu",
      name: BARCELONA.name,
      start: BARCELONA.start,
      end: BARCELONA.end,
      venue: BARCELONA.venue,
      tz: BARCELONA.timezone,
      source: "slate-seed",
      denId: null,
      ppaEventId: ENDED_PPA.barcelona.ppaEventId,
      officialUrl: BARCELONA.officialUrl,
      drawUrl: "",
      scorePath: null,
      parked: false,
      ended: true,
      intake: {
        name: true,
        venue: true,
        timezone: true,
        scorePath: false,
        status: "fail",
      },
      board: "results_only",
      note: BARCELONA.note,
    },
    {
      tour: "mlp-asia",
      name: "MLP Asia",
      start: null,
      end: null,
      venue: "",
      tz: "",
      source: "label-guard",
      scorePath: null,
      intake: {
        name: true,
        venue: false,
        timezone: false,
        scorePath: false,
        status: "fail",
      },
      board: "results_only",
      note: MLP_ASIA_NOTE,
    },
  ];
}
