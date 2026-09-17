import type { Config } from "@netlify/functions";
import {
  ingest,
  mapTies,
  dedupMatches,
  filterMatches,
  buildBrackets,
} from "./wc-parse.mjs";

export default async () => {
  const headers = { RSC: "1", "User-Agent": "WPM-LIVE/1.0" };
  const [oop, live] = await Promise.all([
    fetch("https://www.sporttora.com/pwc2026/schedule?view=order-of-play&_rsc=wpm", { headers }),
    fetch("https://www.sporttora.com/pwc2026/live?_rsc=wpm", { headers }),
  ]);
  const ties: Record<string, any> = {};
  if (oop.ok) ingest(await oop.text(), ties);
  if (live.ok) ingest(await live.text(), ties);

  const today = new Date().toISOString().slice(0, 10);
  const mapped = mapTies(ties);
  const unique = dedupMatches(mapped);
  const matches = filterMatches(unique, today);
  const brackets = buildBrackets(unique);

  return Response.json(
    { updated: new Date().toISOString(), source: "sporttora-oop", matches, brackets },
    { headers: { "Cache-Control": "public, max-age=15" } }
  );
};

export const config: Config = { path: "/api/worldcup" };
