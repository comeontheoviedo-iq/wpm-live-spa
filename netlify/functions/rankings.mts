import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import WAVE_SNAP_BUNDLED from "./wave-snap.json";
import {
  fetchWave,
  parseWaveBoard,
  collectWaveTargets,
  fetchWavePlayer,
  mapPool,
  WAVE_SEED,
} from "./wave-parse.mjs";

const GPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybmVlZGhxaW51ZGFzbmdrcXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDkzMDIsImV4cCI6MjA3NjEyNTMwMn0.U6VPCpYEtyFkVwxQ7yMAbGf_huWORMg_8iyyd-WkADc";
const PPA_WORLD = {"men": [{"rank": 1, "name": "Ben Johns", "points": 18837.5}, {"rank": 2, "name": "Gabriel Tardio", "points": 13443.8}, {"rank": 3, "name": "Christian Alshon", "points": 11682.5}, {"rank": 4, "name": "Hayden Patriquin", "points": 10857.5}, {"rank": 5, "name": "Federico Staksrud", "points": 10620}, {"rank": 6, "name": "JW Johnson", "points": 10380.6}, {"rank": 7, "name": "Andrei Daescu", "points": 10130}, {"rank": 8, "name": "CJ Klinger", "points": 6280}, {"rank": 9, "name": "Eric Oncins", "points": 5753.8}, {"rank": 10, "name": "Noe Khlif", "points": 4138.8}], "women": [{"rank": 1, "name": "Anna Leigh Waters", "points": 21555}, {"rank": 2, "name": "Anna Bright", "points": 16390}, {"rank": 3, "name": "Jorja Johnson", "points": 11226.3}, {"rank": 4, "name": "Hurricane Tyra Black", "points": 10010}, {"rank": 5, "name": "Catherine Parenteau", "points": 8465}, {"rank": 6, "name": "Parris Todd", "points": 8170}, {"rank": 7, "name": "Rachel Rohrabacher", "points": 7630}, {"rank": 8, "name": "Kate Fahey", "points": 6352.5}, {"rank": 9, "name": "Tina Pisnik", "points": 5571.3}, {"rank": 10, "name": "Kaitlyn Christian", "points": 5454.4}]};
const GPA = "https://prneedhqinudasngkqqi.supabase.co/rest/v1";

/** Prefer nightly Blobs snap; fall back to bundled wave-snap.json / inline. */
async function loadWaveSnap(): Promise<{ snap: any; source: "blobs" | "bundled" }> {
  try {
    const store = getStore("wpm-wave");
    const blob = await store.get("snap", { type: "json" });
    if (blob && Array.isArray((blob as any).singles) && (blob as any).singles.length > 0) {
      return { snap: blob, source: "blobs" };
    }
  } catch {
    // Blobs unavailable in local/dev or empty — use bundled
  }
  return { snap: WAVE_SNAP_BUNDLED as any, source: "bundled" };
}

async function gpaRankings() {
  const res = await fetch(
    `${GPA}/current_rankings?select=rank,name,country,category,total_points,gender,avatar_url,player_id&order=category.asc,rank.asc&limit=800`,
    { headers: { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY } }
  );
  if (!res.ok) throw new Error("gpa " + res.status);
  const rows = await res.json();
  const boards: Record<string, any[]> = {};
  for (const r of rows) {
    const cat = r.category || "other";
    (boards[cat] ||= []).push({
      rank: r.rank,
      name: r.name,
      country: r.country || "",
      points: r.total_points,
      photo: r.avatar_url || "",
      id: r.player_id,
    });
  }
  return boards;
}

async function gpaEvents() {
  const res = await fetch(
    `${GPA}/tournaments?select=name,tournament_date,end_date,location,tier,host,prize_pool,venue,registration_url&order=tournament_date.asc&limit=40`,
    { headers: { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY } }
  );
  if (!res.ok) return [];
  return await res.json();
}

async function waveBoard(path: string) {
  const { ok, html } = await fetchWave(path);
  if (!ok) return [];
  return parseWaveBoard(html);
}

async function gpaHistory() {
  const catsRes = await fetch(
    `${GPA}/tournament_categories?select=id,tournament_name,category,match_date,host&or=(host.eq.DJOY,tournament_name.ilike.*D-Joy*)&limit=40`,
    { headers: { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY } }
  );
  if (!catsRes.ok) return [];
  const cats = await catsRes.json();
  const ids = cats.map((c: any) => c.id).filter(Boolean);
  if (!ids.length) return [];
  const resRes = await fetch(
    `${GPA}/category_results?select=category_id,player_id,finishing_position,points_awarded&finishing_position=in.(winner,second,third)&limit=200`,
    { headers: { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY } }
  );
  const results = resRes.ok ? await resRes.json() : [];
  const pids = [...new Set(results.map((r: any) => r.player_id))];
  const names: Record<string, string> = {};
  if (pids.length) {
    const pr = await fetch(
      `${GPA}/players_public?select=id,name,country&id=in.(${pids.slice(0, 80).join(",")})`,
      { headers: { apikey: GPA_KEY, Authorization: "Bearer " + GPA_KEY } }
    );
    if (pr.ok) for (const p of await pr.json()) names[p.id] = p.name;
  }
  const byEvent: Record<string, any> = {};
  for (const c of cats) {
    const ev = (byEvent[c.tournament_name] ||= {
      name: c.tournament_name,
      date: c.match_date,
      host: c.host,
      status: String(c.match_date || "") >= "2026-09-10" ? "armed" : "complete",
      winners: [] as any[],
    });
    for (const r of results) {
      if (r.category_id !== c.id) continue;
      ev.winners.push({
        category: c.category,
        place: r.finishing_position,
        player: names[r.player_id] || r.player_id,
        points: r.points_awarded,
      });
    }
  }
  return Object.values(byEvent);
}

