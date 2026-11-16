import type { Config } from "@netlify/functions";
import { readFinished } from "./finished-store.mjs";

/**
 * Finished, played matches LIVE kept from the PPA Tour Europe and MLP Asia tickers
 * after those tickers stopped listing them. ?tour=ppa-eu | mlp-asia (optional).
 * Read-only. Real final scores only; see finished-store.mjs for the rules.
 */
export default async (req: Request) => {
  let tour = "";
  try {
    tour = (new URL(req.url).searchParams.get("tour") || "").toLowerCase();
  } catch {
    tour = "";
  }
  if (tour && !/^[a-z0-9-]{2,20}$/.test(tour)) return Response.json({ error: "bad tour" }, { status: 400 });
  try {
    const events = await readFinished({ tour });
    return Response.json(
      { updated: new Date().toISOString(), tour: tour || "all", events },
      { headers: { "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    return Response.json({ error: "store unavailable", events: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};

export const config: Config = { path: "/api/finished" };
