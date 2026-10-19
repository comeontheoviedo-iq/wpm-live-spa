/**
 * Seeded slate events with no live score path yet.
 * Shared by calendar.mts + radar-lib.mjs + ppa.mts.
 * Never onLive for slate seeds. Never point /api/ppa at an ended or rejected UUID.
 */
import { CHONGQING, CHONGQING_DESK_NOTE } from "./sportssync-map.mjs";

/** Veolia Chicago Cup (Life Time North Shore). Finished 11 Oct 2026 (Finals FT). Archive only. */
export const PPA_CHICAGO_EVENT_ID = "203e1164-b4f9-47e9-bacf-ff81f8748025";

/**
 * Rate Las Vegas Open. Finished 4 Oct 2026 (scores API all final, latest day 2026-10-04).
 * Archive only. Never wire /api/ppa back to this UUID.
 */
export const PPA_LAS_VEGAS_EVENT_ID = "86926aef-0566-4fbb-87cf-a48068a9f1c6";

/** April Las Vegas Open. Not the September event — never wire /api/ppa to it. */
export const PPA_APRIL_LAS_VEGAS_PREFIX = "92d37566";

export const PPA_CHICAGO = {
  eventId: PPA_CHICAGO_EVENT_ID,
  name: "Veolia Chicago Cup",
  venue: "Life Time North Shore Sport & Racquetball, Chicago, IL",
  tz: "America/Chicago",
  start: "2026-10-05",
  end: "2026-10-11",
  firstServe: "8:00 AM CDT",
  scorePath: "/api/ppa",
};

/**
 * Mojo Energy Pouches Virginia Beach Open. Finished 18 Oct 2026.
 * Scores API: 183 final rows, latest real day 2026-10-18, plus one Men's Singles
 * Round 64 still Date TBA (not a result — do not invent a score).
 * Archive id virginia-beach, current false. Never wire /api/ppa back here.
 */
export const PPA_VIRGINIA_BEACH = {
  eventId: "429c7980-e1b9-4800-805f-dfb160781cd9",
  name: "Mojo Energy Pouches Virginia Beach Open",
  venue: "Pickleball Virginia Beach, Virginia Beach, VA",
  tz: "America/New_York",
  start: "2026-10-12",
  end: "2026-10-18",
  firstServe: "8:00 AM EDT",
};

/**
 * PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026, 19–25 Oct, Kai Tak Arena.
 * UUID is tournamentId on https://www.ppatour.com/api/scores/?event=c7e4fd72-d159-4211-82a2-21adbb21defe
 * (verified 19 Oct 2026: 93 pro main-draw rows, all scheduled, dateLabel Date TBA).
 * Qualifier rows with a real dateKey stay on the day board. Date TBA is not a day
 * and is not a clock. No first-serve time until the ticker prints one.
 * Ticker rows are stamped with this pin only when the title contains this name.
 */
export const PPA_HONG_KONG = {
  eventId: "c7e4fd72-d159-4211-82a2-21adbb21defe",
  name: "PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026",
  venue: "Kai Tak Arena, Hong Kong",
  tz: "Asia/Hong_Kong",
  start: "2026-10-19",
  end: "2026-10-25",
  scorePath: "/api/ppa",
  officialUrl: "https://www.ppatour-asia.com/tournament/2026/hong-kong-slam/",
};

/** Live /api/ppa event. Week flip is this binding. */
export const PPA_NEXT = PPA_HONG_KONG;
export const PPA_LIVE = PPA_NEXT;
export const PPA_LIVE_EVENT_ID = PPA_LIVE.eventId;

/** True only for a prepared next id that is not already the live pin. */
export function isPreparedNextPpaId(id) {
  const s = String(id || "").trim().toLowerCase();
  if (!s || s === String(PPA_LIVE.eventId).toLowerCase()) return false;
  return s === String(PPA_NEXT.eventId).toLowerCase();
}

/** Finished PPA week. Results stay on /api/archive. Not the live board. */
export const PPA_LAS_VEGAS = {
  eventId: PPA_LAS_VEGAS_EVENT_ID,
  name: "PPA Rate Las Vegas Open",
  venue: "Darling Tennis Center, Las Vegas",
  tz: "America/Los_Angeles",
  start: "2026-09-28",
  end: "2026-10-04",
};

/**
 * Columbus ended 4 Oct 2026. Finished-tour archive only (current false).
 * Not the /api/app pin. ?tournamentId=18448 still smokes the old draw.
 */