function snapPlayers(waveSnap: any): Record<string, any> {
  const p = waveSnap?.players;
  return p && typeof p === "object" ? p : {};
}

async function buildWavePlayers(
  singles: any[],
  liveOk: boolean,
  waveSnap: any,
  snapSource: string
): Promise<{ wavePlayers: Record<string, any>; waveMeta: any }> {
  const snap = snapPlayers(waveSnap);
  const allTargets = collectWaveTargets(singles, { topN: 10 });
  // Runtime budget: live-refresh seed trio only (3 × profile/ppa). Top-10 rest come from snap.
  // Full top-10 + set-score enrichment is nightly Blobs / scripts/refresh-wave-snap.mjs.
  const liveTargets = allTargets.filter((t: any) => t.seed);
  const waveMeta: any = {
    liveBoards: liveOk,
    scraped: 0,
    degraded: [] as string[],
    seed: WAVE_SEED,
    runtime: "seed-live+snap-pool",
    snapSource,
    snapUpdated: waveSnap?.updated || null,
  };

  const eloById: Record<string, any> = {};
  for (const row of singles || []) {
    if (row?.id) eloById[String(row.id)] = row;
  }

  const scraped = await mapPool(liveTargets, 3, async (t: any) => {
    try {
      const live = await fetchWavePlayer(t.id, t.name, { enrichScores: false });
      const fromSnap = snap[t.id] || {};
      const board = eloById[t.id] || {};
      const recent =
        live.recent?.length
          ? live.recent.map((r: any) => {
              const prev = (fromSnap.recent || []).find((x: any) => x.matchId === r.matchId);
              if (prev?.score && !r.score) return { ...r, score: prev.score };
              return r;
            })
          : fromSnap.recent || [];
      const watch = live.watch?.length ? live.watch : fromSnap.watch || [];
      if (!recent.length) waveMeta.degraded.push(`${t.id}:no_recent`);
      waveMeta.scraped += 1;
      return {
        id: t.id,
        name: live.name || board.name || t.name,
        elo: board.elo ?? t.elo ?? fromSnap.elo ?? null,
        dupr: board.dupr ?? t.dupr ?? fromSnap.dupr ?? "",
        rank: board.rank ?? t.rank ?? fromSnap.rank ?? null,
        seed: t.seed || fromSnap.seed || null,
        recent,
        watch,
        notes: live.notes || [],
        scrapedAt: live.scrapedAt,
      };
    } catch {
      waveMeta.degraded.push(`${t.id}:error`);
      const fromSnap = snap[t.id];
      if (fromSnap) return { ...fromSnap, id: t.id };
      return {
        id: t.id,
        name: t.name,
        elo: t.elo ?? null,
        dupr: t.dupr || "",
        recent: [],
        watch: [],
        notes: ["scrape_error"],
      };
    }
  });

  const wavePlayers: Record<string, any> = {};
  // Start from snap pool (top ~10 from last refresh)
  for (const [id, p] of Object.entries(snap)) {
    const board = eloById[id] || {};
    wavePlayers[id] = {
      ...(p as any),
      elo: board.elo ?? (p as any).elo ?? null,
      dupr: board.dupr ?? (p as any).dupr ?? "",
      rank: board.rank ?? (p as any).rank ?? null,
      name: board.name || (p as any).name,
    };
  }
  for (const p of scraped) {
    if (p) wavePlayers[p.id] = p;
  }

  if (!Object.keys(wavePlayers).length) {
    waveMeta.degraded.push("wavePlayers_empty");
  }
  if (!liveOk) waveMeta.degraded.push("boards_used_snap");
  return { wavePlayers, waveMeta };
}

export default async () => {
  const [{ snap: waveSnap, source: snapSource }, gpa, events, singlesLive, mdLive, history] =
    await Promise.all([
      loadWaveSnap(),
      gpaRankings().catch(() => ({})),
      gpaEvents().catch(() => []),
      waveBoard("/rankings/all-singles").catch(() => []),
      waveBoard("/rankings/mens-doubles").catch(() => []),
      gpaHistory().catch(() => []),
    ]);
  const liveOk = singlesLive.length > 0;
  const eloSingles = liveOk ? singlesLive : waveSnap.singles || [];
  const eloMd = mdLive.length ? mdLive : waveSnap.mensDoubles || [];

  const { wavePlayers, waveMeta } = await buildWavePlayers(
    eloSingles,
    liveOk,
    waveSnap,
    snapSource
  );

  return Response.json(
    {
      updated: new Date().toISOString(),
      gpa,
      events,
      elo: { singles: eloSingles, mensDoubles: eloMd },
      ppaWorld: PPA_WORLD,
      wavePlayers,
      waveMeta,
      history,
      armed: [
        {
          name: "PICKLEBALL D-JOY TOUR 2026 - LEG 3",
          start: "2026-09-10",
          end: "2026-09-13",
          place: "Vietnam",
          connector: "djoy",
          status: "armed",
          note: "Live URL to be attached when D-Joy publish the draw.",
        },
      ],
      source: {
        gpa: "gpapickleball.org",
        elo: "picklewave.com public rankings",
        wavePlayers: "picklewave.com public player + /ppa tabs (restyled; no iframe)",
        ppaWorld: "ppatour.com/rankings (static snapshot in function)",
      },
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
};

export const config: Config = { path: "/api/rankings" };
