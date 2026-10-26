/**
 * Hand-curated official schedule rows for tours the GPA slate does not carry.
 * Every row was read from the tour's own public page on VERIFIED_ON with
 * UA "WPMagBot/1.0 (+https://worldpickleballmagazine.com)". Dates are copied
 * from the source as published — never inferred. Re-verify before editing.
 * `endPublished: false` means the source lists only a start date.
 */
export const VERIFIED_ON = "2026-10-26";

const row = (r) => ({
  host: r.tour.toUpperCase(),
  tier: "",
  status: "results-only",
  onLive: false,
  connector: { type: "none" },
  verifiedOn: VERIFIED_ON,
  endPublished: true,
  ...r,
  officialUrl: r.sourceUrl,
  note: `Official schedule: ${r.sourceUrl} (verified ${VERIFIED_ON}). No score path.`,
});

export const OFFICIAL_SCHEDULE = [
  // RTA Pickleball Tour — RTA2000 season ended at Farnham (2-4 Oct). Next pro event is the European Finals.
  row({
    id: "official:rta-arlberg-finals-2026",
    tour: "rta",
    host: "RTA",
    tier: "APC",
    name: "RTA European Finals – Arlberg Pickleball Championship 2026",
    venue: "Arlberg WellCom, St. Anton am Arlberg, Austria",
    timezone: "Europe/Vienna",
    start: "2026-12-18",
    end: "2026-12-20",
    sourceUrl: "https://play.rtapickleballtour.com/tournaments?upcoming=1&inProgress=1",
    alsoUrl: "https://rtapickleballtour.com/",
  }),
  row({
    id: "official:rta-arlberg-team-2026",
    tour: "rta",
    host: "RTA",
    tier: "Amateur team",
    name: "RTA Amateur Team Event – Arlberg Pickleball Championship 2026",
    venue: "Arlberg WellCom, St. Anton am Arlberg, Austria",
    timezone: "Europe/Vienna",
    start: "2026-12-18",
    end: "2026-12-20",
    sourceUrl: "https://play.rtapickleballtour.com/tournaments?upcoming=1&inProgress=1",
    alsoUrl: "https://rtapickleballtour.com/",
  }),
  // TOP Pickleball Tour (powered by APP) — 2026 calendar on the home page.
  row({
    id: "official:tpb-almeria-2026",
    tour: "tpb",
    host: "TPB",
    name: "TPB Almería 2026",
    venue: "Almería, Spain",
    timezone: "Europe/Madrid",
    start: "2026-10-23",
    end: "2026-10-25",
    sourceUrl: "https://toppickleballtour.com/",
  }),
  row({
    id: "official:tpb-somontes-2026",
    tour: "tpb",
    host: "TPB",
    name: "TPB Somontes 2026",
    venue: "Somontes, Spain",
    timezone: "Europe/Madrid",
    start: "2026-11-13",
    end: "2026-11-15",
    sourceUrl: "https://toppickleballtour.com/",
  }),
  row({
    id: "official:tpb-andorra-2026",
    tour: "tpb",
    host: "TPB",
    name: "TPB Andorra 2026",
    venue: "Andorra",
    timezone: "Europe/Andorra",
    start: "2026-11-20",
    end: "2026-11-22",
    sourceUrl: "https://toppickleballtour.com/",
  }),
  // US Open Pickleball Championships — home page banner.
  row({
    id: "official:us-open-2027",
    tour: "us open",
    host: "US Open",
    name: "US Open Pickleball Championships 2027",
    venue: "East Naples Community Park, Naples, FL",
    timezone: "America/New_York",
    start: "2027-04-17",
    end: "2027-04-24",
    sourceUrl: "https://www.usopenpickleball.com/",
  }),
  // Major League Pickleball (US) — 2026 schedule; only the Nations Cup is still ahead.
  row({
    id: "official:mlp-nations-cup-2026",
    tour: "mlp",
    host: "MLP",
    name: "MLP Nations Cup 2026",
    venue: "Brookhaven Country Club, Dallas, TX",
    timezone: "America/Chicago",
    start: "2026-10-30",
    end: "2026-11-01",
    sourceUrl: "https://majorleaguepickleball.co/events-2026/mlp-nations-cup/",
  }),
  // PPA Tour Australia — calendar lists a start date only.
  row({
    id: "official:ppa-au-adelaide-2026",
    tour: "ppa-au",
    host: "PPA Australia",
    tier: "PPA125",
    name: "PPA 125 Adelaide",
    venue: "Voyager Playford, Adelaide, SA",
    timezone: "Australia/Adelaide",
    start: "2026-12-10",
    end: "2026-12-10",
    endPublished: false,
    sourceUrl: "https://ppatour.com.au/calendar/",
    alsoUrl: "https://ppatour.com.au/tournaments/ppa-125-adelaide-sa/",
  }),
];