export const APP_COLUMBUS = {
  eventId: "18448",
  name: "APP Columbus Open presented by The James",
  shortName: "APP Columbus Open",
  venue: "Pickle & Chill, Columbus, OH",
  tz: "America/New_York",
  start: "2026-10-01",
  end: "2026-10-04",
  scorePath: "/api/app",
  /** eventId("APP Columbus Open", "2026-10-01") — gpa:app columbus open / 2026-10-01 */
  calendarId: "gpa:app%20columbus%20open:2026-10-01",
  ended: true,
};

/**
 * Humana APP Louisville Open. Den 18454, 15–18 Oct 2026. Ended 18 Oct.
 * Archive id louisville, current false. The next US APP stop is Arizona
 * (no Den id). /api/app does not paint this week as LIVE after the end date.
 * ?tournamentId=18454 still smokes the draw. Pending is not a 0–0.
 */
export const APP_LOUISVILLE = {
  eventId: "18454",
  name: "Humana APP Louisville Open",
  shortName: "Humana APP Louisville Open",
  venue: "Kentucky International Convention Center, Louisville, KY",
  tz: "America/New_York",
  start: "2026-10-15",
  end: "2026-10-18",
  scorePath: "/api/app",
  calendarId: "gpa:humana%20app%20louisville%20open:2026-10-15",
};

/**
 * Chronological Den pins. selectAppLive picks the latest one whose start
 * date has arrived in that pin's venue timezone. Add the next stop here
 * (and point APP_NEXT at it) so the board moves on the start date.
 */
export const APP_PINS = [APP_COLUMBUS, APP_LOUISVILLE];

/**
 * No week after Louisville has a Den id. Same object as the coded pin.
 * After the end date the board is between events (Arizona has no Den id).
 * A later distinct APP_NEXT is appended by selectAppLive and flips on its
 * venue-local start date. Do not invent a Den id.
 */
export const APP_NEXT = APP_LOUISVILLE;

/** Coded pin. After its end date, /api/app is between events, not a LIVE board. */
export const APP_LIVE = APP_LOUISVILLE;

/** True once the pin's venue-local end date is in the past. Not a score. */
export function appPinWindowEnded(pin, now = new Date()) {
  if (!pin || !pin.end) return false;
  return ymdInVenueTz(pin.tz, now) > String(pin.end);
}

