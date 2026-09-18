import type { Config } from "@netlify/functions";
import { tagsFor } from "./follow-tags.mjs";

const EVENT = "62c01642-1bb2-4f9a-9998-599f8fdefe5c"; // Veolia Arizona Open 2026-09-14..20

function sideName(team: any) {
  if (!team) return "TBD";
  const ps = team.players || [];
  const names = ps.map((p: any) => (typeof p === "string" ? p : p?.name || "")).filter(Boolean);
  if (!names.length) return "TBD";
  if (names.length === 1) return names[0];
  const short = names.map((n: string) => n.split(" ").slice(-1)[0]);
  return short.join(" / ");
}

function gamesWon(g: any[]) {
  const nums = (g || []).filter((n) => n != null && n !== "");
  return nums;
}

function mapStatus(s: string) {
  if (s === "live") return "LIVE";
  if (s === "final") return "FT";
  return "NEXT";
}

function gameComplete(a: any, b: any, matchFinal: boolean, isCurrent: boolean) {
  if (a == null || b == null || a === "" || b === "") return false;
  if (isCurrent && !matchFinal) return false;
  const hi = Math.max(Number(a), Number(b));
  const lo = Math.min(Number(a), Number(b));
  // Only 11-win-by-2 counts as a completed game. Do NOT treat padded 0,0 or
  // partial scores as wins just because the match is final.
  if (hi >= 11 && hi - lo >= 2) return true;
  return false;
}

function isPadZero(a: any, b: any) {
  // PPA scores API pads unplayed games as 0,0 (sometimes trailing in best-of-3/5).
  // Never surface those as real lines — FotMob rule: no fake 0–0.
  const na = a == null || a === "" ? null : Number(a);
  const nb = b == null || b === "" ? null : Number(b);
  if (na === null && nb === null) return true;
  return na === 0 && nb === 0;
}

function linesFrom(m: any, t0: any, t1: any) {
  const g0 = t0?.games || [];
  const g1 = t1?.games || [];
  const liveIdx = m.status === "live" && m.liveGame != null ? Number(m.liveGame) : -1;
  const final = m.status === "final";
  const n = Math.max(g0.length, g1.length, liveIdx + 1, 0);
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = g0[i];
    const b = g1[i];
    const current = liveIdx === i;
    // Skip empty / padded slots unless this is the live game (0–0 in progress is OK).
    if (!current && isPadZero(a, b)) continue;
    if ((a == null || a === "") && (b == null || b === "") && !current) continue;
    const done = gameComplete(a, b, final, current);
    lines.push({
      disc: "G" + (i + 1),
      score: `${a ?? 0}–${b ?? 0}`,
      winner: done ? (Number(a) > Number(b) ? sideName(t0) : Number(b) > Number(a) ? sideName(t1) : "") : "",
      live: current && !final,
      court: current ? (m.court || "") : "",
    });
  }
  return lines;
}

function toMatch(m: any) {
  const t0 = (m.teams || [])[0] || {};
  const t1 = (m.teams || [])[1] || {};
  const a = sideName(t0);
  const b = sideName(t1);
  const st = mapStatus(m.status);
  const date = (m.dateKey || (m.plannedStart || "").slice(0, 10) || new Date().toISOString().slice(0, 10));
  const lines = linesFrom(m, t0, t1);
  const w0 = lines.filter((l: any) => l.winner === a).length;
  const w1 = lines.filter((l: any) => l.winner === b).length;
  const liveLine = lines.find((l: any) => l.live);
  const games = lines.map((l: any) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · ");
  return {
    id: "ppa-" + m.id,
    date,
    tour: "ppa",
    comp: "PPA Veolia Arizona Open · Mesa",
    div: [m.division || m.divisionLabel, m.round || m.roundLabel].filter(Boolean).join(" · "),
    round: m.round || m.roundLabel || "",
    session: m.court ? "Court " + m.court : "",
    a,
    b,
    tags: tagsFor(a, b),
    status: st,
    start: m.plannedStart || date + "T14:00:00Z",
    score: st === "NEXT" && !w0 && !w1 && !liveLine ? "" : `${w0}-${w1}`,
    games,
    lines,
    court: m.court || "",
    note: liveLine ? `In play ${liveLine.disc} ${liveLine.score}` : (m.time || ""),
    watch: "pbtv",
  };
}

function keepPpaMatch(m: any, now: Date = new Date()) {
  if (m.status === "LIVE" || m.status === "FT") return true;
  // NEXT: keep if start within last 48h or in the future
  const start = m.start ? new Date(m.start) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const ageMs = now.getTime() - start.getTime();
    return ageMs <= 48 * 3600000; // past within 48h OR future (negative age)
  }
  // No start: keep if date >= yesterday (today-1)
  const y = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  return !m.date || m.date >= y;
}

export default async () => {
  const [tickRes, scoreRes] = await Promise.all([
    fetch("https://www.ppatour.com/api/ticker/", { headers: { "User-Agent": "WPM-LIVE/1.0" } }),
    fetch("https://www.ppatour.com/api/scores/?event=" + EVENT, { headers: { "User-Agent": "WPM-LIVE/1.0" } }),
  ]);
  const tick = tickRes.ok ? await tickRes.json() : { matches: [] };
  const scores = scoreRes.ok ? await scoreRes.json() : { matches: [] };
  const byId: Record<string, any> = {};
  for (const m of scores.matches || []) byId[m.id] = m;
  for (const m of tick.matches || []) {
    const prev = byId[m.id] || {};
    byId[m.id] = { ...prev, ...m, dateKey: prev.dateKey || (m.plannedStart || "").slice(0, 10) };
  }
  const now = new Date();
  const all = Object.values(byId).map(toMatch);
  const matches = all
    .filter((m) => keepPpaMatch(m, now))
    .sort((a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE"));
  const brackets: Record<string, any> = {};
  for (const m of all) {
    const div = (m.div || "").split(" · ")[0] || "Draw";
    const round = m.round || (m.div || "").split(" · ")[1] || "Round";
    const rec = (brackets[div] ||= {});
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
    { updated: new Date().toISOString(), source: "ppa-ticker", matches, brackets },
    { headers: { "Cache-Control": "public, max-age=15" } }
  );
};

export const config: Config = { path: "/api/ppa" };
