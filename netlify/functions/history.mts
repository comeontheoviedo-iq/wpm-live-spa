import type { Config } from "@netlify/functions";

const GPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmVlZGhxaW51ZGFzbmdrcXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDkzMDIsImV4cCI6MjA3NjEyNTMwMn0.U6VPCpYEtyFkVwxQ7yMAbGf_huWORMg_8iyyd-WkADc";
const GPA = "https://prneedhqinudasngkqqi.supabase.co/rest/v1";
const NPL_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJteGhxYWlwZm1zYXRtd2xhbHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDE4NTAsImV4cCI6MjA4NzgxNzg1MH0.OpvImKmUXEsm8UaC66HithpyDHOWnO5NhHZLATCVjcc";
const NPL = "https://bmxhqaipfmsatmwlaltu.supabase.co/rest/v1";


const ENGLISH_OPEN_2026 = {
  event: "2026 English OPEN powered by the APP",
  date: "2026-08-12",
  host: "PBE/APP/GPA",
  medals: [
    { category: "ws", place: "winner", player: "Domenika Turkovic" },
    { category: "ms", place: "winner", player: "Ignasi De Rueda" },
    { category: "wd", place: "winner", player: "Shelby Bates / Roos van Reek" },
    { category: "md", place: "winner", player: "Jack Munro / Richard Livornese" },
    { category: "xd", place: "winner", player: "Roos van Reek / Jack Munro" }
  ]
};
const APP_KL_2026 = {
  event: "APP Malaysia Kuala Lumpur Open 2026",
  date: "2026-02-14",
  host: "APP",
  medals: [
    { category: "ms", place: "winner", player: "Phuc Huynh" },
    { category: "ws", place: "winner", player: "Sofia Sewing" }
  ]
};
const ENGLAND_NATS = {
  event: "2025 English Nationals",
  date: "2025-02",
  host: "PBE",
  medals: [
    { category: "open_wd", place: "winner", player: "Thaddea Lock / Molly O'Donoghue" },
    { category: "open_md", place: "winner", player: "Louis Laville / Josh Bright" },
    { category: "open_xd", place: "winner", player: "Molly O'Donoghue / Louis Laville" },
    { category: "senior_xd", place: "winner", player: "Anna Linton / Richard Love" },
    { category: "senior_md", place: "winner", player: "Richard Love / David Youngs" },
    { category: "senior_wd", place: "winner", player: "Anna Linton / Marcia Audibert" }
  ]
};
const PPA_ASIA_HANOI = {
  event: "MB Hanoi Cup 2026",
  date: "2026-04",
  host: "PPA-ASIA",
  medals: [
    { category: "ws", place: "winner", player: "Kaitlyn Christian" },
    { category: "ms", place: "winner", player: "Hoang Nam Ly" },
    { category: "xd", place: "winner", player: "Anna Leigh Waters / Ben Johns" },
    { category: "wd", place: "winner", player: "Anna Leigh Waters / Anna Bright" },
    { category: "md", place: "winner", player: "Ben Johns / Gabriel Tardio" }
  ]
};
const hdr = (k: string) => ({ apikey: k, Authorization: "Bearer " + k });

async function gpaArchive() {
  const [tour, cats, results, players] = await Promise.all([
    fetch(`${GPA}/tournaments?select=id,name,tournament_date,end_date,host,location,tier&order=tournament_date.desc&limit=40`, { headers: hdr(GPA_KEY) }),
    fetch(`${GPA}/tournament_categories?select=id,tournament_name,category,match_date,host,tournament_id&limit=120`, { headers: hdr(GPA_KEY) }),
    fetch(`${GPA}/category_results?select=category_id,player_id,finishing_position,points_awarded&finishing_position=in.(winner,second)&limit=400`, { headers: hdr(GPA_KEY) }),
    fetch(`${GPA}/players_public?select=id,name,country&limit=800`, { headers: hdr(GPA_KEY) }),
  ]);
  const events = tour.ok ? await tour.json() : [];
  const categories = cats.ok ? await cats.json() : [];
  const rows = results.ok ? await results.json() : [];
  const plist = players.ok ? await players.json() : [];
  const names: Record<string, string> = {};
  for (const p of plist) names[p.id] = p.name;
  const catById: Record<string, any> = {};
  for (const c of categories) catById[c.id] = c;
  const medals: any[] = [];
  for (const r of rows) {
    const c = catById[r.category_id];
    if (!c) continue;
    medals.push({
      event: c.tournament_name,
      date: c.match_date,
      host: c.host,
      category: c.category,
      place: r.finishing_position,
      player: names[r.player_id] || "",
      points: r.points_awarded,
    });
  }
  return { events, medals: medals.slice(0, 200) };
}

