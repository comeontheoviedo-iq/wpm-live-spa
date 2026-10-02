import type { Config } from "@netlify/functions";
import { catalog, loadFinished } from "./finished-archive.mjs";

export default async (req: Request) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) {
    return Response.json(
      { updated: new Date().toISOString(), events: catalog() },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  }
  const data = await loadFinished(id);
  return Response.json(data, {
    status: data.unknown ? 404 : 200,
    headers: { "Cache-Control": "public, max-age=120" },
  });
};

export const config: Config = { path: "/api/archive" };
