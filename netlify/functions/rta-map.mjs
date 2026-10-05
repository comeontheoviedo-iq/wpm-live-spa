/**
 * RTA2000 Farnham via Tournated public drawsDetail.
 * Tournament 8510 on play.rtapickleballtour.com. Own tour "rta" — never APP, never PPA.
 *
 * Score strings are game points ("11:2 11:1"). Seeds, ranks, and DUPR ratings
 * on the same card are not scores. LIVE only when status is inProgress or
 * isMatchInProgress is true. A live match with no points stays score-blank.
 * matchStatus values "Specific Time" and "Followed By" are schedule types.
 */

export const RTA_TOURNAMENT_ID = 8510;
export const RTA_GRAPHQL = "https://play.rtapickleballtour.com/api/graphql";

export const FARNHAM = {
  id: String(RTA_TOURNAMENT_ID),
  name: "RTA2000 Farnham",
  title: "RTA2000 - Farnham",
  venue: "Hurlands Pickleball + Padel Club, Farnham, England",
  tz: "Europe/London",
  start: "2026-10-02",
  end: "2026-10-04",
  eventKey: "ev:rta:8510",
  tour: "rta",
  officialUrl:
    "https://play.rtapickleballtour.com/tournament/8510/draws?category=34477&segment=MD",
};

/** Tournated category setting ids. Segment "MD" is the main draw, not men's doubles. */
export const RTA_CATEGORIES = [
  { id: 34474, code: "WS", disc: "WS", label: "Women's singles" },
  { id: 34475, code: "MS", disc: "MS", label: "Men's singles" },
  { id: 34476, code: "WD", disc: "WD", label: "Women's doubles" },
  { id: 34477, code: "MD", disc: "MD", label: "Men's doubles" },
  { id: 34478, code: "MX", disc: "XD", label: "Mixed doubles" },
];

/** Main draw plus consolation / qualification. Discipline codes are categories, not segments. */
export const RTA_SEGMENTS = ["MD", "consolation", "Q"];

const CATEGORY_BY_ID = new Map(RTA_CATEGORIES.map((c) => [c.id, c]));

export function gameComplete(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const hi = Math.max(x, y);
  const lo = Math.min(x, y);
  return hi >= 11 && hi - lo >= 2;
}

/** Only "11:2 11:1" style tokens. Anything else is not a score. */
export function parseGameScores(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return [];
  const parts = text.split(/\s+/);
  const games = [];
  for (const part of parts) {
    const m = /^(\d+):(\d+)$/.exec(part);
    if (!m) return null;
    games.push([Number(m[1]), Number(m[2])]);
  }
  return games;
}

