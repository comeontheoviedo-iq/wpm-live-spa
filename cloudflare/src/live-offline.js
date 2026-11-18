/**
 * MASTER SWITCH: WPM LIVE offline.
 *
 * Set 18 Nov 2026 (Chris): take live.worldpickleballmagazine.com down entirely while
 * data-source terms are checked (Pickleball Den's terms prohibit automated extraction).
 *
 * While LIVE_OFFLINE is true:
 *   - every page and /api/* and /desk request gets a neutral 503 page
 *     (Retry-After, noindex, no-store) and runs NO handler, so no request goes upstream;
 *   - both cron triggers return before doing anything (no ticker/board polling,
 *     no archive backfill, no daily scores save, no push check, no wave/official-URL fetches);
 *   - /sw.js is replaced by a self-removing service worker so browsers drop the cached app.
 * KV data (wpm-finished, desk, push subscriptions...) is left untouched.
 *
 * To bring LIVE back: set LIVE_OFFLINE = false and redeploy with scripts/deploy-cloudflare.sh.
 * (Den Live stays separately paused by DEN_LIVE_ENABLED in netlify/functions/den-live.mjs.)
 */
export const LIVE_OFFLINE = true;

export const RETRY_AFTER_SECONDS = 3600;

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>WPM LIVE is temporarily offline</title>
<style>
html,body{margin:0;height:100%;background:#0b1220;color:#f3f5f9;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px}
h1{font-size:clamp(1.5rem,4vw,2.25rem);margin:0 0 12px}
p{margin:0 0 20px;max-width:34rem;line-height:1.5;color:#c3cad8}
a{color:#fff;background:#1d4ed8;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600}
</style></head>
<body><main>
<h1>WPM LIVE is temporarily offline &mdash; back soon</h1>
<p>We have paused live scores for now. Thanks for your patience.</p>
<a href="https://worldpickleballmagazine.com/">Go to World Pickleball Magazine</a>
</main></body></html>`;

const KILL_SW = `self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",(e)=>e.waitUntil((async()=>{
  try{for(const k of await caches.keys())await caches.delete(k);}catch(_){}
  try{await self.registration.unregister();}catch(_){}
  try{for(const c of await self.clients.matchAll({type:"window"}))c.navigate(c.url);}catch(_){}
})()));
`;

const COMMON = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
  "retry-after": String(RETRY_AFTER_SECONDS),
};

/** The response for any request while LIVE is offline. Never touches KV, assets or upstreams. */
export function offlineResponse(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === "/sw.js") {
    return new Response(KILL_SW, {
      status: 200,
      headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }
  if (path === "/api" || path.startsWith("/api/")) {
    return Response.json(
      { offline: true, error: "temporarily_offline", message: "WPM LIVE is temporarily offline", home: "https://worldpickleballmagazine.com/" },
      { status: 503, headers: { ...COMMON, "access-control-allow-origin": "*" } }
    );
  }
  return new Response(request.method === "HEAD" ? null : PAGE, {
    status: 503,
    headers: { ...COMMON, "content-type": "text/html; charset=utf-8" },
  });
}
