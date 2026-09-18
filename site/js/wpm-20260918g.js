
const WATCH = {
  pbtv: {label:"Watch on PBTV", href:"https://www.ppatour.com/watch/"},
  streamed: {label:"PPA Streamed Courts", href:"https://www.youtube.com/@ppastreamedcourts"},
  wcyoutube: {label:"World Cup YouTube", href:"https://www.youtube.com/@PickleballWorldCup/streams"}
};
const WAVE_SEED_IDS = { Waters:"477702", Johns:"367397", Bright:"128780" };
const PLAYERS = {
  Waters: {name:"Anna Leigh Waters", role:"USA · singles / doubles / mixed", blurb:"The standard. Triple-stack Friday at Nationals."},
  Johns: {name:"Ben Johns", role:"USA · doubles / mixed", blurb:"Out of singles in Cary. Still in MD and XD."},
  Bright: {name:"Anna Bright", role:"USA · doubles / mixed", blurb:"On court with Patriquin and with Waters."}
};
const TEAMS = {
  Vietnam: {name:"Vietnam", role:"Hosts · Open team", blurb:"18–0 in the Open pool. Knockouts ask for depth across six disciplines."},
  USA: {name:"United States", role:"Open team", blurb:"Knockout window in Da Nang."},
  India: {name:"India", role:"Open team", blurb:"17–1 through the pool. R32 against Portugal."}
};
const STORIES = [
  {tag:"Issue 19", title:"World Pickleball Magazine", stand:"Culture, personalities and the month that shaped the global game.", href:"https://worldpickleballmagazine.com/magazines/", cover:true},
  {tag:"World Cup", title:"Vietnam Have Looked Like the Team to Beat", stand:"Hosts went 18–0 in the Open pool. Knockouts ask for depth.", href:"https://worldpickleballmagazine.com/pickleball-world-cup-vietnam-team-knockout-2026/"},
  {tag:"PPA Tour", title:"Cary’s Outsiders Broke the Draw", stand:"Quarterfinals after a compressed singles week.", href:"https://worldpickleballmagazine.com/ppa-cary-quarterfinals-outsiders-contenders-2026/"},
  {tag:"Podcast", title:"Why Your Pickleball Grip Matters", stand:"Sahara Dry CEO Rob McEvoy on sweat and control.", href:"https://worldpickleballmagazine.com/pickleball-grip-sweat-sahara-dry-rob-mcevoy/"}
];
function amazonUrl(q){
  const tag = localStorage.getItem("wpm-amazon-tag") || "";
  return "https://www.amazon.com/s?k="+encodeURIComponent(q)+(tag?"&tag="+encodeURIComponent(tag):"");
}
const PRODUCTS = [
  {id:"boomstik", cat:"paddles", name:"Selkirk Labs Boomstik", price:"$280", who:"Sock / Parenteau on PPA", why:"Highest ticket on the board. Brand store pays better than Amazon.", tags:[], store:"https://www.selkirk.com/", q:"Selkirk Boomstik pickleball paddle"},
  {id:"perseus", cat:"paddles", name:"JOOLA Perseus / Magnus", price:"$200–280", who:"Johns, Bright, Fahey", why:"Tour paddle most of your follows actually use.", tags:["Johns","Bright"], store:"https://joola.com/", q:"JOOLA Perseus pickleball paddle"},
  {id:"franklin", cat:"paddles", name:"Franklin FS Tour", price:"$150–220", who:"Anna Leigh Waters 2026 deal", why:"Waters contract paddle. Pair with Franklin balls.", tags:["Waters"], store:"https://franklinsports.com/", q:"Franklin FS Tour pickleball paddle"},
  {id:"crbn", cat:"paddles", name:"CRBN TruFoam", price:"$180–280", who:"On streamed PPA courts", why:"Search demand is high. Easy Amazon convert.", tags:[], store:"https://crbn.com/", q:"CRBN pickleball paddle"},
  {id:"x40", cat:"balls", name:"Franklin X-40 outdoor balls", price:"$20–35", who:"USA Pickleball outdoor ball", why:"Best affiliate SKU. Repeat buy. Low price, high volume.", tags:["Waters"], store:"https://franklinsports.com/", q:"Franklin X-40 pickleball"},
  {id:"indoor", cat:"balls", name:"Franklin indoor balls", price:"$18–30", who:"Gym and club standard", why:"Same as X-40 for indoor players.", tags:[], store:"https://franklinsports.com/", q:"Franklin indoor pickleball balls"},
  {id:"tourna", cat:"grips", name:"Tourna Grip overgrips", price:"$8–20", who:"Every serious bag", why:"Consumable. Highest conversion of anything in the shop.", tags:[], store:"https://tourna.com/", q:"Tourna Grip pickleball overgrip"},
  {id:"geckogrip", cat:"grips", name:"Hesacore / comfort grip", price:"$25–40", who:"Tennis-to-pickle converts", why:"Mid ticket accessory. Good attach rate next to paddles.", tags:[], store:"https://www.hesacore.com/", q:"Hesacore pickleball grip"},
  {id:"shoes", cat:"shoes", name:"Court shoes (PB5 / Asics)", price:"$90–140", who:"Lateral movement, not running trainers", why:"Second biggest basket after paddles.", tags:[], store:"https://pb5star.com/", q:"pickleball court shoes"},
  {id:"bag", cat:"bags", name:"Tour paddle bag", price:"$40–90", who:"2–4 paddle carry", why:"Gift SKU. Converts off magazine gear guides.", tags:[], store:"https://www.selkirk.com/", q:"pickleball paddle bag"},
  {id:"starter", cat:"starter", name:"Franklin starter set", price:"$40–80", who:"New players from the magazine audience", why:"Lowest friction first purchase.", tags:[], store:"https://franklinsports.com/", q:"Franklin pickleball starter set"},
  {id:"net", cat:"starter", name:"Portable net", price:"$80–160", who:"Driveway and club overflow", why:"Seasonal spike. Heavy but high AOV.", tags:[], store:"https://franklinsports.com/", q:"portable pickleball net"}
];

const state = {
  date: null,
  filter: "all",
  selected: {},
  matches: [],
  heroByDate: {},
  updated: null,
  notified: {},
  deskKey: localStorage.getItem("wpm-desk-key") || "",
  boardMode: "matches",
  more: {},
  magazine: {page:1, pages:1, stories:[]},
  shopCat: "all",
  rankings: null,
  history: null,
  rankBoard: "gpa",
  rankCat: "mens_singles",
  resultCat: "all",
  calendar: null,
  calAddId: "",
  brackets: {},
  wcBrackets: {},
  appBrackets: {},
  drawTour: "ppa",
  drawDiv: ""
};
try { state.selected = JSON.parse(localStorage.getItem("wpm-follows") || "{}"); } catch(e) { state.selected = {}; }
try { state.notified = JSON.parse(sessionStorage.getItem("wpm-notified-live") || "{}"); } catch(e) { state.notified = {}; }
try {
  const savedCat = sessionStorage.getItem("wpm-result-cat") || "";
  if (/^(all|MS|WS|MD|WD|XD)$/.test(savedCat)) state.resultCat = savedCat;
} catch(e) {}
(function applyCatHash(){
  const h = String(location.hash || "").replace(/^#/, "");
  const m = h.match(/(?:^|&)cat=([A-Za-z]+)/i);
  if (!m) return;
  const cat = m[1].toUpperCase() === "ALL" ? "all" : m[1].toUpperCase();
  if (/^(all|MS|WS|MD|WD|XD)$/.test(cat)) state.resultCat = cat;
})();
// Re-sync push subscription if alerts already granted (follows may have changed offline).
if ("Notification" in window && Notification.permission === "granted") {
  setTimeout(() => { syncPushSubscription(); }, 2500);
}

const SAFE_SW = "/sw.js?v=20260918f";
const SAFE_SW_MARK = "20260918f";
/** Application-server VAPID public key (safe to embed). Private stays in Netlify env. */
const VAPID_PUBLIC_KEY = "BEuWn2rcxKeLXPFa3KJzys7rLOtFX8GUZ9ckfFhsqEVO0Y2PE3WfnOivmFJV3EUVCf1c1g31qSiVoNDbcJQO8GQ";

function urlBase64ToUint8Array(base64String){
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function followTagsList(){
  // Player/team keys only — event keys (ev:) stay in localStorage but never go to Web Push.
  return Object.keys(state.selected || {}).filter(k => state.selected[k] && String(k).indexOf("ev:") !== 0);
}
async function fetchPushPublicKey(){
  try {
    const res = await fetch("/api/push-subscribe", { cache: "no-store" });
    if (!res.ok) return VAPID_PUBLIC_KEY;
    const j = await res.json();
    return (j && j.publicKey) || VAPID_PUBLIC_KEY;
  } catch(e) {
    return VAPID_PUBLIC_KEY;
  }
}
/** After Notification permission + SW ready: PushManager.subscribe and POST + follows. */
async function syncPushSubscription(){
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, reason: "unsupported" };
  if (!("Notification" in window) || Notification.permission !== "granted") return { ok: false, reason: "permission" };
  try {
    const reg = await ensureSafeSW();
    if (!reg) return { ok: false, reason: "sw" };
    await navigator.serviceWorker.ready;
    const key = await fetchPushPublicKey();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key)
      });
    }
    const follows = followTagsList();
    const res = await fetch("/api/push-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), follows }),
      cache: "no-store"
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn("[wpm-push] subscribe POST failed", res.status, t);
      return { ok: false, reason: "post" };
    }
    return { ok: true, follows: follows.length };
  } catch(e) {
    console.warn("[wpm-push] sync failed", e);
    return { ok: false, reason: "error" };
  }
}

