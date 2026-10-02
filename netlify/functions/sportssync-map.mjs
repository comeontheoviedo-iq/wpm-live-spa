/**
 * SportsSync (sportssync.asia) → WPM match cards.
 * Results first. LIVE is not emitted: as of 2026-09-30 the public scores JSON
 * has no in-progress row, and the schedule filter is only scheduled | completed.
 *
 * Dry-run ids 89 (KL) and 222 (Penang) are real tournaments on organizer 1645900.
 * They are not Chongqing. Chongqing's SportsSync id stays null until that page lists it.
 */

export const SPORTSSYNC_ORIGIN = "https://www.sportssync.asia";
export const APP_ASIA_ORGANIZER_ID = "1645900";
export const APP_ASIA_ORGANIZER_URL = `${SPORTSSYNC_ORIGIN}/organizers/${APP_ASIA_ORGANIZER_ID}`;

/**
 * Flip only after a scores JSON row is shown to carry a trustworthy in-progress
 * status. The HTTP handler does not pass allowLive, so this flag alone cannot
 * paint LIVE.
 */
export const SPORTSSYNC_LIVE_SAFE = false;

/** Verified on the organizer page 2026-09-30. Chongqing was not among them. */
export const SPORTSSYNC_LISTED = {
  asOf: "2026-09-30",
  organizerId: APP_ASIA_ORGANIZER_ID,
  tournaments: [
    {
      id: "89",
      name: "Leapmotor APP Kuala Lumpur Open 2026 (APP Malaysia)",
      start: "2026-02-09",
      end: "2026-02-14",
      tz: "Asia/Kuala_Lumpur",
      venue: "Kuala Lumpur, Malaysia",
    },
    {
      id: "222",
      name: "Leapmotor APP Asia Penang Open 2026",
      start: "2026-07-22",
      end: "2026-07-26",
      tz: "Asia/Kuala_Lumpur",
      venue: "Penang, Malaysia",
    },
  ],
};

export const CHONGQING = {
  name: "APP Asia Chongqing Open",
  start: "2026-10-02",
  end: "2026-10-06",
  venue: "Chongqing, China",
  tz: "Asia/Shanghai",
  tour: "app-asia",
  sportsSyncTournamentId: null,
  denTournamentId: null,
  onLive: false,
  status: "results-only",
};

/**
 * Claimed on APP pages, not on organizer 1645900, not in the sitemap.
 * /tournament/{id} redirects to /tournament/index (checked 2026-10-02).
 * Not Chongqing. Not a score path.
 */
export const SPORTSSYNC_UNRESOLVED = [
  {
    id: "390",
    name: "2026 TCI APP Asia Taipei Open",
    asOf: "2026-10-02",
  },
  {
    id: "391",
    name: "2026 APP Asia Bangkok Open",
    asOf: "2026-10-02",
  },
];

export const CHONGQING_DESK_NOTE =
  "APP Asia Tour (not MLP Asia). No Den Live id. SportsSync organizer 1645900 still lists KL 89 and Penang 222 only. Sitemap tournament titles (ids 91–471, scanned 2026-10-02) do not include Chongqing. Links 390 (Taipei) and 391 (Bangkok) do not resolve and are not Chongqing. Calendar/results-only only. Do not invent a SportsSync id. Do not fake LIVE.";

const FT_TOKENS = new Set([
  "COMPLETED",
  "COMPLETE",
  "FINISHED",
  "FINISH",
  "FT",
  "DONE",
  "CLOSED",
  "WALKOVER",
  "WO",
  "RETIRED",
  "RET",
]);

const NEXT_TOKENS = new Set([
  "SCHEDULED",
  "SCHEDULE",
  "UPCOMING",
  "PENDING",
  "NOT_STARTED",
  "NS",
  "WAITING",
  "QUEUED",
]);

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function normalizeSportsSyncId(raw) {
  const s = String(raw ?? "").trim();
  if (!/^\d{1,8}$/.test(s)) return "";
  return s;
}

export function isDryRunSportsSyncId(raw) {
  const id = normalizeSportsSyncId(raw);
  return SPORTSSYNC_LISTED.tournaments.some((t) => t.id === id);
}

