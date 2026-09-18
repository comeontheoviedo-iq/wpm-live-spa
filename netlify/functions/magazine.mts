import type { Config } from "@netlify/functions";

function strip(html: string) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Prefer tour/desk labels over player-name categories WordPress uses as tags. */
const KICKER_PREF = [
  "World Cup",
  "APP Tour",
  "APP",
  "PPA Tour",
  "MLP",
  "Podcast",
  "Equipment",
  "Global Development",
  "Competitions",
  "Tournaments",
  "Regions",
];

const KICKER_SKIP = new Set([
  "Players",
  "Pickleball News",
  "rankings-players",
]);

function image(p: any) {
  const media = p?._embedded?.["wp:featuredmedia"]?.[0];
  if (media) {
    const sizes = media.media_details?.sizes || {};
    const fromMedia =
      sizes.medium_large?.source_url ||
      sizes.large?.source_url ||
      sizes.medium?.source_url ||
      media.source_url ||
      "";
    if (fromMedia) return fromMedia;
  }
  const yoast = p?.yoast_head_json?.og_image;
  if (Array.isArray(yoast) && yoast[0]?.url) return String(yoast[0].url);
  return "";
}

function kicker(p: any) {
  const terms = p?._embedded?.["wp:term"] || [];
  const cats: string[] = [];
  for (const group of terms) {
    for (const t of group || []) {
      if (t?.taxonomy !== "category") continue;
      const name = String(t.name || "").trim();
      if (!name || KICKER_SKIP.has(name)) continue;
      cats.push(name);
    }
  }
  for (const pref of KICKER_PREF) {
    if (cats.includes(pref)) return pref;
  }
  // Avoid player-name categories (multi-word proper names without known desk labels)
  const deskish = cats.find((c) => KICKER_PREF.some((p) => c.includes(p)) || c.length <= 24);
  return deskish || "";
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const res = await fetch(
    `https://worldpickleballmagazine.com/wp-json/wp/v2/posts?per_page=20&page=${page}&_embed=1`,
    { headers: { "User-Agent": "WPM-LIVE/1.0" } }
  );
  if (!res.ok) return Response.json({ error: "magazine " + res.status }, { status: 502 });
  const total = res.headers.get("X-WP-Total") || "";
  const pages = res.headers.get("X-WP-TotalPages") || "";
  const posts = await res.json();
  const stories = (Array.isArray(posts) ? posts : []).map((p: any) => ({
    date: p.date,
    title: strip(p.title?.rendered || ""),
    stand: strip(p.excerpt?.rendered || "").slice(0, 220),
    href: p.link,
    image: image(p),
    tag: kicker(p),
  }));
  return Response.json(
    { page, pages: Number(pages) || 1, total: Number(total) || stories.length, stories },
    { headers: { "Cache-Control": "public, max-age=120" } }
  );
};

export const config: Config = { path: "/api/magazine" };