function persistNotified(){
  try { sessionStorage.setItem("wpm-notified-live", JSON.stringify(state.notified || {})); } catch(e) {}
}
function pruneNotified(){
  const liveIds = new Set((state.matches || []).filter(m => effectiveStatus(m) === "LIVE").map(m => m.id));
  let changed = false;
  Object.keys(state.notified || {}).forEach(id => {
    if (!liveIds.has(id)) { delete state.notified[id]; changed = true; }
  });
  if (changed) persistNotified();
}
function followNameTokens(s){
  return String(s || "").split(/[^A-Za-z0-9']+/).filter(t => t.length > 0);
}
/** Follow keys that hit this match via tags or a/b/games name tokens (mirrors push matchFollowKeys). */
function matchedFollowsFor(m){
  const keys = Object.keys(state.selected || {}).filter(k => state.selected[k]);
  if (!keys.length || !m) return [];
  const tagSet = new Set(m.tags || []);
  const hay = `${m.a || ""} ${m.b || ""} ${m.games || ""}`;
  const hayTokens = new Set(followNameTokens(hay).map(t => t.toLowerCase()));
  const hayLower = hay.toLowerCase();
  const hit = [];
  for (const k of keys) {
    if (tagSet.has(k)) { hit.push(k); continue; }
    const kl = String(k).toLowerCase();
    if (!kl) continue;
    if (hayTokens.has(kl)) { hit.push(k); continue; }
    if (kl.includes(" ") && hayLower.includes(kl)) { hit.push(k); continue; }
  }
  return hit;
}
function followedTagsFor(m){
  return matchedFollowsFor(m);
}
function notifyBody(m){
  const who = followedTagsFor(m).join(", ") || "follow";
  const tour = m.comp || (m.tour === "ppa" ? "PPA" : m.tour === "app" ? (appTier(m) === "pro" ? "APP Pro" : "APP") : m.tour === "wc" ? "World Cup" : (m.tour || "")).toString();
  const div = m.div || m.round || "";
  const meta = [tour, div].filter(Boolean).join(" · ");
  const line = meta ? `${m.a} vs ${m.b} · ${meta}` : `${m.a} vs ${m.b} is live`;
  return `${line}\nFollowing · ${who}`;
}
async function ensureSafeSW(){
  if (!("serviceWorker" in navigator)) return null;
  try {
    const rs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(rs.map(r => {
      const sw = r.active || r.waiting || r.installing;
      const url = (sw && sw.scriptURL) || "";
      if (url.includes(SAFE_SW_MARK)) return null;
      return r.unregister();
    }));
    return await navigator.serviceWorker.register(SAFE_SW);
  } catch(e) { return null; }
}

function ymd(d){
  const y=d.getFullYear(), m=d.getMonth()+1, day=d.getDate();
  return `${y}-${m<10?"0"+m:m}-${day<10?"0"+day:day}`;
}
function parseUtc(s){ return s ? new Date(s) : null; }
function localTime(iso){
  if(!iso) return "";
  return parseUtc(iso).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
}
function relTime(iso){
  if(!iso) return "";
  const t = parseUtc(iso).getTime() - Date.now();
  if (t > 3600000) return "in " + Math.round(t/3600000) + "h";
  if (t > 60000) return "in " + Math.round(t/60000) + "m";
  if (t > -60000) return "now";
  return "";
}
function effectiveStatus(m){
  // API status is authority — never invent LIVE from the clock alone.
  // PPA ticker says upnext until live; promoting NEXT→LIVE from start age caused false LIVE.
  if (m.status === "FT") return "FT";
  if (m.status === "LIVE") return "LIVE";
  if ((m.lines || []).some(l => l.live)) return "LIVE";
  // Soft window only for tours that supply an explicit end (desk/WC windows).
  // PPA + APP: API status is authority — never clock-promote NEXT→LIVE.
  if (m.tour !== "ppa" && m.tour !== "app") {
    const now = Date.now();
    const start = parseUtc(m.start);
    const end = parseUtc(m.end);
    if (start && end && now >= start.getTime() && now <= end.getTime()) return "LIVE";
  }
  return m.status === "NEXT" ? "NEXT" : (m.status || "NEXT");
}
function followsMatch(m){
  return matchedFollowsFor(m).length > 0;
}
function anyFollows(){
  return Object.values(state.selected).some(Boolean);
}
function centerScore(m){
  const st = effectiveStatus(m);
  if (st === "NEXT" && !m.score) return "vs";
  return m.score || "vs";
}

function gameLooksFinished(a,b){
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.max(x,y) >= 11 && Math.abs(x-y) >= 2;
}
function cleanLines(m){
  if (!m || m.tour !== "ppa") return m;
  // Drop padded / unplayed 0–0 lines (PPA API pads best-of arrays). Keep true live 0–0.
  const rawLines = (m.lines || []).filter(l => {
    const pts = String(l.score||"").split(/[–-]/);
    const x = Number(pts[0]), y = Number(pts[1]);
    if (x === 0 && y === 0 && !l.live) return false;
    return true;
  });
  const lines = rawLines.map(l => {
    const pts = String(l.score||"").split(/[–-]/);
    const done = gameLooksFinished(pts[0], pts[1]);
    return {...l, winner: done ? l.winner : "", live: !done && m.status !== "FT" && !!l.live };
  });
  if (!lines.length) {
    // Still recompute empty games string if we stripped pads from a 2-0 FT
    if ((m.lines || []).length) {
      return Object.assign({}, m, { lines: [], score: m.status === "NEXT" ? "" : (m.score || ""), games: "" });
    }
    return m;
  }
  let aWins=0,bWins=0;
  lines.forEach(l => {
    const pts = String(l.score||"").split(/[–-]/);
    if (!gameLooksFinished(pts[0], pts[1])) return;
    if (Number(pts[0]) > Number(pts[1])) aWins++;
    else if (Number(pts[1]) > Number(pts[0])) bWins++;
  });
  const anyLive = lines.some(l => l.live);
  return Object.assign({}, m, {
    lines,
    score: (m.status==="NEXT" && !aWins && !bWins && !anyLive) ? "" : `${aWins}-${bWins}`,
    games: lines.map(l => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · ")
  });
}

function byId(id){ return state.matches.find(m => m.id === id); }

function qs(k){ try { return new URLSearchParams(location.search).get(k)||""; } catch(e){ return ""; } }
function path(){
  return location.pathname.replace(/\/+$/,"") || "/";
}
function go(href, ev){
  if (ev) ev.preventDefault();
  history.pushState({}, "", href);
  render();
  window.scrollTo(0,0);
}

function deskClock(){
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset()*60000;
  const bst = new Date(utc + 60*60*1000);
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const pad = n => n<10?"0"+n:""+n;
  return `${days[bst.getDay()]} ${bst.getDate()} ${months[bst.getMonth()]} ${bst.getFullYear()} · DESK ${pad(bst.getHours())}:${pad(bst.getMinutes())} BST`;
}

function dayMeta(iso){
  const [Y,M,D] = iso.split("-").map(Number);
  const d = new Date(Y, M-1, D);
  const today = ymd(new Date());
  const yest = ymd(new Date(Date.now()-86400000));
  const tom = ymd(new Date(Date.now()+86400000));
  const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  const tag = iso===today?"Today":iso===yest?"Yest":iso===tom?"Tom":"";
  return {wd, num:d.getDate(), tag};
}

function datesAvailable(){
  const set = {};
  state.matches.forEach(m => set[m.date]=1);
  const today = ymd(new Date());
  set[today]=1;
  set[ymd(new Date(Date.now()-86400000))]=1;
  set[ymd(new Date(Date.now()+86400000))]=1;
  return Object.keys(set).sort();
}


function competition(m){
  const d = ((m.div||"")+" "+(m.cat||"")).toLowerCase();
  if (m.tour === "ppa") return {id:"ppa", title:"PPA Nationals", place:"Cary, NC", rank:1};
  if (m.tour === "app") {
    const pro = appTier(m) === "pro";
    return pro
      ? {id:"app-pro", title:"APP Pro · Overland Park", place:"Overland Park, KS", rank:1}
      : {id:"app", title:"APP · Overland Park", place:"Overland Park, KS", rank:2};
  }
  if (d.includes("open")) return {id:"wc-open", title:"World Cup · Open", place:"Da Nang", rank:2};
  if (d.includes("junior")) return {id:"wc-jr", title:"World Cup · Juniors", place:"Da Nang", rank:3};
  if (d.includes("kid")) return {id:"wc-kids", title:"World Cup · Kids", place:"Da Nang", rank:4};
  if (d.includes("senior") || d.includes("master")) return {id:"wc-sr", title:"World Cup · Age groups", place:"Da Nang", rank:5};
  if (m.tour === "wc") return {id:"wc-other", title:"World Cup", place:"Da Nang", rank:6};
  return {id:"other", title:m.comp||"Other", place:"", rank:9};
}

function appTier(m){
  if (m.tour !== "app") return "";
  if (m.tier === "pro" || m.tier === "amateur") return m.tier;
  // Fallback if older API omitted tier: Pro in div/comp name
  const blob = ((m.div||"")+" "+(m.comp||"")).toLowerCase();
  if (/\bpro\b/.test(blob)) return "pro";
  return "amateur";
}
const RESULT_CATS = [
  ["all","All"],
  ["MS","Men's Singles"],
  ["WS","Women's Singles"],
  ["XD","Mixed Doubles"],
  ["MD","Men's Doubles"],
  ["WD","Women's Doubles"]
];
function discFromDivName(raw){
  const s = String(raw || "").toLowerCase();
  if (!s) return "";
  if (/mixed/.test(s) || /\bxd\b/.test(s)) return "XD";
  if (/women'?s?\s*doubles|\bwd\b/.test(s)) return "WD";
  if (/men'?s?\s*doubles|\bmd\b/.test(s)) return "MD";
  if (/women'?s?\s*singles|\bws\b/.test(s)) return "WS";
  if (/men'?s?\s*singles|\bms\b/.test(s)) return "MS";
  if (/women/.test(s) && /double/.test(s)) return "WD";
  if (/men/.test(s) && /double/.test(s)) return "MD";
  if (/women/.test(s) && /single/.test(s)) return "WS";
  if (/men/.test(s) && /single/.test(s)) return "MS";
  return "";
}
/** PPA division / APP bracket / existing disc field → MS WS XD MD WD. Never invent scores. */
function matchDisc(m){
  const d = String(m && m.disc || "").toUpperCase();
  if (["MS","WS","MD","WD","XD"].includes(d)) return d;
  return discFromDivName((m && (m.div || m.round || m.comp)) || "");
}
function persistResultCat(){
  try { sessionStorage.setItem("wpm-result-cat", state.resultCat || "all"); } catch(e) {}
  if (state.boardMode !== "results") return;
  const cat = state.resultCat && state.resultCat !== "all" ? "cat="+state.resultCat : "";
  const hash = cat ? "#"+cat : "";
  const next = location.pathname + location.search + hash;
  if ((location.pathname + location.search + location.hash) !== next) history.replaceState({}, "", next);
}
function eventFollowKey(m){
  if (!m || !m.tour) return "";
  if (m.tour === "ppa") return "ev:ppa";
  if (m.tour === "app") return "ev:app";
  if (m.tour === "wc") return "ev:wc";
  return "ev:" + m.tour;
}
function followPersonLabel(k){
  if (PLAYERS[k]) return {Waters:"A. Waters",Johns:"B. Johns",Bright:"A. Bright"}[k] || PLAYERS[k].name;
  if (TEAMS[k]) return TEAMS[k].name;
  return k;
}
function followingEvents(){
  const out = [];
  const seen = new Set();
  const labels = { "ev:ppa":"PPA Tour (US)", "ev:app":"APP", "ev:wc":"World Cup" };
  Object.keys(state.selected || {}).filter(k => state.selected[k] && String(k).indexOf("ev:")===0).forEach(k => {
    if (seen.has(k)) return;
    seen.add(k);
    const sample = (state.matches||[]).find(m => eventFollowKey(m)===k);
    const tour = k.slice(3);
    out.push({
      key: k,
      label: (sample && sample.comp) || labels[k] || tour.toUpperCase(),
      filter: tour === "app" ? "app-pro" : tour
    });
  });
  (state.matches||[]).filter(followsMatch).forEach(m => {
    const k = eventFollowKey(m);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push({
      key: k,
      label: m.comp || m.tour,
      filter: m.tour === "app" ? (appTier(m)==="pro" ? "app-pro" : "app") : m.tour
    });
  });
  return out;
}
function followingRail(){
  const people = followTagsList();
  const events = followingEvents();
  const peopleHtml = people.length
    ? people.map(k => {
        const href = TEAMS[k] ? "/team/"+encodeURIComponent(k) : "/player/"+encodeURIComponent(k);
        return `<a class="follow-item" href="${href}">${esc(followPersonLabel(k))}</a>`;
      }).join("")
    : `<p class="empty rail-empty">Follow a player on a match or profile — they land here.</p>`;
  const eventsHtml = events.length
    ? events.map(e => `<button class="league ${state.filter===e.filter?"on":""}" data-f="${e.filter}">${esc(e.label)}</button>`).join("")
    : (people.length ? `<p class="empty rail-empty">No followed event in this board window.</p>` : "");
  return `<div class="panel rail-card follow-box">
    <div class="kicker">Following</div>
    <div class="follow-people">${peopleHtml}</div>
    ${eventsHtml?`<div class="kicker" style="margin-top:10px">Events</div>${eventsHtml}`:""}
    <a class="chip" href="/following">Open following</a>
  </div>`;
}

function filteredList(){
  return state.matches.filter(m => {
    if (m.date !== state.date) return false;
    if (state.filter === "ppa" && m.tour !== "ppa") return false;
    if (state.filter === "app-pro") {
      if (m.tour !== "app" || appTier(m) !== "pro") return false;
    } else if (state.filter === "app") {
      if (m.tour !== "app" || appTier(m) !== "amateur") return false;
    }
    // All: soft-hide APP amateur unless LIVE (keeps All from flooding)
    if (state.filter === "all" && m.tour === "app" && appTier(m) === "amateur" && effectiveStatus(m) !== "LIVE") return false;
    if (state.filter === "wc" && m.tour !== "wc") return false;
    if (state.filter === "npl" && m.tour !== "npl") return false;
    if (state.filter === "asia" && m.tour !== "asia") return false;
    if (state.filter === "following" && !followsMatch(m)) return false;
    if (state.boardMode === "results" && state.resultCat && state.resultCat !== "all") {
      if (matchDisc(m) !== state.resultCat) return false;
    }
    // Competitions without a live path: never leak PPA/APP/WC as if they belonged here.
    if (state.filter === "mlp-asia" || state.filter === "app-asia" || state.filter === "tpb" || state.filter === "ppa-eu" || state.filter === "gpa") return false;
    return true;
  }).sort((a,b) => {
    const ra = {LIVE:0,NEXT:1,FT:2}[effectiveStatus(a)];
    const rb = {LIVE:0,NEXT:1,FT:2}[effectiveStatus(b)];
    if (ra !== rb) return ra-rb;
    const sa = parseUtc(a.start)?.getTime() || 0;
    const sb = parseUtc(b.start)?.getTime() || 0;
    if (effectiveStatus(a)==="FT") return sb-sa;
    return sa-sb;
  });
}

const GPA_CAT_LABEL = {
  mens_singles:"Men's singles", womens_singles:"Women's singles",
  mens_doubles:"Men's doubles", womens_doubles:"Women's doubles",
  mens_mixed_doubles:"Mixed (M)", womens_mixed_doubles:"Mixed (W)"
};
const ELO_CAT_LABEL = { singles:"Singles", mensDoubles:"Men's doubles" };

function normName(s){
  return String(s||"").toLowerCase().replace(/[./,'']/g," ").replace(/\s+/g," ").trim();
}
function nameTokens(s){
  return normName(s).split(" ").filter(t => t && t.length > 1);
}
function resolvePlayerKey(id){
  const raw = decodeURIComponent(String(id||"").trim());
  if (PLAYERS[raw]) return raw;
  const nid = normName(raw);
  for (const [k,p] of Object.entries(PLAYERS)){
    if (normName(k) === nid || normName(p.name) === nid) return k;
    const pt = nameTokens(p.name);
    const ct = nameTokens(raw);
    if (!pt.length || !ct.length) continue;
    const last = pt[pt.length-1];
    if (ct[ct.length-1] !== last && !ct.includes(last)) continue;
    if (ct.length === 1 && ct[0] === last) return k;
    const pFirst = pt[0], cFirst = ct[0];
    if (cFirst === pFirst) return k;
    if (cFirst.length === 1 && pFirst.startsWith(cFirst)) return k;
    if (pFirst.length === 1 && cFirst.startsWith(pFirst)) return k;
    if (pt.includes(cFirst) || ct.includes(pFirst)) return k;
  }
  return null;
}
function resolveTeamKey(id){
  const raw = decodeURIComponent(String(id||"").trim());
  if (TEAMS[raw]) return raw;
  const nid = normName(raw);
  if (nid === "united states" || nid === "usa" || nid === "us") return TEAMS.USA ? "USA" : null;
  for (const [k,t] of Object.entries(TEAMS)){
    if (normName(k) === nid || normName(t.name) === nid) return k;
  }
  return null;
}
function rankingNameMatches(fullName, rowName){
  const pt = nameTokens(fullName), rt = nameTokens(rowName);
  if (!pt.length || !rt.length) return false;
  if (normName(fullName) === normName(rowName)) return true;
  const pLast = pt[pt.length-1], rLast = rt[rt.length-1];
  if (pLast !== rLast) return false;
  const pFirst = pt[0], rFirst = rt[0];
  if (pFirst === rFirst) return true;
  if (pFirst.length === 1 && rFirst.startsWith(pFirst)) return true;
  if (rFirst.length === 1 && pFirst.startsWith(rFirst)) return true;
  if (pt.includes(rFirst) || rt.includes(pFirst)) return true;
  return false;
}
function personInText(fullName, text){
  const hay = String(text||"");
  if (!hay) return false;
  if (rankingNameMatches(fullName, hay)) return true;
  const pt = nameTokens(fullName);
  if (pt.length < 2) return normName(hay) === normName(fullName);
  // Abbreviated sides like "A. Waters" / "B. Johns / A. Waters"
  const last = pt[pt.length-1];
  const first = pt[0];
  const re = new RegExp("\\b"+first[0]+"\\.?\\s+"+last+"\\b","i");
  if (re.test(hay)) return true;
  const fullRe = new RegExp("\\b"+pt.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("\\s+")+"\\b","i");
  return fullRe.test(hay);
}
function collectPlayerRankings(fullName){
  const cards = [];
  const data = state.rankings || {};
  Object.entries(data.gpa || {}).forEach(([cat, rows]) => {
    (rows||[]).forEach(r => {
      if (!rankingNameMatches(fullName, r.name)) return;
      cards.push({ source:"GPA", cat: GPA_CAT_LABEL[cat]||cat, rank:r.rank, detail:(r.points!=null?r.points+" pts":"")+(r.country?" · "+r.country:""), name:r.name });
    });
  });
  ((data.elo || {}).singles || []).forEach(r => {
    if (!rankingNameMatches(fullName, r.name)) return;
    cards.push({ source:"WPR", cat: "Open mixed", rank:r.rank, detail:(r.elo!=null?r.elo+" WPR":"")+(r.dupr?" · DUPR "+r.dupr:""), name:r.name });
  });
  Object.entries(data.ppaWorld || {}).forEach(([sex, rows]) => {
    (rows||[]).forEach(r => {
      if (!rankingNameMatches(fullName, r.name)) return;
      cards.push({ source:"PPA World", cat: sex==="women"?"Women":"Men", rank:r.rank, detail:r.points!=null?r.points+" pts":"", name:r.name });
    });
  });
  cards.sort((a,b) => (a.rank||99) - (b.rank||99));
  // Prefer best ranks per source; keep all labelled boards visible
  const out = [];
  const seen = new Set();
  cards.forEach(c => {
    const k = c.source+"|"+c.cat;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(c);
  });
  return out.slice(0, 8);
}
function playerPath(name){
  const key = resolvePlayerKey(name);
  if (key) return "/player/" + encodeURIComponent(key);
  return "/player/" + encodeURIComponent(String(name||"").trim());
}
function teamPath(name){
  const key = resolveTeamKey(name);
  if (key) return "/team/" + encodeURIComponent(key);
  return "/team/" + encodeURIComponent(String(name||"").trim());
}
function entityPath(name){
  if (resolveTeamKey(name)) return teamPath(name);
  return playerPath(name);
}
function matchRow(raw){
  const m = cleanLines(raw);
  const st = effectiveStatus(m);
  const when = st==="LIVE" ? "LIVE" : st==="FT" ? "FT" : (localTime(m.start)||"NEXT");
  const sc = (centerScore(m)||"vs").split("-");
  const sa = sc[0] || "";
  const sb = sc[1] != null ? sc[1] : "";
  const linePreview = (m.lines||[]).slice(0,4).map(l => l.score ? `${l.disc} ${l.score}` : l.disc).join(" · ") || (m.games||"").split(" · ").slice(0,3).join(" · ");
  return `<div class="match">
    <div class="line">
      <a class="statuscol st ${st}" href="/match/${m.id}">${st==="LIVE"?"<span class='dot'></span>":""}${when}</a>
      <div class="pair">
        <a class="a" href="${entityPath(m.a)}">${m.a}</a>
        <a class="b" href="${entityPath(m.b)}">${m.b}</a>
      </div>
      <a class="scorecol" href="/match/${m.id}">${st==="NEXT" && !m.score ? "<span class='kick'>vs</span>" : `<div>${sa}</div><div>${sb}</div>`}</a>
    </div>
    <a class="games" href="/match/${m.id}"><b>${m.div||m.round||m.comp||""}</b>${linePreview?" · "+linePreview:""}</a>
  </div>`;
}

function chrome(inner, title){
  const on = (p) => path()===p || (p==="/" && path()==="/") ? "on" : (path().startsWith(p) && p!=="/" ? "on" : "");
  return `
  <header class="top">
    <a class="brand" href="/">
      <div class="mark">W</div>
      <div><h1>WPM LIVE</h1><small>WORLD PICKLEBALL MAGAZINE</small></div>
    </a>
    <form class="find" action="/search" onsubmit="location.href='/search?q='+encodeURIComponent(this.q.value);return false;">
      <input name="q" placeholder="Search player or team" value="${(state.q||"").replace(/"/g,"")}">
    </form>
    <a class="issue" href="/magazine">LATEST ISSUE</a>
  </header>
  ${inner}
  <nav class="tabbar">
    <a class="${path()==="/"||path().startsWith("/match")||path().startsWith("/player")||path().startsWith("/team")||path()==="/draw"?"on":""}" href="/">Live</a>
    <a class="${path()==="/rankings"?"on":""}" href="/rankings">Table</a>
    <a class="${path()==="/calendar"?"on":""}" href="/calendar">Cal</a>
    <a class="${path()==="/following"?"on":""}" href="/following">Follow</a>
    <a class="${path()==="/magazine"?"on":""}" href="/magazine">Mag</a>
    <a class="${path()==="/shop"?"on":""}" href="/shop">Shop</a>
  </nav>`;
}

function viewHome(){
  if (!state.date) state.date = ymd(new Date());
  const days = datesAvailable().map(dt => {
    const L = dayMeta(dt);
    return `<button class="day ${dt===state.date?"on":""}" data-day="${dt}"><span>${L.wd}</span><b>${L.num}</b>${L.tag?`<em>${L.tag}</em>`:""}</button>`;
  }).join("");
  const L = dayMeta(state.date);
  const headline = L.tag==="Today"?"TODAY":L.tag==="Yest"?"YESTERDAY":L.tag==="Tom"?"TOMORROW":L.wd.toUpperCase();
  let live = state.matches.filter(m => effectiveStatus(m)==="LIVE");
  if (anyFollows()) {
    const mine = live.filter(followsMatch);
    if (mine.length) live = mine;
  }
  const list = filteredList().filter(m => {
    const st = effectiveStatus(m);
    if (state.boardMode === "live") return st === "LIVE";
    if (state.boardMode === "results") return st === "FT";
    return true;
  });
  const comps = {};
  list.forEach(m => {
    const c = competition(m);
    (comps[c.id] = comps[c.id] || {meta:c, items:[]}).items.push(m);
  });
  const ordered = Object.values(comps).sort((a,b) => {
    const la = a.items.some(x => effectiveStatus(x)==="LIVE") ? 0 : 1;
    const lb = b.items.some(x => effectiveStatus(x)==="LIVE") ? 0 : 1;
    if (la !== lb) return la-lb;
    return a.meta.rank - b.meta.rank;
  });
  const blocks = ordered.map(c => {
    const liveN = c.items.filter(x => effectiveStatus(x)==="LIVE").length;
    const live = c.items.filter(x => effectiveStatus(x)==="LIVE");
    const next = c.items.filter(x => effectiveStatus(x)==="NEXT");
    const ft = c.items.filter(x => effectiveStatus(x)==="FT");
    const key = c.meta.id;
    const showAll = state.more[key];
    const ftShow = showAll ? ft : ft.slice(0,4);
    return `<section class="comp-card">
      <div class="comp-head">
        <div><h3>${c.meta.title}</h3><span>${c.meta.place} · ${c.items.length} ties</span></div>
        ${liveN?`<div class="livecount"><span class="dot"></span>${liveN} LIVE</div>`:""}
      </div>
      ${live.map(matchRow).join("")}
      ${next.map(matchRow).join("")}
      ${ftShow.map(matchRow).join("")}
      ${ft.length>4?`<button class="chip" data-more="${key}" style="margin:10px">${showAll?"Hide results":"+"+(ft.length-4)+" results"}</button>`:""}
    </section>`;
  }).join("");

  return `
  <div class="hero">
    <div class="desk" id="deskClock">${deskClock()}</div>
    <div class="days">${days}</div>
    <h2>${headline} IN PICKLEBALL</h2>
    <p>${state.heroByDate[state.date]||""}</p>
  </div>
  <div class="wrap fot">
    <aside class="rail-left">${leagueRail()}</aside>
    <div class="rail-main">
        ${live.length?`<div class="panel"><div class="kicker"><span class="dot"></span> Live now</div>
      <div class="strip">${live.map(m=>`<a class="live-card" href="/match/${m.id}"><span class="st LIVE"><span class="dot"></span>LIVE</span><strong>${centerScore(m)}</strong>${m.a} vs ${m.b}<div class="games">${m.div}</div></a>`).join("")}</div></div>`:""}
    <div class="panel">
      <div class="kicker">Follow</div>
      <div class="chips">${followChips()}</div>
      <div class="toolbar" style="margin-top:12px">
        <div class="seg">
          <button data-mode="live" class="${state.boardMode==="live"?"on":""}">Live</button>
          <button data-mode="matches" class="${state.boardMode==="matches"?"on":""}">Matches</button>
          <button data-mode="results" class="${state.boardMode==="results"?"on":""}">Results</button>
          <button data-mode="draw" class="${state.boardMode==="draw"?"on":""}">Draw</button>
        </div>
        <div class="seg">
          <button data-f="all" class="${state.filter==="all"?"on":""}">All</button>
          <button data-f="ppa" class="${state.filter==="ppa"?"on":""}">PPA</button>
          <button data-f="app-pro" class="${state.filter==="app-pro"?"on":""}">APP Pro</button>
          <button data-f="app" class="${state.filter==="app"?"on":""}">APP</button>
          <button data-f="npl" class="${state.filter==="npl"?"on":""}">NPL</button>
          <button data-f="wc" class="${state.filter==="wc"?"on":""}">World Cup</button>
          <button data-f="following" class="${state.filter==="following"?"on":""}">Following</button>
        </div>
      </div>
      ${state.boardMode==="results"?`<div class="chips cat-chips">${RESULT_CATS.map(([id,l])=>`<button class="chip ${state.resultCat===id?"on":""}" data-cat="${id}">${l}</button>`).join("")}</div>`:""}
    </div>
    <div class="panel">${state.boardMode==="draw" ? drawBoard() : (blocks || slateEmpty(state.filter))}</div>
    ${weekStrip()}
    </div>
    <aside class="rail-right">${tableRail()}</aside>
  </div>`;
}

function leagueRail(){
  const items=[
    ["all","All competitions"],
    ["ppa","PPA Tour (US)"],
    ["ppa-eu","PPA Europe"],
    ["app-pro","APP Pro"],
    ["app","APP"],
    ["app-asia","APP Asia"],
    ["asia","PPA Asia"],
    ["mlp-asia","MLP Asia"],
    ["npl","NPL Australia"],
    ["gpa","GPA events"]
  ];
  return `${followingRail()}<div class="panel rail-card"><div class="kicker">Competitions</div>${items.map(([id,l])=>`<button class="league ${state.filter===id?"on":""}" data-f="${id}">${l}</button>`).join("")}</div>`;
}
function tableRail(){
  const gpa=((state.rankings||{}).gpa||{}).mens_singles||[];
  const wpr=((state.rankings||{}).elo||{}).singles||[];
  const g=gpa.slice(0,6).map(r=>`<a class="rank-row" href="${playerPath(r.name)}"><b>${r.rank}</b><div><strong>${r.name}</strong><span>${r.country||""}</span></div><em>${r.points||""}</em></a>`).join("");
  const e=wpr.slice(0,6).map(r=>`<a class="rank-row" href="${playerPath(r.name)}"><b>${r.rank}</b><div><strong>${r.name}</strong><span>Open mixed</span></div><em>${r.elo||""}</em></a>`).join("");
  return `<div class="panel rail-card"><div class="kicker">GPA table</div>${g||"<p class='empty'>Loading table…</p>"}<a class="chip" href="/rankings">Full table</a><a class="chip" href="/history">Archive</a></div><div class="panel rail-card"><div class="kicker">WPR</div>${e||"<p class='empty'>WPR loading…</p>"}</div>`;
}
function weekStrip(){
  const cal=(state.calendar&&state.calendar.events)||[];
  const fromRank=(state.rankings&&state.rankings.events)||[];
  const today=ymd(new Date());
  let soon;
  if(cal.length){
    soon=cal.filter(e=> (e.end||e.start||'') >= today).slice(0,6);
  } else {
    soon=fromRank.filter(e=> (e.tournament_date||'') >= today).slice(0,5).map(e=>({
      name:e.name, start:(e.tournament_date||'').slice(0,10), venue:e.location||e.venue||'', tier:e.tier||'', host:e.host||'', status:'results-only', onLive:false, armed:false
    }));
  }
  if(!soon.length) return '';
  const armedLive = soon.filter(e=>e.onLive || e.status==='live-path');
  const chrome = armedLive.length
    ? `<div class="cal-chrome"><span class="desk">ON WPM LIVE</span>${armedLive.map(e=>`<span class="cal-pill live-path">${esc(e.name)}</span>`).join('')}</div>`
    : '';
  return `${chrome}<div class="panel"><div class="kicker">GPA calendar</div>${soon.map(calEventRow).join('')}<a class="chip" href="/calendar">Full calendar</a><a class="chip" href="/rankings">Table</a><a class="chip" href="/history">Archive</a></div>`;
}
function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}
function statusChip(st, onLive){
  if(onLive || st==='live-path') return '<span class="cal-status live-path">live-path</span>';
  if(st==='delayed') return '<span class="cal-status delayed">scores delayed</span>';
  return '<span class="cal-status results-only">results-only</span>';
}
function calEventRow(e){
  const start=(e.start||e.tournament_date||'').toString().slice(0,10);
  const end=(e.end||e.end_date||start).toString().slice(0,10);
  const dates=end&&end!==start?`${start} → ${end}`:start;
  const venue=e.venue||e.location||'';
  const id=e.id||('gpa:'+encodeURIComponent(String(e.name||'').toLowerCase())+':'+start);
  const draw=e.drawUrl?`<a class="chip" href="${esc(e.drawUrl)}" target="_blank" rel="noopener">Draw PDF</a>`:"";
  const official=e.officialUrl?`<a class="chip" href="${esc(e.officialUrl)}" target="_blank" rel="noopener">Official</a>`:"";
  const hint=e.note?`<span class="games">${esc(e.note)}</span>`:"";
  return `<div class="rank-row cal-row">
    <b></b>
    <div>
      <strong>${esc(e.name||'')}</strong>
      <span>${dates} · ${esc(venue)} · ${esc(e.tier||'')}</span>
      <span class="cal-meta">${statusChip(e.status,e.onLive)}${e.armed?' <em class="cal-armed">armed</em>':''}${e.onLive?' <em class="cal-onlive">on WPM LIVE</em>':''}${e.seeded?' <em class="cal-armed">slate</em>':''}</span>
      ${hint}
      ${draw||official?`<span class="cal-meta">${draw}${official}</span>`:""}
    </div>
    <em>${esc(e.host||e.tour||'')}</em>
    <a class="chip cal-add" href="/calendar?add=${encodeURIComponent(id)}">Add</a>
  </div>`;
}
function slateFilterMeta(filter){
  return {
    tpb: { title:"TOP Pickleball", copy:"TOP Pickleball Tour (powered by APP, not APP Den). Scores delayed — no live path. Official draw PDF only.", match:e => e.tour==="tpb" || /gij[oó]n/i.test(e.name||"") },
    "ppa-eu": { title:"PPA Europe", copy:"PPA Tour Europe. Upcoming / results-only until ticker + brackets go live. Arizona remains the /api/ppa board.", match:e => e.tour==="ppa-eu" || /barcelona/i.test(e.name||"") },
    "app-asia": { title:"APP Asia", copy:"APP Asia Tour — not MLP Asia. No Den Live id yet. Results-only.", match:e => e.tour==="app-asia" || (/\bAPP\b/i.test(e.name||"") && /Asia|Chongqing|Taipei|Bangkok|Ho Chi Minh|India Open/i.test(e.name||"")) },
    "mlp-asia": { title:"MLP Asia", copy:"MLP Asia is the PPA/MLP franchise, not APP. APP Asia Tour stays on the APP Asia chip. No live board.", match:e => e.tour==="mlp-asia" || /\bMLP\b/i.test(e.name||e.host||"") },
    asia: { title:"PPA Asia", copy:"PPA Asia — results-only until a working ticker is wired. Not APP Asia, not MLP Asia.", match:e => e.tour==="asia" || /PPA Asia|PPA-ASIA/i.test(e.host||"") },
    gpa: { title:"GPA events", copy:"GPA calendar. Live only when intake passes (name · venue · tz · score path).", match:e => e.tour==="gpa" || /D-JOY|DJOY/i.test(e.host||e.name||"") }
  }[filter] || null;
}
function slateEmpty(filter){
  const meta = slateFilterMeta(filter);
  if (!meta) return `<p class="empty">No matches for this day and filter.</p>`;
  const today=ymd(new Date());
  const cal=(state.calendar&&state.calendar.events)||[];
  const rows=cal.filter(e => meta.match(e) && (e.end||e.start||"")>=today).slice(0,8);
  return `<section class="comp-card">
    <div class="comp-head"><div><h3>${meta.title}</h3><span>upcoming / scores delayed</span></div></div>
    <p class="games">${meta.copy}</p>
    ${rows.length?rows.map(calEventRow).join(""):`<p class="empty">${meta.copy}</p>`}
    <a class="chip" href="/calendar">Calendar</a>
  </section>`;
}
function followChips(){
  return ["Vietnam","USA","India","Waters","Johns","Bright"].map(k => {
    const label = PLAYERS[k]?.name.split(" ").slice(-1)[0] === k ? PLAYERS[k].name.replace("Anna Leigh ","A. ").replace("Anna ","A. ").replace("Ben ","B. ") : k;
    const short = {Waters:"A. Waters",Johns:"B. Johns",Bright:"A. Bright"}[k] || k;
    return `<button class="chip ${state.selected[k]?"on":""}" data-follow="${k}">${short}</button>`;
  }).join("");
}

function drawHref(tour, div){
  const p = new URLSearchParams();
  if (tour === "wc" || tour === "ppa" || tour === "app") p.set("tour", tour);
  if (div) p.set("div", div);
  const q = p.toString();
  return "/draw" + (q ? "?" + q : "");
}
function applyDrawQuery(){
  const qt = qs("tour");
  const qd = qs("div");
  if (qt === "wc" || qt === "ppa" || qt === "app") {
    state.drawTour = qt;
    state.filter = qt === "app" ? "app-pro" : qt;
  }
  if (qd) state.drawDiv = qd;
}
function syncDrawUrl(){
  if (state.boardMode !== "draw" && path() !== "/draw") return;
  const tour = state.drawTour === "wc" ? "wc" : state.drawTour === "app" ? "app" : "ppa";
  const href = drawHref(tour, state.drawDiv || "");
  if ((location.pathname + location.search) !== href) history.replaceState({}, "", href);
}
function drawNext(m){
  if (m.tour !== "ppa" && m.tour !== "wc" && m.tour !== "app") return "";
  const div = String(m.div||"").split(" · ")[0].trim();
  const wall = drawHref(m.tour, div);
  const nameBits = (m.a+" "+m.b).split(/[\/ ]+/).filter(w => w.length>2);
  const all = [];
  [state.brackets, state.wcBrackets, state.appBrackets].forEach(br => Object.values(br||{}).forEach(rounds => Object.values(rounds).forEach(arr => all.push(...arr))));
  const later = all.filter(x => x.id !== m.id && x.status !== "FT" && hasDrawSides(x) && nameBits.some(n => (x.a+" "+x.b).includes(n)));
  if (!later.length) return `<p class="games"><a href="${wall}">See the draw${div?" · "+String(div).replace(/&/g,"&amp;").replace(/</g,"&lt;"):""}</a></p>`;
  return `<div class="panel"><div class="kicker">Up next in the draw</div>${later.slice(0,3).map(x=>`<a class="match" href="/match/${x.id}"><div class="line"><div class="a">${x.a}</div><div class="score">${x.score||"vs"}</div><div class="b">${x.b}</div></div></a>`).join("")}<a class="chip" href="${wall}">Full draw${div?" · "+String(div).replace(/&/g,"&amp;").replace(/</g,"&lt;"):""}</a></div>`;
}
function viewMatch(id){
  const raw = byId(id);
  const m = raw ? cleanLines(raw) : raw;
  if (!m) return `<div class="wrap"><p class="empty">Match not found.</p><a class="btn" href="/">Back to live</a></div>`;
  const st = effectiveStatus(m);
  const w = WATCH[m.watch];
  const games = (m.games||"").split("·").map(s=>s.trim()).filter(Boolean);
  const wantTag = m.tour==="wc" ? "World Cup" : m.tour==="ppa" ? "PPA Tour" : m.tour==="app" ? "APP" : "";
  const liveRelated = wantTag ? (state.magazine.stories||[]).filter(s => (s.tag||"") === wantTag || (s.title||"").toLowerCase().includes(wantTag.toLowerCase())).slice(0,3) : [];
  const related = liveRelated.length ? liveRelated : STORIES.filter(s => (m.tour==="wc" && s.tag==="World Cup") || (m.tour==="ppa" && s.tag==="PPA Tour"));
  const people = (m.tags||[]).map(t => {
    if (PLAYERS[t]) return `<a class="chip ${state.selected[t]?"on":""}" href="/player/${t}">${PLAYERS[t].name}</a>`;
    if (TEAMS[t]) return `<a class="chip ${state.selected[t]?"on":""}" href="/team/${t}">${TEAMS[t].name}</a>`;
    return "";
  }).join("");
  return `
  <div class="wrap">
    <p class="kicker"><a href="/">Live</a> · ${m.comp}</p>
    <div class="match-hero">
      <div class="comp"><span class="st ${st}">${st==="LIVE"?"<span class='dot'></span>":""}${st}</span> · ${m.div}</div>
      <div class="names"><h2>${m.a}</h2><div></div><h2>${m.b}</h2></div>
      <div class="big">${centerScore(m)}</div>
      <div class="gamepills">${(m.lines&&m.lines.length?m.lines.map(l=>`${l.disc} ${l.score||""} ${l.live?"LIVE":l.winner||""}`.trim()):games).map(g=>`<span>${g}</span>`).join("")}</div>
      ${m.lines&&m.lines.length?`<table class="scorecard"><thead><tr><th>Discipline</th><th>${m.a}</th><th>${m.b}</th><th></th></tr></thead><tbody>${m.lines.map(l=>{
        const pts=String(l.score||"").split("–");
        return `<tr class="${l.live?"live":""}"><td>${l.disc}${l.live?" · LIVE":""}</td><td>${pts[0]||""}</td><td>${pts[1]||""}</td><td>${l.winner||l.court||""}</td></tr>`;
      }).join("")}</tbody></table>`:""}
      <p class="updated">${m.start?localTime(m.start)+" local":""}${m.court?" · "+m.court:""}${state.updated?" · Updated "+new Date(state.updated).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}):""}</p>
      <p class="games">${m.note||""}</p>
      <div class="watchbar">
        ${w?`<a class="btn gold" href="${w.href}">${w.label}</a>`:""}
        ${(m.tags||[]).map(t=>`<button class="btn ghost" data-follow="${t}">${state.selected[t]?"Following":"Follow"} ${t}</button>`).join("")}
      </div>
    </div>
    ${drawNext(m)}
    <div class="panel">
      <div class="kicker">On this match</div>
      <div class="chips">${people || "<span class='empty'>No player pages tagged.</span>"}</div>
    </div>
    ${related.length?`<div class="panel"><div class="kicker">From the magazine</div>${related.map(magTease).join("")}</div>`:""}
    <div class="panel"><div class="kicker">Kit on this match</div>${PRODUCTS.filter(p => !(m.tags||[]).length || (p.tags||[]).some(t => (m.tags||[]).includes(t)) || p.cat==="balls" || p.cat==="grips").slice(0,3).map(productCard).join("")}</div>
  </div>`;
}

function matchesForPerson(kind, id, rec){
  const followKey = rec.followKey || id;
  const fullName = rec.name || id;
  return (state.matches||[]).filter(m => {
    const tags = m.tags || [];
    if (tags.includes(followKey) || tags.includes(id)) return true;
    if (kind === "team") {
      const names = [fullName, followKey, id].filter(Boolean);
      const a = String(m.a||""), b = String(m.b||"");
      if (names.some(t => a === t || b === t || normName(a) === normName(t) || normName(b) === normName(t))) return true;
      if ((followKey === "USA" || id === "USA") && (/united states|^usa$/i.test(a) || /united states|^usa$/i.test(b))) return true;
      return false;
    }
    const parts = [m.a, m.b, m.games, m.note, ...(tags), ...((m.lines||[]).flatMap(l => [l.disc, l.winner, l.a, l.b]))];
    return parts.some(p => {
      const s = String(p||"");
      if (!s) return false;
      if (s === followKey || s === id) return true;
      return personInText(fullName, s) || rankingNameMatches(fullName, s);
    });
  }).sort((a,b) => (parseUtc(b.start)?.getTime()||0) - (parseUtc(a.start)?.getTime()||0));
}
function storiesForPerson(rec, followKey){
  const needles = [rec.name, followKey, ...(nameTokens(rec.name||""))]
    .filter(Boolean)
    .map(s => String(s).toLowerCase())
    .filter((s,i,arr) => s.length > 2 && arr.indexOf(s) === i);
  const live = (state.magazine.stories||[]).map(s => ({
    tag: s.tag||"", title:s.title, stand:s.stand||"", href:s.href, image:s.image||""
  }));
  // Prefer live feed (with featured images) over hardcoded STORIES stubs
  const all = live.length ? live.concat(STORIES) : STORIES.slice();
  const seen = new Set();
  return all.filter(s => {
    const key = (s.href||s.title||"").toLowerCase();
    if (seen.has(key)) return false;
    const blob = `${s.tag||""} ${s.title||""} ${s.stand||""}`.toLowerCase();
    if (!needles.some(n => blob.includes(n))) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}
function rankingCardsHtml(cards){
  if (!cards || !cards.length) {
    return `<p class="empty">No labelled ranking row yet on GPA, WPR or PPA World.</p>`;
  }
  return `<div class="rank-cards">${cards.map(c => `
    <div class="rank-card">
      <div class="src">${c.source}</div>
      <b>#${c.rank}</b>
      <div class="cat">${c.cat||""}</div>
      <div class="detail">${c.detail||""}</div>
    </div>`).join("")}</div>
    <p class="games" style="margin-top:10px">Sources stay labelled — GPA, WPR and PPA World are different boards, not one world #1.</p>`;
}
function lookupPerson(kind, id){
  id = decodeURIComponent(id||"");
  if (kind !== "player") {
    const teamKey = resolveTeamKey(id);
    const mlp=(((state.history||{}).mlp||{}).standings||[]).find(t => (t.team||"").toLowerCase()===id.toLowerCase() || (teamKey && normName(t.team)===normName((TEAMS[teamKey]||{}).name||id)));
    if (mlp) return {name:mlp.team, role:`MLP 2026 · #${mlp.rank} · ${mlp.pts} pts`, blurb:"2026 Major League Pickleball regular season.", followKey: teamKey || mlp.team, rankings:[]};
    if (teamKey && TEAMS[teamKey]) return { ...TEAMS[teamKey], followKey: teamKey, rankings: [] };
    return {name:id, role:"Team", blurb:"Team page from archive ties.", followKey:id, rankings:[]};
  }
  const followKey = resolvePlayerKey(id);
  const base = followKey ? PLAYERS[followKey] : null;
  let fullName = (base && base.name) || id;
  // Prefer canonical full name from a ranking hit when URL is a short/abbrev form without PLAYERS seed
  if (!base) {
    const probe = collectPlayerRankings(fullName);
    if (probe.length && probe[0].name) fullName = probe[0].name;
  }
  // Re-resolve after expanding abbrev via rankings (e.g. /player/Anna%20Leigh%20Waters)
  const follow = resolvePlayerKey(fullName) || followKey || id;
  const seed = PLAYERS[follow] || base;
  const name = (seed && seed.name) || fullName;
  const rankings = collectPlayerRankings(name);
  const bits = rankings.slice(0, 3).map(c => `${c.source} #${c.rank}`);
  return {
    name,
    role: (seed && seed.role) || (bits.join(" · ") || "Player"),
    blurb: (seed && seed.blurb) || (rankings.length ? "Profile built from the live rankings boards and this week’s ties." : "No ranking row yet. Ties that include this name still show below."),
    followKey: follow,
    rankings
  };
}

function wavePlayerForProfile(rec){
  const wp = (state.rankings || {}).wavePlayers || {};
  const seedKey = rec.followKey && WAVE_SEED_IDS[rec.followKey] ? rec.followKey : null;
  if (seedKey && wp[WAVE_SEED_IDS[seedKey]]) return wp[WAVE_SEED_IDS[seedKey]];
  // Match by elo id from ranking cards / boards
  const elo = ((state.rankings || {}).elo || {});
  const boards = [].concat(elo.singles || [], elo.mensDoubles || []);
  const hit = boards.find(r => rankingNameMatches(rec.name, r.name) && r.id && wp[r.id]);
  if (hit) return wp[hit.id];
  // Direct name match inside wavePlayers
  const byName = Object.values(wp).find(p => rankingNameMatches(rec.name, p.name));
  return byName || null;
}
function formatWaveSide(people){
  if (!people || !people.length) return "—";
  return people.map(p => {
    const label = (p.name || "").trim() || "Player";
    return `<a href="${playerPath(label)}" style="color:inherit;text-decoration:underline;text-underline-offset:2px">${label}</a>`;
  }).join(" / ");
}
function waveRecentPanel(rec){
  const wave = wavePlayerForProfile(rec);
  if (!wave) {
    const degraded = ((state.rankings || {}).waveMeta || {}).degraded;
    const note = degraded && degraded.length
      ? "Pro tour pool unavailable this minute (PickleWave scrape degraded)."
      : "Pro tour pool loading…";
    return `<div class="panel" style="margin-top:18px">
      <div class="kicker">Recent (Pro tour pool)</div>
      <p class="empty">${note}</p>
      <p class="games">Source: PickleWave public boards · labelled WPR / tour pool — not GPA or PPA World.</p>
    </div>`;
  }
  const rows = (wave.recent || []).slice(0, 8);
  const list = rows.length ? rows.map(r => {
    const opp = formatWaveSide(r.opponent);
    const partner = (r.partner && r.partner.length) ? ` <span class="games">with ${formatWaveSide(r.partner)}</span>` : "";
    const score = r.score ? `<em>${r.score}</em>` : (r.result ? `<em>${r.result}</em>` : `<em></em>`);
    const meta = [r.round, r.category, r.date].filter(Boolean).join(" · ");
    return `<div class="rank-row">
      <b>${r.result || "·"}</b>
      <div>
        <strong>vs ${opp}</strong>${partner}
        <span>${r.event || "Pro tour"}${meta ? " · " + meta : ""}</span>
      </div>
      ${score}
    </div>`;
  }).join("") : `<p class="empty">No public recent tour matches parsed yet${wave.notes && wave.notes.length ? " · " + wave.notes[0] : ""}.</p>`;
  const watch = (wave.watch || []).slice(0, 4);
  const watchHtml = watch.length ? `<div class="chips" style="margin-top:12px">${watch.map(w =>
    `<a class="chip" href="${w.url}" target="_blank" rel="noopener">${(w.title||"Watch").slice(0,42)}</a>`
  ).join("")}</div>` : "";
  return `<div class="panel" style="margin-top:18px">
    <div class="kicker">Recent (Pro tour pool)</div>
    <p class="games" style="margin-bottom:10px">PickleWave public tour cards · restyled in WPM · ${wave.elo!=null ? "WPR "+wave.elo : "WPR"} · not an iframe</p>
    ${list}
    ${watchHtml}
  </div>`;
}

function viewPerson(kind, id){
  id = decodeURIComponent(id||"");
  const rec = lookupPerson(kind, id);
  if (!rec) return `<div class="wrap"><p class="empty">Not found.</p></div>`;
  const followKey = rec.followKey || id;
  const list = matchesForPerson(kind, id, rec);
  const todayStr = ymd(new Date());
  const today = list.filter(m => m.date === todayStr).sort((a,b)=>(parseUtc(a.start)?.getTime()||0)-(parseUtc(b.start)?.getTime()||0));
  const recent = list.filter(m => m.date !== todayStr || effectiveStatus(m) === "FT").slice(0, 12);
  const stories = storiesForPerson(rec, followKey);
  const following = !!state.selected[followKey];
  return `<div class="wrap">
    <div class="person-head">
      <p class="kicker">${kind==="player"?"Player":"Team"} · WPM LIVE</p>
      <h2 style="font-family:Syne,sans-serif;font-size:32px;letter-spacing:-.03em">${rec.name}</h2>
      <p class="games">${rec.role}</p>
      <p style="margin:10px 0 16px;max-width:560px">${rec.blurb}</p>
      <button class="btn ${following?"gold":""}" data-follow="${followKey}">${following?"Following":"Follow"}</button>
    </div>
    ${kind==="player"?`<div class="panel" style="margin-top:18px">
      <div class="kicker">Rankings</div>
      ${rankingCardsHtml(rec.rankings||[])}
    </div>`:""}
    ${kind==="player"?waveRecentPanel(rec):""}
    <div class="panel" style="margin-top:18px">
      <div class="kicker">Today</div>
      ${today.length?today.map(matchRow).join(""):"<p class='empty'>Nothing on the board for today.</p>"}
    </div>
    <div class="panel">
      <div class="kicker">Recent results</div>
      ${recent.length?recent.map(matchRow).join(""):(list.length?list.map(matchRow).join(""):"<p class='empty'>No tagged matches yet.</p>")}
    </div>
    ${stories.length?`<div class="panel"><div class="kicker">From the magazine</div>${stories.map(magTease).join("")}</div>`:""}
    ${playerMedals(rec.name)}
  </div>`;
}
function playerMedals(name){
  const n = (name||"").toLowerCase();
  const rows = ((state.history||{}).gpaMedals||[]).filter(m => (m.player||"").toLowerCase().includes(n));
  const extra = [];
  [ ...(((state.history||{}).pbe)||[]), ...(((state.history||{}).ppaAsia)||[]), ...(((state.history||{}).app)||[]) ].forEach(ev => {
    (ev.medals||[]).forEach(m => {
      if ((m.player||"").toLowerCase().includes(n)) extra.push({ event: ev.event, category: m.category, place: m.place, player: m.player });
    });
  });
  const all = rows.concat(extra);
  if (!all.length) return "";
  return `<div class="panel"><div class="kicker">Archive</div>${all.slice(0,20).map(m=>`<div class="rank-row"><b>${m.place==="winner"?"W":"2"}</b><div><strong>${m.event}</strong><span>${m.category}</span></div></div>`).join("")}</div>`;
}

function alertsCta(){
  if (!("Notification" in window)) {
    return `<div class="panel"><p class="games">This browser does not support live alerts.</p></div>`;
  }
  const p = Notification.permission;
  if (p === "granted") {
    return `<div class="panel"><p class="games">Live alerts on · Web Push when a follow walks on (works with this tab closed after subscribe).</p></div>`;
  }
  if (p === "denied") {
    return `<div class="panel"><p class="games">Live alerts blocked. Allow notifications for this site in browser settings, then reload.</p></div>`;
  }
  return `<div class="panel"><p class="games">Get a ping when someone you follow walks on.</p><button class="btn gold" type="button" id="enableAlerts">Turn on live alerts</button></div>`;
}

function viewFollowing(){
  const list = state.matches.filter(followsMatch).sort((a,b)=>{
    const ra={LIVE:0,NEXT:1,FT:2}[effectiveStatus(a)];
    const rb={LIVE:0,NEXT:1,FT:2}[effectiveStatus(b)];
    if(ra!==rb) return ra-rb;
    return (parseUtc(a.start)?.getTime()||0)-(parseUtc(b.start)?.getTime()||0);
  });
  const shop = PRODUCTS.filter(p => (p.tags||[]).some(t => state.selected[t]));
  return `<div class="wrap">
    <h2 style="font-family:Syne,sans-serif;font-size:32px">Following</h2>
    <p class="games">Your players, countries and the matches they are in.</p>
    ${alertsCta()}
    <div class="chips" style="margin:14px 0">${followChips()}</div>
    <div class="panel">${list.length?list.map(matchRow).join(""):"<p class='empty'>Follow someone on Live. This tab then becomes your board.</p>"}</div>
    ${shop.length?`<div class="panel"><div class="kicker">On court with your follows</div>${shop.map(productCard).join("")}</div>`:""}
    <div class="panel">
      <div class="kicker">Watch</div>
      <p class="games">Official courts only.</p>
      <div class="watchbar" style="justify-content:flex-start">
        <a class="btn" href="https://www.youtube.com/@PickleballWorldCup/streams">World Cup live board</a>
        <a class="btn ghost" href="https://www.youtube.com/@ppastreamedcourts">PPA Streamed Courts</a>
        <a class="btn ghost" href="https://www.ppatour.com/watch/">PBTV</a>
      </div>
    </div>
  </div>`;
}


function escAttr(s){
  return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;");
}
function storyDateLabel(s){
  const d = (s.date||"").slice(0,10);
  if (!d) return "";
  try {
    const dt = new Date(d+"T12:00:00Z");
    return dt.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
  } catch(e){ return d; }
}
function magazineStories(){
  if (state.magazine.stories && state.magazine.stories.length) {
    return state.magazine.stories.map(s => ({
      date: s.date||"",
      title: s.title||"",
      stand: s.stand||"",
      href: s.href||"#",
      image: s.image||"",
      tag: s.tag||""
    }));
  }
  return STORIES.map(s => ({
    date:"", title:s.title, stand:s.stand, href:s.href, image:s.image||"", tag:s.tag||"", cover:!!s.cover
  }));
}
function storyCard(s, opts){
  opts = opts || {};
  const featured = !!opts.featured || !!s.cover;
  const img = s.image||"";
  const kicker = s.tag || (featured ? "Featured" : "");
  const date = storyDateLabel(s);
  const meta = [kicker, date].filter(Boolean).join(" · ");
  const phClass = "ph" + (img ? "" : " missing");
  const phStyle = img ? ` style="background-image:url('${escAttr(img)}')"` : "";
  return `<a class="story${featured?" cover":""}" href="${escAttr(s.href||"#")}" ${s.href && s.href.indexOf("worldpickleballmagazine.com")>=0?'target="_blank" rel="noopener"':""}>
    <div class="${phClass}"${phStyle}></div>
    <div class="body">
      ${meta?`<div class="kicker-line">${escAttr(meta)}</div>`:""}
      <h3>${escAttr(s.title||"")}</h3>
      ${s.stand?`<p class="standfirst">${escAttr(s.stand)}</p>`:""}
    </div>
  </a>`;
}
function magTease(s){
  const img = s.image||"";
  const thumbClass = "thumb" + (img ? "" : " missing");
  const thumbStyle = img ? ` style="background-image:url('${escAttr(img)}')"` : "";
  const kicker = s.tag || storyDateLabel(s) || "Magazine";
  return `<a class="mag-tease" href="${escAttr(s.href||"#")}" ${s.href && s.href.indexOf("worldpickleballmagazine.com")>=0?'target="_blank" rel="noopener"':""}>
    <div class="${thumbClass}"${thumbStyle}>${img?"":"WPM"}</div>
    <div>
      <div class="kicker-line">${escAttr(kicker)}</div>
      <h3>${escAttr(s.title||"")}</h3>
      ${s.stand?`<p>${escAttr((s.stand||"").slice(0,110))}</p>`:""}
    </div>
  </a>`;
}

function viewMagazine(){
  const stories = magazineStories();
  const issues = [
    ["#19 Aug 2026","https://worldpickleballmagazine.com/magazines/"],
    ["#18 Jul 2026","https://worldpickleballmagazine.com/world-pickleball-magazine-july-2026-global-pickleball-news/"],
    ["#17 Jun 2026","https://worldpickleballmagazine.com/world-pickleball-magazine-june-2026-global-pickleball-news/"],
    ["#16 May 2026","https://worldpickleballmagazine.com/world-pickleball-magazine-may-2026-global-pickleball-news/"],
    ["#15 Apr 2026","https://worldpickleballmagazine.com/2026-april/"],
    ["#14 Mar 2026","https://worldpickleballmagazine.com/march-2026/"],
    ["#1 Feb 2025","https://worldpickleballmagazine.com/magazine/wpm-issue-1-february-2025/"]
  ];
  const featured = stories[0];
  const rest = stories.slice(1);
  const live = !!(state.magazine.stories&&state.magazine.stories.length);
  return `<div class="wrap">
    <div class="mag-hero">
      <div class="desk">WORLD PICKLEBALL MAGAZINE</div>
      <h2>Magazine desk</h2>
      <p>Featured covers and standfirsts from the site archive — same navy/gold desk as Live. ${live?"Live feed from worldpickleballmagazine.com.":"Showing stub stories until the magazine feed loads."}</p>
    </div>
    <div class="kicker">Issues</div>
    <div class="chips">${issues.map(([l,h])=>`<a class="chip" href="${h}" target="_blank" rel="noopener">${l}</a>`).join("")}<a class="chip" href="https://worldpickleballmagazine.com/magazines/" target="_blank" rel="noopener">All 19 issues</a></div>
    <div class="grid" style="margin-top:16px">
      ${featured?storyCard(featured,{featured:true}):""}
      ${rest.map(s=>storyCard(s)).join("")}
    </div>
    ${state.magazine.page < state.magazine.pages ? `<button class="btn" id="magMore" style="margin-top:16px">Load older stories</button>`:""}
    <p class="games" style="margin-top:10px">${state.magazine.total||""} stories on worldpickleballmagazine.com since January 2025.</p>
  </div>`;
}

function productCard(p){
  const mine = (p.tags||[]).some(t => state.selected[t]);
  return `<div class="product">
    <div class="ph" style="background:linear-gradient(135deg,#1a1540,#0b1020);color:#f4c430;display:flex;align-items:flex-end;padding:12px;font-family:Syne,sans-serif;font-size:13px">${p.cat.toUpperCase()}</div>
    <div>
      <h3>${p.name}</h3>
      <p class="games">${p.who}${mine?" · On court with someone you follow":""}</p>
      <p class="games">${p.why||""}</p>
      <a class="btn gold" href="${amazonUrl(p.q)}" style="margin-top:8px">Buy on Amazon</a>
      <a class="btn ghost" href="${p.store}">Brand store</a>
    </div>
    <div class="price">${p.price}</div>
  </div>`;
}



function hasDrawSides(m){
  const bad = /^(tbd|tba|winner|loser|bye|\-|\u2014|\u2013)?$/i;
  const a = String(m.a||"").trim();
  const b = String(m.b||"").trim();
  if (!a || !b) return false;
  if (bad.test(a) || bad.test(b)) return false;
  return true;
}
/** Map official PPA round strings and APP knockout polish → R64/R32/R16/QF/SF/F/Bronze. WC keeps Round N; never bare "Round". */
function normalizeRoundLabel(tour, raw){
  const s = String(raw||"").trim();
  if (!s || /^round$/i.test(s) || s === "undefined" || s === "null") return null;
  if (tour === "ppa" || tour === "app") {
    const t = s.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    if (/^r?128$/.test(t) || /^round\s*(of\s*)?128$/.test(t)) return "R128";
    if (/^r?64$/.test(t) || /^round\s*(of\s*)?64$/.test(t)) return "R64";
    if (/^r?32$/.test(t) || /^round\s*(of\s*)?32$/.test(t)) return "R32";
    if (/^r?16$/.test(t) || /^round\s*(of\s*)?16$/.test(t)) return "R16";
    if (/quarter/.test(t) || t === "qf") return "QF";
    if (/semi/.test(t) || t === "sf") return "SF";
    if (/bronze|third\s*place|3rd/.test(t)) return "Bronze";
    if (/^finals?$/.test(t) || t === "f") return "F";
    return s;
  }
  const num = s.match(/^round\s*(\d+)$/i);
  if (num) return "Round " + Number(num[1]);
  if (/quarter|semi|final|bronze|third/i.test(s)) return normalizeRoundLabel("ppa", s) || s;
  return s;
}
function roundSortKey(tour, label){
  if (tour === "ppa" || tour === "app") {
    const order = ["R128","R64","R32","R16","QF","SF","Bronze","F"];
    const i = order.indexOf(label === "Final" ? "F" : label);
    return i < 0 ? 80 + String(label).charCodeAt(0) : i;
  }
  const m = String(label).match(/^Round\s+(\d+)$/i);
  if (m) return Number(m[1]);
  return 500;
}
function sortDivKeys(tour, keys){
  const pref = tour === "wc"
    ? ["Kids","Juniors","Open team","Seniors","Masters"]
    : tour === "app"
      ? ["Men's Pro Singles","Women's Pro Singles","Mixed Pro Doubles","Men's Pro Doubles","Women's Pro Doubles"]
      : ["Men's Singles","Women's Singles","Men's Doubles","Women's Doubles","Mixed Doubles"];
  return keys.slice().sort((a,b) => {
    const ia = pref.indexOf(a), ib = pref.indexOf(b);
    const aa = ia < 0 ? 50 : ia, bb = ib < 0 ? 50 : ib;
    if (aa !== bb) return aa - bb;
    return a.localeCompare(b);
  });
}
function divChipLabel(d){
  if (d === "Open team") return "Open";
  return d.replace(/ Pro Qualifier$/, " Qual");
}
function pushBracketMatch(out, div, round, m){
  if (!div || !round) return;
  if (!hasDrawSides(m) && effectiveStatus(m) === "NEXT") return; // ghost NEXT without sides
  (out[div] ||= {});
  (out[div][round] ||= []).push({
    id: m.id,
    a: m.a,
    b: m.b,
    score: m.score,
    status: effectiveStatus(m),
    games: m.games,
    date: m.date
  });
}
function normalizeBracketTree(tour, stored){
  const out = {};
  Object.keys(stored||{}).forEach(div => {
    Object.keys(stored[div]||{}).forEach(rawRound => {
      const round = normalizeRoundLabel(tour, rawRound);
      if (!round) return; // drop empty / bare "Round" dumps
      (stored[div][rawRound]||[]).forEach(m => pushBracketMatch(out, div, round, m));
    });
  });
  return out;
}
function bracketsFromMatches(tour){
  const stored = tour==="wc" ? state.wcBrackets : tour==="app" ? state.appBrackets : state.brackets;
  const normalized = normalizeBracketTree(tour, stored);
  const looksJunk = !Object.keys(normalized).length || Object.values(normalized).every(rounds => {
    const keys = Object.keys(rounds||{});
    return !keys.length || (keys.length === 1 && keys[0] === "Round");
  });
  if (Object.keys(normalized).length && !looksJunk) return normalized;
  const out = {};
  (state.matches||[]).filter(m => m.tour===tour).forEach(m => {
    const parts = (m.div||"").split(" · ").map(s=>s.trim()).filter(Boolean);
    const div = parts[0] || (tour==="wc"?"World Cup":"PPA");
    const raw = m.round || parts.find(p => /round|final|quarter|semi|bronze/i.test(p)) || parts[1] || "";
    const round = normalizeRoundLabel(tour, raw);
    if (!round) return;
    pushBracketMatch(out, div, round, m);
  });
  return out;
}
function drawBoard(){
  if (state.filter === "wc") state.drawTour = "wc";
  if (state.filter === "ppa") state.drawTour = "ppa";
  if (state.filter === "app" || state.filter === "app-pro") state.drawTour = "app";
  const tour = state.drawTour === "wc" ? "wc" : state.drawTour === "app" ? "app" : "ppa";
  const brackets = bracketsFromMatches(tour);
  const divs = sortDivKeys(tour, Object.keys(brackets));
  const prefer = tour === "app"
    ? divs.find(d => /\bpro\b/i.test(d) && !/backdraw/i.test(d))
    : "";
  const div = state.drawDiv && brackets[state.drawDiv] ? state.drawDiv : (prefer || divs[0] || "");
  const rounds = div ? Object.keys(brackets[div]||{}).sort((a,b) => roundSortKey(tour,a) - roundSortKey(tour,b)) : [];
  const nonempty = rounds.filter(r => (brackets[div][r]||[]).some(hasDrawSides));
  let show = nonempty.slice();
  if (tour === "ppa" || tour === "app") {
    const wall = ["R16","QF","SF","F","Bronze"].filter(r => nonempty.includes(r));
    const early = ["R128","R64","R32"].filter(r => nonempty.includes(r));
    const earlyHot = early.some(r => (brackets[div][r]||[]).some(m => {
      const st = effectiveStatus(m);
      return st === "LIVE" || st === "NEXT";
    }));
    if (wall.length) show = earlyHot ? early.concat(wall) : wall;
    else show = early.length ? early : nonempty;
  } else {
    // WC: Round N numerically; never bare Round dumps
    show = nonempty.filter(r => r !== "Round");
  }
  const cols = show.map(r => {
    const items = (brackets[div][r] || []).filter(hasDrawSides).slice(0, 32);
    if (!items.length) return "";
    const knockout = (tour === "ppa" || tour === "app") && /^(QF|SF|F|Bronze)$/.test(r);
    const stLabel = m => {
      const st = effectiveStatus(m);
      return st === "LIVE" ? "LIVE" : st === "FT" ? "FT" : "Next";
    };
    return `<div class="bracket-col ${knockout?"knockout":""}"><h3>${r}</h3>${items.map(m => `
      <a class="bracket-match ${effectiveStatus(m)==="LIVE"?"live":""}" href="/match/${m.id}">
        <div><b>${m.a}</b><span>${effectiveStatus(m)==="NEXT"?"":(m.score||"").split("-")[0]||""}</span></div>
        <div><b>${m.b}</b><span>${effectiveStatus(m)==="NEXT"?"":(m.score||"").split("-")[1]||""}</span></div>
        <em>${stLabel(m)}</em>
      </a>`).join("")}</div>`;
  }).join("");
  let note = "World Cup wall · Sporttora Round N, sorted. Empty Round buckets hidden.";
  if (tour === "ppa") note = "Knockout wall · labels normalised to R64 / R32 / R16 / QF / SF / F / Bronze.";
  if (tour === "app") note = "APP knockout wall · Den Round N mapped from matchType + totalRounds (Final / SF / QF). Pool play stays Round N. Empty later rounds hidden — never invent a bracket.";
  const empty = tour === "app" && !divs.length
    ? "<p class='empty'>APP draw is not on the feed for this event. Den has no bracket sides to hang a wall on — never invent one.</p>"
    : "<p class='empty'>No draw slots with both sides yet.</p>";
  return `
    <div class="seg" style="margin:0 0 12px">
      <button data-drawtour="ppa" class="${tour==="ppa"?"on":""}">PPA</button>
      <button data-drawtour="app" class="${tour==="app"?"on":""}">APP</button>
      <button data-drawtour="wc" class="${tour==="wc"?"on":""}">World Cup</button>
    </div>
    <div class="seg draw-divs" style="margin:0 0 12px">${divs.map(d=>`<button data-draw="${d}" class="${d===div?"on":""}">${divChipLabel(d)}</button>`).join("")||"<span class='empty'>No divisions yet</span>"}</div>
    <p class="draw-wall-note">${note}${div ? " · <strong>"+divChipLabel(div)+"</strong>" : ""}</p>
    <div class="bracket">${cols || empty}</div>`;
}
function viewDraw(){
  return `<div class="hero"><h2>DRAW</h2><p>Who plays whom next.</p></div><div class="wrap"><div class="panel">${drawBoard()}</div></div>`;
}
function viewHistoryPlaceholder(){return ''}

function medalBlock(list, host){
  return (list||[]).map(ev => {
    const rows = (ev.medals||[]).map(m => `<a class="rank-row" href="${playerPath((m.player||"").split(" / ")[0])}"><b>W</b><div><strong>${m.player}</strong><span>${m.category}</span></div><em>${host}</em></a>`).join("");
    return `<div class="kicker">${ev.event} · ${ev.date}</div>${rows}`;
  }).join("");
}
function viewSearch(){
  const q=(qs("q")||state.q||"").trim();
  state.q=q;
  if(!q) return `<div class="wrap"><p class="empty">Type a player or team.</p></div>`;
  const n=q.toLowerCase();
  const people=new Set();
  ((state.history||{}).gpaMedals||[]).forEach(m=>{ if((m.player||"").toLowerCase().includes(n)) people.add(m.player); });
  [ ...(((state.history||{}).pbe)||[]), ...(((state.history||{}).app)||[]), ...(((state.history||{}).ppaAsia)||[]) ].forEach(ev=> (ev.medals||[]).forEach(m=> { (m.player||"").split("/").forEach(p=>{ if(p.trim().toLowerCase().includes(n)) people.add(p.trim()); }); }));
  (state.matches||[]).forEach(m=>{ if((m.a||"").toLowerCase().includes(n)) people.add(m.a); if((m.b||"").toLowerCase().includes(n)) people.add(m.b); });
  const teams=((state.history||{}).mlp||{}).standings||[];
  const hits=[...people].slice(0,30).map(p=>`<a class="rank-row" href="${playerPath(p)}"><b></b><div><strong>${p}</strong><span>Player</span></div></a>`);
  const th=teams.filter(t=>(t.team||"").toLowerCase().includes(n)).map(t=>`<a class="rank-row" href="/team/${encodeURIComponent(t.team)}"><b>${t.rank}</b><div><strong>${t.team}</strong><span>MLP 2026 · ${t.pts} pts</span></div></a>`);
  return `<div class="hero"><h2>SEARCH</h2><p>${q}</p></div><div class="wrap"><div class="panel">${hits.join("")||th.join("")||"<p class='empty'>No profile yet.</p>"}${th.join("")}</div></div>`;
}
function viewCalendar(){
  const data = state.calendar;
  if (!data) return `<div class="wrap"><p class="empty">Loading calendar…</p></div>`;
  const today = ymd(new Date());
  const addId = qs("add") || state.calAddId || "";
  const all = data.events || [];
  const upcoming = all.filter(e => (e.end || e.start || "") >= today);
  const past = all.filter(e => (e.end || e.start || "") < today).slice(-8).reverse();
  const pick = all.find(e => e.id === addId) || null;
  const armed = (data.armed || []).slice().sort((a,b)=>String(a.start).localeCompare(String(b.start)));

  let form = "";
  if (pick || addId === "new") {
    const e = pick || { name:"", venue:"", timezone:"", start:"", end:"", host:"", tier:"", tour:"app", connector:{type:"none"}, note:"" };
    const c = e.connector || {};
    form = `<div class="panel cal-form">
      <div class="kicker">Desk · add / arm event</div>
      <p class="games">Intake gate (see coverage-intake): <b>name · venue · timezone · working score path</b>. Without a score path the event stays <b>results-only</b> or <b>scores delayed</b> — never fake 0–0. Full pass → <b>on WPM LIVE</b> (live-path).</p>
      <form id="calArmForm" class="stack">
        <input type="hidden" name="id" value="${esc(e.id||'')}">
        <label class="games">Display name<br><input class="field" name="name" required value="${esc(e.name||'')}"></label>
        <label class="games">Venue<br><input class="field" name="venue" value="${esc(e.venue||e.location||'')}" placeholder="City / venue"></label>
        <label class="games">Timezone (IANA)<br><input class="field" name="timezone" value="${esc(e.timezone||'')}" placeholder="America/Chicago"></label>
        <div class="cal-dates">
          <label class="games">Start<br><input class="field" name="start" required value="${esc((e.start||'').toString().slice(0,10))}"></label>
          <label class="games">End<br><input class="field" name="end" value="${esc((e.end||e.start||'').toString().slice(0,10))}"></label>
        </div>
        <div class="cal-dates">
          <label class="games">Host / tour chip<br><input class="field" name="host" value="${esc(e.host||'')}" placeholder="APP"></label>
          <label class="games">Tour<br>
            <select class="field" name="tour">
              ${["app","app-asia","ppa","ppa-eu","tpb","wc","gpa","npl","mlp-asia","other"].map(t=>`<option value="${t}" ${(e.tour||"app")===t?"selected":""}>${t}</option>`).join("")}
            </select>
          </label>
          <label class="games">Tier<br><input class="field" name="tier" value="${esc(e.tier||'')}"></label>
        </div>
        <label class="games">Score connector<br>
          <select class="field" name="connType" id="calConnType">
            <option value="none" ${(!c.type||c.type==="none")?"selected":""}>none → results-only</option>
            <option value="app" ${c.type==="app"?"selected":""}>APP / Den tournamentId → /api/app</option>
            <option value="ppa" ${c.type==="ppa"?"selected":""}>PPA event id → /api/ppa</option>
            <option value="url" ${c.type==="url"?"selected":""}>URL / path (e.g. /api/worldcup)</option>
            <option value="djoy" ${c.type==="djoy"?"selected":""}>D-Joy (URL when published)</option>
          </select>
        </label>
        <label class="games">Den tournamentId (APP)<br><input class="field" name="denTournamentId" value="${esc(c.denTournamentId||'')}" placeholder="18453"></label>
        <label class="games">PPA event id<br><input class="field" name="ppaEventId" value="${esc(c.ppaEventId||'')}" placeholder="uuid"></label>
        <label class="games">Score URL / path<br><input class="field" name="scoreUrl" value="${esc(c.scoreUrl||c.scorePath||'')}" placeholder="/api/…"></label>
        <label class="games"><input type="checkbox" name="delayed" ${e.status==="delayed"?"checked":""}> Mark scores delayed (even if path set)</label>
        <label class="games">Note<br><input class="field" name="note" value="${esc(e.note||'')}"></label>
        <label class="games">Desk key<br><input class="field" name="key" id="calDeskKey" type="password" value="${esc(state.deskKey)}"></label>
        <div class="cal-actions">
          <button class="btn" type="submit">Arm / save</button>
          ${e.armed?`<button class="chip" type="button" id="calDisarm" data-id="${esc(e.id||'')}">Disarm</button>`:""}
          <a class="chip" href="/calendar">Cancel</a>
        </div>
        <p class="games" id="calArmMsg"></p>
      </form>
    </div>`;
  }

  const list = (rows, title) => `<div class="panel"><div class="kicker">${title}</div>${rows.length?rows.map(calEventRow).join(""):"<p class='empty'>None</p>"}</div>`;

  const armedBlock = armed.length
    ? `<div class="panel"><div class="kicker">Armed on desk</div>${armed.map(a=>`<div class="rank-row"><b></b><div><strong>${esc(a.name)}</strong><span>${a.start} → ${a.end} · ${esc(a.venue)} · ${esc(a.timezone||"—")}</span><span class="cal-meta">${statusChip(a.status,a.onLive)}${a.onLive?' <em class="cal-onlive">on WPM LIVE</em>':''}</span></div><em>${esc(a.tour)}</em><a class="chip" href="/calendar?add=${encodeURIComponent(a.id)}">Edit</a></div>`).join("")}</div>`
    : `<div class="panel"><div class="kicker">Armed on desk</div><p class="empty">None yet. Pick an event and complete intake to arm.</p></div>`;

  return `<div class="hero">
    <div class="desk">DESK CALENDAR</div>
    <h2>GPA SLATE</h2>
    <p>FotMob-style upcoming events from GPA. Mark <b>on WPM LIVE</b> only when intake passes. No score path → results-only or scores delayed — never invent lines.</p>
  </div>
  <div class="wrap">
    ${form}
    ${armedBlock}
    ${list(upcoming, "Upcoming")}
    ${list(past, "Recent (results-only)")}
    <p class="games"><a href="/desk">Score desk</a> · <a href="/rankings">Table</a> · <a href="/history">Archive</a> · intake rule in docs</p>
  </div>`;
}
function viewHistory(){
  const h = state.history;
  if (!h) return `<div class="wrap"><p class="empty">Loading archive…</p></div>`;
  const armed = (h.armed||[]).map(e => `<div class="rank-row"><b></b><div><strong>${e.name}</strong><span>${e.start} → ${e.end} · ${e.host} · ${e.status}</span></div><em>${e.connector}</em></div>`).join("");
  const npl = (h.npl||[]).slice(0,30).map(m => `<div class="rank-row"><b>${m.score}</b><div><strong>${m.a} vs ${m.b}</strong><span>${m.date} · ${m.games||""}</span></div><em>NPL</em></div>`).join("");
  const medals = (h.gpaMedals||[]).filter(x=>x.place==="winner").slice(0,40).map(m => `<a class="rank-row" href="${playerPath(m.player)}"><b>W</b><div><strong>${m.player}</strong><span>${m.event} · ${m.category}</span></div><em>${m.points||""}</em></a>`).join("");
  return `<div class="hero"><h2>ARCHIVE</h2><p>Federation results. <a href="/calendar" style="color:#f5c518">Desk calendar</a> for upcoming GPA slate + arm status.</p></div>
  <div class="wrap">
    <div class="panel"><div class="kicker">Armed</div>${armed||"<p class='empty'>None</p>"}</div>
    <div class="panel"><div class="kicker">GPA golds</div>${medals||"<p class='empty'>No medals yet</p>"}</div>
    <div class="panel"><div class="kicker">PPA Asia</div>${medalBlock(h.ppaAsia,"ASIA")}</div>
    <div class="panel"><div class="kicker">English OPEN + Nationals</div>${medalBlock(h.pbe,"PBE")}</div>
    <div class="panel"><div class="kicker">APP</div>${medalBlock(h.app,"APP")}</div>
    <div class="panel"><div class="kicker">NPL Australia</div>${npl||"<p class='empty'>No NPL rows</p>"}</div>
  </div>`;
}
function viewRankings(){
  const data = state.rankings;
  if (!data) return `<div class="wrap"><p class="empty">Loading rankings…</p></div>`;
  const board = state.rankBoard || "ppa";
  const gpaCats = [
    ["mens_singles","Men's S"],
    ["womens_singles","Women's S"],
    ["mens_doubles","Men's D"],
    ["womens_doubles","Women's D"],
    ["mens_mixed_doubles","Mixed (M)"],
    ["womens_mixed_doubles","Mixed (W)"]
  ];
  const ppaCats = [["men","Men"],["women","Women"]];
  const cat = state.rankCat || "mens_singles";
  let rows = [];
  let note = "";
  let catSeg = "";
  if (board === "ppa") {
    const sex = cat === "women" || (cat||"").indexOf("women")>=0 ? "women" : "men";
    rows = ((data.ppaWorld||{})[sex]||[]).map(r => ({...r, country:"PPA"}));
    note = "PPA World · official UPA / PPA category rankings (men / women composite 50/35/15, last 52 weeks). Not WPR and not GPA.";
    catSeg = `<div class="seg" style="margin-top:10px;flex-wrap:wrap">${ppaCats.map(([id,l])=>`<button data-rankcat="${id}" class="${sex===id?"on":""}">${l}</button>`).join("")}</div>`;
  } else if (board === "gpa") {
    rows = (data.gpa && data.gpa[cat]) || [];
    note = "GPA world rankings · rolling 12 months · best 10 · gpapickleball.org — labelled separately from PPA World and WPR.";
    catSeg = `<div class="seg" style="margin-top:10px;flex-wrap:wrap">${gpaCats.map(([id,l])=>`<button data-rankcat="${id}" class="${cat===id?"on":""}">${l}</button>`).join("")}</div>`;
  } else if (board === "elo") {
    rows = ((data.elo||{}).singles||[]).map(r => ({...r, country:"Open mixed"}));
    note = "WPR · open mixed rating (all players, not MS/WS/MD/WD). PickleWave public board. PPA World is the official PPA category ranking.";
    catSeg = `<div class="seg" style="margin-top:10px"><button class="on" type="button">Open mixed</button></div>`;
  } else {
    rows = [];
    note = "";
  }
  const list = rows.slice(0, 80).map(r => `
    <a class="rank-row" href="${playerPath(r.name)}">
      <b>${r.rank}</b>
      <div><strong>${r.name}</strong><span>${r.country||""}${r.dupr?" · DUPR "+r.dupr:""}</span></div>
      <em>${r.points!=null?r.points+" pts":(r.elo?r.elo+" WPR":"")}</em>
    </a>`).join("");
  const calEv = ((state.calendar||{}).events||[]).filter(e=>e.upcoming!==false).slice(0,8);
  const events = (calEv.length ? calEv : (data.events||[]).slice(0,8).map(e=>({
    name:e.name, start:(e.tournament_date||"").slice(0,10), venue:e.location||e.venue||"", tier:e.tier||"", host:e.host||"", status:"results-only"
  }))).map(calEventRow).join("");
  return `<div class="hero"><h2>TABLE</h2><p>PPA World, GPA and WPR — labelled separately. WPR is open mixed, not a category table. <a href="/calendar" style="color:#f5c518">Calendar</a> · <a href="/history" style="color:#f5c518">Archive</a>.</p></div>
  <div class="wrap">
    <div class="panel">
      <div class="seg">
        <button data-rankboard="ppa" class="${board==="ppa"?"on":""}">PPA World</button>
        <button data-rankboard="gpa" class="${board==="gpa"?"on":""}">GPA</button>
        <button data-rankboard="elo" class="${board==="elo"?"on":""}">WPR</button>
      </div>
      ${catSeg}
      <p class="games" style="margin-top:10px">${note}</p>
      ${list || "<p class='empty'>Board empty for this cut.</p>"}
    </div>
    <div class="panel"><div class="kicker">GPA calendar</div>${events||"<p class='empty'>No events.</p>"}<a class="chip" href="/calendar">Open calendar / add-event</a></div>
  </div>`;
}
function viewShop(){
  return `<div class="hero"><h2>SHOP</h2><p>Kit, when it is ready to earn without looking cheap.</p></div>
  <div class="wrap"><div class="panel" style="padding:28px">
    <div class="kicker">Coming soon</div>
    <h2 style="font-family:Syne,sans-serif;font-size:28px;margin:8px 0 12px">Affiliate shop is closed for now</h2>
    <p class="games">Amazon and tour-brand deals will land here once tags, inventory and disclosure are signed. Nothing is for sale in the app until then.</p>
  </div></div>`;
}

function viewDesk(){
  const rows = state.matches.map(m => `
    <form class="desk-row" data-desk="${m.id}">
      <div>${m.date}<br>${m.div}</div>
      <input name="a" value="${m.a}">
      <input name="score" value="${m.score||""}" placeholder="vs / 2-1">
      <select name="status">
        <option ${m.status==="NEXT"?"selected":""}>NEXT</option>
        <option ${m.status==="LIVE"?"selected":""}>LIVE</option>
        <option ${m.status==="FT"?"selected":""}>FT</option>
      </select>
      <input name="b" value="${m.b}">
      <input name="games" value="${m.games||""}" placeholder="11-7, 6-4">
      <button class="btn" type="submit">Save</button>
    </form>`).join("");
  return `<div class="wrap">
    <h2 style="font-family:Syne,sans-serif;font-size:32px">Desk</h2>
    <p class="games">Password-gated score writer. This is what makes a match page live. <a href="/calendar">Desk calendar / add-event</a> arms GPA slate events (intake gate).</p>
    <p class="games">Last feed write: ${state.updated || "seed file only"}</p>
    <label class="games">Desk key<br><input class="field" id="deskKey" type="password" value="${state.deskKey}"></label>
    <div class="panel" style="overflow:auto">${rows}</div>
  </div>`;
}

function toggleFollow(k){
  state.selected[k] = !state.selected[k];
  localStorage.setItem("wpm-follows", JSON.stringify(state.selected));
  if (state.selected[k]) {
    ensureSafeSW();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") syncPushSubscription();
        render();
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      syncPushSubscription();
    }
  } else if ("Notification" in window && Notification.permission === "granted") {
    syncPushSubscription();
  }
  render();
}

function maybeNotify(m){
  if (effectiveStatus(m) !== "LIVE" || !followsMatch(m) || state.notified[m.id]) return;
  state.notified[m.id] = 1;
  persistNotified();
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const opts = {
    body: notifyBody(m),
    tag: String(m.id),
    renotify: false,
    data: { url: "/match/" + m.id }
  };
  (async () => {
    try {
      const reg = await ensureSafeSW();
      if (reg && reg.showNotification) {
        await reg.showNotification("WPM LIVE", opts);
        return;
      }
    } catch(e) {}
    try { new Notification("WPM LIVE", opts); } catch(e) {}
  })();
}

function render(){
  if (!state.date) state.date = ymd(new Date());
  const p = path();
  let inner = "";
  let m;
  if (p === "/") inner = viewHome();
  else if (p === "/following") inner = viewFollowing();
  else if (p === "/magazine") inner = viewMagazine();
  else if (p === "/search") inner = viewSearch();
  else if (p === "/calendar") inner = viewCalendar();
  else if (p === "/history") inner = viewHistory();
  else if (p === "/rankings") inner = viewRankings();
  else if (p === "/shop") inner = viewShop();
  else if (p === "/draw") { state.boardMode = "draw"; applyDrawQuery(); inner = viewHome(); }
  else if (p === "/desk") inner = viewDesk();
  else if ((m = p.match(/^\/match\/([^/]+)$/))) inner = viewMatch(m[1]);
  else if ((m = p.match(/^\/player\/([^/]+)$/))) inner = viewPerson("player", m[1]);
  else if ((m = p.match(/^\/team\/([^/]+)$/))) inner = viewPerson("team", m[1]);
  else inner = `<div class="wrap"><p class="empty">Not found.</p><a class="btn" href="/">Live</a></div>`;

  document.getElementById("app").innerHTML = chrome(inner);
  bind();
  pruneNotified();
  state.matches.forEach(maybeNotify);
}

function bind(){
  document.querySelectorAll("a[href^='/']").forEach(a => {
    a.addEventListener("click", ev => {
      const href = a.getAttribute("href");
      if (href.startsWith("http")) return;
      go(href, ev);
    });
  });
  document.querySelectorAll("[data-day]").forEach(b => b.addEventListener("click", () => {
    state.date = b.getAttribute("data-day");
    render();
  }));
  document.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => {
    state.filter = b.getAttribute("data-f");
    if (state.filter === "wc") state.drawTour = "wc";
    if (state.filter === "ppa") state.drawTour = "ppa";
    if (state.filter === "app" || state.filter === "app-pro") state.drawTour = "app";
    render();
  }));
  document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
    state.boardMode = b.getAttribute("data-mode");
    if (state.boardMode === "draw" && state.filter === "wc") state.drawTour = "wc";
    if (state.boardMode === "draw" && state.filter === "ppa") state.drawTour = "ppa";
    if (state.boardMode === "draw" && (state.filter === "app" || state.filter === "app-pro")) state.drawTour = "app";
    if (state.boardMode === "draw") syncDrawUrl();
    if (state.boardMode === "results") persistResultCat();
    render();
  }));
  document.querySelectorAll("[data-more]").forEach(b => b.addEventListener("click", () => {
    const k = b.getAttribute("data-more");
    state.more[k] = !state.more[k];
    render();
  }));
  document.querySelectorAll("[data-draw]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawDiv = b.getAttribute("data-draw") || "";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
  }));
  document.querySelectorAll("[data-drawtour]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawTour = b.getAttribute("data-drawtour") || "ppa";
    state.drawDiv = "";
    state.boardMode = "draw";
    state.filter = state.drawTour === "wc" ? "wc" : (state.drawTour === "ppa" ? "ppa" : (state.drawTour === "app" ? "app-pro" : state.filter));
    syncDrawUrl();
    render();
  }));
  document.querySelectorAll("[data-rankboard]").forEach(b => b.addEventListener("click", () => { state.rankBoard = b.getAttribute("data-rankboard"); render(); }));
  document.querySelectorAll("[data-rankcat]").forEach(b => b.addEventListener("click", () => { state.rankCat = b.getAttribute("data-rankcat"); render(); }));
  document.querySelectorAll("[data-cat]").forEach(b => b.addEventListener("click", () => {
    state.resultCat = b.getAttribute("data-cat") || "all";
    persistResultCat();
    render();
  }));
  document.querySelectorAll("[data-shop]").forEach(b => b.addEventListener("click", () => {
    state.shopCat = b.getAttribute("data-shop");
    render();
  }));
  const magMore = document.getElementById("magMore");
  if (magMore) magMore.addEventListener("click", async () => {
    await pullMagazine((state.magazine.page||1)+1);
    render();
  });
  document.querySelectorAll("[data-follow]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    toggleFollow(b.getAttribute("data-follow"));
  }));
  const enableAlerts = document.getElementById("enableAlerts");
  if (enableAlerts) enableAlerts.addEventListener("click", async () => {
    await ensureSafeSW();
    if ("Notification" in window) await Notification.requestPermission();
    await syncPushSubscription();
    render();
  });
  const key = document.getElementById("deskKey");
  if (key) key.addEventListener("change", () => {
    state.deskKey = key.value;
    localStorage.setItem("wpm-desk-key", key.value);
  });
  document.querySelectorAll("form[data-desk]").forEach(f => {
    f.addEventListener("submit", async ev => {
      ev.preventDefault();
      const id = f.getAttribute("data-desk");
      const fd = new FormData(f);
      const body = {
        key: document.getElementById("deskKey").value,
        id,
        a: fd.get("a"),
        b: fd.get("b"),
        score: fd.get("score"),
        status: fd.get("status"),
        games: fd.get("games")
      };
      const res = await fetch("/api/scores", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body)});
      const json = await res.json().catch(()=>({}));
      if (!res.ok) { alert(json.error || "Save failed"); return; }
      await pull();
      render();
    });
  });

  const calArm = document.getElementById("calArmForm");
  if (calArm) calArm.addEventListener("submit", async ev => {
    ev.preventDefault();
    const fd = new FormData(calArm);
    const key = fd.get("key") || state.deskKey;
    state.deskKey = String(key||"");
    localStorage.setItem("wpm-desk-key", state.deskKey);
    const connType = String(fd.get("connType")||"none");
    const body = {
      key,
      action: "arm",
      id: fd.get("id") || undefined,
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
        ppaEventId: fd.get("ppaEventId") || "",
        scoreUrl: fd.get("scoreUrl") || ""
      }
    };
    const msg = document.getElementById("calArmMsg");
    try {
      const res = await fetch("/api/calendar", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body)});
      const json = await res.json().catch(()=>({}));
      if (!res.ok) {
        if (msg) msg.textContent = json.message || json.error || "Save failed";
        else alert(json.message || json.error || "Save failed");
        return;
      }
      if (msg) msg.textContent = json.event && json.event.onLive
        ? "Armed · on WPM LIVE ("+json.event.status+")"
        : "Saved · status "+(json.event&&json.event.status||"ok")+" (not live until intake + score path)";
      await pullCalendar();
      state.calAddId = "";
      history.replaceState({}, "", "/calendar");
      render();
    } catch(e) {
      if (msg) msg.textContent = "Network error";
    }
  });
  const calDisarm = document.getElementById("calDisarm");
  if (calDisarm) calDisarm.addEventListener("click", async () => {
    const id = calDisarm.getAttribute("data-id");
    const key = (document.getElementById("calDeskKey")||{}).value || state.deskKey;
    const res = await fetch("/api/calendar", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({key, action:"disarm", id})});
    const json = await res.json().catch(()=>({}));
    if (!res.ok) { alert(json.error || "Disarm failed"); return; }
    await pullCalendar();
    history.replaceState({}, "", "/calendar");
    render();
  });

}