/** Venue-local calendar day. Speculative date helper for the pin flip — not a score. */
export function ymdInVenueTz(tz, now = new Date()) {
  const zone = tz || "UTC";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

/**
 * Live APP pin for an instant.
 * The latest pin in `pins` whose venue-local start date has arrived.
 * Before the first start, the earliest pin is returned.
 * After the current pin's end date, it stays until a later pin's start arrives
 * so an ended week is not replaced by a silent fallback to Columbus.
 * Speculative: dates only. Does not fetch Den and does not mark a match LIVE.
 */
export function selectAppLive(now = new Date(), pins = APP_PINS) {
  const list = [...(pins || [])].filter((p) => p && p.eventId && p.start);
  if (APP_NEXT && !list.some((p) => String(p.eventId) === String(APP_NEXT.eventId))) list.push(APP_NEXT);
  if (!list.length) return APP_LOUISVILLE;
  let chosen = null;
  for (const pin of list) {
    const today = ymdInVenueTz(pin.tz, now);
    if (today >= pin.start) chosen = pin;
  }
  return chosen || list[0];
}

/** True for a known Den id whose venue-local start date has not arrived. Query smoke still allowed. */
export function isPreparedNextDenId(id, now = new Date()) {
  const s = String(id || "").replace(/\D/g, "");
  if (!s) return false;
  const live = selectAppLive(now);
  if (s === String(live.eventId)) return false;
  const list = [...APP_PINS];
  if (APP_NEXT && !list.some((p) => String(p.eventId) === String(APP_NEXT.eventId))) list.push(APP_NEXT);
  const pin = list.find((p) => String(p.eventId) === s);
  if (!pin || !pin.start) return false;
  return ymdInVenueTz(pin.tz, now) < pin.start;
}

/** Overland ended 20 Sep 2026. Disarmed — not onLive, not the /api/app fallback. */
export const ENDED_APP = {
  overland: {
    denTournamentId: "18453",
    name: "APP Dillons Overland Park Open",
    gpaName: "APP Overland Park Open",
    venue: "AdventHealth Sports Park at Bluhawk, Overland Park, KS",
    timezone: "America/Chicago",
    start: "2026-09-17",
    end: "2026-09-20",
    ended: true,
  },
};

export function isEndedAppDenId(id, now = new Date()) {
  const s = String(id || "").replace(/\D/g, "");
  if (!s) return false;
  if (s === ENDED_APP.overland.denTournamentId) return true;
  const live = selectAppLive(now);
  if (s === String(live.eventId)) return false;
  const pin = APP_PINS.find((p) => String(p.eventId) === s);
  if (!pin || !pin.end) return false;
  return ymdInVenueTz(pin.tz, now) > pin.end;
}

export function isEndedOverlandRow(row) {
  if (!row || typeof row !== "object") return false;
  const den = String(row?.connector?.denTournamentId || row?.denTournamentId || "").replace(/\D/g, "");
  if (den === ENDED_APP.overland.denTournamentId) return true;
  return /overland park/i.test(String(row.name || ""));
}

/**
 * Code-armed calendar row for the APP pin at `now`.
 * After the pin's end date this is an ended row: not onLive, no score path.
 * Arizona has no Den id, so nothing replaces it with a fake live board.
 */
export function appArmedRow(now = new Date()) {
  const pin = selectAppLive(now);
  const ended = appPinWindowEnded(pin, now);
  return {
    id: pin.calendarId,
    name: pin.shortName,
    venue: pin.venue,
    timezone: pin.tz,
    tour: "app",
    host: "APP",
    tier: "",
    start: pin.start,
    end: pin.end,
    connector: ended
      ? { type: "none" }
      : {
          type: "app",
          denTournamentId: pin.eventId,
          scorePath: pin.scorePath,
        },
    status: ended ? "ended" : "live-path",
    onLive: !ended,
    ended,
    note: "",
    armedAt: "2026-10-15T00:00:00.000Z",
    gpaName: pin.shortName,
    gpaStart: pin.start,
  };
}

/** Older name from the Columbus week. Arms the current APP pin. */
export function columbusArmedRow(now) {
  return appArmedRow(now);
}

function isEndedColumbusRow(row, now = new Date()) {
  if (!row || typeof row !== "object") return false;
  if (String(selectAppLive(now).eventId) === APP_COLUMBUS.eventId) return false;
  const den = String(row?.connector?.denTournamentId || row?.denTournamentId || "").replace(/\D/g, "");
  if (den === APP_COLUMBUS.eventId) return true;
  return /columbus open/i.test(String(row.name || ""));
}

/**
 * Arm the live APP pin. Drop Overland 18453 and ended Columbus 18448 so a
 * stale blob cannot keep an ended week onLive. Does not invent a Den id
 * for Chongqing or any other APP Asia row.
 */
export function applyAppCalendarCut(events, now = new Date()) {
  const pin = selectAppLive(now);
  const kept = [];
  let armed = null;
  for (const e of events || []) {
    if (isEndedOverlandRow(e) || isEndedColumbusRow(e, now)) continue;
    const den = String(e?.connector?.denTournamentId || "").replace(/\D/g, "");
    if (isEndedAppDenId(den, now)) continue;
    const isLive = e?.id === pin.calendarId || den === String(pin.eventId);
    if (isLive) {
      const seed = appArmedRow(now);
      const ended = appPinWindowEnded(pin, now);
      armed = {
        ...seed,
        ...e,
        name: pin.shortName,
        venue: pin.venue,
        timezone: pin.tz,
        start: pin.start,
        end: pin.end,
        tour: "app",
        host: e.host || "APP",
        connector: ended
          ? { type: "none" }
          : {
              ...seed.connector,
              ...(e.connector || {}),
              type: "app",
              denTournamentId: pin.eventId,
              scorePath: pin.scorePath,
            },
        status: ended ? "ended" : "live-path",
        onLive: !ended,
        ended,
        id: pin.calendarId,
      };
      continue;
    }
    kept.push(e);
  }
  kept.push(armed || appArmedRow(now));
  return kept;
}

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
      "Window ended 27 Sep 2026 with no scores on the official PPA scores API. Unparked \u2014 do not cut /api/ppa to this UUID. Live board is PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026 (" +
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

/** MLP Asia is the PPA/MLP franchise. APP Asia Tour is APP. Never merge the chips. */
export const MLP_ASIA_NOTE =
  "MLP Asia \u2260 APP. MLP Asia is the PPA/MLP franchise. APP Asia Tour (Chongqing / Taipei / Bangkok / HCMC / India) stays on the APP Asia chip \u2014 never chip MLP Asia as APP.";

/** Humana APP Louisville Open ended 18 Oct 2026. Archive only. Not the live board. */
export const LOUISVILLE = {
  id: "slate:app-louisville-2026",
  name: APP_LOUISVILLE.name,
  venue: APP_LOUISVILLE.venue,
  timezone: APP_LOUISVILLE.tz,
  tour: "app",
  host: "APP",
  tier: "",
  start: APP_LOUISVILLE.start,
  end: APP_LOUISVILLE.end,
  status: "ended",
  onLive: false,
  ended: true,
  denTournamentId: APP_LOUISVILLE.eventId,
  officialUrl: "https://theapp.global/tour-schedule/2026-app-louisville",
  note:
    "Ended 18 Oct 2026. Den 18454 is archive louisville, current false. All pro brackets Completed or Pending — not RUNNING. /api/app with no params is between events (reader Event ended, no LIVE rows). ?tournamentId=18454 still smokes the draw. Next US APP is APP Arizona Open, no Den id. Do not fake LIVE.",
  connector: { type: "none" },
};

/** Next APP Pro after Louisville. No published Den scoring id. */
export const ARIZONA_APP = {
  id: "slate:app-arizona-2026",
  name: "APP Arizona Open",
  venue: "Arizona Athletic Grounds, Mesa, AZ",
  timezone: "America/Phoenix",
  tour: "app",
  host: "APP",
  tier: "",
  start: "2026-11-12",
  end: "2026-11-15",
  status: "results-only",
  onLive: false,
  denTournamentId: null,
  officialUrl: "https://theapp.global/tour-schedule/2026-app-arizona",
  note:
    "APP Arizona Open at Arizona Athletic Grounds, Mesa (official page 12–15 Nov 2026). No Den Live tournamentId published. Results-only. Do not invent a Den id. Do not mark LIVE. Not the PPA Arizona event.",
  connector: { type: "none" },
};

/** APP Asia. No Den id and no SportsSync id after the 2026-10-02 hunt. */
export const CHONGQING_SLATE = {
  id: "slate:app-asia-chongqing-2026",
  name: CHONGQING.name,
  venue: CHONGQING.venue,
  timezone: CHONGQING.tz,
  tour: "app-asia",
  host: "APP",
  tier: "",
  start: CHONGQING.start,
  end: CHONGQING.end,
  status: "results-only",
  onLive: false,
  denTournamentId: null,
  sportsSyncTournamentId: null,
  note: CHONGQING_DESK_NOTE,
  connector: { type: "none" },
};

/** Official APP page window. GPA still says 2026-10-26 — do not treat that as the event dates. */
export const BANGKOK = {
  id: "slate:app-asia-bangkok-2026",
  name: "APP Asia Bangkok Open",
  venue: "Bangkok, Thailand",
  timezone: "Asia/Bangkok",
  tour: "app-asia",
  host: "APP",
  tier: "",
  start: "2026-11-02",
  end: "2026-11-07",
  status: "results-only",
  onLive: false,
  dateAuthority: "official",
  sportsSyncTournamentId: null,
  officialUrl: "https://theapp.global/tour-schedule/2026-app-bangkok-open",
  note:
    "Official APP page data-event-start 2026-11-02 through 2026-11-07. GPA listed 2026-10-26. SportsSync register link 391 redirects to /tournament/index (2026-10-02) and is not armed. Not Chongqing. Not MLP. Results-only. Do not fake LIVE.",
  connector: { type: "none" },
};

export const TAIPEI = {
  id: "slate:app-asia-taipei-2026",
  name: "TCI APP Asia Taipei City Open",
  venue: "Taipei City, Taiwan",
  timezone: "Asia/Taipei",
  tour: "app-asia",
  host: "APP",
  tier: "",
  start: "2026-11-12",
  end: "2026-11-15",
  status: "results-only",
  onLive: false,
  sportsSyncTournamentId: null,
  note:
    "GPA window 2026-11-12–2026-11-15. SportsSync 390 is a label on theapp.asia and /tournament/390 does not resolve (2026-10-02). Not Chongqing. Not MLP. Results-only. Do not fake LIVE.",
  connector: { type: "none" },
};

export const INDIA_APP = {
  id: "slate:app-asia-india-2026",
  name: "APP India Open",
  venue: "India",
  timezone: "Asia/Kolkata",
  tour: "app-asia",
  host: "APP",
  tier: "",
  start: "2026-11-27",
  end: "2026-11-27",
  status: "results-only",
  onLive: false,
  officialUrl: "https://theapp.global/tour-schedule/2026-app-india-open",
  note:
    "APP India Open dated 2026-11-27 on the official APP page and GPA. No Den id and no SportsSync id. APP Asia, not MLP. Results-only. Do not fake LIVE.",
  connector: { type: "none" },
};

export const HCMC = {
  id: "slate:app-asia-hcmc-2026",
  name: "APP Ho Chi Minh City Open",
  venue: "Ho Chi Minh City, Vietnam",
  timezone: "Asia/Ho_Chi_Minh",
  tour: "app-asia",
  host: "APP",
  tier: "",
  start: "2026-12-02",
  end: "2026-12-02",
  status: "results-only",
  onLive: false,
  officialUrl: "https://theapp.global/tour-schedule/2026-app-ho-chi-minh-city-open",
  note:
    "APP Ho Chi Minh City Open dated 2026-12-02 on the official APP page and GPA. No Den id and no SportsSync id. APP Asia, not MLP. Results-only. Do not fake LIVE.",
  connector: { type: "none" },
};

/** MLP Asia franchise season. Not APP Asia. */
export const MLP_ASIA_SEASON = {
  id: "slate:mlp-asia-2026",
  name: "MLP Asia 2026",
  venue: "Home nights — Tokyo opener",
  timezone: "Asia/Tokyo",
  tour: "mlp-asia",
  host: "MLP Asia",
  tier: "",
  start: "2026-11-13",
  end: "2026-12-12",
  status: "results-only",
  onLive: false,
  officialUrl: "https://mlp-asia.com/meet-the-six-teams-draft-sign-up-and-showdown-schedule-revealed/",
  note:
    MLP_ASIA_NOTE +
    " Pool nights 13–28 Nov 2026 (Tokyo 13 Nov, Hong Kong 14 Nov, Manila 20 Nov, Vietnam 21 Nov, 27–28 Nov) and playoffs 11–12 Dec. Results-only. No live path.",
  connector: { type: "none" },
};

/**
 * Upcoming PPA stops after Hong Kong. UUIDs were on the 19 Oct 2026
 * ppatour.com/schedule payload and the scores API echoed the same tournamentId.
 * Ottawa, Nanjing, College, Lille, and Daytona returned 0 match rows — not a
 * live score path. Opendoor's schedule UUID is last year's finals; it is not stored.
 * None of these is /api/ppa. Do not invent a clock.
 */
function ppaCalendarSeed(row) {
  return {
    tour: "ppa",
    host: "PPA Tour",
    tier: row.tier || "",
    status: "results-only",
    onLive: false,
    ppaEventId: row.ppaEventId || null,
    officialUrl: row.officialUrl || "",
    note: row.note,
    connector: row.ppaEventId ? { type: "none", ppaEventId: row.ppaEventId } : { type: "none" },
    ...row,
  };
}

export const PPA_OTTAWA = ppaCalendarSeed({
  id: "slate:ppa-ottawa-125-2026",
  name: "PPA Canada Ottawa 125",
  venue: "The Forge, Ottawa, Canada",
  timezone: "America/Toronto",
  tier: "125",
  start: "2026-10-22",
  end: "2026-10-25",
  ppaEventId: "94307fed-6e0f-4390-bf19-bda3bfb80d18",
  officialUrl: "https://ppatourcanada.ca/tournament/2026/ottawa-125/",
  note:
    "Scores API tournamentId 94307fed-6e0f-4390-bf19-bda3bfb80d18 echoed on 19 Oct 2026 with 0 match rows. Not the live pin. Do not cut /api/ppa here.",
});

export const PPA_NANJING = ppaCalendarSeed({
  id: "slate:ppa-nanjing-125-2026",
  name: "PPA Asia 125 Skechers Nanjing Challenger 2026",
  venue: "Ledongli Jiangning Digital Sports Center, Nanjing",
  timezone: "Asia/Shanghai",
  tour: "asia",
  tier: "125",
  start: "2026-10-28",
  end: "2026-10-31",
  ppaEventId: "49004a6d-fb3b-4a64-81a5-6468df8ec39d",
  officialUrl: "https://pickleballtournaments.com/tournaments/ppa-asia-125-skechers-nanjing-challenger-2026",
  note:
    "Scores API tournamentId 49004a6d-fb3b-4a64-81a5-6468df8ec39d echoed on 19 Oct 2026 with 0 match rows. PPA Asia, not APP Asia, not MLP. Not the live pin. Do not cut /api/ppa here.",
});

export const PPA_COLLEGE_WORLDS = ppaCalendarSeed({
  id: "slate:ppa-college-worlds-2026",
  name: "College World Championship",
  venue: "Brookhaven Country Club, Farmers Branch, TX",
  timezone: "America/Chicago",
  start: "2026-10-30",
  end: "2026-11-01",
  ppaEventId: "95602192-b649-420f-a8ff-0887fddfe1e7",
  officialUrl: "https://www.ppatour.com/events/2026/college-world-championship/",
  note:
    "Scores API tournamentId 95602192-b649-420f-a8ff-0887fddfe1e7 echoed on 19 Oct 2026 with 0 match rows. Not the Opendoor Worlds UUID. Not the live pin. Do not cut /api/ppa here.",
});

export const PPA_OPENDOOR_WORLDS = ppaCalendarSeed({
  id: "slate:ppa-opendoor-worlds-2026",
  name: "Opendoor Pickleball World Championships",
  venue: "Brookhaven Country Club, Farmers Branch, TX",
  timezone: "America/Chicago",
  start: "2026-11-02",
  end: "2026-11-08",
  ppaEventId: null,
  officialUrl: "https://www.ppatour.com/events/2026/pickleball-world-championships/",
  note:
    "Schedule card slug pickleball-world-championships lists tournamentUuid f02fa839-68e0-46d5-8b93-dc266f201a4e. Scores API for that UUID is 322 final rows dated 4–9 Nov 2025, not the 2026 draw. UUID is not stored as a score path. Not wired. Do not cut /api/ppa to that UUID.",
});

export const PPA_LILLE = ppaCalendarSeed({
  id: "slate:ppa-lille-p125-2026",
  name: "PPA Tour Europe · P125 Lille",
  venue: "Lille, Villeneuve d'Ascq, France",
  timezone: "Europe/Paris",
  tour: "ppa-eu",
  tier: "P125",
  start: "2026-11-12",
  end: "2026-11-15",
  ppaEventId: "04a30133-11cc-4280-97f7-3027404c05b3",
  officialUrl: "https://www.ppatour.com/schedule/",
  note:
    "Schedule name PPA TOUR EUROPE - P125 LILLE. Scores API tournamentId 04a30133-11cc-4280-97f7-3027404c05b3 echoed on 19 Oct 2026 with 0 match rows. Not Barcelona. Not the live pin. Do not cut /api/ppa here.",
});

export const PPA_DAYTONA = ppaCalendarSeed({
  id: "slate:ppa-daytona-2026",
  name: "Proton Daytona Beach Open",
  venue: "Pictona at Holly Hill, Holly Hill, FL",
  timezone: "America/New_York",
  start: "2026-11-16",
  end: "2026-11-22",
  ppaEventId: "12a61e43-1dc7-4d48-a926-10d3aa1a66cb",
  officialUrl: "https://www.ppatour.com/events/2026/proton-daytona-beach-open/",
  note:
    "Scores API tournamentId 12a61e43-1dc7-4d48-a926-10d3aa1a66cb echoed on 19 Oct 2026 with 0 match rows. Not the live pin. Do not cut /api/ppa here.",
});

/** Radar probes these. A verified UUID with no rows is not a live path. */
export const PPA_UPCOMING = [PPA_OTTAWA, PPA_NANJING, PPA_COLLEGE_WORLDS, PPA_LILLE, PPA_DAYTONA];

/**
 * RTA2000 Farnham. Tournated 8510. Own tour — not an APP or PPA chip.
 * APP Louisville ended 18 Oct. Live PPA is Hong Kong Slam.
 */
export const FARNHAM = {
  id: "slate:rta-farnham-2026",
  name: "RTA2000 Farnham",
  venue: "Hurlands Pickleball + Padel Club, Farnham, England",
  timezone: "Europe/London",
  tour: "rta",
  host: "RTA",
  tier: "RTA2000",
  start: "2026-10-02",
  end: "2026-10-04",
  status: "live-path",
  onLive: true,
  officialUrl:
    "https://play.rtapickleballtour.com/tournament/8510/draws?category=34477&segment=MD",
  note:
    "Tournated tournament 8510 at Hurlands. Window ended 4 Oct 2026. /api/rta reads drawsDetail. Unplayed rows after the window are not NEXT. Not APP and not PPA. Do not cut /api/app back onto Humana APP Louisville Open Den 18454. Do not cut /api/ppa off PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026 c7e4fd72-d159-4211-82a2-21adbb21defe.",
  connector: { type: "url", scoreUrl: "/api/rta" },
};

export const SLATE = [
  FARNHAM,
  GIJON,
  BARCELONA,
  CHONGQING_SLATE,
  LOUISVILLE,
  PPA_OTTAWA,
  PPA_NANJING,
  PPA_COLLEGE_WORLDS,
  PPA_OPENDOOR_WORLDS,
  BANGKOK,
  ARIZONA_APP,
  PPA_LILLE,
  TAIPEI,
  PPA_DAYTONA,
  MLP_ASIA_SEASON,
  INDIA_APP,
  HCMC,
];

export function coverageSeedFor(name) {
  return SLATE.find((s) => matchesSlateName(name, s.name)) || null;
}

/** Desk / radar copy. Never send these strings on the public board. */
export const FILTER_COPY = {
  tpb: "TOP Pickleball Tour (powered by APP, not APP Den). Scores delayed \u2014 no live path. Official draw PDF only.",
  "ppa-eu":
    "PPA Tour Europe. Barcelona window ended 27 Sep 2026 with no scores. Not the live board \u2014 PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026 is /api/ppa.",
  "app-asia": "APP Asia Tour \u2014 not MLP Asia. No Den Live id. SportsSync /api/sportssync is results-only once a real tournamentId is listed. Not LIVE.",
  "mlp-asia": MLP_ASIA_NOTE,
  asia: "PPA Asia \u2014 results-only until a working ticker is wired. Not APP Asia, not MLP Asia.",
  gpa: "GPA calendar. Live only when intake passes (name \u00b7 venue \u00b7 tz \u00b7 score path).",
};

/**
 * Public reader sentences.
 * Results-only / ended / parked cards use ended, delayed, draw, results.
 * A live-armed board with nothing in progress uses soon — never a LIVE chip.
 */
export const READER_LINES = {
  ended: "Event ended",
  delayed: "Scores delayed",
  draw: "Draw not published yet",
  results: "Results will appear when available",
  soon: "Play starts soon",
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

/** Den match tokens that may paint a LIVE chip. Pending brackets are not in this set. */
export const DEN_LIVE_STATUSES = ["RUNNING", "IN_PROGRESS", "INPROGRESS", "STARTED", "PLAYING"];

const DEN_DONE_STATUSES = ["COMPLETED", "COMPLETE", "FINISHED", "CLOSED"];

export function denStatusToken(raw) {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
}

export function isDenLiveStatus(raw) {
  return DEN_LIVE_STATUSES.includes(denStatusToken(raw));
}

/** Bracket list status. "Running" / RUNNING counts. "Pending" does not. */
export function isDenRunningBracket(status) {
  return isDenLiveStatus(status);
}

export function isDenPendingBracket(status) {
  const s = denStatusToken(status);
  if (!s) return true;
  if (isDenRunningBracket(status)) return false;
  if (DEN_DONE_STATUSES.includes(s)) return false;
  return true;
}

/**
 * A match paints LIVE only when WPM status is LIVE and Den said it is running.
 * A pending / scheduled row with a leaked LIVE label does not count.
 * Legacy rows with no denStatus keep status === "LIVE".
 */
export function matchCountsAsLive(m) {
  if (!m || m.status === "FT") return false;
  const token = m.denStatus == null ? "" : String(m.denStatus);
  if (token) return m.status === "LIVE" && isDenLiveStatus(token);
  return m.status === "LIVE";
}

/**
 * Live-armed board with nothing in progress.
 * Empty pending brackets before first serve, or a next-only list: reader line, not LIVE.
 * A failed fetch (delayed) stays "Scores delayed". An ended window stays quiet.
 */
export function appBoardPhase({
  liveCount = 0,
  matches = [],
  brackets = [],
  startDate = "",
  endDate = "",
  today = "",
  delayed = false,
} = {}) {
  if (delayed) return { preServe: false, reader: READER_LINES.delayed, live: false };
  const rows = Array.isArray(matches) ? matches : [];
  const bracketRows = Array.isArray(brackets) ? brackets : [];
  const live = rows.some(matchCountsAsLive);
  if (live) return { preServe: false, reader: "", live: true };
  const ended = !!(endDate && today && String(endDate) < String(today));
  if (ended) return { preServe: false, reader: "", live: false };
  const pending = bracketRows.filter((b) =>
    isDenPendingBracket(typeof b === "string" ? b : b && b.status)
  );
  const nextLike = (m) => {
    if (!m || matchCountsAsLive(m) || m.status === "FT") return false;
    if (m.denStatus && !isDenLiveStatus(m.denStatus)) return true;
    const st = String(m.status || "").toUpperCase();
    return st === "NEXT" || st === "PENDING" || st === "SCHEDULED";
  };
  const onlyNext = rows.length > 0 && rows.every(nextLike);
  const empty = rows.length === 0;
  const start = String(startDate || "");
  const day = String(today || "");
  const onOrBeforeStart = !!(start && day && start >= day);
  const preServe =
    onlyNext ||
    (empty && pending.length > 0) ||
    (empty && bracketRows.length === 0 && onOrBeforeStart);
  // liveCount cannot invent a LIVE board when no match is actually running.
  void liveCount;
  return {
    preServe,
    reader: preServe ? READER_LINES.soon : "",
    live: false,
  };
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

/**
 * Ticker title must contain the pinned event name.
 * "PPA Tour: PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026" matches Hong Kong.
 * "PPA Tour: Mojo Energy Pouches Virginia Beach Open" does not. A bare "Hong Kong" does not.
 * Empty title does not contradict the pin (older feeds omit it).
 */
export function ppaTickerTitleAligned(title, pin = PPA_LIVE) {
  const t = String(title || "").trim();
  if (!t) return true;
  const name = String(pin?.name || "").trim();
  if (!name) return false;
  return t.toLowerCase().includes(name.toLowerCase());
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
  if (/chongqing/i.test(a) && /chongqing/i.test(b)) return true;
  if (/louisville/i.test(a) && /louisville/i.test(b)) return true;
  if (/bangkok/i.test(a) && /bangkok/i.test(b)) return true;
  if (/taipei/i.test(a) && /taipei/i.test(b)) return true;
  if (/virginia beach/i.test(a) && /virginia beach/i.test(b)) return true;
  if (/hong kong|hang seng/i.test(a) && /hong kong|hang seng/i.test(b)) return true;
  if (/ottawa/i.test(a) && /ottawa/i.test(b)) return true;
  if (/nanjing/i.test(a) && /nanjing/i.test(b)) return true;
  if (/college world/i.test(a) && /college world/i.test(b)) return true;
  if (/opendoor|world championships/i.test(a) && /opendoor|world championships/i.test(b)) return true;
  if (/lille/i.test(a) && /lille/i.test(b)) return true;
  if (/daytona/i.test(a) && /daytona/i.test(b)) return true;
  if (/veolia chicago|chicago cup/i.test(a) && /veolia chicago|chicago cup/i.test(b)) return true;
  if (/\bmlp\b/i.test(a) && /\bmlp\b/i.test(b)) return true;
  if (/india open/i.test(a) && /india open/i.test(b)) return true;
  if (/ho chi minh/i.test(a) && /ho chi minh/i.test(b)) return true;
  if (/\bapp\b/i.test(a) && /\bapp\b/i.test(b) && /arizona/i.test(a) && /arizona/i.test(b)) return true;
  return false;
}

function watchFromSeed(seed, extra = {}) {
  return {
    tour: seed.tour,
    name: seed.name,
    start: seed.start,
    end: seed.end,
    venue: seed.venue,
    tz: seed.timezone,
    source: "slate-seed",
    denId: seed.denTournamentId || null,
    ppaEventId: seed.ppaEventId || null,
    sportsSyncTournamentId: seed.sportsSyncTournamentId || null,
    officialUrl: seed.officialUrl || "",
    scorePath: null,
    onLive: false,
    nextPin: seed.nextPin === true,
    intake: {
      name: true,
      venue: Boolean(seed.venue),
      timezone: Boolean(seed.timezone),
      scorePath: false,
      status: "fail",
    },
    board: "results_only",
    note: seed.note,
    ...extra,
  };
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
    onLive: seed.onLive === true && seed.status === "live-path",
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
    watchFromSeed(CHONGQING_SLATE),
    watchFromSeed(BANGKOK),
    watchFromSeed(ARIZONA_APP),
    watchFromSeed(TAIPEI),
    watchFromSeed(MLP_ASIA_SEASON),
    watchFromSeed(INDIA_APP),
    watchFromSeed(HCMC),
    watchFromSeed(PPA_OTTAWA),
    watchFromSeed(PPA_NANJING),
    watchFromSeed(PPA_COLLEGE_WORLDS),
    watchFromSeed(PPA_OPENDOOR_WORLDS),
    watchFromSeed(PPA_LILLE),
    watchFromSeed(PPA_DAYTONA),
  ];
}
