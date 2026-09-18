import type { Config } from "@netlify/functions";

/** APP (Association of Pickleball Professionals) via Den Live proxies. */
const TOURNAMENT_ID = "18453";
const DEN = "https://denlive.pickleballden.com";
const TZ = "America/Chicago"; // Overland Park, KS — AdventHealth Sports Park at Bluhawk
const COMP = "APP Dillons Overland Park Open";
const VENUE = "AdventHealth Sports Park at Bluhawk, Overland Park, KS";
const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };

const LIVE_STATUSES = new Set(["RUNNING", "IN_PROGRESS", "INPROGRESS", "STARTED", "PLAYING"]);
const SKIP_STATUSES = new Set(["BYE", "WAITING_FOR_OPPONENT", "WAITINGFOROPPONENT"]);

function ymdInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function sideName(team: any): string {
  if (!team) return "TBD";
  if (team.bye) return "BYE";
  const ps = team.players || [];
  const names = ps
    .map((p: any) => (typeof p === "string" ? p : p?.name || p?.playerName || p?.displayName || ""))
    .filter(Boolean);
  if (!names.length) return team.teamName || "TBD";
  if (names.length === 1) return names[0];
  const short = names.map((n: string) => n.split(/\s+/).slice(-1)[0]);
  return short.join(" / ");
}

function tagsFor(a: string, b: string) {
  const blob = (a + " " + b).toLowerCase();
  const tags: string[] = [];
  // Light follow hooks for known APP names if present
  for (const t of ["Waters", "Johns", "Bright", "Jardim", "Devilliers", "Fu"]) {
    if (blob.includes(t.toLowerCase())) tags.push(t);
  }
  return tags;
}

function mapStatus(raw: string, completed: boolean): "LIVE" | "FT" | "NEXT" {
  const s = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
  if (LIVE_STATUSES.has(s)) return "LIVE";
  if (completed || s === "COMPLETED" || s === "COMPLETE" || s === "FINISHED") return "FT";
  return "NEXT";
}

/** Den match startTime is a Java-style LocalDateTime array: [y, M, d, H, m, s, nanos] (month 1-indexed, venue local). */
function localArrayToIso(arr: any, tz: string): string | null {
  if (!Array.isArray(arr) || arr.length < 5) return null;
  const [y, mo, d, h = 0, mi = 0, s = 0] = arr;
  // Build a UTC instant that displays as this wall clock in tz via iterative offset.
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
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
  const parts = Object.fromEntries(fmt.formatToParts(guess).map((p) => [p.type, p.value]));
  const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const wanted = Date.UTC(y, mo - 1, d, h, mi, s);
  return new Date(guess.getTime() + (wanted - asLocal)).toISOString();
}

function bracketStartIso(startDate: string, startTime: string | null, tz: string): string {
  const [hh = "08", mm = "00", ss = "00"] = (startTime || "08:00:00").split(":");
  const [y, mo, d] = startDate.split("-").map(Number);
  return localArrayToIso([y, mo, d, +hh, +mm, +ss, 0], tz) || `${startDate}T${hh}:${mm}:${ss}Z`;
}

function gameComplete(a: number, b: number) {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  // APP mixes 11- and 15-pt formats; treat win-by-2 at/above 11 as complete.
  return hi >= 11 && hi - lo >= 2;
}

function linesFrom(m: any, aName: string, bName: string, st: string) {
  const scores = Array.isArray(m.scores) ? [...m.scores] : [];
  scores.sort((x: any, y: any) => (x.gameNumber || 0) - (y.gameNumber || 0));
  const lines: any[] = [];
  for (const g of scores) {
    const ga = g.team1Score;
    const gb = g.team2Score;
    if (ga == null || gb == null || ga === "" || gb === "") continue;
    const na = Number(ga);
    const nb = Number(gb);
    // Never surface pad/phantom 0–0 unless the match is LIVE (in progress game 1).
    if (na === 0 && nb === 0 && st !== "LIVE") continue;
    const done = st === "FT" && gameComplete(na, nb);
    const live = st === "LIVE" && !done && g === scores[scores.length - 1];
    lines.push({
      disc: "G" + (g.gameNumber || lines.length + 1),
      score: `${na}–${nb}`,
      winner: done ? (na > nb ? aName : nb > na ? bName : "") : "",
      live,
      court: live ? courtLabel(m) : "",
    });
  }
  // LIVE with no score lines yet: show in-progress without inventing 0–0.
  if (st === "LIVE" && !lines.length) {
    lines.push({ disc: "G1", score: "–", winner: "", live: true, court: courtLabel(m) });
  }
  return lines;
}

function courtLabel(m: any): string {
  const n = String(m?.courtName || "").trim();
  const num = m?.courtNumber != null && String(m.courtNumber).trim() !== "" ? String(m.courtNumber).trim() : "";
  if (n && num && !new RegExp(`\\b${num}\\b`).test(n)) return `${n} ${num}`.trim();
  return n || (num ? "Court " + num : "");
}