async function pull(){
  let file = null;
  try {
    const res = await fetch("/scores.json?t="+Date.now(), {cache:"no-store"});
    if (res.ok) file = await res.json();
  } catch(e) {}
  if (file && file.matches) {
    state.matches = file.matches;
    state.heroByDate = file.heroByDate || {};
    state.updated = file.updated;
  }
  async function overlay(url, tour){
    try {
      const res = await fetch(url+"?t="+Date.now(), {cache:"no-store"});
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.matches) || !data.matches.length) return;
      const ids = new Set(data.matches.map(m => m.id));
      state.matches = (state.matches || []).filter(m => m.tour !== tour && !ids.has(m.id)).concat(data.matches);
      state.updated = data.updated || state.updated;
      if (tour === "ppa" && data.brackets) state.brackets = data.brackets;
      if (tour === "wc" && data.brackets) state.wcBrackets = data.brackets;
      if (tour === "app" && data.brackets) state.appBrackets = data.brackets;
    } catch(e) {}
  }
  await overlay("/api/worldcup", "wc");
  await overlay("/api/ppa", "ppa");
  await overlay("/api/app", "app");
  state.heroByDate = state.heroByDate || {};
  const liveN = (state.matches||[]).filter(m => effectiveStatus(m)==="LIVE").length;
  const todayLine = liveN
    ? liveN + " live now across the board."
    : "No live ties on the feed this minute. GPA rankings and the week calendar are below.";
  state.heroByDate[ymd(new Date())] = todayLine;
}

