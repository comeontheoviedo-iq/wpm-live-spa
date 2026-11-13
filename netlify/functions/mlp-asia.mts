import type { Config } from "@netlify/functions";
import { loadMlpAsia } from "./pb-ticker.mjs";

/**
 * MLP Asia 2026 team-league ticker. Season-scoped, so later stops
 * (Hong Kong and the rest of the pool) arrive on the same path.
 * Tour is mlp-asia, never APP.
 */
export default async (_req: Request) => {
  const body = await loadMlpAsia();
  return Response.json(body, {
    headers: { "Cache-Control": body.delayed ? "public, max-age=10" : "public, max-age=15" },
  });
};

export const config: Config = { path: "/api/mlp-asia" };