async function nplArchive() {
  const [teamsRes, matchesRes] = await Promise.all([
    fetch(`${NPL}/league_teams?select=id,name,slug&limit=40`, { headers: hdr(NPL_KEY) }),
    fetch(`${NPL}/league_matches?select=home_team_id,away_team_id,home_score,away_score,status,sets_detail,scheduled_at&status=eq.completed&order=scheduled_at.desc&limit=200`, { headers: hdr(NPL_KEY) }),
  ]);
  const teams = teamsRes.ok ? await teamsRes.json() : [];
  const tn: Record<string, string> = {};
  for (const t of teams) tn[t.id] = t.name;
  const matches = matchesRes.ok ? await matchesRes.json() : [];
  return matches.map((m: any, i: number) => {
    const date = String(m.scheduled_at || "").slice(0, 10);
    const a = tn[m.home_team_id] || "Home";
    const b = tn[m.away_team_id] || "Away";
    const lines = Array.isArray(m.sets_detail)
      ? m.sets_detail.map((s: any, n: number) => ({
          disc: "S" + (s.g || n + 1),
          score: `${s.h ?? ""}–${s.a ?? ""}`,
          winner: Number(s.h) > Number(s.a) ? a : b,
        }))
      : [];
    return {
      id: "npl-" + date + "-" + i,
      tour: "npl",
      comp: "NPL Australia",
      div: "League",
      date,
      start: m.scheduled_at,
      a,
      b,
      score: `${m.home_score}-${m.away_score}`,
      status: "FT",
      games: lines.map((l) => l.score).join(" · "),
      lines,
    };
  });
}

export default async () => {
  const [gpa, npl] = await Promise.all([gpaArchive().catch(() => ({ events: [], medals: [] })), nplArchive().catch(() => [])]);
  return Response.json(
    {
      updated: new Date().toISOString(),
      armed: [
        { name: "PICKLEBALL D-JOY TOUR 2026 - LEG 3", start: "2026-09-10", end: "2026-09-13", host: "DJOY", connector: "djoy", status: "armed" },
        { name: "APP Overland Park Open", start: "2026-09-17", end: "2026-09-20", host: "APP", connector: "app", status: "armed" },
        { name: "APP Japan – Sendai", start: "2026-09-19", end: "2026-09-20", host: "JPA", connector: "app", status: "armed" },
        { name: "APP Columbus Open", start: "2026-10-01", end: "2026-10-04", host: "APP", connector: "app", status: "armed" },
      ],
      gpaEvents: gpa.events,
      gpaMedals: gpa.medals,
      npl,
      pbe: [ENGLISH_OPEN_2026, ENGLAND_NATS],
      app: [APP_KL_2026],
      ppaAsia: [PPA_ASIA_HANOI],
      mlp: {
        season: "2026",
        note: "Season complete. Official JSON feed blocks third-party origins.",
        champion: "New Jersey 5s",
        standings: [
          { rank: 1, team: "New Jersey 5s", pts: 118 },
          { rank: 2, team: "St. Louis Shock", pts: 111 },
          { rank: 3, team: "Los Angeles Mad Drops", pts: 86 },
          { rank: 4, team: "Columbus Sliders", pts: 83 },
          { rank: 5, team: "Brooklyn Pickleball Team", pts: 78 },
          { rank: 6, team: "Dallas Flash", pts: 72 },
          { rank: 7, team: "Palm Beach Royals", pts: 54 },
          { rank: 8, team: "Texas Ranchers", pts: 48 }
        ]
      },
      source: { gpa: "gpapickleball.org", npl: "nplpickleball.com.au", pbe: "pickleballengland.org", ppaAsia: "ppatour-asia.com" },
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
};

export const config: Config = { path: "/api/history" };
