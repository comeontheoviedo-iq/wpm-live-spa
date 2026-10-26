
// Heat Check is not public yet. Keep false in the build; flip to true when it launches.
const HEAT_CHECK_ENABLED = false;
const HEAT_CHECK_URL = "https://worldpickleballmagazine.com/heat-check/";
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

try { localStorage.removeItem("wpm-desk-key"); } catch (e) {}
const state = {
  date: null,
  filter: "all",
  selected: {},
  matches: [],
  heroByDate: {},
  updated: null,
  notified: {},
  boardMode: "matches",
  more: {},
  magazine: {page:1, pages:1, stories:[]},
  shopCat: "all",
  rankings: null,
  history: null,
  rankBoard: "elo",
  rankCat: "mens_singles",
  resultCat: "all",
  calendar: null,
  brackets: {},
  wcBrackets: {},
  appBrackets: {},
  drawTour: "ppa",
  drawDiv: "",
  drawPhase: "",
  drawPool: "",
  appEvent: null,
  appBracketIndex: [],
  ppaEvent: null,
  appBoard: null,
  ppaBoard: null,
  archiveId: "",
  archiveCache: {},
  archiveCatalog: [],
  dossier: {},
  dossierPending: {}
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

const SAFE_SW = "/sw.js?v=20261025a";
const SAFE_SW_MARK = "20261025a";
const GIJON_DRAW_URL = "https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf";
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
const TOUR_IDS = ["app","ppa","wc","gpa","npl","asia","ppa-eu","app-asia","mlp-asia","tpb","rta"];
const TOUR_LABELS = {app:"APP", ppa:"PPA", wc:"World Cup", gpa:"GPA", npl:"NPL", asia:"PPA Asia", "ppa-eu":"PPA Europe", "app-asia":"APP Asia", "mlp-asia":"MLP Asia", tpb:"TOP Pickleball", rta:"RTA2000"};
function isTourFollowKey(k){
  const s = String(k || "");
  return s.indexOf("tour:") === 0 && TOUR_IDS.indexOf(s.slice(5)) !== -1;
}
function isLegacyEventFollowKey(k){
  const s = String(k || "");
  return s.indexOf("ev:") === 0 || s.indexOf("gpa:") === 0;
}
/** Finished event names are not players. Mirrors follow-tags.mjs looksLikeStoredEvent. */
function looksLikeStoredEvent(raw){
  const s = String(raw || "").trim();
  if (!s || s.indexOf("tour:") === 0) return false;
  if (s.indexOf("slate:") === 0 || s.indexOf("ev:") === 0 || s.indexOf("gpa:") === 0) return true;
  if (/^(overland|arizona|gij[oó]n|gijon|columbus|louisville|las vegas|barcelona|mesa|chicago cup|virginia beach|hong kong)$/i.test(s)) return true;
  if (/\b(overland park|gij[oó]n|arizona open|las vegas open|columbus open|louisville|barcelona open|chicago cup|veolia chicago|virginia beach|hong kong|hang seng)\b/i.test(s)) return true;
  if (/^(APP|PPA|TPB|GPA|MLP)\b/.test(s) && /\b(open|tour|asia)\b/i.test(s)) return true;
  if (/\brta2000\b/i.test(s)) return true;
  if (/\brta\b/i.test(s) && /farnham/i.test(s)) return true;
  return false;
}
function tourFromEventBlob(raw){
  let decoded = String(raw || "");
  try { decoded = decodeURIComponent(decoded); } catch(e) {}
  const blob = decoded.toLowerCase();
  if (/rta2000|farnham|^ev:rta\b|slate:rta/.test(blob)) return "tour:rta";
  if (/app-asia|chongqing|taipei|bangkok|ho chi minh|india open/.test(blob)) return "tour:app-asia";
  if (/\bmlp\b|mlp-asia/.test(blob)) return "tour:mlp-asia";
  if (/gij|tpb|top pickleball/.test(blob)) return "tour:tpb";
  if (/barcelona|ppa-eu|ppa europe/.test(blob)) return "tour:ppa-eu";
  if (/hong kong|hang seng|c7e4fd72/.test(blob)) return "tour:ppa";
  if (/ppa asia|ppa-asia/.test(blob)) return "tour:asia";
  if (/\bapp\b/.test(blob) && /arizona/.test(blob) && !/\bppa\b/.test(blob)) return "tour:app";
  if (/arizona|mesa|62c01642|las vegas|86926aef|veolia chicago|chicago cup|203e1164|virginia beach|429c7980|hong kong|c7e4fd72|^ev:ppa\b|\bppa\b/.test(blob)) return "tour:ppa";
  if (/^ev:wc\b|world cup/.test(blob)) return "tour:wc";
  if (/overland|columbus|louisville|18448|18453|18454|^ev:app\b|\bapp\b/.test(blob)) return "tour:app";
  if (/\bnpl\b/.test(blob)) return "tour:npl";
  if (/\bgpa\b|d-joy|djoy/.test(blob)) return "tour:gpa";
  return "";
}
/** Player keys pass through. Event keys (ev:app:18454, Louisville, Columbus, Overland) upgrade to a tour or drop. Mirrors follow-tags.mjs. */
function normalizeFollowKey(raw){
  const k = String(raw || "").trim();
  if (!k) return "";
  if (k.indexOf("tour:") === 0) return isTourFollowKey(k) ? k : "";
  if (isLegacyEventFollowKey(k) || k.indexOf("slate:") === 0 || looksLikeStoredEvent(k)) return tourFromEventBlob(k);
  return k;
}
function migrateFollows(){
  const prev = state.selected || {};
  const next = {};
  let changed = false;
  Object.keys(prev).forEach(k => {
    if (!prev[k]) { changed = true; return; }
    const nk = normalizeFollowKey(k);
    if (!nk) { changed = true; return; }
    if (nk !== k) changed = true;
    next[nk] = true;
  });
  if (!changed && Object.keys(prev).length === Object.keys(next).length) return;
  state.selected = next;
  try { localStorage.setItem("wpm-follows", JSON.stringify(state.selected)); } catch(e) {}
}
migrateFollows();
function followTagsList(){
  return Object.keys(state.selected || {}).filter(k => {
    if (!state.selected[k]) return false;
    const n = normalizeFollowKey(k);
    if (!n || isTourFollowKey(n) || isLegacyEventFollowKey(n) || looksLikeStoredEvent(n)) return false;
    return true;
  });
}
function followedTourKeys(){
  return Object.keys(state.selected || {}).filter(k => state.selected[k] && isTourFollowKey(k));
}
/** Player, team, and tour keys synced to Web Push. */
function followPushList(){
  return Object.keys(state.selected || {}).filter(k => state.selected[k]);
}
function tourLabel(key){
  const id = String(key || "").replace(/^tour:/, "");
  return TOUR_LABELS[id] || id;
}
function tourFollowKey(tour){
  const id = String(tour || "");
  return TOUR_IDS.indexOf(id) === -1 ? "" : "tour:" + id;
}
function tourFollowButton(tour){
  const key = tourFollowKey(tour);
  if (!key) return "";
  const on = !!state.selected[key];
  const label = on ? "Following" : "Follow " + tourLabel(key);
  return `<button class="chip ${on?"on":""}" data-follow="${esc(key)}">${label}</button>`;
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
    const follows = followPushList();
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
/** Followed tour → every match on that tour. Mirrors follow-tags.mjs tourFollowMatches. */
function tourFollowHit(m, key){
  const nk = normalizeFollowKey(key);
  if (!isTourFollowKey(nk) || !m) return false;
  return String(m.tour || "") === nk.slice(5);
}
/** Follow keys that hit this match: player tags/names, or a followed tour. */
function matchedFollowsFor(m){
  const keys = Object.keys(state.selected || {}).filter(k => state.selected[k]);
  if (!keys.length || !m) return [];
  const tagSet = new Set(m.tags || []);
  const hay = `${m.a || ""} ${m.b || ""} ${m.games || ""} ${m.roster || ""}`;
  const hayTokens = new Set(followNameTokens(hay).map(t => t.toLowerCase()));
  const hayLower = hay.toLowerCase();
  const hit = [];
  const seen = new Set();
  for (const raw of keys) {
    const k = normalizeFollowKey(raw);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    if (isTourFollowKey(k)) {
      if (tourFollowHit(m, k)) hit.push(k);
      continue;
    }
    if (tagSet.has(k)) { hit.push(k); continue; }
    const kl = String(k).toLowerCase();
    if (!kl) continue;
    if (hayTokens.has(kl)) { hit.push(k); continue; }
    if (kl.includes(" ") && hayLower.includes(kl)) { hit.push(k); continue; }
  }
  return hit;
}
function playerFollowsMatch(m){
  return matchedFollowsFor(m).some(k => !isTourFollowKey(k));
}
function followedTagsFor(m){
  return matchedFollowsFor(m);
}
function followKeyLabel(k){
  const n = normalizeFollowKey(k);
  if (isTourFollowKey(n)) return tourLabel(n);
  return followPersonLabel(n);
}
function notifyBody(m){
  const who = followedTagsFor(m).map(followKeyLabel).join(", ") || "follow";
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
function ymdInTz(d, tz){
  if (!tz) return ymd(d instanceof Date ? d : new Date(d));
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d instanceof Date ? d : new Date(d));
  } catch(e) {
    return ymd(d instanceof Date ? d : new Date(d));
  }
}
function tzOffsetMinutes(tz, instant){
  const d = instant instanceof Date ? instant : new Date(instant || Date.now());
  if (!tz || Number.isNaN(d.getTime())) return 0;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    const parts = {};
    fmt.formatToParts(d).forEach(p => { parts[p.type] = p.value; });
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return Math.round((asUtc - d.getTime()) / 60000);
  } catch(e) { return 0; }
}
/**
 * Same rule as netlify/functions/ppa-keep.mjs rebasePpaLocalDates.
 * Finished scores dateKey is the UTC filing date. Late venue-evening rows
 * spill onto the next date. Pull those back onto the round's earliest day.
 * Scheduled rows stay. Scores are not touched.
 */