async function pullHistory(){
  try {
    const res=await fetch("/api/history",{cache:"no-store"});
    if(!res.ok) return;
    state.history=await res.json();
    const npl=(state.history.npl||[]).filter(m=>m.id);
    if (npl.length) {
      const ids=new Set(npl.map(m=>m.id));
      state.matches=(state.matches||[]).filter(m=>m.tour!=="npl" && !ids.has(m.id)).concat(npl);
    }
  } catch(e) {}
}
async function pullRankings(){
  try {
    const res = await fetch("/api/rankings", {cache:"no-store"});
    if (res.ok) state.rankings = await res.json();
  } catch(e) {}
}
async function pullCalendar(){
  try {
    const res = await fetch("/api/calendar", {cache:"no-store"});
    if (res.ok) state.calendar = await res.json();
  } catch(e) {}
}

async function pullMagazine(page){
  try {
    const res = await fetch("/api/magazine?page="+(page||1), {cache:"no-store"});
    if (!res.ok) return;
    const data = await res.json();
    if (page > 1) state.magazine.stories = state.magazine.stories.concat(data.stories||[]);
    else state.magazine.stories = data.stories || [];
    state.magazine.page = data.page || 1;
    state.magazine.pages = data.pages || 1;
    state.magazine.total = data.total || 0;
  } catch(e) {}
}

