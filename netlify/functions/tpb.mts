import type { Config } from "@netlify/functions";
import { loadTpb } from "./tpb-cuadros.mjs";

/**
 * TOP Pickleball Tour Somontes. Official Cuadros y horarios widget.
 * Default cuadros id is Somontes. A later stop (Andorra) can pass ?id=
 * once that widget id is published. Does not replace /api/ppa or /api/app.
 */
export default async (req: Request) => {
  let id = "";
  try {
    id = new URL(req.url).searchParams.get("id") || "";
  } catch {
    id = "";
  }
  const body = await loadTpb({ id });
  return Response.json(body, {
    headers: { "Cache-Control": body.delayed ? "public, max-age=15" : "public, max-age=30" },
  });
};

export const config: Config = { path: "/api/tpb" };