function matchDate(m: any, bracketDate: string, st: string, todayTz: string): string {
  // Rolling: live / on-deck sit on "today" so the desk sees them without flipping dates.
  if (st === "LIVE" || String(m.status || "").toUpperCase() === "WAITING_FOR_COURT") return todayTz;
  const arr = m.startTime || m.endTime;
  if (Array.isArray(arr) && arr.length >= 3) {
    const [y, mo, d] = arr;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return bracketDate || todayTz;
}

function toMatch(m: any, bracket: any, todayTz: string) {
  const a = sideName(m.team1);
  const b = sideName(m.team2);
  if (a === "TBD" || b === "TBD" || a === "BYE" || b === "BYE") return null;
  const raw = m.status || m.matchStatus || "";
  if (SKIP_STATUSES.has(String(raw).toUpperCase().replace(/[^A-Z0-9]+/g, "_"))) return null;
  const st = mapStatus(raw, !!m.completed);
  const date = matchDate(m, bracket.startDate, st, todayTz);
  const start =
    localArrayToIso(m.startTime, TZ) ||
    localArrayToIso(m.scheduledTime, TZ) ||
    bracketStartIso(bracket.startDate || date, bracket.startTime || null, TZ);
  const lines = linesFrom(m, a, b, st);
  const w0 = lines.filter((l) => l.winner === a).length;
  const w1 = lines.filter((l) => l.winner === b).length;
  const liveLine = lines.find((l) => l.live);
  const games = lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · ");
  const court = courtLabel(m);
  const round = m.roundDisplayName || (m.round != null ? "Round " + m.round : "");
  return {
    id: "app-" + m.matchId,
    date,
    tour: "app",
    comp: COMP,
    div: [bracket.bracketName, round].filter(Boolean).join(" · "),
    round,
    session: court ? court : "",
    a,
    b,
    tags: tagsFor(a, b),
    status: st,
    start,
    score: st === "NEXT" && !w0 && !w1 && !liveLine ? "" : `${w0}-${w1}`,
    games,
    lines,
    court,
    note: liveLine
      ? `In play ${liveLine.disc}${liveLine.score && liveLine.score !== "–" ? " " + liveLine.score : ""}`
      : court || "",
    watch: "", // stay in-app — no bounce to Den/APPTV as product path
    venue: VENUE,
    tz: TZ,
  };
}

function keepMatch(m: any, todayTz: string) {
  if (m.status === "LIVE" || m.status === "FT") {
    const y = addDays(todayTz, -1);
    return !m.date || m.date >= y;
  }
  // NEXT: today ± 1 day
  const y = addDays(todayTz, -1);
  const t = addDays(todayTz, 1);
  if (m.date && m.date >= y && m.date <= t) return true;
  const start = m.start ? new Date(m.start) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const ageMs = Date.now() - start.getTime();
    return ageMs <= 48 * 3600000;
  }
  return false;
}

export default async () => {
  try {
    const [infoRes, brRes] = await Promise.all([
      fetchJson(`${DEN}/api/tournament-info?tournamentId=${TOURNAMENT_ID}`),
      fetchJson(`${DEN}/api/tournament-brackets?tournamentId=${TOURNAMENT_ID}`),
    ]);
    const venueName = infoRes?.info?.venue?.name || VENUE;
    const brackets: any[] = brRes?.brackets?.content || [];
    if (!brackets.length) {
      return Response.json(
        {
          updated: new Date().toISOString(),
          source: "den-live",
          delayed: true,
          message: "scores delayed",
          matches: [],
          event: { id: TOURNAMENT_ID, name: COMP, venue: venueName, tz: TZ },
        },
        { headers: { "Cache-Control": "public, max-age=15" } }
      );
    }

    const todayTz = ymdInTz(new Date(), TZ);
    const window = new Set([addDays(todayTz, -1), todayTz, addDays(todayTz, 1)]);
    const selected = brackets.filter(
      (b) => b.status === "Running" || window.has(b.startDate) || LIVE_STATUSES.has(String(b.status || "").toUpperCase())
    );

    const settled = await Promise.all(
      selected.map(async (b) => {
        try {
          const payload = await fetchJson(
            `${DEN}/api/bracket-matches?bracketId=${encodeURIComponent(b.bracketId)}&size=200`
          );
          const content = payload?.payload?.content || payload?.content || [];
          return { bracket: b, matches: content };
        } catch {
          return { bracket: b, matches: [] as any[] };
        }
      })
    );

    const all = settled
      .flatMap(({ bracket, matches }) => matches.map((m: any) => toMatch(m, bracket, todayTz)))
      .filter(Boolean) as any[];

    const matches = all
      .filter((m) => keepMatch(m, todayTz))
      .sort((a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE"));

    const bracketsOut: Record<string, any> = {};
    for (const m of all) {
      const div = (m.div || "").split(" · ")[0] || "Draw";
      const round = m.round || (m.div || "").split(" · ")[1] || "Round";
      const rec = (bracketsOut[div] ||= {});
      (rec[round] ||= []).push({
        id: m.id,
        a: m.a,
        b: m.b,
        score: m.score,
        status: m.status,
        games: m.games,
        date: m.date,
      });
    }

    return Response.json(
      {
        updated: new Date().toISOString(),
        source: "den-live",
        matches,
        brackets: bracketsOut,
        event: {
          id: TOURNAMENT_ID,
          name: COMP,
          venue: venueName,
          tz: TZ,
          startDate: brRes?.tournament?.startDate,
          endDate: brRes?.tournament?.endDate,
        },
      },
      { headers: { "Cache-Control": "public, max-age=15" } }
    );
  } catch (e: any) {
    return Response.json(
      {
        updated: new Date().toISOString(),
        source: "den-live",
        delayed: true,
        message: "scores delayed",
        matches: [],
        error: String(e?.message || e),
      },
      { status: 200, headers: { "Cache-Control": "public, max-age=10" } }
    );
  }
};

export const config: Config = { path: "/api/app" };