window.addEventListener("popstate", render);
window.addEventListener("load", async () => {
  await pull();
  pullHistory().then(()=>{ if(path()==="/history") render(); });
  pullRankings().then(() => { if (path()==="/rankings" || path().startsWith("/player/") || path()==="/") render(); });
  pullCalendar().then(() => { if (path()==="/calendar" || path()==="/" || path()==="/rankings") render(); });
  pullMagazine(1).then(() => { if (path()==="/magazine") render(); });
  render();
  setInterval(() => {
    const el = document.getElementById("deskClock");
    if (el) el.textContent = deskClock();
  }, 15000);
  setInterval(async () => {
    await pull();
    render();
  }, 12000);
});


document.addEventListener("click", function wpmClick(ev){
  const el = ev.target && ev.target.closest ? ev.target.closest("[data-draw], [data-drawtour], [data-mode], [data-f], [data-shop], [data-day], [data-more], [data-cat]") : null;
  if (!el) return;
  if (el.hasAttribute("data-draw")) {
    ev.preventDefault();
    state.drawDiv = el.getAttribute("data-draw") || "";
    state.boardMode = "draw";
    render();
    return;
  }
  if (el.hasAttribute("data-drawtour")) {
    ev.preventDefault();
    state.drawTour = el.getAttribute("data-drawtour") || "ppa";
    state.drawDiv = "";
    state.boardMode = "draw";
    if (state.drawTour === "wc") state.filter = "wc";
    if (state.drawTour === "ppa") state.filter = "ppa";
    if (state.drawTour === "app") state.filter = "app-pro";
    render();
    return;
  }
  if (el.hasAttribute("data-cat")) {
    ev.preventDefault();
    state.resultCat = el.getAttribute("data-cat") || "all";
    persistResultCat();
    render();
  }
}, true);