export function cleanName(raw) {
  return String(raw || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sideName(entry) {
  if (!entry || typeof entry !== "object") return "";
  const people = [];
  for (const row of entry.users || []) {
    const user = row && row.user;
    const name = cleanName(`${(user && user.name) || ""} ${(user && user.surname) || ""}`);
    if (name) people.push(name);
  }
  if (people.length) return people.join(" / ");
  const team = cleanName(entry.team && (entry.team.title || entry.team.name));
  if (team && !/^(tbd|tba|bye)$/i.test(team)) return team;
  return "";
}

export function isPlaceholderSide(name) {
  const s = cleanName(name);
  return !s || /^(tbd|tba|bye)$/i.test(s);
}

/** Tournated stores the local calendar date as UTC midnight. Do not shift it into the previous day. */
export function boardDate(raw) {
  const m = String(raw || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

export function wallTimeToIso(date, time, tz) {
  const day = boardDate(date);
  const clock = String(time || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!day || !clock) return "";
  const [y, mo, d] = day.split("-").map(Number);
  const h = Number(clock[1]);
  const mi = Number(clock[2]);
  if (h > 23 || mi > 59) return "";
  const zone = tz || "UTC";
  let utc = Date.UTC(y, mo - 1, d, h, mi, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(utc)).map((p) => [p.type, p.value]));
    const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    const wanted = Date.UTC(y, mo - 1, d, h, mi, 0);
    const next = utc + (wanted - asLocal);
    if (next === utc) break;
    utc = next;
  }
  return new Date(utc).toISOString();
}

function categoryMeta(draw, fallbackId) {
  const settingId = Number(
    (draw && draw.tournamentCategory && draw.tournamentCategory.id) || fallbackId || 0
  );
  const known = CATEGORY_BY_ID.get(settingId);
  if (known) return known;
  const cat = (draw && draw.tournamentCategory && draw.tournamentCategory.category) || {};
  const name = String(cat.name || draw?.title || "");
  const blob = `${name} ${cat.gender || ""} ${cat.type || ""}`.toLowerCase();
  if (/mixed/.test(blob)) return { id: settingId, code: "MX", disc: "XD", label: "Mixed doubles" };
  if (/women/.test(blob) && /single/.test(blob)) return { id: settingId, code: "WS", disc: "WS", label: "Women's singles" };
  if (/single/.test(blob)) return { id: settingId, code: "MS", disc: "MS", label: "Men's singles" };
  if (/women/.test(blob)) return { id: settingId, code: "WD", disc: "WD", label: "Women's doubles" };
  return { id: settingId, code: "MD", disc: "MD", label: "Men's doubles" };
}

function collectSeeds(draw) {
  const out = [];
  const push = (seed, roundTitle, bracketType) => {
    if (!seed || seed.id == null) return;
    out.push({
      seed,
      roundTitle: roundTitle || seed.round || "",
      bracketType: bracketType || "",
    });
  };
  const walkRound = (round, bracketType) => {
    if (!round) return;
    for (const seed of round.seeds || []) push(seed, round.title, bracketType);
    if (round.lowerPlaceMatch && round.lowerPlaceMatch.id != null) {
      push(round.lowerPlaceMatch, round.title || "Place", bracketType);
    }
  };
  for (const round of draw.rounds || []) walkRound(round, "");
  for (const bracket of draw.brackets || []) {
    for (const round of bracket.rounds || []) walkRound(round, bracket.type || "");
    if (bracket.lowerPlaceMatch && bracket.lowerPlaceMatch.id != null) {
      push(bracket.lowerPlaceMatch, "Place", bracket.type || "");
    }
  }
  if (draw.lowerPlaceMatch && draw.lowerPlaceMatch.id != null) push(draw.lowerPlaceMatch, "Place", "");
  return out;
}

function isLiveSeed(seed) {
  if (!seed) return false;
  if (seed.isMatchInProgress === true) return true;
  return String(seed.status || "") === "inProgress";
}

function isFinishedSeed(seed) {
  return String(seed && seed.status || "") === "completed";
}

/**
 * Map one draw seed. Returns null for byes, empty slots, and hidden placeholders.
 * Never returns score "0-0".
 */
export function mapRtaSeed(seed, meta) {
  if (!seed || seed.id == null) return null;
  if (seed.isBye === true) return null;
  const a = sideName(seed.entry1);
  const b = sideName(seed.entry2);
  if (isPlaceholderSide(a) || isPlaceholderSide(b)) return null;

  const live = isLiveSeed(seed);
  const finished = isFinishedSeed(seed);
  const parsed = parseGameScores(seed.score);
  const games = parsed || [];
  // Drop padded 0:0. A live match whose only points are 0:0 is still blank.
  const played = games.filter(([x, y]) => !(x === 0 && y === 0));

  const lines = played.map(([x, y], i) => {
    const done = gameComplete(x, y);
    const last = i === played.length - 1;
    return {
      disc: "G" + (i + 1),
      score: `${x}–${y}`,
      winner: done ? (x > y ? a : y > x ? b : "") : "",
      live: live && last && !done,
      court: "",
    };
  });

  let aWins = 0;
  let bWins = 0;
  for (const line of lines) {
    if (!line.winner) continue;
    if (line.winner === a) aWins += 1;
    else if (line.winner === b) bWins += 1;
  }
  const score = aWins || bWins ? `${aWins}-${bWins}` : "";

  let status = "NEXT";
  if (live) status = "LIVE";
  else if (finished) status = "FT";

  const court = cleanName(seed.court && (seed.court.name || seed.court));
  const date = boardDate(seed.date);
  const time = String(seed.time || "").trim();
  const hasClock = /^(\d{1,2}):(\d{2})$/.test(time);
  const tz = (meta && meta.tz) || FARNHAM.tz;
  const start = hasClock ? wallTimeToIso(date, time, tz) : "";
  const round = cleanName(meta && meta.round) || cleanName(seed.round);
  const label = (meta && meta.label) || "Match";
  const div = [label, round].filter(Boolean).join(" · ");
  const note = seed.isWalkover === true && !lines.length ? "Walkover" : court || "";

  return {
    id: "rta-" + seed.id,
    date,
    tour: "rta",
    comp: (meta && meta.comp) || FARNHAM.name,
    div,
    round: round || label,
    disc: (meta && meta.disc) || "",
    format: "ko",
    a,
    b,
    roster: `${a} vs ${b}`,
    tags: (meta && meta.tagsFor ? meta.tagsFor(`${a} ${b}`) : []),
    status,
    start,
    end: "",
    score,
    games: lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · "),
    lines,
    court,
    hasClock: hasClock && !!start,
    eventKey: (meta && meta.eventKey) || FARNHAM.eventKey,
    note,
    watch: "",
    venue: (meta && meta.venue) || FARNHAM.venue,
    tz,
    categoryId: meta && meta.categoryId,
    segment: (meta && meta.segment) || "",
    rtaStatus: seed.status || "",
    rtaLive: live,
  };
}

function emptyCategory(cat) {
  return {
    id: cat.id,
    code: cat.code,
    disc: cat.disc,
    label: cat.label,
    name: cat.name || cat.label,
    draws: 0,
    seeds: 0,
    contests: 0,
    scored: 0,
    live: 0,
    segments: [],
  };
}

/**
 * @param {Array<{categoryId:number, segment?:string, draws:any[]}>} packs
 * @param {{tagsFor?: Function}} [opts]
 */
export function mapRtaPacks(packs, opts = {}) {
  const tagsFor = opts.tagsFor;
  const byId = new Map();
  const cats = new Map(RTA_CATEGORIES.map((c) => [c.id, emptyCategory(c)]));

  for (const pack of packs || []) {
    const fallbackId = Number(pack.categoryId || 0);
    if (!cats.has(fallbackId) && fallbackId) {
      cats.set(fallbackId, emptyCategory({ id: fallbackId, code: String(fallbackId), disc: "", label: "Match" }));
    }
    const bucket = cats.get(fallbackId);
    const segment = pack.segment || "";
    const visibleDraws = (pack.draws || []).filter((draw) => draw && !draw.hide);
    if (bucket && segment && visibleDraws.length && !bucket.segments.includes(segment)) {
      bucket.segments.push(segment);
    }
    for (const draw of visibleDraws) {
      if (!draw || draw.hide) continue;
      if (bucket) bucket.draws += 1;
      const cat = categoryMeta(draw, fallbackId);
      if (bucket) {
        bucket.code = cat.code;
        bucket.disc = cat.disc;
        bucket.label = cat.label;
        if (draw.tournamentCategory && draw.tournamentCategory.category && draw.tournamentCategory.category.name) {
          bucket.name = draw.tournamentCategory.category.name;
        }
      }
      for (const row of collectSeeds(draw)) {
        if (bucket) bucket.seeds += 1;
        const mapped = mapRtaSeed(row.seed, {
          label: cat.label,
          disc: cat.disc,
          round: row.roundTitle,
          categoryId: cat.id,
          segment: draw.segment || segment,
          comp: FARNHAM.name,
          venue: FARNHAM.venue,
          tz: FARNHAM.tz,
          eventKey: FARNHAM.eventKey,
          tagsFor,
        });
        const both = !isPlaceholderSide(sideName(row.seed.entry1)) && !isPlaceholderSide(sideName(row.seed.entry2));
        if (bucket && both) bucket.contests += 1;
        if (!mapped) continue;
        const prev = byId.get(mapped.id);
        if (!prev || preferMatch(mapped, prev)) byId.set(mapped.id, mapped);
      }
    }
  }

  const matches = [...byId.values()].sort(sortMatches);
  for (const match of matches) {
    const bucket = cats.get(Number(match.categoryId));
    if (!bucket) continue;
    if (match.lines && match.lines.length) bucket.scored += 1;
    if (match.status === "LIVE") bucket.live += 1;
  }
  return {
    matches,
    categories: [...cats.values()],
  };
}

function ymdInTz(now, tz) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * After the event window, an unplayed row is not upcoming.
 * LIVE and FT stay. A row that already has game lines stays (do not hide a real score).
 * Never invent a result for the rows this drops.
 */
export function keepRtaMatch(m, now = new Date(), event = FARNHAM) {
  if (!m) return false;
  if (m.status === "LIVE" || m.status === "FT") return true;
  if (Array.isArray(m.lines) && m.lines.length) return true;
  if (String(m.score || "").trim()) return true;
  const today = ymdInTz(now, (event && event.tz) || FARNHAM.tz);
  const end = String((event && event.end) || "").slice(0, 10);
  if (end && today > end) return false;
  return true;
}

function preferMatch(next, prev) {
  const rank = (m) => (m.status === "LIVE" ? 3 : m.lines && m.lines.length ? 2 : m.status === "FT" ? 1 : 0);
  return rank(next) > rank(prev);
}

function sortMatches(a, b) {
  const rank = { LIVE: 0, NEXT: 1, FT: 2 };
  const ra = rank[a.status] ?? 3;
  const rb = rank[b.status] ?? 3;
  if (ra !== rb) return ra - rb;
  const sa = a.start || "";
  const sb = b.start || "";
  if (sa !== sb) return sa < sb ? -1 : 1;
  return String(a.court || "").localeCompare(String(b.court || ""));
}
