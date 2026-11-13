import type { Config } from "@netlify/functions";
import { loadPpaEu } from "./pb-ticker.mjs";

/**
 * PPA Tour Europe P125 Lille. The US ppatour.com scores API returns 0 rows
 * for this module. Europe is scored on pickleballtournaments.com.
 * Does not replace /api/ppa.
 */
export default async (_req: Request) => {
  const body = await loadPpaEu();
  return Response.json(body, {
    headers: { "Cache-Control": body.delayed ? "public, max-age=10" : "public, max-age=15" },
  });
};

export const config: Config = { path: "/api/ppa-eu" };