function rebasePpaLocalDates(matches, tz){
  const rows = matches || [];
  if (tzOffsetMinutes(tz) >= 0) return rows;
  const byRound = {};
  rows.forEach(m => {
    if (!m || (m.status !== "FT" && m.status !== "LIVE")) return;
    const round = String(m.round || "").trim();
    const day = String(m.date || "").slice(0, 10);
    if (!round || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day.indexOf("9999") === 0) return;
    (byRound[round] = byRound[round] || {})[day] = 1;
  });
  const pull = {};
  Object.keys(byRound).forEach(round => {
    const sorted = Object.keys(byRound[round]).sort();
    if (sorted.length < 2) return;
    const next = addDaysIso(sorted[0], 1);
    if (next && byRound[round][next]) pull[round] = { from: next, to: sorted[0] };
  });
  if (!Object.keys(pull).length) return rows;
  return rows.map(m => {
    if (!m || (m.status !== "FT" && m.status !== "LIVE")) return m;
    const rule = pull[String(m.round || "").trim()];
    if (!rule || m.date !== rule.from) return m;
    return Object.assign({}, m, { date: rule.to });
  });
}
function addDaysIso(iso, n){
  if (!iso) return "";
  const [y,m,d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(Date.UTC(y, m-1, d+n)).toISOString().slice(0,10);
}
/** PPA day tabs use the PPA event zone. Other boards prefer the APP event zone. */
function boardTz(){
  if (state.filter === "ppa") return (state.ppaEvent && state.ppaEvent.tz) || "America/New_York";
  const ev = state.appEvent || {};
  if (ev.tz) return ev.tz;
  const app = (state.matches||[]).find(m => m.tour === "app" && m.tz);
  if (app && app.tz) return app.tz;
  const ppa = state.ppaEvent || {};
  if (ppa.tz) return ppa.tz;
  const any = (state.matches||[]).find(m => m.tz);
  return (any && any.tz) || "";
}
function boardToday(){
  return ymdInTz(new Date(), boardTz());
}
function dateChip(iso){
  if (!iso) return "";
  if (String(iso).indexOf("9999") === 0) return "Date TBA";
  const [Y,M,D] = String(iso).split("-").map(Number);
  if (!Y || !M || !D) return "";
  const d = new Date(Y, M-1, D);
  const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  return `${wd} ${D} ${mon}`;
}
function startLocalYmd(m){
  if (!m || !m.start) return "";
  return ymdInTz(parseUtc(m.start), m.tz || boardTz());
}
function parseUtc(s){ return s ? new Date(s) : null; }
function localTime(iso, tz){
  if(!iso) return "";
  const d = parseUtc(iso);
  if (!d || Number.isNaN(d.getTime())) return "";
  const opts = { hour:"numeric", minute:"2-digit" };
  if (tz) opts.timeZone = tz;
  try { return d.toLocaleTimeString(undefined, opts); } catch(e) {
    return d.toLocaleTimeString(undefined, {hour:"numeric", minute:"2-digit"});
  }
}
function relTime(iso){
  if(!iso) return "";
  const t = parseUtc(iso).getTime() - Date.now();
  if (t > 3600000) return "in " + Math.round(t/3600000) + "h";
  if (t > 60000) return "in " + Math.round(t/60000) + "m";
  if (t > -60000) return "now";
  return "";
}
function denStatusToken(raw){
  return String(raw == null ? "" : raw).toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}
/** Den live tokens only. Pending brackets stay NEXT — never a LIVE chip. */
function isDenLiveStatus(raw){
  const s = denStatusToken(raw);
  return s === "RUNNING" || s === "IN_PROGRESS" || s === "INPROGRESS" || s === "STARTED" || s === "PLAYING";
}
function effectiveStatus(m){
  // API status is authority — never invent LIVE from the clock alone.
  // PPA ticker says upnext until live; promoting NEXT→LIVE from start age caused false LIVE.
  if (!m) return "NEXT";
  if (m.status === "FT") return "FT";
  // PPA: ticker live flag only. A line flag or a scores "live" is not a LIVE chip.
  if (m.tour === "ppa") {
    if (m.tickerLive === true) return "LIVE";
    if (m.tickerLive === false) return "NEXT";
    if (m.status === "LIVE") return "LIVE";
    return "NEXT";
  }
  // APP: LIVE chip only when Den says the match is running. Pending brackets stay NEXT.
  if (m.tour === "app") {
    const token = m.denStatus == null ? "" : String(m.denStatus);
    if (token) {
      if (m.status === "LIVE" && isDenLiveStatus(token)) return "LIVE";
      return "NEXT";
    }
    if (m.status === "LIVE") return "LIVE";
    return "NEXT";
  }
  // APP Asia / SportsSync: results only. No proven in-progress token, so never LIVE.
  if (m.tour === "app-asia") return m.status === "FT" ? "FT" : "NEXT";
  if (m.status === "LIVE") return "LIVE";
  if ((m.lines || []).some(l => l.live)) return "LIVE";
  // Soft window only for tours that supply an explicit end (desk/WC windows).
  // PPA, APP, and RTA: API status is authority — never clock-promote NEXT→LIVE.
  if (m.tour !== "ppa" && m.tour !== "app" && m.tour !== "app-asia" && m.tour !== "rta") {
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
function followsBoardMatch(m){
  return followsMatch(m);
}
function anyFollows(){
  return Object.values(state.selected).some(Boolean);
}
function blankResultLabel(m){
  const note = String((m && m.note) || "");
  if (/walkover/i.test(note)) return "W/O";
  if (/withdraw/i.test(note)) return "WD";
  if (/retire/i.test(note)) return "RET";
  if (/no game scores/i.test(note)) return "FT";
  return "";
}
function rtaLiveBlank(m){
  if (!m || m.tour !== "rta" || effectiveStatus(m) !== "LIVE") return false;
  const raw = String(m.score || "").trim();
  if (raw && !/^0\s*[-–]\s*0$/.test(raw)) return false;
  return !(m.lines || []).some(l => {
    const pts = String(l.score || "").split(/[–-]/);
    return (Number(pts[0]) || 0) > 0 || (Number(pts[1]) || 0) > 0;
  });
}
function liveHasPoints(m){
  if (!m) return false;
  const raw = String(m.score || "").trim();
  if (raw && !/^0\s*[-–]\s*0$/.test(raw)) return true;
  return (m.lines || []).some(l => {
    const pts = String(l.score || "").split(/[–-]/);
    if (pts.length < 2) return false;
    return (Number(pts[0]) || 0) > 0 || (Number(pts[1]) || 0) > 0;
  });
}
function centerScore(m){
  if (rtaLiveBlank(m)) return "";
  const st = effectiveStatus(m);
  if (st === "LIVE" && !liveHasPoints(m)) return "";
  if (m && m.score && !(st === "LIVE" && /^0\s*[-–]\s*0$/.test(String(m.score).trim()) && !liveHasPoints(m))) return m.score;
  if (st === "NEXT") return "vs";
  const mark = blankResultLabel(m);
  if (mark) return mark;
  if (st === "LIVE") return "–";
  if (st === "FT") return "FT";
  return "vs";
}

function gameLooksFinished(a,b){
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return Math.max(x,y) >= 11 && Math.abs(x-y) >= 2;
}
function isPhantomZeroScore(score){
  return score === "0-0" || score === "0–0";
}
function lineHasDigits(score){
  const pts = String(score||"").split(/[–-]/);
  if (pts.length < 2) return false;
  if (String(pts[0]).trim() === "" || String(pts[1]).trim() === "") return false;
  const x = Number(pts[0]), y = Number(pts[1]);
  return Number.isFinite(x) && Number.isFinite(y);
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
    const phantom = isPhantomZeroScore(m.score);
    // Still recompute empty games string if we stripped pads from a 2-0 FT
    if ((m.lines || []).length || phantom) {
      return Object.assign({}, m, { lines: [], score: (m.status === "NEXT" || phantom) ? "" : (m.score || ""), games: "" });
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
  const pointsPlayed = lines.some(l => {
    const pts = String(l.score || "").split(/[–-]/);
    return (Number(pts[0]) || 0) > 0 || (Number(pts[1]) || 0) > 0;
  });
  let score = "";
  if (aWins || bWins) score = `${aWins}-${bWins}`;
  else if (pointsPlayed && anyLive) score = "0-0";
  else if (m.status === "FT" && m.score && !isPhantomZeroScore(m.score)) score = m.score;
  return Object.assign({}, m, {
    lines,
    score,
    games: lines.map(l => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · ")
  });
}
function presentMatch(raw){
  const m = cleanLines(raw);
  if (!m || !isPhantomZeroScore(m.score)) return m;
  const real = (m.lines || []).some(l => l && l.live && lineHasDigits(l.score) && String(l.score).split(/[–-]/).every(p => Number(p) === 0));
  if (real) return m;
  if ((m.lines || []).some(l => lineHasDigits(l.score) && /[1-9]/.test(String(l.score||"")))) return m;
  return Object.assign({}, m, { score: "" });
}

function archiveMatchById(id){
  const caches = state.archiveCache || {};
  const keys = Object.keys(caches);
  for (let i = 0; i < keys.length; i++) {
    const rows = (caches[keys[i]] && caches[keys[i]].matches) || [];
    const hit = rows.find(m => m && m.id === id);
    if (hit) return hit;
  }
  return null;
}
function byId(id){ return state.matches.find(m => m.id === id) || archiveMatchById(id); }

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
  const today = boardToday();
  const yest = addDaysIso(today, -1);
  const tom = addDaysIso(today, 1);
  const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  const tag = iso===today?"Today":iso===yest?"Yest":iso===tom?"Tom":"";
  return {wd, num:d.getDate(), tag};
}

function datesAvailable(){
  const set = {};
  state.matches.forEach(m => { if (m.date) set[m.date]=1; });
  const today = boardToday();
  set[today]=1;
  set[addDaysIso(today, -1)]=1;
  set[addDaysIso(today, 1)]=1;
  const ev = state.appEvent || {};
  if (ev.endDate) set[ev.endDate]=1;
  if (ev.startDate) set[ev.startDate]=1;
  if (state.archiveId) {
    const pack = state.archiveCache[state.archiveId];
    ((pack && pack.matches) || []).forEach(m => { if (m && m.date) set[m.date]=1; });
  }
  return Object.keys(set).filter(Boolean).sort();
}


function competition(m){
  if (m.tour === "ppa") {
    const ev = state.ppaEvent || {};
    return {
      id:"ppa",
      tour:"ppa",
      title: "PPA · "+shortEventLabel(ev.name || m.comp, eventFollowKey(m)),
      place: ev.venue || m.venue || "Life Time North Shore Sport & Racquetball, Chicago, IL",
      rank:1,
      eventKey: eventFollowKey(m)
    };
  }
  if (m.tour === "app") {
    const ev = state.appEvent || {};
    const pro = appTier(m) === "pro";
    const name = ev.name || m.comp || "APP";
    const place = ev.venue || m.venue || "Kentucky International Convention Center, Louisville, KY";
    return pro
      ? {id:"app-pro", tour:"app", title:"APP Pro · "+shortEventLabel(name, eventFollowKey(m)), place, rank:1, eventKey: eventFollowKey(m)}
      : {id:"app", tour:"app", title:"APP · "+shortEventLabel(name, eventFollowKey(m)), place, rank:2, eventKey: eventFollowKey(m)};
  }
  if (m.tour === "app-asia") {
    return {
      id: "app-asia",
      tour: "app-asia",
      title: "APP Asia · "+shortEventLabel(m.comp || "APP Asia", eventFollowKey(m)),
      place: m.venue || "",
      rank: 3,
      eventKey: eventFollowKey(m)
    };
  }
  if (m.tour === "rta") {
    return {
      id: "rta",
      tour: "rta",
      title: "RTA2000 · "+shortEventLabel(m.comp || "Farnham", eventFollowKey(m)),
      place: m.venue || "Hurlands Pickleball + Padel Club, Farnham, England",
      rank: 2,
      eventKey: eventFollowKey(m)
    };
  }
  const d = ((m.div||"")+" "+(m.cat||"")).toLowerCase();
  if (d.includes("open")) return {id:"wc-open", tour:"wc", title:"World Cup · Open", place:"Da Nang", rank:2};
  if (d.includes("junior")) return {id:"wc-jr", tour:"wc", title:"World Cup · Juniors", place:"Da Nang", rank:3};
  if (d.includes("kid")) return {id:"wc-kids", tour:"wc", title:"World Cup · Kids", place:"Da Nang", rank:4};
  if (d.includes("senior") || d.includes("master")) return {id:"wc-sr", tour:"wc", title:"World Cup · Age groups", place:"Da Nang", rank:5};
  if (m.tour === "wc") return {id:"wc-other", tour:"wc", title:"World Cup", place:"Da Nang", rank:6};
  return {id:"other", tour:m.tour||"", title:m.comp||"Other", place:"", rank:9};
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
function dayCatOn(){
  if (state.archiveId || state.boardMode === "draw") return false;
  if (state.boardMode !== "live" && state.boardMode !== "matches" && state.boardMode !== "results") return false;
  return state.filter === "ppa" || state.filter === "all" || state.filter === "following";
}
function catChipsHtml(){
  const label = {};
  RESULT_CATS.forEach(([id,l]) => { label[id] = l; });
  const order = ["all","MS","WS","MD","WD","XD"];
  return `<div class="chips cat-chips">${order.map(id=>`<button class="chip ${state.resultCat===id?"on":""}" data-cat="${id}" title="${esc(label[id]||id)}">${id==="all"?"All":id}</button>`).join("")}</div>`;
}
function persistResultCat(){
  try { sessionStorage.setItem("wpm-result-cat", state.resultCat || "all"); } catch(e) {}
  if (state.boardMode !== "results" && !dayCatOn()) return;
  const cat = state.resultCat && state.resultCat !== "all" ? "cat="+state.resultCat : "";
  const hash = cat ? "#"+cat : "";
  const next = location.pathname + location.search + hash;
  if ((location.pathname + location.search + location.hash) !== next) history.replaceState({}, "", next);
}
function eventFollowKey(m){
  if (m && m.eventKey) return m.eventKey;
  if (!m || !m.tour) return "";
  if (m.tour === "ppa") return (state.ppaEvent && state.ppaEvent.eventKey) || "ev:ppa";
  if (m.tour === "app") return (state.appEvent && state.appEvent.eventKey) || "ev:app";
  if (m.tour === "wc") return "ev:wc";
  return "ev:" + m.tour;
}
function shortEventLabel(name, key){
  const n = String(name || "");
  const k = String(key || "");
  const blob = n + " " + k;
  if (/columbus/i.test(blob) || /18448/.test(k)) return "Columbus";
  if (/louisville|18454/i.test(blob)) return "Louisville";
  if (/overland/i.test(blob) || /18453/.test(k)) return "Overland";
  if (/arizona|mesa/i.test(n) || /62c01642/i.test(k)) return "Arizona";
  if (/hong kong|hang seng|c7e4fd72/i.test(blob)) return "Hong Kong";
  if (/virginia beach|429c7980/i.test(blob)) return "Virginia Beach";
  if (/veolia chicago|chicago cup|203e1164/i.test(blob)) return "Chicago";
  if (/las vegas|darling/i.test(n) || /86926aef/i.test(k)) return "Las Vegas";
  if (/chongqing/i.test(blob)) return "Chongqing";
  if (/kuala lumpur/i.test(blob)) return "Kuala Lumpur";
  if (/penang/i.test(blob)) return "Penang";
  if (/farnham|rta2000|^ev:rta\b/i.test(blob)) return "Farnham";
  if (/gij/i.test(blob)) return "Gijón";
  if (/barcelona/i.test(blob)) return "Barcelona";
  if (/world cup|^ev:wc$/i.test(blob)) return "World Cup";
  const first = n.split("·")[0].trim();
  return first || k.replace(/^ev:/, "");
}
function eventFilterForKey(k, cal){
  if (/ev:app/.test(k)) return "app-pro";
  if (/ev:ppa:/.test(k) || k === "ev:ppa") return "ppa";
  if (/gijon|tpb/i.test(k) || (cal && cal.tour === "tpb")) return "tpb";
  if (/barcelona|ppa-eu/i.test(k) || (cal && cal.tour === "ppa-eu")) return "ppa-eu";
  if (/ev:wc/.test(k)) return "wc";
  if (cal && cal.tour) return cal.tour;
  return "all";
}
function followPersonLabel(k){
  if (PLAYERS[k]) return {Waters:"A. Waters",Johns:"B. Johns",Bright:"A. Bright"}[k] || PLAYERS[k].name;
  if (TEAMS[k]) return TEAMS[k].name;
  return k;
}
function tourFilterForKey(k){
  const id = String(k || "").replace(/^tour:/, "");
  if (id === "app") return "app-pro";
  if (id === "ppa") return "ppa";
  if (id === "wc") return "wc";
  if (id === "npl") return "npl";
  if (id === "asia") return "asia";
  return id || "all";
}
function followingBox(extraClass){
  const people = followTagsList();
  const tours = followedTourKeys();
  const toursHtml = tours.map(k => `<button class="league ${state.filter===tourFilterForKey(k)?"on":""}" data-f="${tourFilterForKey(k)}">${esc(tourLabel(k))}</button>`).join("");
  const peopleHtml = people.map(k => {
    const href = TEAMS[k] ? "/team/"+encodeURIComponent(k) : "/player/"+encodeURIComponent(k);
    return `<a class="follow-item" href="${href}">${esc(followPersonLabel(k))}</a>`;
  }).join("");
  const empty = !tours.length && !people.length
    ? `<p class="empty rail-empty">None.</p>`
    : "";
  const open = (tours.length || people.length) ? `<a class="follow-open" href="/following">Open</a>` : "";
  return `<div class="panel rail-card follow-box ${extraClass||""}">
    <div class="kicker">Following</div>
    ${toursHtml?`<div class="follow-tours">${toursHtml}</div>`:""}
    ${peopleHtml?`<div class="follow-people">${peopleHtml}</div>`:""}
    ${empty}
    ${open}
  </div>`;
}
function followingRail(){
  return followingBox("");
}
/** Phone list of tours and players already followed. Hidden when empty — not a suggestion bar. */
function followingMobile(){
  if (!followTagsList().length && !followedTourKeys().length) return "";
  return followingBox("follow-inline");
}

function passesBoardFilter(m){
  if (!m) return false;
  if (state.filter === "ppa" && m.tour !== "ppa") return false;
  if (state.filter === "app-pro") {
    if (m.tour !== "app" || appTier(m) !== "pro") return false;
  } else if (state.filter === "app") {
    if (m.tour !== "app" || appTier(m) !== "amateur") return false;
  }
  // All: soft-hide APP amateur unless LIVE (keeps All from flooding)
  if (state.filter === "all" && m.tour === "app" && appTier(m) === "amateur" && effectiveStatus(m) !== "LIVE") return false;
  if (state.filter === "wc" && m.tour !== "wc") return false;
  if (state.filter === "rta" && m.tour !== "rta") return false;
  if (state.filter === "npl" && m.tour !== "npl") return false;
  if (state.filter === "asia" && m.tour !== "asia") return false;
  if (state.filter === "following" && !followsBoardMatch(m)) return false;
  if ((state.boardMode === "results" || dayCatOn()) && state.resultCat && state.resultCat !== "all") {
    if (matchDisc(m) !== state.resultCat) return false;
  }
  // Competitions without a live path: never leak PPA/APP/WC as if they belonged here.
  if (state.filter === "mlp-asia" || state.filter === "app-asia" || state.filter === "tpb" || state.filter === "ppa-eu" || state.filter === "gpa") return false;
  return true;
}
function sortMatchDay(a, b){
  const ra = {LIVE:0,NEXT:1,FT:2}[effectiveStatus(a)];
  const rb = {LIVE:0,NEXT:1,FT:2}[effectiveStatus(b)];
  if (ra !== rb) return ra-rb;
  const fa = playerFollowsMatch(a) ? 0 : 1;
  const fb = playerFollowsMatch(b) ? 0 : 1;
  if (fa !== fb) return fa-fb;
  const sa = parseUtc(a.start)?.getTime() || 0;
  const sb = parseUtc(b.start)?.getTime() || 0;
  if (effectiveStatus(a)==="FT") return sb-sa;
  if (sa !== sb) return sa-sb;
  return courtOnCard(a).localeCompare(courtOnCard(b));
}
function filteredList(){
  const today = boardToday();
  return state.matches.filter(m => {
    const live = effectiveStatus(m) === "LIVE";
    // Default today: that calendar day in event tz, plus LIVE/RUNNING always.
    if (m.date !== state.date && !(live && state.date === today)) return false;
    return passesBoardFilter(m);
  }).sort(sortMatchDay);
}
/** NEXT rows after the selected day. Used when today has no slate yet (Columbus eve). */
function upcomingAhead(){
  const day = state.date || boardToday();
  return (state.matches || []).filter(m => {
    if (effectiveStatus(m) !== "NEXT") return false;
    if (!m.date || m.date <= day) return false;
    return passesBoardFilter(m);
  }).sort(sortMatchDay);
}
/**
 * Live tab: in-progress only.
 * Results: FT on the selected day.
 * Matches: that day's rows, and if nothing is scheduled yet, the next day's NEXT slate.
 */
function boardList(){
  const mode = state.boardMode;
  const dayRows = filteredList();
  if (mode === "live") return dayRows.filter(m => effectiveStatus(m) === "LIVE");
  if (mode === "results") return dayRows.filter(m => effectiveStatus(m) === "FT");
  if (mode === "matches") {
    const hasSlate = dayRows.some(m => {
      const st = effectiveStatus(m);
      return st === "NEXT" || st === "LIVE";
    });
    if (hasSlate) return dayRows;
    const ahead = upcomingAhead();
    if (!ahead.length) return dayRows;
    const seen = new Set(dayRows.map(m => m.id));
    return dayRows.concat(ahead.filter(m => !seen.has(m.id))).sort(sortMatchDay);
  }
  return dayRows;
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
    cards.push({ source:"WPR", cat: "Open mixed", rank:r.rank, elo:r.elo, dupr:r.dupr||"", detail:wprText(r.elo), name:r.name });
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
function splitSides(side){
  return String(side||"").split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
}
function sideLinks(side){
  const parts = splitSides(side);
  if (!parts.length) return esc(side);
  return `<span class="side-links">${parts.map(p => {
    if (/^(tbd|tba|bye)$/i.test(p)) return esc(p);
    return `<a href="${entityPath(p)}">${esc(p)}</a>`;
  }).join(" / ")}</span>`;
}
function wprText(elo){
  if (elo == null || elo === "") return "";
  return String(elo) + " WPR";
}
function courtOnCard(m){
  return String((m && m.court) || "").trim();
}
/** Scheduled local clock only when Den/PPA supplied it. Never invent bracket 09:00. */
function scheduledLocalLabel(m){
  if (!m) return "";
  const clock = String(m.clock || "").trim();
  if (clock) return clock;
  const note = String(m.note || "").trim();
  if (m.tour === "ppa" && note && !/^In play/i.test(note) && /\d/.test(note) && /(AM|PM|MST|MDT|PST|PDT|CST|CDT|EST|EDT)/i.test(note)) {
    return note;
  }
  if (m.hasClock !== true || !m.start) return "";
  return localTime(m.start, m.tz || boardTz()) || "";
}
function nextWhenLabel(m){
  const today = boardToday();
  const chip = dateChip(m.date);
  const time = scheduledLocalLabel(m);
  if (m.date && m.date !== today) return time ? `${chip} ${time}`.trim() : (chip || "NEXT");
  return time || "NEXT";
}
function tierMark(m){
  if (appTier(m) !== "pro") return "";
  return `<em class="tier-chip">Pro</em>`;
}
function discMark(m){
  const d = matchDisc(m);
  if (!d) return "";
  return `<em class="disc-chip">${d}</em>`;
}
/** Court and ticker clock only when the feed sent them. Never invent either. */
function cardFacts(m, st){
  const court = courtOnCard(m);
  const clock = scheduledLocalLabel(m);
  const bits = [];
  if (court) bits.push(court);
  if (clock && (st !== "NEXT" || court)) bits.push(clock);
  if (!bits.length) return "";
  return `<span class="card-facts">${esc(bits.join(" · "))}</span>`;
}
function matchRow(raw, opts){
  const m = presentMatch(raw);
  const st = effectiveStatus(m);
  let when = st==="LIVE" ? "LIVE" : st==="FT" ? "FT" : nextWhenLabel(m);
  if (st === "NEXT" && opts && opts.hideDate) when = scheduledLocalLabel(m) || "NEXT";
  const noPoints = st === "LIVE" && !liveHasPoints(m);
  const rtaBlank = rtaLiveBlank(m) || noPoints;
  const mark = rtaBlank ? "" : (m.score ? "" : (st==="NEXT" ? "vs" : (blankResultLabel(m) || (st==="LIVE" ? "" : (st==="FT" ? "FT" : "vs")))));
  const sc = String(rtaBlank ? "" : (m.score || "")).split("-");
  const sa = sc[0] || "";
  const sb = sc[1] != null ? sc[1] : "";
  const linePreview = (m.lines||[]).slice(0,4).map(l => l.score ? `${l.disc} ${l.score}` : l.disc).join(" · ") || (m.games||"").split(" · ").slice(0,3).join(" · ");
  const reason = !m.score && blankResultLabel(m) ? String(m.note || "").trim() : "";
  const today = boardToday();
  const hideDate = opts && opts.hideDate;
  const chip = (!hideDate && st==="NEXT" && m.date && m.date !== today) ? `<em class="date-chip">${dateChip(m.date)}</em>` : "";
  const facts = cardFacts(m, st);
  const followed = playerFollowsMatch(m) ? " followed" : "";
  const div = m.div||m.round||m.comp||"";
  return `<div class="match${followed}">
    <div class="line">
      <a class="statuscol st ${st}" href="/match/${m.id}">${st==="LIVE"?"<span class='dot'></span>":""}${when}</a>
      <div class="pair">
        <div class="a">${sideLinks(m.a)}</div>
        <div class="b">${sideLinks(m.b)}</div>
      </div>
      <a class="scorecol" href="/match/${m.id}">${rtaBlank ? "<span class='kick'></span>" : (mark ? `<span class="kick">${esc(mark)}</span>` : `<div>${esc(sa)}</div><div>${esc(sb)}</div>`)}</a>
    </div>
    <a class="games" href="/match/${m.id}">${discMark(m)}${tierMark(m)}${div?`<b>${div}</b>`:""}${facts?` · ${facts}`:""}${reason?` · ${esc(reason)}`:""}${linePreview?" · "+linePreview:""}${chip}</a>
  </div>`;
}
const SLATE_CAP = 18;
function capFollowFirst(items, moreKey, cap){
  if (state.more[moreKey] || items.length <= cap) return items;
  const pinned = items.filter(playerFollowsMatch);
  const rest = items.filter(m => !playerFollowsMatch(m));
  const room = Math.max(0, cap - pinned.length);
  return pinned.concat(rest.slice(0, room));
}
function whenGroupLabel(m){
  const clock = scheduledLocalLabel(m);
  const today = boardToday();
  if (m.date && m.date !== today) {
    const chip = dateChip(m.date);
    return clock ? `${chip} · ${clock}` : chip || "Time to be assigned";
  }
  return clock || "Time to be assigned";
}
function groupByWhen(items){
  const groups = [];
  const map = new Map();
  items.forEach(m => {
    const label = whenGroupLabel(m);
    if (!map.has(label)) {
      const g = { label, items: [] };
      map.set(label, g);
      groups.push(g);
    }
    map.get(label).items.push(m);
  });
  return groups;
}
function slateMoreButton(moreKey, total, shown, noun){
  if (total <= shown) return "";
  const open = !!state.more[moreKey];
  const hidden = total - shown;
  return `<button class="chip" data-more="${moreKey}" style="margin:10px">${open?"Hide "+noun:"+"+hidden+" "+noun}</button>`;
}
function upcomingHtml(items, key){
  const moreKey = key + ":next";
  const visible = capFollowFirst(items, moreKey, SLATE_CAP);
  const dates = [...new Set(items.map(m => m.date).filter(Boolean))];
  const offDay = dates.length === 1 && dates[0] !== (state.date || boardToday()) ? dateChip(dates[0]) : "";
  const groups = groupByWhen(visible);
  const grouped = groups.length > 1 && groups.some(g => g.items.length > 1);
  const hideDate = !!offDay;
  const body = grouped
    ? groups.map(g => `<div class="slate-kicker slate-time">${esc(g.label)}</div>${g.items.map(m => matchRow(m, {hideDate})).join("")}`).join("")
    : visible.map(m => matchRow(m, {hideDate})).join("");
  const tour = (visible[0] && visible[0].tour) || (items[0] && items[0].tour) || "";
  const sub = offDay ? `${offDay} · scheduled, not live yet` : (tour === "app" ? "Scheduled · not live until Den says so" : "Scheduled · not live yet");
  return `<div class="slate-kicker">Upcoming <span>${items.length}</span></div><p class="slate-sub">${esc(sub)}</p>${body}${slateMoreButton(moreKey, items.length, visible.length, "upcoming")}`;
}
function resultsHtml(items, key){
  const moreKey = key + ":ft";
  const visible = capFollowFirst(items, moreKey, 4);
  return `<div class="slate-kicker">Results <span>${items.length}</span></div>${visible.map(m => matchRow(m)).join("")}${slateMoreButton(moreKey, items.length, visible.length, "results")}`;
}
function cardQuietLine(c){
  if (state.boardMode !== "matches") return "";
  if (!c || !c.items || !c.items.length) return "";
  if (c.items.some(x => effectiveStatus(x) === "LIVE")) return "";
  const tour = c.meta && c.meta.tour;
  if (tour !== "app" && tour !== "ppa") return "";
  if (tourPreServe(tour)) {
    if (!c.items.some(x => effectiveStatus(x) === "NEXT")) return "";
    return "Play starts soon";
  }
  if ((state.date || boardToday()) !== boardToday()) return "";
  return "Nothing live right now";
}
function slateSections(c){
  const live = c.items.filter(x => effectiveStatus(x)==="LIVE");
  const next = c.items.filter(x => effectiveStatus(x)==="NEXT");
  const ft = c.items.filter(x => effectiveStatus(x)==="FT");
  const parts = [];
  const quiet = cardQuietLine(c);
  if (quiet) parts.push(`<p class="pre-serve-line">${quiet}</p>`);
  if (live.length) parts.push(`<div class="slate-kicker">Live <span>${live.length}</span></div>${live.map(m => matchRow(m)).join("")}`);
  if (next.length) parts.push(upcomingHtml(next, c.meta.id));
  else if (state.boardMode === "matches" && (live.length || ft.length) && (state.date || boardToday()) === boardToday()) {
    const tour = c.meta && c.meta.tour;
    if ((tour === "app" || tour === "ppa") && !tourPreServe(tour)) parts.push(`<p class="slate-sub">Nothing else scheduled for this day.</p>`);
  }
  if (ft.length) parts.push(resultsHtml(ft, c.meta.id));
  else if (state.boardMode === "matches" && (live.length || next.length) && (state.date || boardToday()) === boardToday()) {
    const tour = c.meta && c.meta.tour;
    if ((tour === "app" || tour === "ppa") && !tourPreServe(tour)) parts.push(`<p class="slate-sub">No results for this day yet.</p>`);
  }
  return parts.join("");
}

const MAG = "https://worldpickleballmagazine.com";
const MAG_NAV = [["/","Home"],["/live/","Live"],["/watch/","Watch"],["/play/","Play"],["/rankings/","Rankings"],["/gear/","Gear"]];
function escTick(v){ return String(v==null?"":v).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function tickerHtml(){
  const all = (state.matches || []).map(presentMatch).filter(Boolean);
  const live = all.filter(m => effectiveStatus(m) === "LIVE");
  const ft = all.filter(m => effectiveStatus(m) === "FT" && m.score && m.date && /^(ppa|app|wc|mlp|usap)/.test(m.tour || "")).sort((x, y) => String(y.date + (y.time || "")).localeCompare(String(x.date + (x.time || "")))).slice(0, 12);
  const items = live.concat(ft).slice(0, 14);
  const cards = items.map(m => {
    const st = effectiveStatus(m);
    return `<a class="tick" href="/match/${encodeURIComponent(m.id)}"><span class="tick-st tick-${st.toLowerCase()}">${st === "LIVE" ? "Live" : "Final"}</span><span class="tick-teams">${escTick(m.a)}</span><span class="tick-games"><b>${escTick(centerScore(m) || "–")}</b></span><span class="tick-teams">${escTick(m.b)}</span><span class="tick-meta">${escTick(m.div || (m.tour||"").toUpperCase())}</span></a>`;
  }).join("");
  return `<div class="ticker"><div class="w ticker-row"><a class="ticker-label" href="/">Scores</a><div class="ticker-track">${cards || `<span class="tick-empty">No live scores right now.</span>`}</div><a class="ticker-out" href="${MAG}/">Magazine</a></div></div>`;
}
function themeToggle(){
  return `<button class="theme" type="button" aria-label="Toggle dark mode" onclick="(function(){var r=document.documentElement;var d=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);var n=d?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('wpm-theme',n)}catch(e){}})()"><span class="when-light">Dark</span><span class="when-dark">Light</span></button>`;
}
function chrome(inner, title){
  const liveOn = path()==="/"||path().startsWith("/match")||path().startsWith("/player")||path().startsWith("/team")||path()==="/draw";
  return `
  ${tickerHtml()}
  <div class="top"><div class="w top-row"><span>WPM LIVE · The live centre of World Pickleball Magazine</span><span class="lang">${themeToggle()}<a href="${MAG}/">worldpickleballmagazine.com</a></span></div></div>
  <header class="mast">
    <div class="w mast-row">
      <a class="brand" href="${MAG}/" aria-label="World Pickleball Magazine"><img class="logo" src="/img/wpm-logo.avif" alt="World Pickleball Magazine" width="480" height="192"></a>
      <nav class="tabs" aria-label="Magazine sections">${MAG_NAV.map(([h,l]) => `<a href="${MAG}${h}" class="${h==="/live/"?"on":""}"${h==="/live/"?' aria-current="page"':""}>${l}</a>`).join("")}</nav>
      <form class="find" action="/search" onsubmit="location.href='/search?q='+encodeURIComponent(this.q.value);return false;">
        <input name="q" aria-label="Search player or team" placeholder="Search player or team" value="${(state.q||"").replace(/"/g,"")}">
      </form>
      <a class="report-link" href="${MAG}/newsletter/">Get the Report</a>
    </div>
  </header>
  <nav class="subnav" aria-label="Live centre"><div class="w subnav-row">
    <a class="${liveOn?"on":""}" href="/">Live</a>
    <a class="${path()==="/rankings"?"on":""}" href="/rankings">Table</a>
    <a class="${path()==="/calendar"?"on":""}" href="/calendar">Calendar</a>
    <a class="${path()==="/history"?"on":""}" href="/history">Archive</a>
    <a class="${path()==="/following"?"on":""}" href="/following">Following</a>
    <a class="${path()==="/magazine"?"on":""}" href="/magazine">Magazine</a>
    <a class="${path()==="/shop"?"on":""}" href="/shop">Shop</a>
  </div></nav>
  ${inner}
  <footer class="colophon"><div class="w foot-row"><p class="foot-name">World Pickleball Magazine</p><nav>${MAG_NAV.map(([h,l]) => `<a href="${MAG}${h}">${l}</a>`).join("")}<a href="${MAG}/magazine/">Issues</a><a href="${MAG}/newsletter/">The Report</a></nav></div></footer>
  <nav class="tabbar">
    <a class="${liveOn?"on":""}" href="/">Live</a>
    <a class="${path()==="/rankings"?"on":""}" href="/rankings">Table</a>
    <a class="${path()==="/calendar"?"on":""}" href="/calendar">Cal</a>
    <a class="${path()==="/following"?"on":""}" href="/following">Follow</a>
    <a class="${path()==="/magazine"?"on":""}" href="/magazine">Mag</a>
    <a class="${path()==="/shop"?"on":""}" href="/shop">Shop</a>
  </nav>`;
}

function amateurPoolNote(list){
  if (state.filter !== "all" || state.boardMode === "live" || state.boardMode === "draw") return "";
  const dates = new Set((list || []).map(m => m.date).filter(Boolean));
  const hidden = (state.matches || []).filter(m => {
    if (m.tour !== "app" || appTier(m) !== "amateur") return false;
    if (effectiveStatus(m) === "LIVE") return false;
    if (state.boardMode === "results" && effectiveStatus(m) !== "FT") return false;
    if (state.boardMode === "matches" && effectiveStatus(m) === "FT") return false;
    if (!dates.size) return effectiveStatus(m) === "NEXT";
    return dates.has(m.date);
  }).length;
  if (!hidden) return "";
  return `<p class="slate-sub">Pro is on this board. ${hidden} amateur ${hidden===1?"match is":"matches are"} on the APP chip.</p>`;
}
const ARCHIVE_FALLBACK = [
  {id:"overland", tour:"app", label:"Overland", name:"APP Dillons Overland Park Open", venue:"AdventHealth Sports Park at Bluhawk, Overland Park, KS", tz:"America/Chicago", start:"2026-09-17", end:"2026-09-20", current:false},
  {id:"arizona", tour:"ppa", label:"Arizona", name:"PPA Veolia Arizona Open", venue:"Mesa, AZ", tz:"America/Phoenix", start:"2026-09-14", end:"2026-09-21", current:false},
  {id:"columbus", tour:"app", label:"Columbus", name:"APP Columbus Open presented by The James", venue:"Pickle & Chill, Columbus, OH", tz:"America/New_York", start:"2026-10-01", end:"2026-10-04", current:false},
  {id:"louisville", tour:"app", label:"Louisville", name:"Humana APP Louisville Open", venue:"Kentucky International Convention Center, Louisville, KY", tz:"America/New_York", start:"2026-10-15", end:"2026-10-18", current:false},
  {id:"las-vegas", tour:"ppa", label:"Las Vegas", name:"PPA Rate Las Vegas Open", venue:"Darling Tennis Center, Las Vegas", tz:"America/Los_Angeles", start:"2026-09-28", end:"2026-10-04", current:false},
  {id:"chicago-cup", tour:"ppa", label:"Chicago", name:"Veolia Chicago Cup", venue:"Life Time North Shore Sport & Racquetball, Chicago, IL", tz:"America/Chicago", start:"2026-10-05", end:"2026-10-11", current:false},
  {id:"virginia-beach", tour:"ppa", label:"Virginia Beach", name:"Mojo Energy Pouches Virginia Beach Open", venue:"Pickleball Virginia Beach, Virginia Beach, VA", tz:"America/New_York", start:"2026-10-12", end:"2026-10-18", current:false},
  {id:"hong-kong", tour:"ppa", label:"Hong Kong", name:"PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026", venue:"Kai Tak Arena, Hong Kong", tz:"Asia/Hong_Kong", start:"2026-10-19", end:"2026-10-25", current:true}
];
const DISC_LABEL = {MS:"Men's singles", WS:"Women's singles", XD:"Mixed doubles", MD:"Men's doubles", WD:"Women's doubles"};
function weekIsFinished(matches, today){
  const rows = matches || [];
  const day = String(today || "").slice(0, 10);
  if (!rows.length || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  let latest = "";
  for (let i = 0; i < rows.length; i++) {
    const st = String(rows[i] && rows[i].status || "").toLowerCase();
    if (st !== "ft" && st !== "final") return false;
    const d = String((rows[i] && (rows[i].date || rows[i].dateKey)) || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d > latest) latest = d;
  }
  return !!(latest && latest < day);
}
function pinEnded(end, today){
  const e = String(end || "").slice(0, 10);
  const t = String(today || "").slice(0, 10);
  return !!(e && t && t > e);
}
function appPinFinished(){
  const ev = state.appEvent || {};
  const id = String(ev.id || ev.eventKey || "");
  const today = ymdInTz(new Date(), ev.tz || "America/New_York");
  if (/18448|columbus/i.test(id)) return today > (ev.endDate || "2026-10-04");
  const end = ev.endDate || "2026-10-18";
  return !!(end && today > end);
}
function ppaFeedFinished(){
  const ev = state.ppaEvent || {};
  const id = String(ev.id || "");
  const rows = (state.matches || []).filter(m => {
    if (!m || m.tour !== "ppa") return false;
    if (id) return String(m.eventKey || "").indexOf(id) !== -1;
    const blob = `${m.eventKey || ""} ${m.comp || ""} ${m.venue || ""}`;
    return /c7e4fd72|hong kong|hang seng/i.test(blob);
  });
  const today = ymdInTz(new Date(), ev.tz || "Asia/Hong_Kong");
  return weekIsFinished(rows, today);
}
function vegasInPast(){
  if (ppaFeedFinished()) return true;
  const pin = ARCHIVE_FALLBACK.find(e => e.id === "las-vegas");
  const today = ymdInTz(new Date(), "America/Los_Angeles");
  return !!(pin && pinEnded(pin.end, today));
}
function archiveEntries(){
  return (state.archiveCatalog && state.archiveCatalog.length) ? state.archiveCatalog : ARCHIVE_FALLBACK;
}
function archiveMeta(id){
  return archiveEntries().find(e => e.id === id) || null;
}
function archiveReady(e){
  if (!e) return false;
  if (!e.current) return true;
  if (e.id === "las-vegas") return vegasInPast();
  if (e.id === "columbus" || e.tour === "app") return appPinFinished();
  if (e.tour === "ppa") return ppaFeedFinished() || pinEnded(e.end, ymdInTz(new Date(), e.tz || "UTC"));
  return false;
}
function boardWantsPast(filter){
  return filter === "ppa" || filter === "app-pro" || filter === "all";
}
function visiblePast(filter){
  return archiveEntries().filter(e => {
    if (!archiveReady(e)) return false;
    if (filter === "ppa") return e.tour === "ppa";
    if (filter === "app-pro") return e.tour === "app";
    return true;
  });
}
function livePinLabel(filter){
  if (filter === "app-pro" && !appPinFinished()) {
    const ev = state.appEvent || {};
    return shortEventLabel(ev.name || "Humana APP Louisville Open", ev.eventKey || ev.id || "ev:app:18454") || "Louisville";
  }
  if (filter === "ppa" && !ppaFeedFinished()) {
    const ev = state.ppaEvent || {};
    return shortEventLabel(ev.name || "PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026", ev.eventKey || "ev:ppa") || "Hong Kong";
  }
  if (filter === "all" && (!appPinFinished() || !ppaFeedFinished())) return "This week";
  return "";
}
function ensureFinishedBoard(){
  if (state.boardMode === "draw") return;
  if (state.archiveId) return;
  if (state.filter === "app-pro" && appPinFinished()) {
    const ev = state.appEvent || {};
    const id = String(ev.id || ev.eventKey || "");
    state.archiveId = /18448|columbus/i.test(id) ? "columbus" : "louisville";
    if (state.boardMode === "live" || state.boardMode === "matches") state.boardMode = "results";
  } else if (state.filter === "ppa" && ppaFeedFinished()) {
    state.archiveId = "hong-kong";
    if (state.boardMode === "live" || state.boardMode === "matches") state.boardMode = "results";
  }
}
function pastNavHtml(){
  if (!boardWantsPast(state.filter)) return "";
  const past = visiblePast(state.filter);
  const live = livePinLabel(state.filter);
  if (!past.length && !live) return "";
  const liveBtn = live ? `<button type="button" data-archive="live" class="${state.archiveId?"":"on"}">${esc(live)}</button>` : "";
  const buttons = past.map(e => `<button type="button" data-archive="${esc(e.id)}" class="${state.archiveId===e.id?"on":""}">${esc(e.label)}</button>`).join("");
  return `<nav class="past-nav" aria-label="Past events">${liveBtn}${buttons?`<span>Past</span>${buttons}`:""}</nav>`;
}
function archiveRoundRank(m){
  const r = String((m && (m.round || m.div)) || "");
  if (/semi/i.test(r)) return 1;
  if (/quarter/i.test(r)) return 2;
  if (/\bfinal/i.test(r)) return 0;
  return 9;
}
function archiveRowsFor(id){
  const pack = state.archiveCache[id];
  if (!pack || !Array.isArray(pack.matches)) return [];
  let rows = pack.matches.filter(m => m && m.status === "FT" && effectiveStatus(m) === "FT");
  if (state.boardMode === "results" && state.resultCat && state.resultCat !== "all") {
    rows = rows.filter(m => matchDisc(m) === state.resultCat);
  }
  const day = state.date;
  const days = {};
  rows.forEach(m => { if (m.date) days[m.date] = 1; });
  if (day && days[day]) rows = rows.filter(m => m.date === day);
  return rows;
}
function archiveBoardHtml(){
  const id = state.archiveId;
  const meta = archiveMeta(id) || {label:id, name:id, venue:"", start:"", end:""};
  const pack = state.archiveCache[id];
  const name = (pack && pack.event && pack.event.name) || meta.name || meta.label || "Results";
  const venue = (pack && pack.event && pack.event.venue) || meta.venue || "";
  const when = [meta.start, meta.end && meta.end !== meta.start ? meta.end : ""].filter(Boolean).join(" → ");
  const head = `<div class="comp-head"><div><h3>${esc(name)}</h3><span>${esc([venue, when, "Finished"].filter(Boolean).join(" · "))}</span></div></div>`;
  if (!pack || pack.loading || !Array.isArray(pack.matches)) {
    return `<section class="comp-card">${head}<p class="games">Loading results…</p></section>`;
  }
  if (pack.unavailable || pack.finished === false) {
    return `<section class="comp-card">${head}<p class="games">${esc(pack.reader || "Results will appear when available")}</p></section>`;
  }
  const rows = archiveRowsFor(id);
  if (!rows.length) {
    return `<section class="comp-card">${head}<p class="games">No finished results in this cut.</p></section>`;
  }
  const order = ["MS","WS","XD","MD","WD",""];
  const groups = {};
  rows.forEach(m => {
    const d = matchDisc(m) || "";
    (groups[d] = groups[d] || []).push(m);
  });
  const keys = Object.keys(groups).sort((a,b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib);
  });
  const body = keys.map(d => {
    const items = groups[d].slice().sort((a,b) => {
      const ra = archiveRoundRank(a), rb = archiveRoundRank(b);
      if (ra !== rb) return ra - rb;
      return String(b.date||"").localeCompare(String(a.date||""));
    });
    const moreKey = "arch:"+id+":"+(d || "other");
    const visible = state.more[moreKey] ? items : items.slice(0, 8);
    const label = DISC_LABEL[d] || "Results";
    return `<div class="slate-kicker">${esc(label)} <span>${items.length}</span></div>${visible.map(m => matchRow(m)).join("")}${slateMoreButton(moreKey, items.length, visible.length, "results")}`;
  }).join("");
  const ended = state.boardMode === "live" ? `<p class="pre-serve-line">Event ended</p>` : "";
  return `<section class="comp-card">${head}${ended}${body}</section>`;
}
function viewHome(){
  ensureFinishedBoard();
  if (state.archiveId && state.boardMode !== "draw") pullArchive(state.archiveId);
  if (!state.date) state.date = boardToday();
  const days = datesAvailable().map(dt => {
    const L = dayMeta(dt);
    return `<button class="day ${dt===state.date?"on":""}" data-day="${dt}"><span>${L.wd}</span><b>${L.num}</b>${L.tag?`<em>${L.tag}</em>`:""}</button>`;
  }).join("");
  const L = dayMeta(state.date);
  const headline = L.tag==="Today"?"TODAY":L.tag==="Yest"?"YESTERDAY":L.tag==="Tom"?"TOMORROW":L.wd.toUpperCase();
  let live = state.matches.filter(m => effectiveStatus(m)==="LIVE" && passesBoardFilter(m));
  if (anyFollows()) {
    const mine = live.filter(followsMatch);
    if (mine.length) live = mine;
  }
  const list = boardList();
  const comps = {};
  list.forEach(m => {
    const c = competition(m);
    (comps[c.id] = comps[c.id] || {meta:c, items:[]}).items.push(m);
  });
  const ordered = Object.values(comps).sort((a,b) => {
    const fa = a.items.some(followsBoardMatch) ? 0 : 1;
    const fb = b.items.some(followsBoardMatch) ? 0 : 1;
    if (fa !== fb) return fa-fb;
    const la = a.items.some(x => effectiveStatus(x)==="LIVE") ? 0 : 1;
    const lb = b.items.some(x => effectiveStatus(x)==="LIVE") ? 0 : 1;
    if (la !== lb) return la-lb;
    return a.meta.rank - b.meta.rank;
  });
  const blocks = ordered.map(c => {
    const liveN = c.items.filter(x => effectiveStatus(x)==="LIVE").length;
    const nextN = c.items.filter(x => effectiveStatus(x)==="NEXT").length;
    const followBtn = tourFollowButton(c.meta.tour);
    const countBits = [liveN?liveN+" live":"", nextN?nextN+" upcoming":""].filter(Boolean).join(" · ");
    return `<section class="comp-card">
      <div class="comp-head">
        <div><h3>${c.meta.title}</h3><span>${c.meta.place}${countBits?" · "+countBits:""}</span></div>
        <div class="comp-actions">${liveN?`<div class="livecount"><span class="dot"></span>${liveN} LIVE</div>`:""}${followBtn}</div>
      </div>
      ${slateSections(c)}
    </section>`;
  }).join("");

  return `
  <div class="hero">
    <div class="desk" id="deskClock">${deskClock()}</div>
    <div class="days">${days}</div>
    <h2>${headline} IN PICKLEBALL</h2>
    <p>${heroLine()}</p>
  </div>
  <div class="wrap fot">
    <aside class="rail-left">${leagueRail()}</aside>
    <div class="rail-main">
        ${followingMobile()}
        ${live.length?`<div class="panel"><div class="kicker"><span class="dot"></span> Live now</div>
      <div class="strip">${live.map(raw=>{const m=presentMatch(raw);return `<a class="live-card" href="/match/${m.id}"><span class="st LIVE"><span class="dot"></span>LIVE</span><strong>${centerScore(m)}</strong>${m.a} vs ${m.b}<div class="games">${[m.div, courtOnCard(m), scheduledLocalLabel(m)].filter(Boolean).join(" · ")}</div></a>`;}).join("")}</div></div>`:""}
    <div class="panel">
      <div class="toolbar">
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
          <button data-f="rta" class="${state.filter==="rta"?"on":""}">RTA2000</button>
          <button data-f="wc" class="${state.filter==="wc"?"on":""}">World Cup</button>
          <button data-f="following" class="${state.filter==="following"?"on":""}">Following</button>
        </div>
      </div>
      ${(state.boardMode==="results" || dayCatOn()) ? catChipsHtml() : ""}
      ${amateurPoolNote(list)}
    </div>
    <div class="panel">${pastNavHtml()}${state.boardMode==="draw" ? drawBoard() : (state.archiveId ? archiveBoardHtml() : (blocks || preServeBoard(state.filter, state.boardMode) || slateEmpty(state.filter)))}</div>
    ${weekStrip()}
    </div>
    <aside class="rail-right">${tableRail()}</aside>
  </div>`;
}

function leagueRail(){
  const items=[
    ["all","All competitions"],
    ["rta","RTA2000 Farnham"],
    ["ppa","PPA Tour (US)"],
    ["ppa-eu","PPA Europe"],
    ["tpb","TOP Pickleball"],
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
  const g=gpa.slice(0,6).map(r=>`<a class="rank-row" href="${playerPath(r.name)}"><b>${r.rank}</b><div><strong>${r.name}</strong><span>${r.country||""}</span></div><em>${r.points!=null&&r.points!==""?r.points+" pts":""}</em></a>`).join("");
  const e=wpr.slice(0,6).map(r=>`<a class="rank-row" href="${playerPath(r.name)}"><b>${r.rank}</b><div><strong>${r.name}</strong><span>Open mixed</span></div><em>${wprText(r.elo)}</em></a>`).join("");
  return `<div class="panel rail-card"><div class="kicker">GPA table</div>${g||"<p class='empty'>Loading table…</p>"}<a class="chip" href="/rankings">Full table</a><a class="chip" href="/history">Archive</a></div><div class="panel rail-card"><div class="kicker">WPR</div>${e||"<p class='empty'>WPR loading…</p>"}</div>`;
}
function weekStrip(){
  const cal=(state.calendar&&state.calendar.events)||[];
  const fromRank=(state.rankings&&state.rankings.events)||[];
  const today=ymd(new Date());
  let soon;
  if(cal.length){
    soon=cal.filter(e=> (e.end||e.start||'') >= today).slice(0,8);
    const mlp=cal.find(e => (e.end||e.start||"")>=today && (e.tour==="mlp-asia" || /\bMLP\b/.test((e.name||"")+" "+(e.host||""))));
    if(mlp && !soon.some(e => e===mlp || (e.id && e.id===mlp.id))) soon.push(mlp);
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
  return `${chrome}<div class="panel"><div class="kicker">Coming up</div>${soon.map(calEventRow).join('')}<a class="chip" href="/calendar">Full calendar</a><a class="chip" href="/rankings">Table</a><a class="chip" href="/history">Archive</a></div>`;
}
function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}
function statusChip(st, onLive){
  if(onLive || st==='live-path') return '<span class="cal-status live-path">live-path</span>';
  if(st==='delayed') return '<span class="cal-status delayed">scores delayed</span>';
  if(st==='ended') return '<span class="cal-status results-only">ended</span>';
  return '<span class="cal-status results-only">results-only</span>';
}
function officialDrawCta(url, label){
  if (!url) return "";
  return `<a class="btn gold draw-cta" href="${esc(url)}" target="_blank" rel="noopener">${esc(label || "Official draw")}</a>`;
}
/** Drop desk prose if a feed field still carries it. Clock notes stay. */
function publicProse(s){
  const n = String(s||"");
  if(!n) return "";
  if(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(n)) return "";
  if(/external-tournament|\/api\/ppa|\btournamentId\b|\bintake\b|\bradar\b|\bblocker\b/i.test(n)) return "";
  return n;
}
/** Reader board only. Desk notes, ids, and API paths never become card body. */
function readerStatusLine(e){
  if(!e) return "";
  if(e.onLive || e.status==="live-path") return "";
  if(e.ended || e.status==="ended") return "Event ended";
  if(e.status==="delayed") return "Scores delayed";
  const blob=[e.note,e.statusNote,e.blurb,e.detail,e.description].filter(Boolean).join(" ");
  if(!e.drawUrl && /draw/i.test(blob) && /not published|unpublished|no official/i.test(blob)) return "Draw not published yet";
  return "Results will appear when available";
}
function tourMark(e){
  if(!e) return "";
  if(e.tour==="mlp-asia") return "MLP Asia";
  if(e.tour==="app-asia") return "APP Asia";
  if(e.tour==="ppa") return "PPA";
  if(e.tour==="app") return "APP";
  if(e.tour==="ppa-eu") return "PPA Europe";
  return e.host||e.tour||"";
}
function calEventRow(e){
  const start=(e.start||e.tournament_date||'').toString().slice(0,10);
  const end=(e.end||e.end_date||start).toString().slice(0,10);
  const dates=end&&end!==start?`${start} → ${end}`:start;
  const venue=e.venue||e.location||'';
  const draw=officialDrawCta(e.drawUrl);
  const official=e.officialUrl?`<a class="chip" href="${esc(e.officialUrl)}" target="_blank" rel="noopener">Official</a>`:"";
  const line=readerStatusLine(e);
  const hint=line?`<span class="games">${esc(line)}</span>`:"";
  return `<div class="rank-row cal-row">
    <b></b>
    <div>
      <strong>${esc(e.name||'')}</strong>
      <span>${dates} · ${esc(venue)} · ${esc(e.tier||'')}</span>
      <span class="cal-meta">${statusChip(e.status,e.onLive)}${e.armed?' <em class="cal-armed">armed</em>':''}${e.onLive?' <em class="cal-onlive">on WPM LIVE</em>':''}${e.seeded?' <em class="cal-armed">slate</em>':''}</span>
      ${hint}
      <span class="cal-meta">${official}</span>
      ${draw}
    </div>
    <em>${esc(tourMark(e))}</em>
  </div>`;
}
function slateFilterMeta(filter){
  return {
    tpb: { title:"TOP Pickleball", kicker:"scores delayed", copy:"Scores delayed", match:e => e.tour==="tpb" || /gij[oó]n/i.test(e.name||"") },
    "ppa-eu": { title:"PPA Europe", kicker:"ended", copy:"Event ended", match:e => e.tour==="ppa-eu" || /barcelona/i.test(e.name||"") },
    "app-asia": { title:"APP Asia", kicker:"results-only", copy:"Results will appear when available", match:e => e.tour==="app-asia" || (/\bAPP\b/i.test(e.name||"") && /Asia|Chongqing|Taipei|Bangkok|Ho Chi Minh|India Open/i.test(e.name||"")) },
    "mlp-asia": { title:"MLP Asia", kicker:"results-only", copy:"Results will appear when available", match:e => e.tour==="mlp-asia" || /\bMLP\b/i.test(e.name||e.host||"") },
    asia: { title:"PPA Asia", kicker:"results-only", copy:"Results will appear when available", match:e => e.tour==="asia" || /PPA Asia|PPA-ASIA/i.test(e.host||"") },
    gpa: { title:"GPA events", kicker:"results-only", copy:"Results will appear when available", match:e => e.tour==="gpa" || /D-JOY|DJOY/i.test(e.host||e.name||"") }
  }[filter] || null;
}
function armedCalendarRows(){
  const cal = (state.calendar && state.calendar.events) || [];
  return cal.filter(e => e && (e.onLive || e.status === "live-path"));
}
function armedRowForTour(tour){
  return armedCalendarRows().find(e => e.tour === tour || (e.connector && e.connector.type === tour)) || null;
}
function dayTourMatches(tour){
  const day = state.date || boardToday();
  const today = boardToday();
  return (state.matches || []).filter(m => {
    if (!m || m.tour !== tour) return false;
    if (m.date === day) return true;
    return effectiveStatus(m) === "LIVE" && day === today;
  });
}
function tourHasLive(tour){
  return dayTourMatches(tour).some(m => effectiveStatus(m) === "LIVE");
}
/** Finished or in-progress rows, or a calendar day after the event start. Day-3 NEXT is not pre-serve. */
function eventHasStarted(tour){
  const rows = (state.matches || []).filter(m => m && m.tour === tour);
  for (let i = 0; i < rows.length; i++) {
    const st = effectiveStatus(rows[i]);
    if (st === "FT" || st === "LIVE") return true;
  }
  const event = tour === "app" ? (state.appEvent || {}) : (state.ppaEvent || {});
  const start = String(event.startDate || "").slice(0, 10);
  const today = boardToday();
  return !!(start && today && today > start);
}
/** Nothing in progress before the event has produced a result. A later next-only morning is not this. */
function tourPreServe(tour){
  if (tourHasLive(tour)) return false;
  if (eventHasStarted(tour)) return false;
  const board = tour === "app" ? state.appBoard : state.ppaBoard;
  if (board && board.delayed && !board.preServe) return false;
  const rows = dayTourMatches(tour);
  // A day slate of NEXT or FT is match day. Idle qualifiers are not "play starts soon".
  if (rows.some(m => {
    const st = effectiveStatus(m);
    return st === "NEXT" || st === "FT";
  })) return false;
  if (rows.length) return false;
  if (board && board.preServe) return true;
  const armed = armedRowForTour(tour);
  const event = tour === "app" ? (state.appEvent || {}) : (state.ppaEvent || {});
  const start = String((armed && armed.start) || event.startDate || "").slice(0, 10);
  const end = String((armed && (armed.end || armed.start)) || event.endDate || "").slice(0, 10);
  const day = state.date || boardToday();
  if (end && day && end < day) return false;
  if (start && day && start >= day) return true;
  return false;
}
function preServeModel(tour){
  const armed = armedRowForTour(tour) || {};
  if (tour === "app") {
    const ev = state.appEvent || {};
    return {
      tour: "app",
      name: armed.name || ev.name || "Humana APP Louisville Open",
      venue: armed.venue || ev.venue || "Kentucky International Convention Center, Louisville, KY",
      start: String(armed.start || ev.startDate || "2026-10-15").slice(0, 10),
      eventKey: ev.eventKey || "ev:app:18454"
    };
  }
  const ev = state.ppaEvent || {};
  return {
    tour: "ppa",
    name: armed.name || ev.name || "PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026",
    venue: armed.venue || ev.venue || "Kai Tak Arena, Hong Kong",
    start: String(armed.start || ev.startDate || "2026-10-19").slice(0, 10),
    eventKey: ev.eventKey || "ev:ppa:c7e4fd72-d159-4211-82a2-21adbb21defe"
  };
}
function filterWantsPreServe(filter, tour){
  if (filter === "app" || filter === "app-pro") return tour === "app";
  if (filter === "ppa") return tour === "ppa";
  if (filter === "wc" || filter === "npl") return false;
  if (slateFilterMeta(filter)) return false;
  if (filter === "following") return !!(state.selected && state.selected[tourFollowKey(tour)]);
  return tour === "app" || tour === "ppa";
}
function emptyBoardLine(tour, mode){
  if (tourHasLive(tour)) return "";
  const board = tour === "app" ? state.appBoard : state.ppaBoard;
  if (board && board.delayed && !board.preServe) return "Scores delayed";
  if (tour === "app" && ((board && board.ended) || appPinFinished())) return "Event ended";
  if (tourPreServe(tour)) {
    if (mode === "results") return "Results will appear when available";
    return "Play starts soon";
  }
  if (mode === "live") return "Nothing live right now";
  if (mode === "results") return "No results for this day yet";
  if (mode === "matches") return "Nothing scheduled for this day";
  return "";
}
function preServeCard(model, line){
  const text = String(line || "");
  const upcoming = text.indexOf("starts soon") !== -1 || text.indexOf("when available") !== -1;
  const when = upcoming && model.start ? dateChip(model.start) : "";
  const place = [model.venue, when].filter(Boolean).join(" · ");
  const followBtn = tourFollowButton(model.tour);
  return `<section class="comp-card pre-serve">
    <div class="comp-head"><div><h3>${esc(model.name)}</h3><span>${esc(place)}</span></div><div class="comp-actions">${followBtn}</div></div>
    <p class="games">${line}</p>
    <a class="chip" href="/calendar">Calendar</a>
  </section>`;
}
function heroLine(){
  const liveN = (state.matches||[]).filter(m => effectiveStatus(m)==="LIVE").length;
  if (liveN) return liveN + " live now across the board.";
  if (state.filter !== "ppa" && tourPreServe("app")) return "Play starts soon.";
  if (state.filter === "ppa" && tourPreServe("ppa")) return "Play starts soon.";
  if ((state.date || boardToday()) === boardToday()) return "Nothing live right now.";
  return state.heroByDate[state.date] || "";
}
function preServeBoard(filter, mode){
  return ["app", "ppa"].map(tour => {
    if (!filterWantsPreServe(filter, tour)) return "";
    const line = emptyBoardLine(tour, mode);
    if (!line) return "";
    return preServeCard(preServeModel(tour), line);
  }).join("");
}
function slateEmpty(filter){
  const meta = slateFilterMeta(filter);
  if (!meta) {
    const mode = state.boardMode;
    let line = "No matches for this day and filter.";
    if (filter === "following") {
      line = anyFollows()
        ? (mode === "live" ? "Nothing you follow is live right now." : mode === "results" ? "No results for players or tours you follow." : "Nothing you follow is scheduled for this day.")
        : "Nothing you follow is on this board.";
    } else if (mode === "live") line = "Nothing live right now.";
    else if (mode === "results") line = "No results for this day yet.";
    else if (mode === "matches") line = "Nothing scheduled for this day.";
    return `<p class="empty">${line}</p>`;
  }
  const today=ymd(new Date());
  const cal=(state.calendar&&state.calendar.events)||[];
  const rows=cal.filter(e => meta.match(e) && (e.end||e.start||"")>=today).slice(0,8);
  const drawUrl = (rows.find(e => e.drawUrl)||{}).drawUrl || (filter==="tpb" ? GIJON_DRAW_URL : "");
  const draw = officialDrawCta(drawUrl, filter==="tpb" ? "Official draw" : "Draw PDF");
  const body = rows.length ? rows.map(calEventRow).join("") : `<p class="games">${esc(meta.copy)}</p>`;
  const tourBtn = tourFollowButton(filter);
  return `<section class="comp-card">
    <div class="comp-head"><div><h3>${meta.title}</h3><span>${meta.kicker || "results-only"}</span></div><div class="comp-actions">${tourBtn}</div></div>
    ${body}
    ${draw}
    <a class="chip" href="/calendar">Calendar</a>
  </section>`;
}
function drawHref(tour, div, opts){
  opts = opts || {};
  const p = new URLSearchParams();
  if (tour === "wc" || tour === "ppa" || tour === "app") p.set("tour", tour);
  if (div) p.set("div", div);
  if (tour === "app" && (opts.phase === "pool" || opts.phase === "elim")) p.set("phase", opts.phase);
  if (tour === "app" && opts.pool) p.set("pool", String(opts.pool));
  const q = p.toString();
  return "/draw" + (q ? "?" + q : "");
}
function drawHrefForMatch(m){
  const div = String((m && m.div) || "").split(" · ")[0].trim();
  if (!m || m.tour !== "app") return drawHref(m && m.tour, div);
  const phase = appSlotPhase(m) === "pool" ? "pool" : "elim";
  return drawHref("app", div, { phase, pool: m.pool || "" });
}
function applyDrawQuery(){
  const qt = qs("tour");
  const qd = qs("div");
  const qp = qs("phase");
  const qpool = qs("pool");
  if (qt === "wc" || qt === "ppa" || qt === "app") {
    state.drawTour = qt;
    state.filter = qt === "app" ? "app-pro" : qt;
  }
  if (qd) state.drawDiv = qd;
  if (qt === "app" && (qp === "pool" || qp === "elim")) state.drawPhase = qp;
  if (qt === "app" && qpool) state.drawPool = qpool;
}
function syncDrawUrl(){
  if (state.boardMode !== "draw" && path() !== "/draw") return;
  const tour = state.drawTour === "wc" ? "wc" : state.drawTour === "app" ? "app" : "ppa";
  const opts = tour === "app" ? { phase: state.drawPhase === "pool" ? "pool" : "elim", pool: state.drawPool || "" } : {};
  const href = drawHref(tour, state.drawDiv || "", opts);
  if ((location.pathname + location.search) !== href) history.replaceState({}, "", href);
}
function drawNext(m){
  if (m.tour !== "ppa" && m.tour !== "wc" && m.tour !== "app") return "";
  const div = String(m.div||"").split(" · ")[0].trim();
  const wall = drawHrefForMatch(m);
  const nameBits = (m.a+" "+m.b).split(/[\/ ]+/).filter(w => w.length>2);
  const all = [];
  [state.brackets, state.wcBrackets, state.appBrackets].forEach(br => Object.values(br||{}).forEach(rounds => Object.values(rounds).forEach(arr => all.push(...arr))));
  const later = all.filter(x => x.id !== m.id && x.status !== "FT" && hasDrawSides(x) && nameBits.some(n => (x.a+" "+x.b).includes(n)));
  if (!later.length) return `<p class="games"><a href="${wall}">See the draw${div?" · "+String(div).replace(/&/g,"&amp;").replace(/</g,"&lt;"):""}</a></p>`;
  return `<div class="panel"><div class="kicker">Up next in the draw</div>${later.slice(0,3).map(x=>`<a class="match" href="/match/${x.id}"><div class="line"><div class="a">${x.a}</div><div class="score">${x.score||"vs"}</div><div class="b">${x.b}</div></div></a>`).join("")}<a class="chip" href="${wall}">Full draw${div?" · "+String(div).replace(/&/g,"&amp;").replace(/</g,"&lt;"):""}</a></div>`;
}
function viewMatch(id){
  const raw = byId(id);
  const m = raw ? presentMatch(raw) : raw;
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
      <div class="names"><h2>${sideLinks(m.a)}</h2><div></div><h2>${sideLinks(m.b)}</h2></div>
      <div class="big">${centerScore(m)}</div>
      <div class="gamepills">${(m.lines&&m.lines.length?m.lines.map(l=>`${l.disc} ${l.score||""} ${l.live?"LIVE":l.winner||""}`.trim()):games).map(g=>`<span>${g}</span>`).join("")}</div>
      ${m.lines&&m.lines.length?`<table class="scorecard"><thead><tr><th>Discipline</th><th>${m.a}</th><th>${m.b}</th><th></th></tr></thead><tbody>${m.lines.map(l=>{
        const pts=String(l.score||"").split("–");
        return `<tr class="${l.live?"live":""}"><td>${l.disc}${l.live?" · LIVE":""}</td><td>${pts[0]||""}</td><td>${pts[1]||""}</td><td>${l.winner||l.court||""}</td></tr>`;
      }).join("")}</tbody></table>`:""}
      <p class="updated">${scheduledLocalLabel(m)?scheduledLocalLabel(m)+(m.tz?" "+String(m.tz).split("/").pop():"")+" local":""}${courtOnCard(m)?" · "+courtOnCard(m):""}${state.updated?" · Updated "+new Date(state.updated).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}):""}</p>
      <p class="games">${publicProse(m.note)}</p>
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

function resultShape(m){
  if (!m) return "";
  const sides = [normName(m.a), normName(m.b)].filter(Boolean).sort().join("|");
  return [m.tour || "", String(m.date || ""), sides, normName(m.comp || ""), normName(m.round || "")].join("~");
}
function personMatchPool(){
  const out = [];
  const seen = new Set();
  const shapes = new Map();
  function push(m){
    if (!m) return;
    const id = m.id ? String(m.id) : "";
    const shape = resultShape(m);
    if (id && seen.has(id)) return;
    if (shape && shapes.has(shape)) {
      const idx = shapes.get(shape);
      const prev = out[idx];
      if (prev && prev.status !== "FT" && m.status === "FT") {
        if (id) seen.add(id);
        out[idx] = m;
      }
      return;
    }
    if (id) seen.add(id);
    if (shape) shapes.set(shape, out.length);
    out.push(m);
  }
  (state.matches || []).forEach(push);
  Object.keys(state.archiveCache || {}).forEach(id => {
    const rows = (state.archiveCache[id] && state.archiveCache[id].matches) || [];
    rows.forEach(m => {
      if (!m || m.status !== "FT") return;
      push(m);
    });
  });
  return out;
}
function matchesForPerson(kind, id, rec){
  const followKey = rec.followKey || id;
  const fullName = rec.name || id;
  return personMatchPool().filter(m => {
    const tags = m.tags || [];
    if (tags.includes(followKey) || tags.includes(id)) return true;
    if (kind === "team") {
      const names = [fullName, followKey, id].filter(Boolean);
      const a = String(m.a||""), b = String(m.b||"");
      if (names.some(t => a === t || b === t || normName(a) === normName(t) || normName(b) === normName(t))) return true;
      if ((followKey === "USA" || id === "USA") && (/united states|^usa$/i.test(a) || /united states|^usa$/i.test(b))) return true;
      return false;
    }
    if (splitSides(m.a).concat(splitSides(m.b)).some(p => sidePartIsPerson(p, rec))) return true;
    const parts = [m.a, m.b, m.roster, m.games, m.note, ...(tags), ...((m.lines||[]).flatMap(l => [l.disc, l.winner, l.a, l.b]))];
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
  if (!state.rankings) return `<p class="empty">Rankings loading…</p>`;
  if (!cards || !cards.length) {
    return `<p class="empty">No labelled ranking row yet on GPA, WPR or PPA World.</p>`;
  }
  return `<div class="rank-cards">${cards.map(c => `
    <div class="rank-card">
      <div class="src">${esc(c.source)}</div>
      <b>#${esc(c.rank)}</b>
      <div class="cat">${esc(c.cat||"")}</div>
      ${c.detail?`<div class="detail">${esc(c.detail)}</div>`:""}
      ${c.source==="WPR" && c.dupr?`<div class="detail">DUPR ${esc(c.dupr)}</div>`:""}
    </div>`).join("")}</div>
    <p class="games" style="margin-top:10px">Sources stay labelled — GPA, WPR and PPA World are different boards, not one world #1.</p>`;
}
function personInitials(name){
  const t = nameTokens(name);
  if (!t.length) return "·";
  if (t.length === 1) return t[0].slice(0, 2).toUpperCase();
  return (t[0][0] + t[t.length - 1][0]).toUpperCase();
}
function sidePartIsPerson(part, rec){
  const name = (rec && rec.name) || "";
  const follow = (rec && rec.followKey) || "";
  if (!part || !name) return false;
  if (personInText(name, part) || rankingNameMatches(name, part) || normName(part) === normName(name)) return true;
  const tokens = nameTokens(part);
  const pt = nameTokens(name);
  // Doubles cards print last names only ("Waters / Parenteau"). Token equality, not a substring.
  if (tokens.length === 1 && pt.length && tokens[0] === pt[pt.length - 1]) return true;
  if (follow && tokens.length === 1 && tokens[0] === normName(follow)) return true;
  return false;
}
function personOnSide(side, rec){
  return splitSides(side).some(p => sidePartIsPerson(p, rec));
}
function wprSnapshot(rec){
  const card = (rec.rankings || []).find(c => c.source === "WPR");
  const wave = wavePlayerForProfile(rec);
  const elo = card && card.elo != null && card.elo !== "" ? card.elo : (wave && wave.elo != null && wave.elo !== "" ? wave.elo : null);
  const rank = card && card.rank ? card.rank : null;
  if (elo == null) return null;
  return { elo, rank };
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
    return `<a href="${playerPath(label)}">${esc(label)}</a>`;
  }).join(" / ");
}
function waveRecentPanel(rec){
  if (!state.rankings) return "";
  const wave = wavePlayerForProfile(rec);
  const rows = wave ? (wave.recent || []).slice(0, 8) : [];
  if (!rows.length) {
    const degraded = ((state.rankings || {}).waveMeta || {}).degraded;
    if (!(degraded && degraded.length)) return "";
    return `<div class="panel" style="margin-top:18px">
      <div class="kicker">Pro tour</div>
      <p class="empty">Pro tour pool unavailable this minute.</p>
      <p class="games">Source: public boards · labelled WPR — not GPA or PPA World.</p>
    </div>`;
  }
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
  }).join("") : `<p class="empty">No public recent tour matches parsed yet.</p>`;
  const watch = (wave.watch || []).slice(0, 4);
  const watchHtml = watch.length ? `<div class="chips" style="margin-top:12px">${watch.map(w =>
    `<a class="chip" href="${w.url}" target="_blank" rel="noopener">${(w.title||"Watch").slice(0,42)}</a>`
  ).join("")}</div>` : "";
  return `<div class="panel" style="margin-top:18px">
    <div class="kicker">Pro tour</div>
    <p class="games" style="margin-bottom:10px">Public tour cards · restyled in WPM · ${wave.elo!=null ? wprText(wave.elo) : "WPR"} · Open mixed · not an iframe</p>
    ${list}
    ${watchHtml}
  </div>`;
}

function personRoundLabel(m){
  const round = String((m && m.round) || "").trim();
  if (round) return round;
  const parts = String((m && m.div) || "").split(" · ").map(s => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(" · ") : "";
}
function profileScore(m, rec){
  const st = effectiveStatus(m);
  const raw = String((m && m.score) || "").trim();
  if (st === "LIVE" && /^0\s*[-–]\s*0$/.test(raw)) {
    const numeric = (m.lines || []).some(l => /\d/.test(String(l && l.score || "")));
    if (!numeric) return "";
  }
  const g = raw.match(/^(\d+)\s*([-–])\s*(\d+)$/);
  if (g && rec) {
    const onA = personOnSide(m.a, rec);
    const onB = personOnSide(m.b, rec);
    if (onB && !onA) return g[3] + g[2] + g[1];
    if (onA && !onB) return g[1] + g[2] + g[3];
  }
  if (!raw) return st === "NEXT" ? "vs" : "";
  return raw;
}
function personResultRow(m, rec){
  const st = effectiveStatus(m);
  const outcome = st === "FT" ? personOutcome(m, rec) : "";
  const onA = personOnSide(m.a, rec);
  const onB = personOnSide(m.b, rec);
  const opp = onA && !onB ? sideLinks(m.b) : onB && !onA ? sideLinks(m.a) : `${sideLinks(m.a)} <span class="games">vs</span> ${sideLinks(m.b)}`;
  const when = m.date ? dateChip(m.date) : "";
  const divName = String(m.div || "").split(" · ")[0].trim();
  const round = personRoundLabel(m);
  const meta = [m.comp, divName && divName !== round ? divName : "", round, when].filter(Boolean).map(s => esc(s)).join(" · ");
  const wall = (m.tour === "app" || m.tour === "ppa" || m.tour === "wc") ? ` · <a href="${drawHrefForMatch(m)}">Draw</a>` : "";
  const score = esc(profileScore(m, rec));
  const chip = (outcome === "W" || outcome === "L")
    ? `<a class="statuscol wl ${outcome === "W" ? "w" : "l"}" href="/match/${esc(m.id)}">${outcome}</a>`
    : `<a class="statuscol st ${st}" href="/match/${esc(m.id)}">${st==="LIVE"?"<span class='dot'></span>":""}${st === "LIVE" ? "LIVE" : st === "FT" ? "FT" : "NEXT"}</a>`;
  return `<div class="result-row">
    ${chip}
    <div>
      <div class="opp">${onA !== onB ? "vs " : ""}${opp}</div>
      <span class="meta">${meta}${wall}</span>
    </div>
    <a class="scorecol" href="/match/${esc(m.id)}">${score}</a>
  </div>`;
}
function personOutcome(m, rec){
  if (!m || effectiveStatus(m) !== "FT" || !m.score) return "";
  const onA = personOnSide(m.a, rec);
  const onB = personOnSide(m.b, rec);
  if (onA === onB) return "";
  const g = String(m.score).match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!g) return "";
  const mine = onA ? Number(g[1]) : Number(g[2]);
  const opp = onA ? Number(g[2]) : Number(g[1]);
  if (!Number.isFinite(mine) || !Number.isFinite(opp) || mine === opp) return "";
  return mine > opp ? "W" : "L";
}
function byRecent(a, b){
  const d = String(b.date || "").localeCompare(String(a.date || ""));
  if (d) return d;
  return (parseUtc(b.start)?.getTime() || 0) - (parseUtc(a.start)?.getTime() || 0);
}
function personFormMarks(list, rec){
  const sorted = (list || []).filter(m => effectiveStatus(m) === "FT").slice().sort(byRecent);
  const marks = [];
  const tours = [];
  const events = [];
  sorted.forEach(m => {
    if (marks.length >= 8) return;
    const o = personOutcome(m, rec);
    if (!o) return;
    marks.push(o);
    const tour = m.tour || "";
    if (tour && tours.indexOf(tour) < 0) tours.push(tour);
    const ev = m.comp || "";
    if (ev && events.indexOf(ev) < 0) events.push(ev);
  });
  const wins = marks.filter(x => x === "W").length;
  return { marks, string: marks.join(""), wins, losses: marks.length - wins, tours, events };
}
function personFormHtml(list, rec){
  const summary = personFormMarks(list, rec);
  const marks = summary.marks;
  if (!marks.length) return "";
  const tourLabel = summary.tours.map(t => TOUR_LABELS[t] || t).join(" · ");
  const finished = (list || []).filter(m => effectiveStatus(m) === "FT");
  let allW = 0, allL = 0;
  finished.forEach(m => {
    const o = personOutcome(m, rec);
    if (o === "W") allW++;
    else if (o === "L") allL++;
  });
  const wider = (allW + allL) > marks.length
    ? `<p class="games">${allW}–${allL} from finished matches on this profile.</p>`
    : "";
  return `<div class="panel form-panel" style="margin-top:18px"><div class="kicker">Form</div><div class="form-head"><b class="form-string">${esc(summary.string)}</b><span class="form-record">${summary.wins}–${summary.losses}</span></div><div class="form-pips">${marks.map(x => `<b class="${x==="W"?"w":"l"}">${x}</b>`).join("")}</div><p class="games">Last ${marks.length} with a recorded winner${tourLabel ? " · " + esc(tourLabel) : ""} · most recent first.</p>${wider}</div>`;
}
function personMatchList(list, rec){
  const rank = { LIVE:0, NEXT:1 };
  const open = (list || []).filter(m => effectiveStatus(m) !== "FT").sort((a,b) => {
    const d = (rank[effectiveStatus(a)] ?? 3) - (rank[effectiveStatus(b)] ?? 3);
    if (d) return d;
    return (parseUtc(a.start)?.getTime()||0) - (parseUtc(b.start)?.getTime()||0);
  }).slice(0, 8);
  const finished = (list || []).filter(m => effectiveStatus(m) === "FT").slice().sort(byRecent);
  const openHtml = open.length ? `<div class="panel" style="margin-top:18px"><div class="kicker">This week</div>${open.map(m => personResultRow(m, rec)).join("")}</div>` : "";
  const moreKey = "player-ft:" + ((rec && (rec.followKey || rec.name)) || "player");
  const shown = state.more[moreKey] ? finished : finished.slice(0, 30);
  const body = finished.length
    ? shown.map(m => personResultRow(m, rec)).join("") + slateMoreButton(moreKey, finished.length, state.more[moreKey] ? 30 : shown.length, "results")
    : `<p class="empty">No finished matches yet.</p>`;
  return openHtml + `<div class="panel" style="margin-top:18px"><div class="kicker">Recent results</div>${body}</div>`;
}
function dossierCacheKey(name){
  return String(name || "").toLowerCase().replace(/[.'’]/g, "").replace(/\s+/g, " ").trim();
}
function dossierHttps(url){
  const s = String(url || "").trim();
  if (!/^https:\/\//i.test(s)) return "";
  return s;
}
function ensureDossier(name){
  const key = dossierCacheKey(name);
  if (!key) return null;
  const hit = state.dossier[key];
  if (hit) return hit.miss ? null : hit;
  if (state.dossierPending[key]) return null;
  state.dossierPending[key] = true;
  const q = "/api/dossier?name=" + encodeURIComponent(name) + "&n=8";
  fetch(q, { cache: "no-store" }).then(res => {
    if (res.status === 404 || res.status === 409) return { miss: true };
    if (!res.ok) return { miss: true };
    return res.json().then(data => data || { miss: true }).catch(() => ({ miss: true }));
  }).then(data => {
    const pack = data && data.name && !data.miss ? data : { miss: true };
    const stored = pack.miss ? { miss: true } : pack;
    state.dossier[key] = stored;
    if (!stored.miss && stored.search_name) state.dossier[dossierCacheKey(stored.search_name)] = stored;
  }).catch(() => {
    state.dossier[key] = { miss: true };
  }).then(() => {
    state.dossierPending[key] = false;
    if (path().startsWith("/player/")) render();
  });
  return null;
}
function dossierHtml(rec){
  if (!rec || !rec.name) return "";
  const d = ensureDossier(rec.name);
  if (!d || d.miss) return "";
  const totals = d.seasonTotals || {};
  const points = totals.points != null ? totals.points + " fantasy pts" : "";
  const events = totals.eventsPlayed != null ? totals.eventsPlayed + " events" : "";
  const weeks = totals.gameweeksScored != null ? totals.gameweeksScored + " gameweeks" : "";
  const head = [points, events, weeks].filter(Boolean).join(" · ");
  const form = (d.recentForm || []).map(r => {
    const matches = (r.matches || []).map(g => {
      const who = g.opponentName ? "vs " + esc(g.opponentName) : "";
      const line = g.scoreline ? esc(g.scoreline) : "";
      const mark = g.won === true ? "W" : g.won === false ? "L" : "";
      return `<span class="games">${mark ? esc(mark) + " " : ""}${esc(g.round || "")} ${who}${line ? " " + line : ""}</span>`;
    }).join(" ");
    const meta = [r.tour, r.discipline, r.roundLabel, r.points != null ? r.points + " fantasy pts" : ""].filter(Boolean).map(s => esc(s)).join(" · ");
    return `<div class="rank-row"><b>${esc(r.furthestRound || "·")}</b><div><strong>${esc(r.eventName || "Event")}</strong><span>${meta}</span>${matches ? `<div>${matches}</div>` : ""}</div></div>`;
  }).join("");
  const partners = (d.partnerFrequency || []).slice(0, 8).map(p => {
    const label = p.name || "";
    if (!label) return "";
    return `<a class="chip" href="${playerPath(label)}">${esc(label)}${p.matches != null ? " · " + esc(p.matches) : ""}</a>`;
  }).join("");
  const h2h = (d.h2h || []).slice(0, 8).map(h => {
    const rec = (h.wins != null || h.losses != null) ? `${h.wins || 0}–${h.losses || 0}` : "";
    return `<div class="rank-row"><b>${esc(rec)}</b><div><strong>${esc(h.opponentName || "")}</strong><span>${h.matches != null ? esc(h.matches) + " matches" : ""}</span></div></div>`;
  }).join("");
  const disclaimer = d.disclaimer || "Fantasy points are not LIVE/FT match scores.";
  return `<div class="panel dossier" style="margin-top:18px">
    <div class="kicker">2026 season dossier (Fantasy research)</div>
    ${d.reason ? `<p class="blurb">${esc(d.reason)}</p>` : ""}
    ${head ? `<p class="games">${esc(head)}</p>` : ""}
    ${form ? `<div class="slate-kicker">Season event log</div>${form}` : ""}
    ${partners ? `<div class="slate-kicker">Regular partners</div><div class="chips">${partners}</div>` : ""}
    ${h2h ? `<div class="slate-kicker">H2H</div>${h2h}` : ""}
    <p class="games dossier-note">${esc(disclaimer)}</p>
  </div>`;
}
function viewPerson(kind, id){
  id = decodeURIComponent(id||"");
  pullProfileArchives();
  const rec = lookupPerson(kind, id);
  if (!rec) return `<div class="wrap"><p class="empty">Not found.</p></div>`;
  const followKey = rec.followKey || id;
  const list = matchesForPerson(kind, id, rec);
  const stories = storiesForPerson(rec, followKey);
  const following = !!state.selected[followKey];
  const snap = kind === "player" ? wprSnapshot(rec) : null;
  const badge = snap ? `<div class="wpr-badge"><b>${esc(snap.elo)}</b><span>WPR · Open mixed${snap.rank ? " · #"+esc(snap.rank) : ""}</span></div>` : "";
  const dossier = kind === "player" ? ensureDossier(rec.name) : null;
  const photo = dossier && !dossier.miss ? dossierHttps(dossier.photo_url) : "";
  const avatar = photo
    ? `<img class="avatar photo" src="${escAttr(photo)}" alt="" data-initials="${escAttr(personInitials(rec.name))}">`
    : `<div class="avatar" aria-hidden="true">${esc(personInitials(rec.name))}</div>`;
  return `<div class="wrap">
    <div class="person-hero">
      ${avatar}
      <div class="who">
        <p class="kicker">${kind==="player"?"Player":"Team"}</p>
        <h2>${esc(rec.name)}</h2>
        <p class="role">${esc(rec.role||"")}</p>
        ${rec.blurb?`<p class="blurb">${esc(rec.blurb)}</p>`:""}
      </div>
      <div class="person-actions">
        ${badge}
        <button class="btn ${following?"gold":""}" data-follow="${esc(followKey)}">${following?"Following":"Follow"}</button>
      </div>
    </div>
    ${kind==="player"?`<div class="panel" style="margin-top:18px">
      <div class="kicker">Rankings</div>
      ${rankingCardsHtml(rec.rankings||[])}
    </div>`:""}
    ${kind==="player"?personFormHtml(list, rec):""}
    ${kind==="player"?dossierHtml(rec):""}
    ${personMatchList(list, rec)}
    ${kind==="player"?waveRecentPanel(rec):""}
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
    return `<div class="panel"><p class="games">Live alerts on. Web Push fires when a followed player or a followed tour match goes LIVE, even with this tab closed. One ping per match until it leaves LIVE.</p></div>`;
  }
  if (p === "denied") {
    return `<div class="panel"><p class="games">Live alerts blocked. Allow notifications for this site in browser settings, then reload.</p></div>`;
  }
  return `<div class="panel"><p class="games">Get a ping when someone you follow walks on.</p><button class="btn gold" type="button" id="enableAlerts">Turn on live alerts</button></div>`;
}

function followedTourRows(){
  const tours = followedTourKeys();
  if (!tours.length) return `<p class="empty">None.</p>`;
  return tours.map(k => `<div class="rank-row">
    <b></b>
    <div>
      <strong>${esc(tourLabel(k))}</strong>
      <span class="cal-meta"><button class="chip on" data-follow="${esc(k)}">Following</button></span>
    </div>
  </div>`).join("");
}
function viewFollowing(){
  const people = followTagsList();
  const tours = followedTourKeys();
  const quiet = !people.length && !tours.length;
  const list = quiet ? [] : state.matches.filter(followsBoardMatch).sort((a,b)=>{
    const ra={LIVE:0,NEXT:1,FT:2}[effectiveStatus(a)];
    const rb={LIVE:0,NEXT:1,FT:2}[effectiveStatus(b)];
    if(ra!==rb) return ra-rb;
    return (parseUtc(a.start)?.getTime()||0)-(parseUtc(b.start)?.getTime()||0);
  });
  const peopleHtml = people.length
    ? people.map(k => {
        const href = TEAMS[k] ? "/team/"+encodeURIComponent(k) : "/player/"+encodeURIComponent(k);
        return `<div class="rank-row">
          <b></b>
          <div>
            <strong><a href="${href}">${esc(followPersonLabel(k))}</a></strong>
            <span class="cal-meta"><button class="chip on" data-follow="${esc(k)}">Following</button></span>
          </div>
        </div>`;
      }).join("")
    : `<p class="empty">None.</p>`;
  return `<div class="wrap">
    <h2 style="font-family:Inter,sans-serif;font-weight:800;font-size:32px">Following</h2>
    ${quiet?"":alertsCta()}
    <div class="panel"><div class="kicker">Tours</div>${followedTourRows()}</div>
    <div class="panel"><div class="kicker">Players</div>${peopleHtml}</div>
    ${quiet?"":`<div class="panel">${list.length?list.map(matchRow).join(""):"<p class='empty'>None.</p>"}</div>`}
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
    <div class="ph" style="background:linear-gradient(135deg,#1a1540,#0b1020);color:#F7EA05;display:flex;align-items:flex-end;padding:12px;font-family:Inter,sans-serif;font-weight:800;font-size:13px">${p.cat.toUpperCase()}</div>
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
/** Map official PPA round strings → R64/R32/R16/QF/SF/F/Bronze. APP keeps Final (not F). WC keeps Round N; never bare "Round". */
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
    if (/^finals?$/.test(t) || t === "f") return tour === "app" ? "Final" : "F";
    return s;
  }
  const num = s.match(/^round\s*(\d+)$/i);
  if (num) return "Round " + Number(num[1]);
  if (/quarter|semi|final|bronze|third/i.test(s)) return normalizeRoundLabel("ppa", s) || s;
  return s;
}
function roundSortKey(tour, label){
  if (tour === "ppa" || tour === "app") {
    const order = tour === "app"
      ? ["R128","R64","R32","R16","QF","SF","Bronze","Final","F"]
      : ["R128","R64","R32","R16","QF","SF","Bronze","F"];
    const i = order.indexOf(tour === "app" ? label : (label === "Final" ? "F" : label));
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
    date: m.date,
    format: m.format || "",
    pool: m.pool || null
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
const APP_ELIM_LATE = ["R16", "QF", "SF", "F", "Final", "Bronze"];
const APP_ELIM_EARLY = ["R128", "R64", "R32"];
const APP_ELIM_ORDER = ["R128", "R64", "R32", "R16", "QF", "SF", "Bronze", "F", "Final"];
function appRoundUsable(raw){
  const s = String(raw || "").trim();
  if (!s || /^round$/i.test(s) || s === "undefined" || s === "null") return "";
  return s;
}
function appSlotPhase(m){
  const fmt = String((m && m.format) || "");
  if (fmt === "pool") return "pool";
  if (fmt === "ko" || fmt === "elim") return "elim";
  const round = appRoundUsable(m && m.round);
  if (/^round\s+\d+$/i.test(round)) return "pool";
  return "elim";
}
function appWallBands(slots){
  const pool = [];
  const elim = [];
  const seenP = new Set();
  const seenE = new Set();
  const elimSlots = [];
  (slots || []).forEach(m => {
    const a = String((m && m.a) || "").trim();
    const b = String((m && m.b) || "").trim();
    if (!a || !b || /^(tbd|tba|winner|loser|bye|-|—|–)$/i.test(a) || /^(tbd|tba|winner|loser|bye|-|—|–)$/i.test(b)) return;
    const round = appRoundUsable(m && m.round);
    if (!round) return;
    const phase = appSlotPhase(Object.assign({}, m, { round }));
    if (phase === "pool") {
      if (!seenP.has(round)) { seenP.add(round); pool.push(round); }
    } else {
      elimSlots.push(Object.assign({}, m, { round }));
      if (!seenE.has(round)) { seenE.add(round); elim.push(round); }
    }
  });
  const num = s => Number((String(s).match(/\d+/) || ["999"])[0]);
  pool.sort((a, b) => num(a) - num(b) || String(a).localeCompare(String(b)));
  const rank = label => {
    const i = APP_ELIM_ORDER.indexOf(label);
    if (i >= 0) return i;
    const n = String(label).match(/^Round\s+(\d+)$/i);
    if (n) return 100 + Number(n[1]);
    return 400;
  };
  elim.sort((a, b) => rank(a) - rank(b) || String(a).localeCompare(String(b)));
  const late = elim.filter(l => APP_ELIM_LATE.includes(l));
  const early = elim.filter(l => APP_ELIM_EARLY.includes(l));
  const other = elim.filter(l => !APP_ELIM_LATE.includes(l) && !APP_ELIM_EARLY.includes(l));
  let elimShow = elim;
  if (late.length) {
    const hot = early.some(r => elimSlots.some(m => m.round === r && (m.status === "LIVE" || m.status === "NEXT")));
    elimShow = (hot ? early : []).concat(late).concat(other);
    elimShow.sort((a, b) => rank(a) - rank(b) || String(a).localeCompare(String(b)));
  }
  return { pool, elim: elimShow };
}
function appDivsForPhase(phase, brackets){
  const names = new Set();
  (state.appBracketIndex || []).forEach(b => { if (b && b.phase === phase && b.name) names.add(b.name); });
  Object.keys(brackets || {}).forEach(div => {
    const slots = [];
    Object.entries(brackets[div] || {}).forEach(([round, arr]) => (arr || []).forEach(m => slots.push(Object.assign({ round }, m))));
    if (slots.some(m => appSlotPhase(m) === phase && hasDrawSides(m))) names.add(div);
  });
  return sortDivKeys("app", [...names]);
}
function appPoolNumbers(div, brackets){
  const nums = new Set();
  (state.appBracketIndex || []).forEach(b => {
    if (b && b.phase === "pool" && b.name === div && b.poolNumber) nums.add(Number(b.poolNumber));
  });
  Object.values((brackets || {})[div] || {}).forEach(arr => (arr || []).forEach(m => {
    if (m && m.pool && appSlotPhase(m) === "pool") nums.add(Number(m.pool));
  }));
  return [...nums].filter(n => n > 0).sort((a, b) => a - b);
}
function appIndexRow(div, phase, pool){
  return (state.appBracketIndex || []).find(b => b && b.name === div && b.phase === phase && (!pool || String(b.poolNumber) === String(pool))) || null;
}
function appIndexWord(row){
  if (!row) return "";
  if (row.status === "in-progress") return "In progress";
  if (row.status === "complete") return "Complete";
  return "Not started";
}
function appColumnHtml(tour, round, items){
  if (!items.length) return "";
  const heading = round === "F" ? "Final" : round;
  const knockout = /^(QF|SF|F|Final|Bronze)$/.test(round);
  const stLabel = m => {
    const st = effectiveStatus(m);
    return st === "LIVE" ? "LIVE" : st === "FT" ? "FT" : "Next";
  };
  return `<div class="bracket-col ${knockout?"knockout":""}"><h3>${esc(heading)}</h3>${items.map(m => `
      <a class="bracket-match ${effectiveStatus(m)==="LIVE"?"live":""}" href="/match/${esc(m.id)}">
        <div><b>${esc(m.a)}</b><span>${effectiveStatus(m)==="NEXT"?"":esc((m.score||"").split("-")[0]||"")}</span></div>
        <div><b>${esc(m.b)}</b><span>${effectiveStatus(m)==="NEXT"?"":esc((m.score||"").split("-")[1]||"")}</span></div>
        <em>${stLabel(m)}</em>
      </a>`).join("")}</div>`;
}
function appDrawBoard(brackets){
  const phase = state.drawPhase === "pool" ? "pool" : "elim";
  state.drawPhase = phase;
  const divs = appDivsForPhase(phase, brackets);
  const prefer = divs.find(d => /\bpro\b/i.test(d) && !/backdraw/i.test(d)) || divs[0] || "";
  const div = state.drawDiv && divs.includes(state.drawDiv) ? state.drawDiv : prefer;
  state.drawDiv = div;
  const pools = phase === "pool" ? appPoolNumbers(div, brackets) : [];
  const poolOn = pools.length > 1;
  let pool = poolOn ? (pools.map(String).includes(String(state.drawPool)) ? String(state.drawPool) : String(pools[0])) : "";
  state.drawPool = pool;
  const slots = [];
  Object.entries((brackets || {})[div] || {}).forEach(([round, arr]) => {
    (arr || []).forEach(m => slots.push(Object.assign({ round }, m)));
  });
  const filtered = slots.filter(m => appSlotPhase(m) === phase && (!pool || String(m.pool || "") === String(pool)));
  const bands = appWallBands(filtered);
  const labels = phase === "pool" ? bands.pool : bands.elim;
  const cols = labels.map(r => {
    const items = filtered.filter(m => m.round === r && hasDrawSides(m)).slice(0, 32);
    return appColumnHtml("app", r, items);
  }).join("");
  const row = appIndexRow(div, phase, pool);
  const structure = (row && row.line) || (phase === "pool" ? "Pools" : "Elimination");
  const quiet = !cols;
  const soon = tourPreServe("app") || (row && row.status === "pending");
  const emptyLine = soon ? "Play starts soon" : "Results will appear when available";
  const word = quiet ? appIndexWord(row) : "";
  const note = div
    ? `${esc(divChipLabel(div))} · ${esc(structure)}${word ? " · " + esc(word) : ""}`
    : (phase === "pool" ? "Pools" : "Elimination");
  const tourSeg = `<div class="seg" style="margin:0 0 12px">
      <button data-drawtour="ppa">PPA</button>
      <button data-drawtour="app" class="on">APP</button>
      <button data-drawtour="wc">World Cup</button>
    </div>`;
  const phaseSeg = `<div class="seg" style="margin:0 0 12px">
      <button data-drawphase="elim" class="${phase==="elim"?"on":""}">Elimination</button>
      <button data-drawphase="pool" class="${phase==="pool"?"on":""}">Pools</button>
    </div>`;
  const divSeg = `<div class="seg draw-divs" style="margin:0 0 12px">${divs.map(d=>`<button data-draw="${escAttr(d)}" class="${d===div?"on":""}">${esc(divChipLabel(d))}</button>`).join("")}</div>`;
  const poolSeg = poolOn ? `<div class="seg draw-divs" style="margin:0 0 12px">${pools.map(n=>`<button data-drawpool="${n}" class="${String(n)===String(pool)?"on":""}">Pool ${n}</button>`).join("")}</div>` : "";
  const hint = quiet ? "" : (phase === "pool"
    ? "Round robin stays Round N. Playoff rounds show under Elimination when both sides are published."
    : "Elimination rounds from the published draw. Empty later rounds stay hidden.");
  syncDrawUrl();
  return `${tourSeg}${phaseSeg}${divSeg}${poolSeg}
    <p class="draw-wall-note">${note}${hint ? " · " + hint : ""}</p>
    <div class="bracket">${cols || `<p class="games">${emptyLine}</p>`}</div>`;
}
function drawBoard(){
  if (state.filter === "wc") state.drawTour = "wc";
  if (state.filter === "ppa") state.drawTour = "ppa";
  if (state.filter === "app" || state.filter === "app-pro") state.drawTour = "app";
  const tour = state.drawTour === "wc" ? "wc" : state.drawTour === "app" ? "app" : "ppa";
  if (tour === "app") {
    const brackets = bracketsFromMatches("app");
    return appDrawBoard(brackets);
  }
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
  if (tour === "app") note = "APP knockout wall · rounds from the published draw. Empty later rounds stay hidden.";
  const quietDraw = tour === "app" && !cols;
  if (quietDraw) note = "";
  const empty = quietDraw
    ? `<p class="games">${tourPreServe("app") ? "Play starts soon" : "Results will appear when available"}</p>`
    : "<p class='empty'>No draw slots with both sides yet.</p>";
  return `
    <div class="seg" style="margin:0 0 12px">
      <button data-drawtour="ppa" class="${tour==="ppa"?"on":""}">PPA</button>
      <button data-drawtour="app" class="${tour==="app"?"on":""}">APP</button>
      <button data-drawtour="wc" class="${tour==="wc"?"on":""}">World Cup</button>
    </div>
    <div class="seg draw-divs" style="margin:0 0 12px">${divs.map(d=>`<button data-draw="${d}" class="${d===div?"on":""}">${divChipLabel(d)}</button>`).join("")||(quietDraw?"":"<span class='empty'>No divisions yet</span>")}</div>
    ${note?`<p class="draw-wall-note">${note}${div ? " · <strong>"+divChipLabel(div)+"</strong>" : ""}</p>`:""}
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
  const all = data.events || [];
  const upcoming = all.filter(e => (e.end || e.start || "") >= today);
  const past = all.filter(e => (e.end || e.start || "") < today).slice(-8).reverse();
  const armed = (data.armed || []).slice().sort((a,b)=>String(a.start).localeCompare(String(b.start)));
  const list = (rows, title) => `<div class="panel"><div class="kicker">${title}</div>${rows.length?rows.map(calEventRow).join(""):"<p class='empty'>None</p>"}</div>`;
  const armedBlock = armed.length
    ? `<div class="panel"><div class="kicker">On WPM LIVE</div>${armed.map(a=>`<div class="rank-row"><b></b><div><strong>${esc(a.name)}</strong><span>${a.start} → ${a.end} · ${esc(a.venue)} · ${esc(a.timezone||"—")}</span><span class="cal-meta">${statusChip(a.status,a.onLive)}${a.onLive?' <em class="cal-onlive">on WPM LIVE</em>':''}</span></div><em>${esc(a.tour)}</em></div>`).join("")}</div>`
    : `<div class="panel"><div class="kicker">On WPM LIVE</div><p class="empty">None yet.</p></div>`;
  return `<div class="hero">
    <div class="desk">CALENDAR</div>
    <h2>TOUR SLATE</h2>
    <p>Upcoming APP, PPA, GPA and MLP Asia. MLP Asia is not APP. <b>On WPM LIVE</b> only when a score path is already armed. No score path means results-only or scores delayed.</p>
  </div>
  <div class="wrap">
    ${armedBlock}
    ${list(upcoming, "Upcoming")}
    ${list(past, "Recent (results-only)")}
    <p class="games"><a href="/rankings">Table</a> · <a href="/history">Archive</a></p>
  </div>`;
}
function viewHistory(){
  const h = state.history;
  if (!h) return `<div class="wrap"><p class="empty">Loading archive…</p></div>`;
  const armed = (h.armed||[]).map(e => `<div class="rank-row"><b></b><div><strong>${e.name}</strong><span>${e.start} → ${e.end} · ${e.host} · ${e.status}</span></div><em>${e.connector}</em></div>`).join("");
  const npl = (h.npl||[]).slice(0,30).map(m => `<div class="rank-row"><b>${m.score}</b><div><strong>${m.a} vs ${m.b}</strong><span>${m.date} · ${m.games||""}</span></div><em>NPL</em></div>`).join("");
  const medals = (h.gpaMedals||[]).filter(x=>x.place==="winner").slice(0,40).map(m => `<a class="rank-row" href="${playerPath(m.player)}"><b>W</b><div><strong>${m.player}</strong><span>${m.event} · ${m.category}</span></div><em>${m.points||""}</em></a>`).join("");
  return `<div class="hero"><h2>ARCHIVE</h2><p>Federation results. <a href="/calendar" class="hero-link">Calendar</a> for the upcoming slate.</p></div>
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
  let board = state.rankBoard || "elo";
  if (board === "heat" && !HEAT_CHECK_ENABLED) board = "elo";
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
    rows = ((data.elo||{}).singles||[]).slice();
    note = "WPR · open mixed rating (all players, not MS/WS/MD/WD). Public board. PPA World is the official PPA category ranking. GPA is a separate table.";
    catSeg = `<div class="seg" style="margin-top:10px"><button class="on" type="button">Open mixed</button></div>`;
  } else if (board === "heat") {
    // No public Heat Check JSON yet: promo card only, never invented rows.
    const hc = Array.isArray(data.heatCheck) ? data.heatCheck.slice(0, 25) : [];
    rows = [];
    note = "Heat Check · World Pickleball Magazine's form board.";
    catSeg = hc.length
      ? `<div class="hc-list">${hc.map((r,i) => `<div class="rank-row"><b>${esc(r.rank||i+1)}</b><div><strong><a href="https://worldpickleballmagazine.com/players/${esc(fmSlug(r.name))}/">${esc(r.name)}</a></strong><span>${esc(r.note||"")}</span></div><em></em></div>`).join("")}</div><a class="chip" href="${HEAT_CHECK_URL}">Full Heat Check</a>`
      : `<div class="hc-promo" style="margin-top:12px;padding:18px;border-radius:14px;background:linear-gradient(180deg,#0D0B3F,#1A1750);color:#fff"><div class="kicker" style="color:#F7EA05">Heat Check</div><h3 style="margin:6px 0 8px;font-size:20px;color:#fff">Who's hot right now</h3><p style="margin:0 0 14px;color:#c9c6d8;font-size:14px">The top 25 form players, ranked by World Pickleball Magazine.</p><a class="chip" style="background:#F7EA05;color:#0D0B3F;border:0" href="${HEAT_CHECK_URL}">Open Heat Check</a></div>`;
  } else {
    rows = [];
    note = "";
  }
  const list = rows.slice(0, 80).map(r => {
    const sub = board === "elo" ? "Open mixed" : (r.country || "");
    const value = board === "elo" ? wprText(r.elo) : (r.points != null ? r.points + " pts" : "");
    return `
    <a class="rank-row" href="${playerPath(r.name)}">
      <b>${r.rank}</b>
      <div><strong>${r.name}</strong><span>${sub}</span></div>
      <em>${value}</em>
    </a>`;
  }).join("");
  const calAll = ((state.calendar||{}).events||[]).filter(e=>e.upcoming!==false);
  const calEv = calAll.slice(0,8);
  const mlpEv = calAll.find(e => e.tour==="mlp-asia" || /\bMLP\b/.test((e.name||"")+" "+(e.host||"")));
  if (mlpEv && !calEv.some(e => e.id && e.id===mlpEv.id)) calEv.push(mlpEv);
  const events = (calEv.length ? calEv : (data.events||[]).slice(0,8).map(e=>({
    name:e.name, start:(e.tournament_date||"").slice(0,10), venue:e.location||e.venue||"", tier:e.tier||"", host:e.host||"", status:"results-only"
  }))).map(calEventRow).join("");
  return `<div class="hero"><h2>TABLE</h2><p>WPR, PPA World and GPA — labelled separately. WPR is open mixed, not a category table. <a href="/calendar" class="hero-link">Calendar</a> · <a href="/history" class="hero-link">Archive</a>.</p></div>
  <div class="wrap">
    <div class="panel">
      <div class="seg">
        <button data-rankboard="elo" class="${board==="elo"?"on":""}">WPR</button>
        <button data-rankboard="ppa" class="${board==="ppa"?"on":""}">PPA World</button>
        <button data-rankboard="gpa" class="${board==="gpa"?"on":""}">GPA</button>
        ${HEAT_CHECK_ENABLED ? `<button data-rankboard="heat" class="${board==="heat"?"on":""}">Heat Check</button>` : ""}
      </div>
      ${catSeg}
      <p class="games" style="margin-top:10px">${note}</p>
      ${list || "<p class='empty'>Board empty for this cut.</p>"}
    </div>
    <div class="panel"><div class="kicker">Coming up</div>${events||"<p class='empty'>No events.</p>"}<a class="chip" href="/calendar">Open calendar</a></div>
  </div>`;
}
function viewShop(){
  return `<div class="hero"><h2>SHOP</h2><p>Kit, when it is ready to earn without looking cheap.</p></div>
  <div class="wrap"><div class="panel" style="padding:28px">
    <div class="kicker">Coming soon</div>
    <h2 style="font-family:Inter,sans-serif;font-weight:800;font-size:28px;margin:8px 0 12px">Affiliate shop is closed for now</h2>
    <p class="games">Amazon and tour-brand deals will land here once tags, inventory and disclosure are signed. Nothing is for sale in the app until then.</p>
  </div></div>`;
}

function toggleFollow(k){
  const key = normalizeFollowKey(k);
  if (!key) return;
  state.selected[key] = !state.selected[key];
  localStorage.setItem("wpm-follows", JSON.stringify(state.selected));
  if (state.selected[key]) {
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

/* render() lives in the v2 layer at the end of this file. */
function notifyLiveFollows(){
  const pending = (state.matches || []).filter(m => effectiveStatus(m) === "LIVE" && followsMatch(m) && !state.notified[m.id]);
  pending.sort((a, b) => {
    const pa = playerFollowsMatch(a) ? 0 : 1;
    const pb = playerFollowsMatch(b) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (parseUtc(a.start)?.getTime() || 0) - (parseUtc(b.start)?.getTime() || 0);
  });
  let hold = 0;
  try { hold = Number(sessionStorage.getItem("wpm-event-notify-hold") || 0); } catch(e) {}
  const windowOpen = Date.now() - hold > 5 * 60 * 1000;
  let eventSent = 0;
  pending.forEach(m => {
    if (!playerFollowsMatch(m)) {
      if (!windowOpen || eventSent >= 6) return;
      eventSent++;
    }
    maybeNotify(m);
  });
  if (eventSent) {
    try { sessionStorage.setItem("wpm-event-notify-hold", String(Date.now())); } catch(e) {}
  }
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
    state.archiveId = "";
    if (state.filter === "wc") state.drawTour = "wc";
    if (state.filter === "ppa") state.drawTour = "ppa";
    if (state.filter === "app" || state.filter === "app-pro") state.drawTour = "app";
    render();
  }));
  document.querySelectorAll("[data-archive]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    openArchive(b.getAttribute("data-archive"));
  }));
  document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
    state.boardMode = b.getAttribute("data-mode");
    if (state.boardMode === "draw") state.archiveId = "";
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
    state.drawPool = "";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
  }));
  document.querySelectorAll("[data-drawphase]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawPhase = b.getAttribute("data-drawphase") === "pool" ? "pool" : "elim";
    state.drawDiv = "";
    state.drawPool = "";
    state.drawTour = "app";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
  }));
  document.querySelectorAll("[data-drawpool]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawPool = b.getAttribute("data-drawpool") || "";
    state.drawPhase = "pool";
    state.drawTour = "app";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
  }));
  document.querySelectorAll("[data-drawtour]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawTour = b.getAttribute("data-drawtour") || "ppa";
    state.drawDiv = "";
    state.drawPool = "";
    state.drawPhase = state.drawTour === "app" ? "elim" : "";
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
}


