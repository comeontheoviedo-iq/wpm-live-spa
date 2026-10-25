import type { Config, Context } from "@netlify/functions";
import {
  clearSessionCookie,
  deskSecret,
  requestAuthorized,
  requestIsSecure,
  sessionCookie,
  signSession,
  secretsEqual,
} from "./_shared/desk-auth.mjs";
import { loadDeskFeed } from "./_shared/desk-feed.mjs";

/**
 * Private score and calendar desk. Not linked from the public bundle and not
 * added to the service worker cache list. The HTML editor is sent only after
 * DESK_KEY / DESK_PASSWORD checks. Mutations still go through the POST
 * handlers, which accept the same secret or this HttpOnly session.
 */

const NO_STORE = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

function html(body: string, status = 200, extra?: Record<string, string>) {
  const headers = new Headers(NO_STORE);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  }
  return new Response(body, { status, headers });
}

function page(title: string, inner: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${title}</title>
  <link rel="stylesheet" href="/css/app.css?v=20261019a">
</head>
<body>
  <div class="wrap" style="max-width:960px;margin:24px auto;padding:0 16px 48px">
    ${inner}
  </div>
</body>
</html>`;
}

function loginHtml(message: string) {
  const msg = message
    ? `<p class="games" id="deskMsg">${message.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] || c)}</p>`
    : `<p class="games" id="deskMsg"></p>`;
  return page(
    "WPM desk",
    `<h2 style="font-family:Syne,sans-serif;font-size:32px">Desk</h2>
     <p class="games">Score and calendar edits stay on this page. The public app does not include them.</p>
     <form method="post" action="/desk" class="stack">
       <label class="games">Desk key<br><input class="field" type="password" name="key" autocomplete="current-password" required></label>
       <button class="btn" type="submit">Continue</button>
     </form>
     ${msg}`
  );
}

function editorHtml(feed: any) {
  const embedded = JSON.stringify(feed ?? { matches: [] }).replace(/</g, "\\u003c");
  return page(
  "WPM desk",
  `<script type="application/json" id="deskFeed">${embedded}</script>
   <h2 style="font-family:Syne,sans-serif;font-size:32px">Desk</h2>
   <p class="games">Manual feed only. Public <code>/api/scores</code> overlays the live tour feeds on top of this blob, the same way the board does. A save here updates the desk copy. Live PPA, APP, World Cup, RTA and armed SportsSync rows are replaced on the public GET when those feeds respond.</p>
   <form method="post" action="/desk"><input type="hidden" name="action" value="logout"><button class="chip" type="submit">Lock</button></form>
   <p class="games" id="deskStatus">Loading the desk feed…</p>
   <div class="panel" id="scoreDesk"></div>
   <div class="panel" id="calDesk" style="margin-top:18px">
     <div class="kicker">Calendar arm</div>
     <form id="armForm" class="stack">
       <label class="games">Display name<br><input class="field" name="name" required></label>
       <label class="games">Venue<br><input class="field" name="venue"></label>
       <label class="games">Timezone (IANA)<br><input class="field" name="timezone" placeholder="America/New_York"></label>
       <label class="games">Start<br><input class="field" name="start" required placeholder="YYYY-MM-DD"></label>
       <label class="games">End<br><input class="field" name="end" placeholder="YYYY-MM-DD"></label>
       <label class="games">Host<br><input class="field" name="host" placeholder="APP"></label>
       <label class="games">Tour<br><input class="field" name="tour" placeholder="app"></label>
       <label class="games">Tier<br><input class="field" name="tier"></label>
       <label class="games">Connector
         <select class="field" name="connType">
           <option value="none">none</option>
           <option value="app">app</option>
           <option value="ppa">ppa</option>
           <option value="url">url</option>
           <option value="djoy">djoy</option>
           <option value="sportssync">sportssync</option>
         </select>
       </label>
       <label class="games">Den tournamentId<br><input class="field" name="denTournamentId"></label>
       <label class="games">PPA event id<br><input class="field" name="ppaEventId"></label>
       <label class="games">SportsSync tournamentId<br><input class="field" name="sportsSyncTournamentId"></label>
       <label class="games">Score URL / path<br><input class="field" name="scoreUrl" placeholder="/api/…"></label>
       <label class="games"><input type="checkbox" name="delayed"> Mark scores delayed</label>
       <label class="games">Note<br><input class="field" name="note"></label>
       <button class="btn" type="submit">Arm / save</button>
       <p class="games" id="armMsg"></p>
     </form>
     <div id="armedList"></div>
   </div>
   <script>
   (function () {
     function esc(s) {
       return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
         return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
       });
     }
     function status(text) {
       var el = document.getElementById("deskStatus");
       if (el) el.textContent = text;
     }
     async function loadFeed() {
       const data = JSON.parse(document.getElementById("deskFeed").textContent || "{}");
       const rows = Array.isArray(data.matches) ? data.matches : [];
       status("Desk feed " + (data.updated || "undated") + " · " + rows.length + " manual rows.");
       const host = document.getElementById("scoreDesk");
       host.innerHTML = rows.map(function (m) {
         return '<form class="desk-row" data-id="' + esc(m.id) + '">' +
           '<div>' + esc(m.date) + '<br>' + esc(m.div || m.tour || "") + '</div>' +
           '<input name="a" value="' + esc(m.a) + '">' +
           '<input name="score" value="' + esc(m.score || "") + '" placeholder="vs / 2-1">' +
           '<select name="status">' +
             ["NEXT", "LIVE", "FT"].map(function (s) {
               return '<option' + (m.status === s ? " selected" : "") + '>' + s + '</option>';
             }).join("") +
           '</select>' +
           '<input name="b" value="' + esc(m.b) + '">' +
           '<input name="games" value="' + esc(m.games || "") + '" placeholder="11-7, 6-4">' +
           '<button class="btn" type="submit">Save</button>' +
         '</form>';
       }).join("") || "<p class='empty'>No manual rows.</p>";
       host.querySelectorAll("form[data-id]").forEach(function (f) {
         f.addEventListener("submit", async function (ev) {
           ev.preventDefault();
           const fd = new FormData(f);
           const body = {
             id: f.getAttribute("data-id"),
             a: fd.get("a"),
             b: fd.get("b"),
             score: fd.get("score"),
             status: fd.get("status"),
             games: fd.get("games")
           };
           const res = await fetch("/api/scores", {
             method: "POST",
             credentials: "same-origin",
             headers: { "content-type": "application/json" },
             body: JSON.stringify(body)
           });
           const json = await res.json().catch(function () { return {}; });
           if (!res.ok) { status(json.error || "Save failed"); return; }
           location.reload();
         });
       });
     }
     async function loadCalendar() {
       const res = await fetch("/api/calendar", { cache: "no-store" });
       if (!res.ok) return;
       const data = await res.json();
       const armed = Array.isArray(data.armed) ? data.armed : [];
       const list = document.getElementById("armedList");
       list.innerHTML = armed.length ? armed.map(function (a) {
         return '<div class="rank-row"><b></b><div><strong>' + esc(a.name) + '</strong><span>' +
           esc(a.start) + " → " + esc(a.end) + " · " + esc(a.status || "") +
           '</span></div><button class="chip" type="button" data-disarm="' + esc(a.id) + '">Disarm</button></div>';
       }).join("") : "<p class='empty'>Nothing armed.</p>";
       list.querySelectorAll("[data-disarm]").forEach(function (btn) {
         btn.addEventListener("click", async function () {
           const res = await fetch("/api/calendar", {
             method: "POST",
             credentials: "same-origin",
             headers: { "content-type": "application/json" },
             body: JSON.stringify({ action: "disarm", id: btn.getAttribute("data-disarm") })
           });
           const json = await res.json().catch(function () { return {}; });
           const msg = document.getElementById("armMsg");
           if (!res.ok) { if (msg) msg.textContent = json.error || "Disarm failed"; return; }
           if (msg) msg.textContent = "Disarmed.";
           loadCalendar();
         });
       });
     }
     document.getElementById("armForm").addEventListener("submit", async function (ev) {
       ev.preventDefault();
       const fd = new FormData(ev.target);
       const connType = String(fd.get("connType") || "none");
       const body = {
         action: "arm",
         name: fd.get("name"),
         venue: fd.get("venue"),
         timezone: fd.get("timezone"),
         start: fd.get("start"),
         end: fd.get("end"),
         host: fd.get("host"),
         tour: fd.get("tour"),
         tier: fd.get("tier"),
         note: fd.get("note"),
         delayed: fd.get("delayed") === "on",
         connector: {
           type: connType,
           denTournamentId: fd.get("denTournamentId") || "",
           sportsSyncTournamentId: fd.get("sportsSyncTournamentId") || "",
           ppaEventId: fd.get("ppaEventId") || "",
           scoreUrl: fd.get("scoreUrl") || ""
         }
       };
       const msg = document.getElementById("armMsg");
       const res = await fetch("/api/calendar", {
         method: "POST",
         credentials: "same-origin",
         headers: { "content-type": "application/json" },
         body: JSON.stringify(body)
       });
       const json = await res.json().catch(function () { return {}; });
       if (!res.ok) { if (msg) msg.textContent = json.message || json.error || "Save failed"; return; }
       if (msg) msg.textContent = json.event && json.event.onLive ? "Armed · on WPM LIVE" : "Saved · " + ((json.event && json.event.status) || "ok");
       loadCalendar();
     });
     loadFeed();
     loadCalendar();
   })();
   </script>`
  );
}

async function readForm(req: Request) {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return {
      action: typeof body.action === "string" ? body.action : "",
      key: typeof body.key === "string" ? body.key : "",
    };
  }
  const params = new URLSearchParams(await req.text());
  return { action: params.get("action") || "", key: params.get("key") || "" };
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const secure = requestIsSecure(req);

  if (path === "/desk/feed") {
    if (!(await requestAuthorized(req, ""))) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const feed = await loadDeskFeed();
    return Response.json(feed, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  if (req.method === "POST") {
    const form = await readForm(req);
    if (form.action === "logout") {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/desk",
          "Set-Cookie": clearSessionCookie(secure),
          "Cache-Control": "no-store",
        },
      });
    }
    const secret = deskSecret();
    if (!secret) return html(loginHtml("Desk is not configured on this host."), 503);
    if (!(await secretsEqual(form.key, secret))) return html(loginHtml("That key was not accepted."), 401);
    const token = await signSession(secret);
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/desk",
        "Set-Cookie": sessionCookie(token, secure),
        "Cache-Control": "no-store",
      },
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return Response.json({ error: "method" }, { status: 405, headers: { "Cache-Control": "no-store" } });
  }

  if (!deskSecret()) return html(loginHtml("Desk is not configured on this host."), 503);
  if (!(await requestAuthorized(req, ""))) return html(loginHtml(""));
  const feed = await loadDeskFeed();
  return html(editorHtml(feed));
};

export const config: Config = {
  path: ["/desk", "/desk/feed"],
};
