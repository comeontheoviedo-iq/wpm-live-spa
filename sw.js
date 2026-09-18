/* WPM LIVE safe SW (20260918a)
 * Never caches boards, HTML, JS, API, or JSON — those always hit network no-store.
 * Optional network-first cache only for inert static assets (icon/manifest/css).
 * Handles notificationclick for follow LIVE alerts.
 */
const STATIC_CACHE = "wpm-static-20260918a";
const STATIC_PATHS = new Set(["/icon.svg", "/manifest.json", "/css/app.css"]);

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function mustNetworkOnly(pathname, mode) {
  if (mode === "navigate") return true;
  if (pathname === "/" || pathname === "/index.html") return true;
  if (pathname.startsWith("/js/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.endsWith(".json")) return true;
  if (pathname.endsWith(".html")) return true;
  // SPA deep links have no extension — never cache
  if (!/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

function isOptionalStatic(pathname) {
  if (STATIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/css/") && pathname.endsWith(".css")) return true;
  return false;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let u;
  try {
    u = new URL(req.url);
  } catch (_) {
    return;
  }
  if (u.origin !== self.location.origin) return;

  if (mustNetworkOnly(u.pathname, req.mode)) {
    e.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  if (isOptionalStatic(u.pathname)) {
    e.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          if (fresh && fresh.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(req, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch (_) {
          const hit = await caches.match(req);
          if (hit) return hit;
          throw new Error("offline");
        }
      })()
    );
    return;
  }

  // Default: network only, never write cache (no poison path for unknown assets)
  e.respondWith(fetch(req, { cache: "no-store" }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const data = e.notification.data || {};
  const target = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/";
  e.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch (_) {}
          }
          return;
        }
      }
      await clients.openWindow(target);
    })()
  );
});