export function isUnresolvedSportsSyncId(raw) {
  const id = normalizeSportsSyncId(raw);
  return SPORTSSYNC_UNRESOLVED.some((t) => t.id === id);
}

/** KL/Penang dry-runs, plus Taipei 390 / Bangkok 391 links that do not resolve. */
export function isChongqingBlockedSportsSyncId(raw) {
  return isDryRunSportsSyncId(raw) || isUnresolvedSportsSyncId(raw);
}

export function isChongqingName(name) {
  return /chongqing/i.test(String(name || ""));
}

export function listedSportsSyncEvent(raw) {
  const id = normalizeSportsSyncId(raw);
  return SPORTSSYNC_LISTED.tournaments.find((t) => t.id === id) || null;
}

export function sportsSyncStatusToken(raw) {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Never returns LIVE unless SPORTSSYNC_LIVE_SAFE and opts.allowLive are both true.
 * An in-progress-looking token stays NEXT (score lines, if any, are not a final).
 */
export function mapSportsSyncStatus(raw, opts = {}) {
  const token = sportsSyncStatusToken(raw);
  const hasScore = Boolean(opts.hasScore);
  const liveLooking =
    token === "LIVE" ||
    token === "IN_PROGRESS" ||
    token === "INPROGRESS" ||
    token === "PLAYING" ||
    token === "RUNNING" ||
    token === "STARTED" ||
    token === "ONGOING" ||
    token === "INPLAY" ||
    token === "IN_PLAY" ||
    /PROGRESS|PLAYING|^LIVE$/.test(token);

  if (FT_TOKENS.has(token)) return { status: "FT", liveSuppressed: false, token };
  if (liveLooking) {
    if (opts.allowLive === true && SPORTSSYNC_LIVE_SAFE === true) {
      return { status: "LIVE", liveSuppressed: false, token };
    }
    return { status: "NEXT", liveSuppressed: true, token };
  }
  if (NEXT_TOKENS.has(token) || !token) {
    if (!token && hasScore && opts.scoreLooksFinal) return { status: "FT", liveSuppressed: false, token };
    return { status: "NEXT", liveSuppressed: false, token };
  }
  if (hasScore && opts.scoreLooksFinal) return { status: "FT", liveSuppressed: false, token };
  return { status: "NEXT", liveSuppressed: false, token };
}

export function extractSportsSyncTournamentIds(html) {
  const ids = new Set();
  const re = /\/tournament\/(\d+)\b/g;
  const text = String(html || "");
  let m;
  while ((m = re.exec(text))) ids.add(m[1]);
  return [...ids].sort((a, b) => Number(a) - Number(b));
}

export function summarizeOrganizerListing(ids) {
  const found = [];
  const seen = new Set();
  for (const raw of ids || []) {
    const id = normalizeSportsSyncId(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    found.push(id);
  }
  const known = SPORTSSYNC_LISTED.tournaments.map((t) => t.id);
  return {
    asOf: SPORTSSYNC_LISTED.asOf,
    organizerId: APP_ASIA_ORGANIZER_ID,
    organizerUrl: APP_ASIA_ORGANIZER_URL,
    found,
    known,
    novel: found.filter((id) => !known.includes(id)),
    chongqingSportsSyncId: null,
    liveSafe: false,
  };
}

/**
 * Calendar arm. A SportsSync id is a results path, never onLive.
 * Chongqing cannot keep dry-run 89/222, and cannot keep a Den connector.
 */
export function applySportsSyncArm(row) {
  if (!row || typeof row !== "object") return row;
  const next = {
    ...row,
    connector: row.connector ? { ...row.connector } : row.connector || null,
  };
  const c = next.connector || {};
  const id = normalizeSportsSyncId(c.sportsSyncTournamentId);
  const chongqing = isChongqingName(next.name);

  if (c.type === "sportssync" || id) {
    if (!id || (chongqing && isChongqingBlockedSportsSyncId(id))) {
      next.connector = { type: "none" };
      next.onLive = false;
      if (chongqing || next.status === "live-path" || !next.status) next.status = "results-only";
    } else {
      next.connector = {
        type: "sportssync",
        sportsSyncTournamentId: id,
        scorePath: "/api/sportssync",
      };
      next.onLive = false;
      if (next.status !== "delayed") next.status = "results-only";
    }
  }

  if (chongqing) {
    next.onLive = false;
    next.tour = next.tour && next.tour !== "app" ? next.tour : "app-asia";
    if (next.status === "live-path" || !next.status) next.status = "results-only";
    if (next.connector?.type === "app") {
      next.connector = { type: "none" };
      next.status = "results-only";
    }
  }
  return next;
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function cleanText(s) {
  return decodeEntities(String(s || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function isPlaceholderSide(name) {
  const s = String(name || "").trim();
  if (!s) return true;
  return /^(tbd|tba|bye|winner|loser|unknown|vs\.?)$/i.test(s);
}

function gameLooksFinal(a, b) {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return hi >= 11 && hi - lo >= 2;
}

function collectPairs(value, out) {
  if (value == null || value === "") return out;
  if (typeof value === "string") {
    const re = /(\d+)\s*[-–]\s*(\d+)/g;
    let m;
    while ((m = re.exec(value))) out.push([Number(m[1]), Number(m[2])]);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPairs(item, out);
    return out;
  }
  if (typeof value === "object") {
    const a = value.p1 ?? value.team1Score ?? value.score1 ?? value.home ?? value.s1 ?? value.a;
    const b = value.p2 ?? value.team2Score ?? value.score2 ?? value.away ?? value.s2 ?? value.b;
    if (a != null && b != null && a !== "" && b !== "" && !Array.isArray(a) && !Array.isArray(b)) {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) {
        out.push([na, nb]);
        return out;
      }
    }
    if (value.score != null) collectPairs(value.score, out);
    else if (value.games != null) collectPairs(value.games, out);
    else if (value.sets != null) collectPairs(value.sets, out);
  }
  return out;
}

function pairsFromRow(row) {
  const out = [];
  const sources = [row?.scores, row?.games, row?.sets, row?.score, row?.result];
  for (const src of sources) {
    if (src == null || src === "") continue;
    const before = out.length;
    collectPairs(src, out);
    if (out.length > before) break;
  }
  return out;
}

function linesFromPairs(pairs, aName, bName) {
  const lines = [];
  for (const [na, nb] of pairs) {
    if (!Number.isFinite(na) || !Number.isFinite(nb)) continue;
    if (na === 0 && nb === 0) continue;
    const done = gameLooksFinal(na, nb);
    lines.push({
      disc: "G" + (lines.length + 1),
      score: `${na}–${nb}`,
      winner: done ? (na > nb ? aName : nb > na ? bName : "") : "",
      live: false,
      court: "",
    });
  }
  return lines;
}

function scoreLooksFinal(pairs) {
  const kept = pairs.filter(([a, b]) => !(a === 0 && b === 0));
  if (!kept.length) return false;
  return kept.every(([a, b]) => gameLooksFinal(a, b));
}

export function discFromCategory(category) {
  const s = String(category || "");
  const mixed = /mixed/i.test(s);
  const women = /women|woman|ladies|\bfemale\b/i.test(s);
  const men = /\bmen\b|\bman\b|\bmale\b/i.test(s);
  const doubles = /doubles/i.test(s);
  const singles = /singles/i.test(s);
  if (mixed) return "XD";
  if (women && doubles) return "WD";
  if (women && singles) return "WS";
  if (men && doubles) return "MD";
  if (men && singles) return "MS";
  return "";
}

function tierFromCategory(category) {
  const s = String(category || "");
  if (/\bpro\b/i.test(s) && !/amateur/i.test(s)) return "pro";
  if (/amateur|\bdupr\b/i.test(s)) return "amateur";
  return "";
}

function formatFromRound(round) {
  const s = String(round || "");
  if (/group|pool|round robin|\brr\b/i.test(s)) return "pool";
  if (/final|semi|quarter|bronze|knockout|\bqf\b|\bsf\b/i.test(s)) return "ko";
  return "";
}

function sideName(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return cleanText(value);
  if (Array.isArray(value)) {
    return value
      .map(sideName)
      .map((n) => n.trim())
      .filter((n) => n && !isPlaceholderSide(n))
      .join(" / ");
  }
  if (typeof value === "object") {
    if (value.name) return cleanText(value.name);
    if (Array.isArray(value.players)) return sideName(value.players);
    const joined = [value.first_name, value.last_name].filter(Boolean).join(" ");
    if (joined) return cleanText(joined);
    if (value.player) return sideName(value.player);
    if (value.team_name || value.teamName) return cleanText(value.team_name || value.teamName);
  }
  return "";
}

function pick(row, keys) {
  for (const k of keys) {
    if (row && row[k] != null && row[k] !== "") return row[k];
  }
  return "";
}

export function parseScheduleWhen(text, yearHint) {
  const s = cleanText(text);
  const m = s.match(
    /([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*(\d{4}))?(?:,\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i
  );
  if (!m) return { date: "", hour: null, minute: null };
  const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!mon) return { date: "", hour: null, minute: null };
  const year = m[3] || yearHint || "";
  const date = year
    ? `${year}-${String(mon).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`
    : "";
  if (m[4] == null) return { date, hour: null, minute: null };
  let hour = Number(m[4]) % 12;
  if (/pm/i.test(m[6] || "")) hour += 12;
  return { date, hour, minute: Number(m[5]) };
}

export function localWallToIso(y, mo, d, h, mi, s, tz) {
  if (!y || !mo || !d || h == null || !tz) return "";
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi || 0, s || 0));
  let parts;
  try {
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
    parts = Object.fromEntries(fmt.formatToParts(guess).map((p) => [p.type, p.value]));
  } catch {
    return "";
  }
  const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const wanted = Date.UTC(y, mo - 1, d, h, mi || 0, s || 0);
  return new Date(guess.getTime() + (wanted - asLocal)).toISOString();
}

function yearFromHtml(html, fallback) {
  const text = String(html || "");
  const hidden = text.match(/name="date"\s+value="(\d{4})-\d{2}-\d{2}"/i);
  if (hidden) return hidden[1];
  const iso = text.match(/\b(20\d{2})-\d{2}-\d{2}\b/);
  if (iso) return iso[1];
  return fallback || "";
}

function cardFromParts(parts, tagsFor) {
  const a = parts.a;
  const b = parts.b;
  if (isPlaceholderSide(a) || isPlaceholderSide(b)) return null;
  const pairs = parts.pairs || [];
  const mapped = mapSportsSyncStatus(parts.rawStatus, {
    hasScore: pairs.some(([x, y]) => !(x === 0 && y === 0)),
    scoreLooksFinal: scoreLooksFinal(pairs),
  });
  if (mapped.status === "LIVE") {
    mapped.status = "NEXT";
    mapped.liveSuppressed = true;
  }
  const lines = linesFromPairs(pairs, a, b);
  const w0 = lines.filter((l) => l.winner === a).length;
  const w1 = lines.filter((l) => l.winner === b).length;
  const games = lines.map((l) => `${l.disc} ${l.score}`).join(" · ");
  const when = parts.when || { date: parts.date || "", hour: null, minute: null };
  const date = when.date || parts.date || "";
  const hasClock = when.hour != null && Boolean(date) && Boolean(parts.tz);
  let start = "";
  if (hasClock) {
    const [y, mo, d] = date.split("-").map(Number);
    start = localWallToIso(y, mo, d, when.hour, when.minute || 0, 0, parts.tz);
  }
  const round = cleanText(parts.round);
  const category = cleanText(parts.category);
  const court = cleanText(parts.court);
  const div = [category, round].filter(Boolean).join(" · ");
  const score = !w0 && !w1 ? "" : `${w0}-${w1}`;
  return {
    id: parts.id,
    date,
    tour: "app-asia",
    tier: tierFromCategory(category),
    comp: parts.comp || "",
    div,
    round,
    disc: discFromCategory(category),
    format: formatFromRound(round || category),
    session: court,
    a,
    b,
    tags: typeof tagsFor === "function" ? tagsFor(a, b) : [],
    status: mapped.status,
    ssStatus: mapped.token,
    liveSuppressed: mapped.liveSuppressed,
    start,
    end: "",
    score,
    games,
    lines,
    court,
    hasClock: Boolean(start),
    eventKey: parts.tournamentId ? "ev:sportssync:" + parts.tournamentId : "ev:sportssync",
    note: mapped.status === "FT" && !lines.length ? "Result recorded (no game scores)" : court || "",
    watch: "",
    venue: parts.venue || "",
    tz: parts.tz || "",
  };
}

export function unwrapScoresPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["matches", "scores", "results", "data", "items"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

export function mapScoresPayload(payload, ctx = {}, tagsFor) {
  const rows = unwrapScoresPayload(payload);
  const tournamentId = normalizeSportsSyncId(ctx.tournamentId);
  const out = [];
  rows.forEach((row, index) => {
    if (!row || typeof row !== "object") return;
    const matchId = normalizeSportsSyncId(pick(row, ["match_id", "matchId", "id"])) || String(index + 1);
    const a = sideName(pick(row, ["team1", "player1", "side1", "p1", "home", "team1_name", "a"]));
    const b = sideName(pick(row, ["team2", "player2", "side2", "p2", "away", "team2_name", "b"]));
    const pairs = pairsFromRow(row);
    const whenText = pick(row, ["start", "start_time", "scheduled_at", "datetime", "date_time", "played_at", "date"]);
    const when = parseScheduleWhen(whenText, String(ctx.year || ctx.startDate || "").slice(0, 4));
    if (!when.date && /^\d{4}-\d{2}-\d{2}/.test(String(whenText))) {
      when.date = String(whenText).slice(0, 10);
    }
    const card = cardFromParts(
      {
        id: `ss-${tournamentId || "x"}-${matchId}`,
        tournamentId,
        a,
        b,
        pairs,
        rawStatus: pick(row, ["status", "match_status", "state"]),
        round: pick(row, ["round", "round_name", "stage"]),
        category: pick(row, ["category", "division", "category_name", "bracket", "event"]),
        court: pick(row, ["court", "court_name", "courtName", "court_number"]),
        when,
        date: when.date,
        comp: ctx.name || "",
        venue: ctx.venue || "",
        tz: ctx.tz || "",
      },
      tagsFor
    );
    if (card) out.push(card);
  });
  return out;
}

export function mapScheduleHtml(html, ctx = {}, tagsFor) {
  const text = String(html || "");
  const tournamentId = normalizeSportsSyncId(ctx.tournamentId);
  const year = yearFromHtml(text, String(ctx.year || ctx.startDate || "").slice(0, 4));
  const rows = text.match(/<tr\b[^>]*match-row[\s\S]*?<\/tr>/gi) || [];
  const matches = [];
  for (const row of rows) {
    const idMatch = row.match(/\/tournament\/\d+\/match\/(\d+)/);
    if (!idMatch) continue;
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    if (cells.length < 7) continue;
    const when = parseScheduleWhen(cells[0], year);
    const court = cleanText(cells[1]);
    const round = cleanText(cells[2]);
    const category = cleanText(cells[3]);
    const names = [...cells[4].matchAll(/<div class="text-sm">\s*([\s\S]*?)\s*<\/div>/gi)]
      .map((m) => cleanText(m[1]))
      .filter((n) => n && !/^vs\.?$/i.test(n));
    const a = names[0] || "";
    const b = names.length > 2 ? names.slice(1).join(" / ") : names[1] || "";
    const scoreText = cleanText(cells[5]);
    const statusText = cleanText(cells[6]);
    const pairs = [];
    collectPairs(scoreText, pairs);
    const card = cardFromParts(
      {
        id: `ss-${tournamentId || "x"}-${idMatch[1]}`,
        tournamentId,
        a: names.length === 4 ? `${names[0]} / ${names[1]}` : a,
        b: names.length === 4 ? `${names[2]} / ${names[3]}` : b,
        pairs,
        rawStatus: statusText,
        round,
        category,
        court,
        when,
        comp: ctx.name || "",
        venue: ctx.venue || "",
        tz: ctx.tz || "",
      },
      tagsFor
    );
    if (card) matches.push(card);
  }
  return {
    matches,
    year,
    partial: true,
    scope: "schedule-search-page",
  };
}

export function countLive(matches) {
  return (matches || []).filter((m) => m && m.status === "LIVE").length;
}
