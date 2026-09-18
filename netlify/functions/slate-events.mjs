/**
 * Seeded slate events with no live score path yet.
 * Shared by calendar.mts + radar-lib.mjs.
 * Never onLive. Never point /api/ppa at a parked UUID while a US event is wired.
 */

/** Live /api/ppa EVENT — Veolia Arizona Open (Mesa). Do not swap for Barcelona. */
export const PPA_LIVE_EVENT_ID = "62c01642-1bb2-4f9a-9998-599f8fdefe5c";

export const PARKED_PPA = {
  barcelona: {
    ppaEventId: "1655a7c9-904a-44c9-aa29-b279fca900e8",
    name: "PPA Tour Europe \u00b7 P250 Barcelona Open",
    venue: "Tennis Desp\u00ed, Sant Joan Desp\u00ed, Spain",
    timezone: "Europe/Madrid",
    start: "2026-09-23",
    end: "2026-09-27",
    officialUrl: "https://ppatour.com/tournament/2026/ppa-spain-p250-barcelona/",
    scorePathWhenLive: "/api/ppa",
    note:
      "UUID parked for cutover. /api/ppa stays Arizona (" +
      PPA_LIVE_EVENT_ID +
      ") until the official ticker title is Barcelona. Single EVENT id \u2014 do not point the live board here while Mesa is on.",
  },
};

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
  name: PARKED_PPA.barcelona.name,
  venue: PARKED_PPA.barcelona.venue,
  timezone: PARKED_PPA.barcelona.timezone,
  tour: "ppa-eu",
  host: "PPA Tour Europe",
  tier: "P250",
  start: PARKED_PPA.barcelona.start,
  end: PARKED_PPA.barcelona.end,
  status: "results-only",
  onLive: false,
  officialUrl: PARKED_PPA.barcelona.officialUrl,
  drawUrl: "",
  note: PARKED_PPA.barcelona.note,
  // UUID stored for cutover; type none so intake never treats this as a working live path.
  connector: { type: "none", ppaEventId: PARKED_PPA.barcelona.ppaEventId },
};

export const SLATE = [GIJON, BARCELONA];

/** MLP Asia is the PPA/MLP franchise. APP Asia Tour is APP. Never merge the chips. */
export const MLP_ASIA_NOTE =
  "MLP Asia \u2260 APP. MLP Asia is the PPA/MLP franchise. APP Asia Tour (Chongqing / Taipei / Bangkok / HCMC / India) stays on the APP Asia chip \u2014 never chip MLP Asia as APP.";

export const FILTER_COPY = {
  tpb: "TOP Pickleball Tour (powered by APP, not APP Den). Scores delayed \u2014 no live path. Official draw PDF only.",
  "ppa-eu":
    "PPA Tour Europe. Upcoming / results-only until ticker + brackets go live. Arizona remains the /api/ppa board.",
  "app-asia": "APP Asia Tour \u2014 not MLP Asia. No Den Live id yet. Results-only.",
  "mlp-asia": MLP_ASIA_NOTE,
  asia: "PPA Asia \u2014 results-only until a working ticker is wired. Not APP Asia, not MLP Asia.",
  gpa: "GPA calendar. Live only when intake passes (name \u00b7 venue \u00b7 tz \u00b7 score path).",
};

export const SLATE_FILTERS = ["tpb", "ppa-eu", "app-asia", "mlp-asia", "asia", "gpa"];

export function isParkedPpaEventId(id) {
  return String(id || "").trim() === PARKED_PPA.barcelona.ppaEventId;
}

export function isLivePpaEventId(id) {
  return String(id || "").trim() === PPA_LIVE_EVENT_ID;
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
      ppaEventId: PARKED_PPA.barcelona.ppaEventId,
      officialUrl: BARCELONA.officialUrl,
      drawUrl: "",
      scorePath: null,
      parked: true,
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