function openArchive(id){
  if (!id || id === "live") {
    state.archiveId = "";
    render();
    return;
  }
  const meta = archiveMeta(id);
  state.archiveId = id;
  state.boardMode = "results";
  if (meta && meta.tour === "ppa") state.filter = "ppa";
  if (meta && meta.tour === "app") state.filter = "app-pro";
  pullArchive(id);
  render();
}
function pullArchive(id){
  if (!id) return Promise.resolve();
  const cur = state.archiveCache[id];
  const meta = archiveMeta(id);
  const stalePartial = !!(cur && cur.finished === false && meta && archiveReady(meta) && !cur.loading);
  if (!stalePartial && cur && (cur.loading || Array.isArray(cur.matches) || cur.unavailable)) return Promise.resolve();
  state.archiveCache[id] = Object.assign({}, cur || {}, { loading: true });
  return fetch("/api/archive?id="+encodeURIComponent(id), {cache:"no-store"}).then(res => res.json()).then(data => {
    state.archiveCache[id] = data && typeof data === "object" ? data : { unavailable: true, matches: [] };
    render();
  }).catch(() => {
    state.archiveCache[id] = { unavailable: true, matches: [], reader: "Results will appear when available" };
    render();
  });
}
function pullFinishedArchives(){
  const ids = archiveEntries().filter(e => e && !e.current).map(e => e.id);
  if (!ids.length) ["overland", "arizona"].forEach(id => { if (ids.indexOf(id) < 0) ids.push(id); });
  return Promise.all(ids.map(pullArchive));
}
function pullProfileArchives(){
  const ids = archiveEntries().map(e => e.id);
  ["overland", "arizona", "columbus", "las-vegas", "chicago-cup"].forEach(id => { if (ids.indexOf(id) < 0) ids.push(id); });
  return Promise.all(ids.map(pullArchive));
}
async function pullArchiveIndex(){
  try {
    const res = await fetch("/api/archive", {cache:"no-store"});
    if (!res.ok) return;
    const data = await res.json();
    if (data && Array.isArray(data.events) && data.events.length) state.archiveCatalog = data.events;
  } catch(e) {}
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
      if (tour === "app" && data && data.event) state.appEvent = data.event;
      if (tour === "ppa" && data && data.event) state.ppaEvent = data.event;
      if (tour === "app" && data) {
        state.appBoard = {
          preServe: !!data.preServe,
          reader: data.reader || "",
          liveCount: data.liveCount || 0,
          delayed: !!data.delayed,
          ended: !!data.ended,
          betweenEvents: !!data.betweenEvents
        };
        if (Array.isArray(data.bracketIndex)) state.appBracketIndex = data.bracketIndex;
      }
      if (tour === "ppa" && data) {
        state.ppaBoard = {
          preServe: !!data.preServe,
          reader: data.reader || "",
          liveCount: data.liveCount || 0,
          delayed: !!data.delayed
        };
        if (Array.isArray(data.matches)) {
          data.matches = rebasePpaLocalDates(data.matches, (data.event && data.event.tz) || "Asia/Hong_Kong");
        }
      }
      if (!data || !Array.isArray(data.matches)) return;
      // APP empty is real (pending brackets, no rows). Replace so a stale LIVE row cannot linger.
      if (tour === "app") {
        const ids = new Set(data.matches.map(m => m.id));
        state.matches = (state.matches || []).filter(m => m.tour !== "app" && !ids.has(m.id)).concat(data.matches);
        state.updated = data.updated || state.updated;
        if (data.brackets) state.appBrackets = data.brackets;
        return;
      }
      if (tour === "app-asia") {
        // FT only. Unarmed / empty clears so a dry-run cannot linger. Never paint LIVE.
        const incoming = (data.armed && Array.isArray(data.matches))
          ? data.matches.filter(m => m && m.status === "FT")
          : [];
        const ids = new Set(incoming.map(m => m.id));
        state.matches = (state.matches || []).filter(m => m.tour !== "app-asia" && !ids.has(m.id)).concat(incoming);
        if (data.updated) state.updated = data.updated;
        return;
      }
      if (!data.matches.length) return;
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
  await overlay("/api/sportssync", "app-asia");
  await overlay("/api/rta", "rta");
  state.heroByDate = state.heroByDate || {};
  const liveN = (state.matches||[]).filter(m => effectiveStatus(m)==="LIVE").length;
  const appQuiet = state.appBoard && state.appBoard.preServe && !liveN;
  const todayLine = liveN
    ? liveN + " live now across the board."
    : (appQuiet ? "Play starts soon." : "Nothing live right now.");
  state.heroByDate[boardToday()] = todayLine;
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
  const onProfile = path().startsWith("/player/") || path().startsWith("/team/");
  pullArchiveIndex().then(() => onProfile ? pullProfileArchives() : pullFinishedArchives()).then(() => {
    if (path()==="/" || path().startsWith("/player/") || path().startsWith("/team/") || path().startsWith("/match/")) render();
  });
  pullHistory().then(()=>{ if(path()==="/history" || path().startsWith("/player/") || path().startsWith("/team/")) render(); });
  pullRankings().then(() => { if (path()==="/rankings" || path().startsWith("/player/") || path()==="/") render(); });
  pullCalendar().then(() => { render(); });
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


document.addEventListener("error", function(ev){
  const img = ev.target;
  if (!img || !img.classList || !img.classList.contains("photo")) return;
  const div = document.createElement("div");
  div.className = "avatar";
  div.setAttribute("aria-hidden", "true");
  div.textContent = img.getAttribute("data-initials") || "";
  if (img.parentNode) img.replaceWith(div);
}, true);

document.addEventListener("click", function wpmClick(ev){
  const el = ev.target && ev.target.closest ? ev.target.closest("[data-draw], [data-drawphase], [data-drawpool], [data-drawtour], [data-mode], [data-f], [data-archive], [data-shop], [data-day], [data-more], [data-cat]") : null;
  if (!el) return;
  if (el.hasAttribute("data-drawphase")) {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawPhase = el.getAttribute("data-drawphase") === "pool" ? "pool" : "elim";
    state.drawDiv = "";
    state.drawPool = "";
    state.drawTour = "app";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
    return;
  }
  if (el.hasAttribute("data-drawpool")) {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawPool = el.getAttribute("data-drawpool") || "";
    state.drawPhase = "pool";
    state.drawTour = "app";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
    return;
  }
  if (el.hasAttribute("data-draw")) {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawDiv = el.getAttribute("data-draw") || "";
    state.drawPool = "";
    state.boardMode = "draw";
    syncDrawUrl();
    render();
    return;
  }
  if (el.hasAttribute("data-drawtour")) {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawTour = el.getAttribute("data-drawtour") || "ppa";
    state.drawDiv = "";
    state.drawPool = "";
    state.drawPhase = state.drawTour === "app" ? "elim" : "";
    state.boardMode = "draw";
    if (state.drawTour === "wc") state.filter = "wc";
    if (state.drawTour === "ppa") state.filter = "ppa";
    if (state.drawTour === "app") state.filter = "app-pro";
    syncDrawUrl();
    render();
    return;
  }
  if (el.hasAttribute("data-archive")) {
    ev.preventDefault();
    ev.stopPropagation();
    openArchive(el.getAttribute("data-archive"));
    return;
  }
  if (el.hasAttribute("data-cat")) {
    ev.preventDefault();
    state.resultCat = el.getAttribute("data-cat") || "all";
    persistResultCat();
    render();
  }
}, true);

/* ======================================================================
   WPM LIVE v2 · FotMob-style live centre layer (2026-10-26).
   Front end only. Reads the same /api feeds the board already pulls.
   Never invents data: every section hides when the feed has nothing.
   ====================================================================== */
const FM = {
  collapsed: {}, evFollows: {}, prevSig: {}, flash: {}, loaded: false,
  liveOnly: false, lastPoll: 0, pickerOpen: false
};
try { FM.collapsed = JSON.parse(localStorage.getItem("wpm-v2-collapsed") || "{}"); } catch(e) {}
try { FM.evFollows = JSON.parse(localStorage.getItem("wpm-follow-events") || "{}"); } catch(e) {}
const FM_TOUR_ORDER = {ppa:1, app:2, wc:3, mlp:4, "mlp-asia":5, rta:6, "app-asia":7, asia:8, "ppa-eu":9, tpb:10, npl:11, gpa:12};
const FM_FLAGS = {"argentina":"AR","australia":"AU","austria":"AT","belgium":"BE","brazil":"BR","cambodia":"KH","canada":"CA","chile":"CL","china":"CN","chinese taipei":"TW","taiwan":"TW","colombia":"CO","costa rica":"CR","croatia":"HR","czech republic":"CZ","czechia":"CZ","denmark":"DK","dominican republic":"DO","ecuador":"EC","egypt":"EG","england":"GB","great britain":"GB","united kingdom":"GB","finland":"FI","france":"FR","germany":"DE","greece":"GR","hong kong":"HK","hungary":"HU","india":"IN","indonesia":"ID","ireland":"IE","israel":"IL","italy":"IT","japan":"JP","kenya":"KE","korea":"KR","south korea":"KR","laos":"LA","malaysia":"MY","mexico":"MX","mongolia":"MN","netherlands":"NL","new zealand":"NZ","nigeria":"NG","norway":"NO","pakistan":"PK","panama":"PA","peru":"PE","philippines":"PH","poland":"PL","portugal":"PT","puerto rico":"PR","qatar":"QA","romania":"RO","russia":"RU","saudi arabia":"SA","scotland":"GB","serbia":"RS","singapore":"SG","slovakia":"SK","slovenia":"SI","south africa":"ZA","spain":"ES","sri lanka":"LK","sweden":"SE","switzerland":"CH","thailand":"TH","turkey":"TR","türkiye":"TR","uae":"AE","united arab emirates":"AE","ukraine":"UA","united states":"US","usa":"US","uruguay":"UY","venezuela":"VE","vietnam":"VN","viet nam":"VN","wales":"GB","macau":"MO","macao":"MO","nepal":"NP","bangladesh":"BD","brunei":"BN","myanmar":"MM","kazakhstan":"KZ","uzbekistan":"UZ","guatemala":"GT","el salvador":"SV","honduras":"HN","jamaica":"JM","bahamas":"BS","iceland":"IS","estonia":"EE","latvia":"LV","lithuania":"LT","luxembourg":"LU","malta":"MT","cyprus":"CY","morocco":"MA","tunisia":"TN","ghana":"GH","uganda":"UG","bolivia":"BO","paraguay":"PY"};
function fmFlag(name){
  const code = FM_FLAGS[String(name||"").toLowerCase().replace(/\s+\d+$/,"").trim()];
  if (!code) return "";
  return `<span class="fm-flag" aria-hidden="true">${String.fromCodePoint(...[...code].map(c => 0x1F1A5 + c.charCodeAt(0)))}</span>`;
}
function fmSlug(name){
  return String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/['’.]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function fmHub(name){ return `${MAG}/players/${fmSlug(name)}/`; }
function fmLocalYmd(d){ const x = d || new Date(); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; }
function fmToday(){ return fmLocalYmd(new Date()); }
function fmAll(){
  const seen = new Set(); const out = [];
  (state.matches||[]).forEach(m => { if (m && m.id && !seen.has(m.id)) { seen.add(m.id); out.push(m); } });
  Object.keys(state.archiveCache||{}).forEach(k => ((state.archiveCache[k]||{}).matches||[]).forEach(m => {
    if (m && m.id && !seen.has(m.id)) { seen.add(m.id); out.push(Object.assign({_archive:k}, m)); }
  }));
  return out;
}
function fmEventKey(m){ return m.eventKey || (m._archive ? "archive:"+m._archive : (m.tour==="wc" ? "ev:wc" : eventFollowKey(m))); }
function fmEventName(m){
  if (m.tour === "ppa" && state.ppaEvent && m.eventKey === state.ppaEvent.eventKey) return state.ppaEvent.name;
  return m.comp || TOUR_LABELS[m.tour] || "Event";
}
function fmDivision(m){
  const d = String(m.div||"").split("·")[0].trim();
  return d || DISC_LABEL[m.disc] || "";
}
function fmRound(m){
  if (m.round) return String(m.round).trim();
  const parts = String(m.div||"").split("·");
  return parts.length > 1 ? parts.slice(1).join("·").trim() : "";
}
const FM_ROUND_RANK = [
  [/^(pool|group|round robin|rr)/i, 5], [/round\s*1$|^r1$|ub r1/i, 8], [/r256|round 256/i, 9], [/r128|round 128/i, 10], [/r64|round 64/i, 11],
  [/r32|round 32/i, 12], [/r16|round 16|last 16/i, 13], [/quarter|^qf|ub qf/i, 14], [/semi|^sf/i, 15], [/bronze|3rd|third/i, 16], [/final/i, 17]
];
function fmRoundRank(r){
  const s = String(r||"");
  for (const [re, n] of FM_ROUND_RANK) if (re.test(s)) return n;
  const num = s.match(/(\d+)/); return num ? 6 + Math.min(Number(num[1]), 1) * 0 + Number(num[1]) / 100 : 7;
}
function fmSides(m){
  const roster = String(m.roster||"");
  const parts = roster.split(/\s+vs\.?\s+/i);
  const full = parts.length === 2 ? parts : [m.a, m.b];
  return [0,1].map(i => {
    const short = i ? m.b : m.a;
    const fullNames = splitSides(full[i]);
    const shortNames = splitSides(short);
    const names = fullNames.length === shortNames.length ? fullNames : shortNames;
    return { short: String(short||""), names, team: m.tour === "wc" || !!resolveTeamKey(short) };
  });
}
function fmGames(m){
  return (m.lines||[]).filter(l => lineHasDigits(l.score) || l.live).map(l => {
    const p = String(l.score||"").split(/[–-]/).map(x => x.trim());
    return { label: l.disc, a: p[0]||"", b: p[1]||"", live: !!l.live, winner: l.winner||"", court: l.court||"" };
  });
}
function fmWinnerSide(m){
  if (effectiveStatus(m) !== "FT") return -1;
  const sc = String(m.score||"").split("-").map(Number);
  if (sc.length === 2 && Number.isFinite(sc[0]) && Number.isFinite(sc[1]) && sc[0] !== sc[1]) return sc[0] > sc[1] ? 0 : 1;
  return -1;
}
function fmTime(m){
  if (!m.start) return "";
  if (m.hasClock === false) return "";
  if (m.hasClock !== true && m.tour !== "wc") return "";
  const d = parseUtc(m.start); if (!d || isNaN(d)) return "";
  return d.toLocaleTimeString(undefined, {hour:"2-digit", minute:"2-digit"});
}
function fmDate(m){
  if (m.start && (m.hasClock === true || m.tour === "wc")) { const d = parseUtc(m.start); if (d && !isNaN(d)) return fmLocalYmd(d); }
  return m.date || "";
}
function fmSig(m){ return `${m.score||""}|${(m.lines||[]).map(l => l.score+(l.live?"*":"")).join(",")}|${effectiveStatus(m)}`; }
function fmIsFollowedEvent(k){ return !!FM.evFollows[k]; }
function fmPlayerFollowed(name){ return !!state.selected[name] || !!state.selected[resolvePlayerKey(name) || "\u0000"]; }
function fmFollowsMatch(m){
  if (fmIsFollowedEvent(fmEventKey(m))) return true;
  return matchedFollowsFor(m).length > 0;
}
function fmStar(kind, key, label){
  const on = kind === "ev" ? fmIsFollowedEvent(key) : fmPlayerFollowed(key);
  return `<button class="fm-star${on?" on":""}" type="button" data-fmstar="${kind}" data-key="${escAttr(key)}" aria-pressed="${on}" aria-label="${on?"Unfollow":"Follow"} ${escAttr(label||key)}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg></button>`;
}
function fmToggleStar(kind, key){
  if (kind === "ev") {
    if (FM.evFollows[key]) delete FM.evFollows[key]; else FM.evFollows[key] = 1;
    try { localStorage.setItem("wpm-follow-events", JSON.stringify(FM.evFollows)); } catch(e) {}
    render(); return;
  }
  const rk = resolvePlayerKey(key);
  if (rk && state.selected[rk] && !state.selected[key]) { toggleFollow(rk); return; }
  toggleFollow(key);
}
function fmTourBadge(t){ return `<span class="fm-tour fm-t-${escAttr(t||"x")}">${esc(TOUR_LABELS[t] || String(t||"").toUpperCase())}</span>`; }
const FM_ICONS = {
  matches:'<path d="M4 6h16M4 12h16M4 18h10"/>',
  following:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
  events:'<path d="M7 4h10v4a5 5 0 01-10 0zM5 5H3v2a3 3 0 003 3M19 5h2v2a3 3 0 01-3 3M12 13v4M8 20h8"/>',
  table:'<path d="M4 5h16v14H4zM4 10h16M4 15h16M10 5v14"/>',
  more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  cal:'<path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4"/>'
};
function fmIcon(n, s){ return `<svg class="fm-i" viewBox="0 0 24 24" width="${s||22}" height="${s||22}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FM_ICONS[n]}</svg>`; }
function fmTab(){
  const p = path();
  if (p === "/following") return "following";
  if (p === "/events" || p.startsWith("/event/") || p === "/draw") return "events";
  if (p === "/rankings") return "table";
  if (p === "/more" || p === "/calendar" || p === "/history" || p === "/magazine" || p === "/shop") return "more";
  if (p === "/search") return "search";
  return "matches";
}
const FM_TABS = [["matches","/","Matches"],["following","/following","Following"],["events","/events","Events"],["table","/rankings","Table"],["more","/more","More"]];
function fmChrome(inner, opts){
  const tab = fmTab();
  const liveN = fmAll().filter(m => effectiveStatus(m) === "LIVE").length;
  const back = opts && opts.back;
  return `<a class="fm-skip" href="#fm-main">Skip to content</a>
  <header class="fm-bar"><div class="fm-bar-in">
    ${back ? `<a class="fm-iconbtn" href="${back}" aria-label="Back">${fmIcon("back")}</a>` : ""}
    <a class="fm-brand" href="/" aria-label="WPM LIVE home"><img src="/img/wpm-logo.avif" alt="World Pickleball Magazine" width="120" height="48"><span>LIVE</span></a>
    <nav class="fm-topnav" aria-label="Live centre">${FM_TABS.map(([k,h,l]) => `<a href="${h}" class="${tab===k?"on":""}"${tab===k?' aria-current="page"':""}>${l}${k==="matches"&&liveN?` <em class="fm-livecount">${liveN}</em>`:""}</a>`).join("")}</nav>
    <span class="fm-bar-sp"></span>
    <a class="fm-iconbtn${tab==="search"?" on":""}" href="/search" aria-label="Search">${fmIcon("search")}</a>
    ${themeToggle().replace('class="theme"','class="theme fm-theme"')}
  </div></header>
  <main id="fm-main" class="fm-main">${inner}</main>
  <nav class="fm-tabbar" aria-label="Sections">${FM_TABS.map(([k,h,l]) => `<a href="${h}" class="${tab===k?"on":""}"${tab===k?' aria-current="page"':""}>${fmIcon(k)}<span>${l}</span>${k==="matches"&&liveN?`<i class="fm-dot" aria-label="${liveN} live"></i>`:""}</a>`).join("")}</nav>`;
}
function fmSkeletonRows(n){
  return Array.from({length:n}, () => `<div class="fm-row fm-skel" aria-hidden="true"><span class="fm-st"><i class="sk w30"></i></span><span class="fm-names"><i class="sk w70"></i><i class="sk w55"></i></span><span class="fm-sc"><i class="sk w20"></i></span></div>`).join("");
}
function fmSkeleton(){
  return `<div class="fm-wrap"><div class="fm-dates fm-skel-strip">${Array.from({length:7},()=>`<span class="fm-day"><i class="sk w40"></i></span>`).join("")}</div>
    ${[5,4,3].map(n => `<section class="fm-group"><div class="fm-gh"><i class="sk w55"></i></div>${fmSkeletonRows(n)}</section>`).join("")}</div>`;
}
/* ---------- Score row ---------- */
function fmRow(raw, opts){
  const m = presentMatch(raw);
  const st = effectiveStatus(m);
  const sides = fmSides(m);
  const win = fmWinnerSide(m);
  const games = fmGames(m);
  const sets = String(m.score||"").split("-");
  const time = fmTime(m);
  const court = courtOnCard(m);
  const mark = blankResultLabel(m);
  let stHtml;
  if (st === "LIVE") stHtml = `<b class="fm-live">LIVE</b>${court?`<small>${esc(court)}</small>`:""}`;
  else if (st === "FT") stHtml = `<b>${mark && !m.score ? esc(mark) : "FT"}</b>${opts && opts.showDate ? `<small>${esc(dateChip(m.date).replace(/^\w+ /,""))}</small>` : ""}`;
  else stHtml = `<b>${esc(time || (opts && opts.showDate ? dateChip(m.date).replace(/^\w+ /,"") : "–"))}</b>${court?`<small>${esc(court)}</small>`:""}`;
  const name = (i) => {
    const s = sides[i];
    const lab = s.short || "TBD";
    return `<span class="fm-side${win===i?" win":win===1-i?" lose":""}">${s.team?fmFlag(lab):""}<span class="fm-nm">${esc(lab)}</span>${win===i?'<i class="fm-wmark" aria-label="winner"></i>':""}</span>`;
  };
  const gcols = games.slice(0,5).map(g => `<span class="fm-g${g.live?" live":""}"><span class="${Number(g.a)>Number(g.b)?"fm-w":""}">${esc(g.a)}</span><span class="${Number(g.b)>Number(g.a)?"fm-w":""}">${esc(g.b)}</span></span>`).join("");
  const hasSets = m.score && sets.length === 2 && !(st === "LIVE" && !liveHasPoints(m));
  const sc = hasSets ? `<span class="fm-sets${st==="LIVE"?" live":""}"><span class="${win===0?"fm-w":""}">${esc(sets[0])}</span><span class="${win===1?"fm-w":""}">${esc(sets[1])}</span></span>` : `<span class="fm-sets fm-vs">${st==="NEXT"?"":esc(mark||"")}</span>`;
  const fl = FM.flash[m.id] ? " fm-flash" : "";
  const sub = opts && opts.sub ? `<span class="fm-rsub">${esc(opts.sub)}</span>` : "";
  return `<a class="fm-row st-${st}${fl}${fmFollowsMatch(m)?" fol":""}" href="/match/${encodeURIComponent(m.id)}" data-mid="${escAttr(m.id)}">
    <span class="fm-st">${stHtml}</span>
    <span class="fm-names">${sub}${name(0)}${name(1)}</span>
    <span class="fm-gs">${gcols}</span>
    ${sc}
  </a>`;
}
function fmSortMatches(list){
  const r = {LIVE:0, NEXT:1, FT:2};
  return list.slice().sort((x,y) => {
    const a = r[effectiveStatus(x)] ?? 1, b = r[effectiveStatus(y)] ?? 1;
    if (a !== b) return a - b;
    const rr = fmRoundRank(fmRound(y)) - fmRoundRank(fmRound(x));
    if (a === 2 && rr) return rr;
    const ta = parseUtc(x.start)?.getTime() || 0, tb = parseUtc(y.start)?.getTime() || 0;
    if (ta !== tb) return ta - tb;
    return (-rr) || String(x.id).localeCompare(String(y.id));
  });
}
function fmGroups(list){
  const g = {};
  list.forEach(m => {
    const ek = fmEventKey(m), dv = fmDivision(m);
    const k = ek + "|" + dv;
    (g[k] = g[k] || {key:k, ev:ek, div:dv, tour:m.tour, name:fmEventName(m), rows:[]}).rows.push(m);
  });
  return Object.values(g).sort((a,b) => {
    const la = a.rows.some(m => effectiveStatus(m)==="LIVE") ? 0 : 1, lb = b.rows.some(m => effectiveStatus(m)==="LIVE") ? 0 : 1;
    if (la !== lb) return la - lb;
    const fa = fmIsFollowedEvent(a.ev) ? 0 : 1, fb = fmIsFollowedEvent(b.ev) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    const ta = FM_TOUR_ORDER[a.tour] || 50, tb = FM_TOUR_ORDER[b.tour] || 50;
    if (ta !== tb) return ta - tb;
    return (a.name+a.div).localeCompare(b.name+b.div);
  });
}
function fmGroupHtml(g, opts){
  const col = !!FM.collapsed[g.key];
  const live = g.rows.filter(m => effectiveStatus(m)==="LIVE").length;
  const rows = fmSortMatches(g.rows);
  return `<section class="fm-group${col?" col":""}">
    <div class="fm-gh">
      <button class="fm-ghb" type="button" data-fmcol="${escAttr(g.key)}" aria-expanded="${!col}">
        ${fmTourBadge(g.tour)}
        <span class="fm-gt"><b>${esc(shortEventLabel(g.name, g.ev))}</b>${g.div?`<span>${esc(g.div)}</span>`:""}</span>
        ${live?`<em class="fm-glive">${live} live</em>`:""}<span class="fm-gn">${rows.length}</span>${fmIcon("chev", 18)}
      </button>
      <a class="fm-gev" href="/event/${encodeURIComponent(g.ev)}${g.div?"?div="+encodeURIComponent(g.div):""}" aria-label="Open ${escAttr(g.name)}">Draw</a>
    </div>
    ${col ? "" : `<div class="fm-rows">${rows.map(m => fmRow(m, {sub: fmRound(m)})).join("")}</div>`}
  </section>`;
}
/* ---------- Matches (home) ---------- */
function fmDays(){
  const s = new Set(); fmAll().forEach(m => { const d = fmDate(m); if (d) s.add(d); });
  return s;
}
function fmDateLabel(iso){
  const t = fmToday();
  if (iso === t) return "Today";
  if (iso === addDaysIso(t,-1)) return "Yesterday";
  if (iso === addDaysIso(t,1)) return "Tomorrow";
  return dateChip(iso);
}
function fmDateStrip(sel){
  const days = fmDays();
  const t = fmToday();
  const schedDays = new Set();
  fmCalEvents().forEach(e => { if (!e.start) return; for (let d = e.start, k = 0; d <= (e.end||e.start) && k < 40; d = addDaysIso(d, 1), k++) schedDays.add(d); });
  const span = [];
  for (let i = -3; i <= 3; i++) span.push(addDaysIso(sel, i));
  return `<div class="fm-datebar">
    <div class="fm-dates" role="tablist" aria-label="Choose day">${span.map(d => {
      const [Y,M,D] = d.split("-").map(Number); const dt = new Date(Y,M-1,D);
      const top = d===t?"Today":d===addDaysIso(t,-1)?"Yest":d===addDaysIso(t,1)?"Tmrw":["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
      return `<button type="button" role="tab" class="fm-day${d===sel?" on":""}${days.has(d)?" has":schedDays.has(d)?" sched":""}" data-fmday="${d}" aria-selected="${d===sel}"><span>${top}</span><b>${D} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][M-1]}</b></button>`;
    }).join("")}</div>
    <label class="fm-pick" aria-label="Pick a date">${fmIcon("cal", 20)}<input type="date" value="${sel}" data-fmpick></label>
  </div>`;
}
function fmNearestDay(sel){
  const days = [...fmDays()].sort(); if (!days.length) return "";
  let best = days[0], bd = Infinity;
  days.forEach(d => { const diff = Math.abs(new Date(d) - new Date(sel)); if (diff < bd || (diff === bd && d < best)) { bd = diff; best = d; } });
  return best;
}
function fmHome(){
  if (!FM.loaded) return fmSkeleton();
  const sel = state.fmDate || fmToday();
  const all = fmAll();
  const liveAll = all.filter(m => effectiveStatus(m)==="LIVE");
  let list = all.filter(m => fmDate(m) === sel || (effectiveStatus(m)==="LIVE" && sel === fmToday()));
  if (FM.liveOnly) list = liveAll;
  const fol = list.filter(fmFollowsMatch);
  const groups = fmGroups(list);
  const near = list.length ? "" : fmNearestDay(sel);
  const boardNames = new Set(list.map(m => fmNorm(fmEventName(m))));
  const sched = FM.liveOnly ? [] : fmCalEvents().filter(e => e.start <= sel && (e.end||e.start) >= sel && !boardNames.has(fmNorm(e.name)) && !fmEventsIndex().some(b => b.n > 0 && fmNorm(b.name) === fmNorm(e.name)));
  return `<div class="fm-wrap fm-home">
    ${fmDateStrip(sel)}
    <div class="fm-filters">
      <button type="button" class="fm-chip${FM.liveOnly?" on":""}" data-fmlive aria-pressed="${FM.liveOnly}"><i class="fm-pulse"></i>Live${liveAll.length?` (${liveAll.length})`:""}</button>
      <span class="fm-daylabel">${esc(FM.liveOnly ? "Live now" : fmDateLabel(sel))} · ${list.length} ${list.length===1?"match":"matches"}</span>
    </div>
    ${fol.length && !FM.liveOnly ? `<section class="fm-group fm-folgroup"><div class="fm-gh"><span class="fm-ghb static">${fmIcon("following",18)}<span class="fm-gt"><b>Following</b><span>Your players and events</span></span><span class="fm-gn">${fol.length}</span></span></div><div class="fm-rows">${fmSortMatches(fol).map(m => fmRow(m, {sub: shortEventLabel(fmEventName(m), fmEventKey(m))+" · "+[fmDivision(m), fmRound(m)].filter(Boolean).join(" · ")})).join("")}</div></section>` : ""}
    ${groups.map(g => fmGroupHtml(g)).join("")}
    ${sched.length ? `<section class="fm-card fm-sched"><h2 class="fm-h2">Scheduled · no draw yet</h2>${sched.map(fmEvRow).join("")}</section>` : ""}
    ${list.length || sched.length ? "" : `<div class="fm-empty"><p>${FM.liveOnly ? "Nothing is live right now." : "No matches on the board for "+esc(fmDateLabel(sel))+"."}</p>${near && !FM.liveOnly ? `<button type="button" class="fm-btn" data-fmday="${near}">Go to ${esc(fmDateLabel(near))}</button>` : ""}${FM.liveOnly?`<button type="button" class="fm-btn" data-fmlive>Show all matches</button>`:""}</div>`}
    <p class="fm-foot">Times in your time zone (${esc(Intl.DateTimeFormat().resolvedOptions().timeZone || "local")}). Scores refresh every 12 seconds.${state.updated?` Feed updated ${esc(new Date(state.updated).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"}))}.`:""}</p>
  </div>`;
}
/* ---------- Match detail ---------- */
function fmSameSide(x, y){
  const n = s => splitSides(s).map(p => normName(p)).sort().join("|");
  return n(x) && n(x) === n(y);
}
function fmPersonBlock(side, i, m, win){
  const names = side.names.length ? side.names : [side.short];
  return `<div class="fm-hside${win===i?" win":""}">
    ${names.map(n => {
      const indiv = !side.team && !/^(tbd|tba|bye)$/i.test(n);
      return `<div class="fm-hp">${side.team?fmFlag(n):`<span class="fm-av" aria-hidden="true">${esc(personInitials(n))}</span>`}
        <span class="fm-hpn">${indiv ? `<a href="${fmHub(n)}" rel="noopener">${esc(n)}</a>` : (side.team ? `<a href="${teamPath(n)}">${esc(n)}</a>` : esc(n))}</span>
        ${indiv || side.team ? fmStar("p", n, n) : ""}</div>`;
    }).join("")}
  </div>`;
}
function fmMatch(id){
  const raw = fmAll().find(m => m.id === id) || byId(id);
  if (!raw) return FM.loaded ? `<div class="fm-wrap"><div class="fm-empty"><p>Match not found on the current board.</p><a class="fm-btn" href="/">Back to matches</a></div></div>` : `<div class="fm-wrap"><div class="fm-hero fm-skel" style="height:220px"></div>${fmSkeletonRows(4)}</div>`;
  const m = presentMatch(raw);
  const st = effectiveStatus(m);
  const sides = fmSides(m);
  const win = fmWinnerSide(m);
  const games = fmGames(m);
  const sets = String(m.score||"").split("-");
  const ek = fmEventKey(m);
  const time = fmTime(m);
  const court = courtOnCard(m);
  const w = WATCH[m.watch];
  const tab = qs("tab") || "games";
  const all = fmAll();
  const h2h = all.filter(x => x.id !== m.id && ((fmSameSide(x.a,m.a) && fmSameSide(x.b,m.b)) || (fmSameSide(x.a,m.b) && fmSameSide(x.b,m.a))));
  const path = (side) => all.filter(x => x.id !== m.id && fmEventKey(x) === ek && fmDivision(x) === fmDivision(m) && (fmSameSide(x.a, side) || fmSameSide(x.b, side)) && effectiveStatus(x) === "FT")
    .sort((a,b) => fmRoundRank(fmRound(a)) - fmRoundRank(fmRound(b)));
  const pa = path(m.a), pb = path(m.b);
  const tabs = [["games","Games", games.length > 0]];
  if (pa.length || pb.length) tabs.push(["path","Path", true]);
  if (h2h.length) tabs.push(["h2h","H2H", true]);
  const cur = tabs.find(t => t[0] === tab) ? tab : (tabs.find(t => t[2]) || ["games"])[0];
  const isTeamTie = m.tour === "wc";
  let body = "";
  if (cur === "games") {
    body = games.length ? `<table class="fm-gt-table"><caption class="fm-sr">${isTeamTie?"Rubbers":"Game by game"}</caption><thead><tr><th scope="col">${isTeamTie?"Rubber":"Game"}</th><th scope="col">${esc(sides[0].short)}</th><th scope="col">${esc(sides[1].short)}</th>${games.some(g=>g.court)?'<th scope="col">Court</th>':""}</tr></thead><tbody>${games.map(g => {
      const aw = Number(g.a) > Number(g.b), bw = Number(g.b) > Number(g.a);
      return `<tr class="${g.live?"live":""}"><th scope="row">${esc(g.label)}${g.live?' <b class="fm-live">LIVE</b>':""}</th><td class="${aw?"fm-w":""}">${esc(g.a)}</td><td class="${bw?"fm-w":""}">${esc(g.b)}</td>${games.some(x=>x.court)?`<td>${esc(g.court)}</td>`:""}</tr>`;
    }).join("")}</tbody></table>` : `<p class="fm-note">${st==="NEXT"?"Game scores appear here when play starts.":"The feed has no game-by-game scores for this match."}</p>`;
  } else if (cur === "path") {
    const col = (lab, rows) => `<div class="fm-path"><h3>${esc(lab)}</h3>${rows.length ? rows.map(x => fmRow(x, {sub: fmRound(x)})).join("") : `<p class="fm-note">No earlier rounds on the board.</p>`}</div>`;
    body = `<div class="fm-paths">${col(sides[0].short, pa)}${col(sides[1].short, pb)}</div>`;
  } else if (cur === "h2h") {
    let wa = 0, wb = 0;
    h2h.forEach(x => { const ws = fmWinnerSide(x); if (ws < 0) return; const aIsA = fmSameSide(x.a, m.a); if ((ws === 0) === aIsA) wa++; else wb++; });
    body = `<div class="fm-h2hsum"><span><b>${wa}</b>${esc(sides[0].short)}</span><span class="fm-mute">Wins in matches on WPM LIVE</span><span><b>${wb}</b>${esc(sides[1].short)}</span></div>${fmSortMatches(h2h).map(x => fmRow(x, {showDate:true, sub: shortEventLabel(fmEventName(x), fmEventKey(x))+" · "+fmRound(x)})).join("")}`;
  }
  const meta = [fmDivision(m), fmRound(m)].filter(Boolean).join(" · ");
  const when = [m.date ? dateChip(fmDate(m)) : "", time, court].filter(Boolean).join(" · ");
  return `<div class="fm-wrap fm-detail">
    <section class="fm-hero st-${st}${FM.flash[m.id]?" fm-flash":""}" data-mid="${escAttr(m.id)}">
      <a class="fm-hev" href="/event/${encodeURIComponent(ek)}${fmDivision(m)?"?div="+encodeURIComponent(fmDivision(m)):""}">${fmTourBadge(m.tour)}<span>${esc(shortEventLabel(fmEventName(m), ek))}</span><span class="fm-mute">${esc(meta)}</span></a>
      <div class="fm-board">
        ${fmPersonBlock(sides[0], 0, m, win)}
        <div class="fm-mid">
          ${m.score && sets.length===2 && !(st==="LIVE" && !liveHasPoints(m)) ? `<div class="fm-big"><span class="${win===0?"fm-w":""}">${esc(sets[0])}</span><i>–</i><span class="${win===1?"fm-w":""}">${esc(sets[1])}</span></div>` : `<div class="fm-big fm-vsbig">${st==="NEXT"?(esc(time)||"vs"):esc(blankResultLabel(m)||"–")}</div>`}
          <div class="fm-stl">${st==="LIVE"?'<b class="fm-live">LIVE</b>':st==="FT"?"Full time":"Upcoming"}</div>
          ${games.length ? `<div class="fm-gline">${games.map(g => `<span class="${g.live?"live":""}">${esc(g.a)}-${esc(g.b)}</span>`).join("")}</div>` : ""}
        </div>
        ${fmPersonBlock(sides[1], 1, m, win)}
      </div>
      ${when || (m.venue) ? `<p class="fm-when">${esc(when)}${m.venue?`${when?" · ":""}${esc(m.venue)}`:""}</p>` : ""}
      ${w ? `<a class="fm-btn gold" href="${w.href}" rel="noopener">${esc(w.label)}</a>` : ""}
    </section>
    ${tabs.length > 1 ? `<nav class="fm-segs" aria-label="Match sections">${tabs.map(([k,l]) => `<a href="/match/${encodeURIComponent(m.id)}?tab=${k}" class="${k===cur?"on":""}"${k===cur?' aria-current="page"':""}>${l}</a>`).join("")}</nav>` : ""}
    <section class="fm-card">${body}</section>
    ${publicProse(m.note) && !/order of play/i.test(m.note||"") ? `<p class="fm-note">${publicProse(m.note)}</p>` : ""}
    <p class="fm-foot">Point-by-point and match stats are not in the public feeds, so they are not shown.</p>
  </div>`;
}
/* ---------- Following ---------- */
function fmSuggestPlayers(){
  const counts = {};
  fmAll().filter(m => !m._archive && m.tour !== "wc").forEach(m => {
    const rr = fmRoundRank(fmRound(m));
    fmSides(m).forEach(s => s.names.forEach(n => { if (!/^(tbd|tba|bye)$/i.test(n)) counts[n] = (counts[n]||0) + rr; }));
  });
  return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(e => e[0]).filter(n => !fmPlayerFollowed(n)).slice(0, 8);
}
function fmFollowing(){
  if (!FM.loaded) return fmSkeleton();
  const people = followTagsList();
  const evs = Object.keys(FM.evFollows).filter(k => FM.evFollows[k]);
  const tours = followedTourKeys();
  const all = fmAll();
  const mine = all.filter(fmFollowsMatch);
  const live = mine.filter(m => effectiveStatus(m) === "LIVE");
  const next = mine.filter(m => effectiveStatus(m) === "NEXT");
  const done = mine.filter(m => effectiveStatus(m) === "FT").sort((a,b) => String(fmDate(b)).localeCompare(String(fmDate(a))) || fmRoundRank(fmRound(b)) - fmRoundRank(fmRound(a))).slice(0, 20);
  const evInfo = fmEventsIndex();
  const sub = m => shortEventLabel(fmEventName(m), fmEventKey(m)) + " · " + [fmDivision(m), fmRound(m)].filter(Boolean).join(" · ");
  const sec = (t, rows, o) => rows.length ? `<section class="fm-group"><div class="fm-gh"><span class="fm-ghb static"><span class="fm-gt"><b>${t}</b></span><span class="fm-gn">${rows.length}</span></span></div><div class="fm-rows">${rows.map(m => fmRow(m, Object.assign({sub: sub(m)}, o||{}))).join("")}</div></section>` : "";
  const sugg = fmSuggestPlayers();
  const nameOf = k => PLAYERS[k] ? PLAYERS[k].name : (TEAMS[k] ? TEAMS[k].name : k);
  return `<div class="fm-wrap">
    <h1 class="fm-h1">Following</h1>
    <div class="fm-chiprow" aria-label="Followed players">
      ${people.map(k => `<span class="fm-pchip"><span class="fm-av" aria-hidden="true">${esc(personInitials(nameOf(k)))}</span><a href="${TEAMS[k]?teamPath(k):fmHub(nameOf(k))}">${esc(nameOf(k))}</a>${fmStar("p", k, nameOf(k))}</span>`).join("")}
      ${evs.map(k => { const e = evInfo.find(x => x.key === k); return `<span class="fm-pchip ev">${e?fmTourBadge(e.tour):""}<a href="/event/${encodeURIComponent(k)}">${esc(e ? shortEventLabel(e.name, k) : k)}</a>${fmStar("ev", k, e?e.name:k)}</span>`; }).join("")}
      ${tours.map(k => `<span class="fm-pchip ev">${fmTourBadge(k.slice(5))}<span>All ${esc(tourLabel(k))}</span><button class="fm-star on" data-follow="${escAttr(k)}" aria-label="Unfollow ${escAttr(tourLabel(k))}"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/></svg></button></span>`).join("")}
    </div>
    ${!people.length && !evs.length && !tours.length ? `<div class="fm-empty"><p>Star players and events to see their matches here first.</p></div>` : ""}
    ${sec("Live now", live)}
    ${sec("Up next", fmSortMatches(next), {showDate:true})}
    ${sec("Recent results", done, {showDate:true})}
    ${(people.length||evs.length||tours.length) && !mine.length ? `<div class="fm-empty"><p>None of your follows are on the current board.</p></div>` : ""}
    ${sugg.length ? `<section class="fm-card"><h2 class="fm-h2">Suggested players</h2><div class="fm-suggest">${sugg.map(n => `<span class="fm-pchip"><span class="fm-av" aria-hidden="true">${esc(personInitials(n))}</span><a href="${fmHub(n)}">${esc(n)}</a>${fmStar("p", n, n)}</span>`).join("")}</div></section>` : ""}
    ${people.length ? alertsCta() : ""}
  </div>`;
}
/* ---------- Events ---------- */
function fmEventsIndex(){
  const map = {};
  fmAll().forEach(m => {
    const k = fmEventKey(m);
    const e = map[k] = map[k] || {key:k, tour:m.tour, name:fmEventName(m), venue:m.venue||"", start:"", end:"", n:0, live:0, archive:m._archive||""};
    const d = m.date || "";
    if (d && (!e.start || d < e.start)) e.start = d;
    if (d && (!e.end || d > e.end)) e.end = d;
    e.n++; if (effectiveStatus(m) === "LIVE") e.live++;
  });
  (state.archiveCatalog.length ? state.archiveCatalog : ARCHIVE_FALLBACK).forEach(a => {
    const k = "archive:" + a.tour + ":" + a.id;
    const hit = Object.values(map).find(e => e.archive === a.id || e.key === k);
    if (hit) { hit.name = a.name || hit.name; hit.start = a.start || hit.start; hit.end = a.end || hit.end; hit.venue = a.venue || hit.venue; return; }
    if (a.current) return;
    map[k] = {key:k, tour:a.tour, name:a.name, venue:a.venue||"", start:a.start, end:a.end, n:0, live:0, archive:a.id, lazy:true};
  });
  return Object.values(map).sort((a,b) => (b.live - a.live) || String(b.end).localeCompare(String(a.end)));
}
const FM_EXTRA_LABELS = {usap:"USA Pickleball", epf:"EPF", gs:"Grand Slam", "tennis australia":"Tennis Aus", "us open":"US Open", mlp:"MLP"};
function fmTourName(t){ return TOUR_LABELS[t] || FM_EXTRA_LABELS[t] || String(t||"").toUpperCase(); }
function fmTourFamily(t){
  t = String(t||"");
  if (t === "ppa" || t === "asia" || t === "ppa-eu") return "PPA";
  if (t === "app" || t === "app-asia") return "APP";
  if (/^mlp/.test(t)) return "MLP";
  if (t === "usap" || t === "us open") return "Nationals";
  if (t === "wc") return "World Cup";
  return fmTourName(t);
}
function fmRegion(e){
  const t = String(e.tour||""), loc = `${e.venue||""} ${e.location||""} ${e.tz||""}`;
  if (/^Asia\//.test(e.tz||"") || /Vietnam|India|Thailand|Taiwan|China|Japan|Tokyo|Hong Kong|Singapore|Korea|Malaysia|Philippines|Indonesia/i.test(loc) || t==="asia" || t==="app-asia" || t==="mlp-asia") return "Asia";
  if (/^Europe\//.test(e.tz||"") || /Europe|France|England|Spain|Italy|Germany|UK\b|Netherlands|Portugal/i.test(loc) || t==="ppa-eu" || t==="epf" || t==="rta") return "Europe";
  if (/^Australia\//.test(e.tz||"") || /Australia|New Zealand|Melbourne|Sydney/i.test(loc) || t==="npl" || t==="tennis australia") return "Oceania";
  if (/^America\//.test(e.tz||"") || /\bUSA\b|, [A-Z]{2}\b|Canada|Mexico/.test(loc) || t==="usap" || t==="app" || t==="ppa") return "Americas";
  return "Other";
}
function fmNorm(n){ return String(n||"").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\b(the|presented by|open|20\d\d)\b/g," ").replace(/\s+/g," ").trim(); }
function fmCalEvents(){
  const cal = state.calendar || {};
  const seen = new Set(), out = [];
  [...(cal.events||[]), ...(cal.slate||[])].forEach(c => {
    if (!c || !c.start || !c.name) return;
    const id = c.id || (c.tour+":"+c.name+":"+c.start);
    if (seen.has(id)) return; seen.add(id);
    const dup = out.find(o => o.start === c.start && (fmNorm(o.name) === fmNorm(c.name) || (o.end === (c.end||c.start) && fmTourFamily(o.tour) === fmTourFamily(c.tour) && fmNorm(o.name).split(" ").some(w => w.length > 4 && !/asia|tour|world|championships?|pickleball/.test(w) && fmNorm(c.name).split(" ").indexOf(w) >= 0))));
    if (dup) return;
    out.push({key:"cal:"+id, cal:true, tour:c.tour||"", name:c.name, start:c.start, end:c.end||c.start, venue:c.venue||"", location:c.location||"", tz:c.timezone||"", tier:c.tier||"", prize:c.prize_pool||"", url:c.officialUrl||c.registration_url||"", drawUrl:c.drawUrl||"", n:0, live:0, note:c.statusNote||c.note||""});
  });
  return out;
}
function fmAllEvents(){
  const board = fmEventsIndex();
  const cal = fmCalEvents().filter(c => !board.some(b => (fmNorm(b.name) && fmNorm(b.name) === fmNorm(c.name)) || (b.tour === c.tour && b.start && b.end && c.start <= b.end && c.end >= b.start && b.n > 0 && fmNorm(b.name).split(" ").some(w => w.length > 4 && fmNorm(c.name).includes(w)))));
  return board.concat(cal);
}
function fmDaysBetween(a, b){ const p = x => { const [Y,M,D] = x.split("-").map(Number); return Date.UTC(Y,M-1,D); }; return Math.round((p(b) - p(a)) / 864e5); }
function fmCountdown(e){
  const t = fmToday();
  if (e.live) return `<em class="fm-glive">${e.live} live</em>`;
  if (!e.start) return "";
  if (e.start <= t && (e.end||e.start) >= t) { const n = fmDaysBetween(e.start, t) + 1, tot = fmDaysBetween(e.start, e.end||e.start) + 1; return `<span class="fm-cd on">${tot > 1 ? `Day ${n} of ${tot}` : "Today"}</span>`; }
  if (e.start > t) { const d = fmDaysBetween(t, e.start); return `<span class="fm-cd">${d === 1 ? "Tomorrow" : d < 14 ? `in ${d} days` : d < 60 ? `in ${Math.round(d/7)} weeks` : `in ${Math.round(d/30)} months`}</span>`; }
  return "";
}
function fmEvRow(e){
  const where = e.venue || e.location || "";
  const dates = e.start ? (e.end && e.end !== e.start ? `${dateChip(e.start)} – ${dateChip(e.end)}` : dateChip(e.start)) : "";
  return `<div class="fm-evrow"><a href="/event/${encodeURIComponent(e.key)}">${fmTourBadge(e.tour)}<span class="fm-evn"><b>${esc(e.name)}</b><span>${esc([dates, where].filter(Boolean).join(" · "))}</span></span>${fmCountdown(e)}${e.n?`<span class="fm-gn">${e.n}</span>`:""}</a>${fmStar("ev", e.key, e.name)}</div>`;
}
function fmEvents(){
  if (!FM.loaded) return fmSkeleton();
  const t = fmToday(), wk = addDaysIso(t, 7);
  const all = fmAllEvents();
  const ftour = qs("tour") || "", freg = qs("region") || "";
  const fams = [...new Set(all.filter(e => (e.end||e.start) >= addDaysIso(t,-30)).map(e => fmTourFamily(e.tour)))].sort();
  const regs = ["Americas","Europe","Asia","Oceania"].filter(r => all.some(e => fmRegion(e) === r));
  const ok = e => (!ftour || fmTourFamily(e.tour) === ftour) && (!freg || fmRegion(e) === freg);
  const evs = all.filter(ok);
  const end = e => e.end || e.start || "";
  const live = evs.filter(e => e.live > 0);
  const week = evs.filter(e => !e.live && e.start && e.start <= wk && end(e) >= t).sort((a,b) => a.start.localeCompare(b.start));
  const up = evs.filter(e => !e.live && e.start > wk).sort((a,b) => a.start.localeCompare(b.start));
  const past = evs.filter(e => !e.live && end(e) && end(e) < t && (e.n > 0 || e.archive)).sort((a,b) => end(b).localeCompare(end(a)));
  const months = {};
  up.forEach(e => { const k = e.start.slice(0,7); (months[k] = months[k] || []).push(e); });
  const mName = k => { const [Y,M] = k.split("-").map(Number); return new Date(Y, M-1, 1).toLocaleDateString(undefined, {month:"long", year:"numeric"}); };
  const link = (o) => { const p = new URLSearchParams(); const tt = o.tour != null ? o.tour : ftour, rr = o.region != null ? o.region : freg; if (tt) p.set("tour", tt); if (rr) p.set("region", rr); const q = String(p); return "/events" + (q ? "?" + q : ""); };
  const chips = `<div class="fm-chips" aria-label="Tour filter"><a class="fm-chip${!ftour?" on":""}" href="${link({tour:""})}">All tours</a>${fams.map(f => `<a class="fm-chip${ftour===f?" on":""}" href="${link({tour:f})}">${esc(f)}</a>`).join("")}</div>
    <div class="fm-chips fm-chips2" aria-label="Region filter"><a class="fm-chip sm${!freg?" on":""}" href="${link({region:""})}">All regions</a>${regs.map(r => `<a class="fm-chip sm${freg===r?" on":""}" href="${link({region:r})}">${esc(r)}</a>`).join("")}</div>`;
  const sec = (title, list) => list.length ? `<section class="fm-card"><h2 class="fm-h2">${title}</h2>${list.map(fmEvRow).join("")}</section>` : "";
  const any = live.length + week.length + up.length + past.length;
  return `<div class="fm-wrap fm-events"><h1 class="fm-h1">Events</h1>
    ${chips}
    ${sec(`<span class="fm-pulse"></span> Live now`, live)}
    ${sec("This week", week)}
    ${Object.keys(months).sort().map(k => sec(esc(mName(k)), months[k])).join("")}
    ${sec("Past", past.slice(0, 40))}
    ${any ? "" : `<div class="fm-empty"><p>No events match these filters.</p><a class="fm-btn" href="/events">Clear filters</a></div>`}
    <p class="fm-foot">Schedule from the WPM tour calendar. Dates are local to each event. <a href="/calendar">Full calendar</a>.</p></div>`;
}

function fmUpcomingEvent(e){
  const t = fmToday();
  const dates = e.end && e.end !== e.start ? `${dateChip(e.start)} – ${dateChip(e.end)}` : dateChip(e.start);
  const where = e.venue || e.location || "";
  const state_ = e.start > t ? "upcoming" : (e.end||e.start) < t ? "done" : "now";
  const facts = [["Dates", dates], ["Venue", where], ["Region", fmRegion(e) !== "Other" ? fmRegion(e) : ""], ["Tour", fmTourName(e.tour)], ["Tier", e.tier && !/unranked|results-only/i.test(e.tier) ? e.tier : ""], ["Prize money", e.prize], ["Time zone", e.tz]].filter(f => f[1]);
  const msg = state_ === "upcoming" ? "Entry list and draw are not out yet" : state_ === "now" ? "In progress. No live score feed for this event yet" : "Finished. Results are not in our feeds yet";
  return `<div class="fm-wrap fm-eventpage">
    <section class="fm-evhead">${fmTourBadge(e.tour)}<div><h1>${esc(e.name)}</h1><p>${esc([dates, where].filter(Boolean).join(" · "))} ${fmCountdown(e)}</p></div>${fmStar("ev", e.key, e.name)}</section>
    <section class="fm-card fm-pending"><div class="fm-pend-ic">${fmIcon("events", 28)}</div><h2>${esc(msg)}</h2><p>${state_ === "upcoming" ? "Divisions, entries and the bracket will appear here once the tour publishes them. Star the event to see it in Following." : "Scores show here automatically if a feed comes online."}</p>${e.url ? `<a class="fm-btn" href="${escAttr(e.url)}" target="_blank" rel="noopener">Official event page</a>` : ""}</section>
    <section class="fm-card"><h2 class="fm-h2">Event info</h2><dl class="fm-facts">${facts.map(([k,v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl><p class="fm-foot">Divisions: not published in our feeds yet.</p></section>
  </div>`;
}
function fmEvent(key){
  const evs = fmAllEvents();
  const e = evs.find(x => x.key === key) || fmCalEvents().find(x => x.key === key);
  if (e && e.cal) return fmUpcomingEvent(e);
  if (e && e.archive) { const c = state.archiveCache[e.archive]; if (!c) pullArchive(e.archive); }
  const rows = fmAll().filter(m => fmEventKey(m) === key);
  if (!e && !FM.loaded) return fmSkeleton();
  if (!e) return `<div class="fm-wrap"><div class="fm-empty"><p>Event not on the board.</p><a class="fm-btn" href="/events">All events</a></div></div>`;
  const loading = e.archive && (!state.archiveCache[e.archive] || state.archiveCache[e.archive].loading);
  const divs = [...new Set(rows.map(fmDivision))].filter(Boolean).sort();
  let div = qs("div"); if (divs.indexOf(div) < 0) div = divs[0] || "";
  const tab = qs("tab") === "results" ? "results" : "draw";
  const dRows = rows.filter(m => fmDivision(m) === div);
  const byRound = {};
  dRows.forEach(m => { const r = fmRound(m) || "Matches"; (byRound[r] = byRound[r] || []).push(m); });
  const rounds = Object.keys(byRound).sort((a,b) => fmRoundRank(a) - fmRoundRank(b));
  const ko = rounds.filter(r => fmRoundRank(r) >= 10);
  const q = (o) => { const p = new URLSearchParams(); p.set("div", o.div != null ? o.div : div); p.set("tab", o.tab || tab); return `/event/${encodeURIComponent(key)}?${p}`; };
  const live = rows.filter(m => effectiveStatus(m) === "LIVE").length;
  let body = "";
  if (loading) body = fmSkeletonRows(6);
  else if (!dRows.length) body = `<p class="fm-note">No matches from this event on the board yet.</p>`;
  else if (tab === "draw" && ko.length) {
    body = `<div class="fm-btools"><div class="fm-bjump" role="toolbar" aria-label="Jump to round">${ko.map((r,i) => `<button type="button" class="fm-chip sm" data-fmjump="${i}" aria-label="Jump to ${escAttr(r)}">${esc(fmRoundShort(r))}</button>`).join("")}</div><div class="fm-barrows"><button type="button" class="fm-arrow" data-fmbx="-1" aria-label="Previous rounds">‹</button><button type="button" class="fm-arrow" data-fmbx="1" aria-label="Next rounds">›</button></div></div><div class="fm-bracket" role="region" aria-label="Draw, scroll sideways for later rounds" tabindex="0">${ko.map(r => `<div class="fm-bcol"><h3>${esc(r)}</h3><div class="fm-bcells">${fmSortMatches(byRound[r]).sort((a,b)=>String(a.id).localeCompare(String(b.id))).map(m => fmBox(m)).join("")}</div></div>`).join("")}</div>${rounds.length > ko.length ? `<p class="fm-note">Group and early rounds: <a href="${q({tab:"results"})}">results by round</a>.</p>` : ""}`;
  } else {
    body = rounds.slice().reverse().map(r => `<section class="fm-group"><div class="fm-gh"><span class="fm-ghb static"><span class="fm-gt"><b>${esc(r)}</b></span><span class="fm-gn">${byRound[r].length}</span></span></div><div class="fm-rows">${fmSortMatches(byRound[r]).map(m => fmRow(m, {showDate:true})).join("")}</div></section>`).join("");
  }
  return `<div class="fm-wrap fm-eventpage${tab==="draw"&&ko.length?" fm-wide":""}">
    <section class="fm-evhead">${fmTourBadge(e.tour)}<div><h1>${esc(e.name)}</h1><p>${esc([e.start&&e.end?`${dateChip(e.start)} – ${dateChip(e.end)}`:"", e.venue].filter(Boolean).join(" · "))}${live?` · <b class="fm-live">${live} live</b>`:""}</p></div>${fmStar("ev", key, e.name)}</section>
    ${divs.length > 1 ? `<div class="fm-chips" role="tablist" aria-label="Division">${divs.map(d => `<a role="tab" class="fm-chip${d===div?" on":""}" href="${q({div:d})}" aria-selected="${d===div}">${esc(d)}</a>`).join("")}</div>` : ""}
    <nav class="fm-segs" aria-label="Event sections"><a href="${q({tab:"draw"})}" class="${tab==="draw"?"on":""}">Draw</a><a href="${q({tab:"results"})}" class="${tab==="results"?"on":""}">Results by round</a></nav>
    ${body}
  </div>`;
}
function fmBox(raw){
  const m = presentMatch(raw);
  const st = effectiveStatus(m);
  const win = fmWinnerSide(m);
  const sides = fmSides(m);
  const sets = String(m.score||"").split("-");
  const hasSets = !!m.score && sets.length === 2;
  const games = fmGames(m).slice(0,5);
  const side = (i) => {
    const gc = games.map(g => { const v = i ? g.b : g.a, o = i ? g.a : g.b; return `<span class="fm-bg${Number(v)>Number(o)?" fm-w":""}${g.live?" live":""}">${esc(v)}</span>`; }).join("");
    return `<span class="fm-bs${win===i?" win":win===1-i?" lose":""}">${sides[i].team?fmFlag(sides[i].short):""}<span class="fm-nm">${esc(sides[i].short||"TBD")}</span>${gc?`<span class="fm-bgs">${gc}</span>`:""}<b class="fm-bset">${hasSets?esc(sets[i]):""}</b></span>`;
  };
  const aria = `${sides[0].short} vs ${sides[1].short}${hasSets?`, ${m.score}`:""}${games.length?` (${games.map(g=>g.a+"-"+g.b).join(", ")})`:""}`;
  return `<a class="fm-box st-${st}${fmFollowsMatch(m)?" fol":""}" href="/match/${encodeURIComponent(m.id)}" aria-label="${escAttr(aria)}">
    ${side(0)}${side(1)}
    ${st==="LIVE"?'<i class="fm-live fm-boxlive">LIVE</i>':""}
  </a>`;
}
function fmRoundShort(r){
  const s = String(r||"");
  if (/quarter/i.test(s)) return "QF";
  if (/semi/i.test(s)) return "SF";
  if (/final/i.test(s)) return "F";
  const n = s.match(/(\d+)/); if (n) return "R" + n[1];
  return s.length > 6 ? s.slice(0,6) : s;
}
function fmBracketScroll(dir, idx){
  const b = document.querySelector(".fm-bracket"); if (!b) return;
  const cols = [...b.querySelectorAll(".fm-bcol")];
  if (idx == null) {
    const w = cols[0] ? cols[0].offsetWidth : 260;
    b.scrollBy({left: dir * w, behavior: "smooth"});
  } else if (cols[idx]) b.scrollTo({left: cols[idx].offsetLeft - b.offsetLeft - (b.firstElementChild ? b.firstElementChild.offsetLeft - b.offsetLeft : 0), behavior: "smooth"});
}
function fmBracketSync(){
  const b = document.querySelector(".fm-bracket"); if (!b) return;
  FM.bx = b.scrollLeft;
  const cols = [...b.querySelectorAll(".fm-bcol")];
  let cur = 0; cols.forEach((c,i) => { if (c.offsetLeft - b.offsetLeft <= b.scrollLeft + 24) cur = i; });
  document.querySelectorAll("[data-fmjump]").forEach(ch => ch.classList.toggle("on", Number(ch.getAttribute("data-fmjump")) === cur));
  const pv = document.querySelector("[data-fmbx='-1']"), nx = document.querySelector("[data-fmbx='1']");
  if (pv) pv.disabled = b.scrollLeft <= 2;
  if (nx) nx.disabled = b.scrollLeft + b.clientWidth >= b.scrollWidth - 2;
}
function fmBracketInit(){
  const b = document.querySelector(".fm-bracket"); if (!b) return;
  const key = location.pathname + location.search;
  if (FM.bxKey === key && FM.bx) b.scrollLeft = FM.bx; else FM.bx = 0;
  FM.bxKey = key;
  b.addEventListener("scroll", fmBracketSync, {passive:true});
  b.addEventListener("keydown", ev => { if (ev.key === "ArrowRight") { fmBracketScroll(1); ev.preventDefault(); } else if (ev.key === "ArrowLeft") { fmBracketScroll(-1); ev.preventDefault(); } });
  let drag = null, moved = false;
  b.addEventListener("pointerdown", ev => { if (ev.pointerType !== "mouse" || ev.button !== 0) return; drag = {x: ev.clientX, l: b.scrollLeft}; moved = false; });
  window.addEventListener("pointermove", ev => { if (!drag) return; const dx = ev.clientX - drag.x; if (Math.abs(dx) > 5) { moved = true; b.classList.add("drag"); } if (moved) b.scrollLeft = drag.l - dx; });
  window.addEventListener("pointerup", () => { if (drag) { drag = null; setTimeout(() => b.classList.remove("drag"), 0); } });
  b.addEventListener("click", ev => { if (moved) { ev.preventDefault(); ev.stopPropagation(); moved = false; } }, true);
  fmBracketSync();
}
/* ---------- Search & More ---------- */
function fmSearch(){
  const q = (qs("q") || "").trim();
  const n = q.toLowerCase();
  let res = "";
  if (n.length >= 2) {
    const ppl = new Map();
    fmAll().forEach(m => fmSides(m).forEach(s => (s.team ? [s.short] : s.names).forEach(nm => { if (nm.toLowerCase().includes(n)) ppl.set(nm, s.team); })));
    const evs = fmEventsIndex().filter(e => (e.name||"").toLowerCase().includes(n) || (e.venue||"").toLowerCase().includes(n));
    const ms = fmAll().filter(m => `${m.a} ${m.b} ${m.roster||""}`.toLowerCase().includes(n));
    res = `${ppl.size ? `<section class="fm-card"><h2 class="fm-h2">Players & teams</h2>${[...ppl].slice(0,20).map(([nm,team]) => `<div class="fm-evrow"><a href="${team?teamPath(nm):fmHub(nm)}">${team?fmFlag(nm):`<span class="fm-av">${esc(personInitials(nm))}</span>`}<span class="fm-evn"><b>${esc(nm)}</b><span>${team?"Team":"Player hub on World Pickleball Magazine"}</span></span></a>${fmStar("p", nm, nm)}</div>`).join("")}</section>` : ""}
      ${evs.length ? `<section class="fm-card"><h2 class="fm-h2">Events</h2>${evs.slice(0,10).map(e => `<div class="fm-evrow"><a href="/event/${encodeURIComponent(e.key)}">${fmTourBadge(e.tour)}<span class="fm-evn"><b>${esc(e.name)}</b><span>${esc(e.venue||"")}</span></span></a>${fmStar("ev", e.key, e.name)}</div>`).join("")}</section>` : ""}
      ${ms.length ? `<section class="fm-group"><div class="fm-gh"><span class="fm-ghb static"><span class="fm-gt"><b>Matches</b></span><span class="fm-gn">${ms.length}</span></span></div><div class="fm-rows">${fmSortMatches(ms).slice(0,30).map(m => fmRow(m, {showDate:true, sub: shortEventLabel(fmEventName(m), fmEventKey(m))+" · "+[fmDivision(m), fmRound(m)].filter(Boolean).join(" · ")})).join("")}</div></section>` : ""}
      ${!ppl.size && !evs.length && !ms.length ? `<div class="fm-empty"><p>No players, teams or events match “${esc(q)}”.</p></div>` : ""}`;
  }
  return `<div class="fm-wrap"><form class="fm-search" role="search" data-fmsearch><label class="fm-sr" for="fmq">Search</label>${fmIcon("search")}<input id="fmq" name="q" type="search" value="${escAttr(q)}" placeholder="Players, teams, events" autocomplete="off" enterkeyhint="search"></form><div id="fm-results">${res || (n ? "" : `<p class="fm-note">Search players, teams and events on the board.</p>`)}</div></div>`;
}
function fmMore(){
  const ext = h => /^https?:/.test(h) && h.indexOf(location.origin) !== 0;
  const tile = (h, ic, l, sub) => `<a class="fm-tile" href="${escAttr(h)}"${ext(h)?' target="_blank" rel="noopener"':""}><span class="fm-tic">${ic}</span><span class="fm-evn"><b>${esc(l)}</b><span>${esc(sub)}</span></span><span class="fm-chev" aria-hidden="true">›</span></a>`;
  const E = c => `<span aria-hidden="true">${c}</span>`;
  const nPl = Object.keys(state.selected||{}).filter(k => state.selected[k]).length;
  const nEv = Object.keys(FM.evFollows||{}).filter(k => FM.evFollows[k]).length;
  const pushOk = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  const perm = pushOk ? Notification.permission : "unsupported";
  const pushTxt = perm === "granted" ? "On for followed players" : perm === "denied" ? "Blocked in browser settings" : perm === "default" ? "Off. Tap to allow" : "Not supported on this browser";
  const sec = (t, body) => `<section class="fm-card fm-hub"><h2 class="fm-h2">${t}</h2><div class="fm-tiles">${body}</div></section>`;
  return `<div class="fm-wrap fm-more"><h1 class="fm-h1">More</h1>
    ${sec("Play", tile("https://pickleball-fantasy-league.comeontheoviedo.workers.dev", E("🏆"), "Fantasy", "Pick a squad, score on real results") + tile("https://pickleball-traders.comeontheoviedo.workers.dev", E("📈"), "Traders", "Back players, trade the market"))}
    ${sec("Watch &amp; listen", tile(MAG+"/watch/", E("▶️"), "Watch", "Video from the magazine") + tile(MAG+"/podcast/", E("🎙️"), "Podcast", "The WPM podcast"))}
    ${sec("The World Pickleball Report", `<div class="fm-tile fm-news"><span class="fm-tic">${E("✉️")}</span><span class="fm-evn"><b>Get the Report</b><span>The week in pro pickleball, in your inbox</span></span><a class="fm-btn" href="${MAG}/newsletter/" target="_blank" rel="noopener">Sign up</a></div>`)}
    ${sec("Alerts &amp; following", tile("/following", fmIcon("following", 22), "Following", `${nPl} player${nPl===1?"":"s"} · ${nEv} event${nEv===1?"":"s"}`) + (pushOk ? `<button type="button" class="fm-tile" data-fmpush><span class="fm-tic">${E("🔔")}</span><span class="fm-evn"><b>Match alerts</b><span>${esc(pushTxt)}</span></span></button>` : `<div class="fm-tile"><span class="fm-tic">${E("🔔")}</span><span class="fm-evn"><b>Match alerts</b><span>${esc(pushTxt)}</span></span></div>`))}
    ${HEAT_CHECK_ENABLED ? sec("Heat Check", tile(HEAT_CHECK_URL, E("🔥"), "Heat Check", "Who is hot right now")) : ""}
    ${sec("Archive", tile("/history", fmIcon("events", 22), "Archive", "Medals and past seasons"))}
    ${sec("Magazine", tile(MAG+"/", E("📰"), "Magazine", "Stories, issues and rankings on worldpickleballmagazine.com"))}
    <section class="fm-card fm-hub"><div class="fm-tile"><span class="fm-tic">${E("🌓")}</span><span class="fm-evn"><b>Appearance</b><span>Light or dark</span></span>${themeToggle().replace('class="theme"','class="theme fm-theme solid"')}</div></section>
    <p class="fm-foot">From <a href="${MAG}/" target="_blank" rel="noopener">World Pickleball Magazine</a>. Scores and draws from public tour feeds (PPA, APP, MLP, GPA, PPA Asia, PPA Europe, RTA and others); ratings by WPR. Scores are never estimated.</p>
  </div>`;
}
function fmDetectChanges(){
  const flash = {};
  fmAll().forEach(m => {
    const s = fmSig(presentMatch(m));
    if (FM.prevSig[m.id] != null && FM.prevSig[m.id] !== s) flash[m.id] = Date.now();
    FM.prevSig[m.id] = s;
  });
  Object.keys(FM.flash).forEach(id => { if (Date.now() - FM.flash[id] < 6000 && !flash[id]) flash[id] = FM.flash[id]; });
  FM.flash = flash;
}
pull = (function(orig){
  return async function(){
    await orig();
    fmDetectChanges();
    FM.loaded = true;
    FM.lastPoll = Date.now();
  };
})(pull);
function fmPlayerParam(raw){
  let n = raw; try { n = decodeURIComponent(raw); } catch(e) {}
  if (resolvePlayerKey(n)) return raw;
  const spaced = n.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const key = resolvePlayerKey(spaced);
  return key ? encodeURIComponent(key) : raw;
}
function render(){
  if (!state.date) state.date = boardToday();
  const p = path();
  let inner = "", m, back = "";
  if (p === "/" ) inner = fmHome();
  else if (p === "/following") inner = fmFollowing();
  else if (p === "/events") inner = fmEvents();
  else if ((m = p.match(/^\/event\/(.+)$/))) { inner = fmEvent(decodeURIComponent(m[1])); back = "/events"; }
  else if (p === "/search") inner = fmSearch();
  else if (p === "/more") inner = fmMore();
  else if ((m = p.match(/^\/match\/([^/]+)$/))) { inner = fmMatch(decodeURIComponent(m[1])); back = "/"; }
  else if (p === "/magazine") inner = `<div class="fm-legacy">${viewMagazine()}</div>`;
  else if (p === "/calendar") inner = `<div class="fm-legacy">${viewCalendar()}</div>`;
  else if (p === "/history") inner = `<div class="fm-legacy">${viewHistory()}</div>`;
  else if (p === "/rankings") inner = `<div class="fm-legacy">${viewRankings()}</div>`;
  else if (p === "/shop") inner = `<div class="fm-legacy">${viewShop()}</div>`;
  else if (p === "/draw") inner = fmEvents();
  else if ((m = p.match(/^\/player\/([^/]+)$/))) inner = `<div class="fm-legacy">${viewPerson("player", fmPlayerParam(m[1]))}</div>`;
  else if ((m = p.match(/^\/team\/([^/]+)$/))) inner = `<div class="fm-legacy">${viewPerson("team", m[1])}</div>`;
  else inner = `<div class="fm-wrap"><div class="fm-empty"><p>Not found.</p><a class="fm-btn" href="/">Matches</a></div></div>`;
  const ae = document.activeElement;
  const keep = ae && ae.id === "fmq" ? {v: ae.value, s: ae.selectionStart} : null;
  const strip = document.querySelector(".fm-dates");
  const sx = strip ? strip.scrollLeft : null;
  document.getElementById("app").innerHTML = fmChrome(inner, {back});
  bind();
  if (keep) { const i = document.getElementById("fmq"); if (i) { i.focus(); i.value = keep.v; try { i.setSelectionRange(keep.s, keep.s); } catch(e) {} } }
  const on = document.querySelector(".fm-day.on");
  if (on && sx == null) on.scrollIntoView({block:"nearest", inline:"center"});
  else if (strip && sx != null) { const s2 = document.querySelector(".fm-dates"); if (s2) s2.scrollLeft = sx; }
  fmBracketInit();
  pruneNotified();
  notifyLiveFollows();
}
document.addEventListener("click", function(ev){
  const bj = ev.target && ev.target.closest ? ev.target.closest("[data-fmjump],[data-fmbx]") : null;
  if (bj) { ev.preventDefault(); ev.stopPropagation(); if (bj.hasAttribute("data-fmjump")) fmBracketScroll(0, Number(bj.getAttribute("data-fmjump"))); else fmBracketScroll(Number(bj.getAttribute("data-fmbx"))); return; }
}, true);
document.addEventListener("click", function(ev){
  const t = ev.target && ev.target.closest ? ev.target.closest("[data-fmstar],[data-fmcol],[data-fmday],[data-fmlive]") : null;
  if (!t) return;
  ev.preventDefault(); ev.stopPropagation();
  if (t.hasAttribute("data-fmstar")) return fmToggleStar(t.getAttribute("data-fmstar"), t.getAttribute("data-key"));
  if (t.hasAttribute("data-fmcol")) {
    const k = t.getAttribute("data-fmcol");
    if (FM.collapsed[k]) delete FM.collapsed[k]; else FM.collapsed[k] = 1;
    try { localStorage.setItem("wpm-v2-collapsed", JSON.stringify(FM.collapsed)); } catch(e) {}
    return render();
  }
  if (t.hasAttribute("data-fmday")) { state.fmDate = t.getAttribute("data-fmday"); FM.liveOnly = false; const s = document.querySelector(".fm-dates"); render(); const on = document.querySelector(".fm-day.on"); if (on) on.scrollIntoView({block:"nearest", inline:"center", behavior:"smooth"}); return; }
  if (t.hasAttribute("data-fmlive")) { FM.liveOnly = !FM.liveOnly; return render(); }
}, true);
document.addEventListener("change", function(ev){
  if (ev.target && ev.target.hasAttribute && ev.target.hasAttribute("data-fmpick") && ev.target.value) { state.fmDate = ev.target.value; FM.liveOnly = false; render(); }
});
let fmSearchT = 0;
document.addEventListener("input", function(ev){
  if (!ev.target || ev.target.id !== "fmq") return;
  clearTimeout(fmSearchT);
  fmSearchT = setTimeout(() => { history.replaceState({}, "", "/search?q=" + encodeURIComponent(ev.target.value)); render(); }, 180);
});
document.addEventListener("submit", function(ev){ if (ev.target && ev.target.hasAttribute("data-fmsearch")) { ev.preventDefault(); const i = document.getElementById("fmq"); if (i) i.blur(); } }, true);
document.addEventListener("visibilitychange", function(){ if (!document.hidden && FM.loaded && Date.now() - FM.lastPoll > 10000) pull().then(render); });
(function(){
  const d = qs("date"); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) state.fmDate = d;
  if (document.getElementById("app")) render();
})();
document.addEventListener("click", (ev) => {
  const b = ev.target.closest && ev.target.closest("[data-fmpush]"); if (!b) return;
  ev.preventDefault();
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") Notification.requestPermission().then(p => { if (p === "granted") { ensureSafeSW(); syncPushSubscription(); } render(); });
  else if (Notification.permission === "granted") { syncPushSubscription(); }
}, true);
