import type { Config } from "@netlify/functions";
import { readFinished } from "./finished-store.mjs";

/**
 * Every finished match LIVE has shown, kept after the upstream feeds stop listing them.
 * ?tour=ppa | app | tpb | rta | wc | sportssync | ppa-eu | mlp-asia | … (optional)
 * ?event=<event id> with a tour narrows to one event (key "<tour>:<event>").
 * Read-only. PPA Europe / MLP Asia: played finals from the raw tickers (finished-store.mjs).
 * Other feeds: every FT board row, all draws incl. amateur and age groups, played: true when
 * real game scores exist, played: false (walkover, withdrawal, unscored) otherwise
 * (finished-board.mjs). Heat Check filters to pro on its side.
 */
export default async (req: Request) => {
  let tour = "";
  let event = "";
  try {
    const q = new URL(req.url).searchParams;
    tour = (q.get("tour") || "").toLowerCase();
    event = q.get("event") || "";
  } catch {
    tour = "";
  }
  if (tour && !/^[a-z0-9-]{2,20}$/.test(tour)) return Response.json({ error: "bad tour" }, { status: 400 });
  if (event && (!tour || !/^[A-Za-z0-9._-]{1,80}$/.test(event))) return Response.json({ error: "bad event" }, { status: 400 });
  try {
    const events = await readFinished({ tour, event });
    return Response.json(
      { updated: new Date().toISOString(), tour: tour || "all", events },
      { headers: { "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return Response.json({ error: "store unavailable", events: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};

export const config: Config = { path: "/api/finished" };
