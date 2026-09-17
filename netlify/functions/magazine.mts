import type { Config } from "@netlify/functions";

function strip(html: string) {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function image(p: any) {
  const media = p?._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) return "";
  const sizes = media.media_details?.sizes || {};
  return sizes.medium_large?.source_url || sizes.medium?.source_url || sizes.large?.source_url || media.source_url || "";
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
  }));
  return Response.json(
    { page, pages: Number(pages) || 1, total: Number(total) || stories.length, stories },
    { headers: { "Cache-Control": "public, max-age=120" } }
  );
};

export const config: Config = { path: "/api/magazine" };
