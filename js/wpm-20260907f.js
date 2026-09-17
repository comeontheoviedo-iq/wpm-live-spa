
const WATCH = {
  pbtv: {label:"Watch on PBTV", href:"https://www.ppatour.com/watch/"},
  streamed: {label:"PPA Streamed Courts", href:"https://www.youtube.com/@ppastreamedcourts"},
  wcyoutube: {label:"World Cup YouTube", href:"https://www.youtube.com/@PickleballWorldCup/streams"}
};
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
  brackets: {},
  wcBrackets: {},
  drawTour: "ppa",
  drawDiv: ""
};
try { state.selected = JSON.parse(localStorage.getItem("wpm-follows") || "{}"); } catch(e) { state.selected = {}; }

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
  if (m.status === "FT") return "FT";
  const now = Date.now();
  const start = parseUtc(m.start);
  const end = parseUtc(m.end);
  if (m.status === "LIVE") return "LIVE";
  if (start && end && now >= start.getTime() && now <= end.getTime()) return "LIVE";
  if (start && now >= start.getTime() && !end && now - start.getTime() < 3*3600000) return "LIVE";
  return "NEXT";
}
function followsMatch(m){
  return (m.tags || []).some(t => state.selected[t]);
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
  const lines = (m.lines || []).map(l => {
    const pts = String(l.score||"").split(/[–-]/);
    const done = gameLooksFinished(pts[0], pts[1]);
    return {...l, winner: done ? l.winner : "", live: !done && m.status !== "FT" && (l.live || !done && (Number(pts[0])||Number(pts[1]))) };
  });
  if (!lines.length) return m;
  const w0 = lines.filter(l => l.winner && (l.winner === m.a || String(l.winner).includes(String(m.a).split(" ")[0]))).length;
  // safer count by comparing scores
  let aWins=0,bWins=0;
  lines.forEach(l => {
    const pts = String(l.score||"").split(/[–-]/);
    if (!gameLooksFinished(pts[0], pts[1])) return;
    if (Number(pts[0]) > Number(pts[1])) aWins++;
    else if (Number(pts[1]) > Number(pts[0])) bWins++;
  });
  const live = lines.some(l => !gameLooksFinished(...String(l.score||"").split(/[–-]/)));
  return Object.assign({}, m, {
    lines,
    score: (m.status==="NEXT" && !aWins && !bWins && !live) ? "" : `${aWins}-${bWins}`,
    games: lines.map(l => `${l.disc} ${l.score}${gameLooksFinished(...String(l.score||"").split(/[–-]/))?"":" LIVE"}`).join(" · ")
  });
}

function byId(id){ return state.matches.find(m => m.id === id); }

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
  if (d.includes("open")) return {id:"wc-open", title:"World Cup · Open", place:"Da Nang", rank:2};
  if (d.includes("junior")) return {id:"wc-jr", title:"World Cup · Juniors", place:"Da Nang", rank:3};
  if (d.includes("kid")) return {id:"wc-kids", title:"World Cup · Kids", place:"Da Nang", rank:4};
  if (d.includes("senior") || d.includes("master")) return {id:"wc-sr", title:"World Cup · Age groups", place:"Da Nang", rank:5};
  if (m.tour === "wc") return {id:"wc-other", title:"World Cup", place:"Da Nang", rank:6};
  return {id:"other", title:m.comp||"Other", place:"", rank:9};
}

function filteredList(){
  return state.matches.filter(m => {
    if (m.date !== state.date) return false;
    if (state.filter === "ppa" && m.tour !== "ppa") return false;
    if (state.filter === "wc" && m.tour !== "wc") return false;
    if (state.filter === "npl" && m.tour !== "npl") return false;
    if (state.filter === "asia" && m.tour !== "asia") return false;
    if (state.filter === "following" && !followsMatch(m)) return false;
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

function playerPath(name){
  return "/player/" + encodeURIComponent(String(name||"").trim());
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
        <a class="a" href="${playerPath(m.a)}">${m.a}</a>
        <a class="b" href="${playerPath(m.b)}">${m.b}</a>
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
    <a class="issue" href="/magazine">LATEST ISSUE</a>
  </header>
  ${inner}
  <nav class="tabbar">
    <a class="${path()==="/"||path().startsWith("/match")||path().startsWith("/player")||path().startsWith("/team")||path()==="/draw"?"on":""}" href="/">Live</a>
    <a class="${path()==="/rankings"?"on":""}" href="/rankings">Table</a>
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
          <button data-f="npl" class="${state.filter==="npl"?"on":""}">NPL</button>
          <button data-f="wc" class="${state.filter==="wc"?"on":""}">World Cup</button>
          <button data-f="following" class="${state.filter==="following"?"on":""}">Following</button>
        </div>
      </div>
    </div>
    <div class="panel">${state.boardMode==="draw" ? drawBoard() : (blocks || `<p class="empty">No matches for this day and filter.</p>`)}</div>
    ${weekStrip()}
    </div>
    <aside class="rail-right">${tableRail()}</aside>
  </div>`;
}

function leagueRail(){
  const items=[
    ["all","All competitions"],
    ["ppa","PPA Tour (US)"],
    ["asia","PPA Asia"],
    ["npl","NPL Australia"],
    ["mlp-asia","MLP Asia"],
    ["gpa","GPA events"],
    ["following","Following"]
  ];
  return `<div class="panel rail-card"><div class="kicker">Competitions</div>${items.map(([id,l])=>`<button class="league ${state.filter===id?"on":""}" data-f="${id}">${l}</button>`).join("")}</div>`;
}
function tableRail(){
  const gpa=((state.rankings||{}).gpa||{}).mens_singles||[];
  const elo=((state.rankings||{}).elo||{}).singles||[];
  const g=gpa.slice(0,6).map(r=>`<a class="rank-row" href="${playerPath(r.name)}"><b>${r.rank}</b><div><strong>${r.name}</strong><span>${r.country||""}</span></div><em>${r.points||""}</em></a>`).join("");
  const e=elo.slice(0,6).map(r=>`<a class="rank-row" href="${playerPath(r.name)}"><b>${r.rank}</b><div><strong>${r.name}</strong><span>ELO</span></div><em>${r.elo||""}</em></a>`).join("");
  return `<div class="panel rail-card"><div class="kicker">GPA table</div>${g||"<p class='empty'>Loading table…</p>"}<a class="chip" href="/rankings">Full table</a><a class="chip" href="/history">Archive</a></div><div class="panel rail-card"><div class="kicker">Pro ELO</div>${e||"<p class='empty'>ELO loading…</p>"}</div>`;
}
function weekStrip(){
  const ev=(state.rankings&&state.rankings.events)||[];
  const soon=ev.filter(e=> (e.tournament_date||'') >= ymd(new Date())).slice(0,5);
  if(!soon.length) return '';
  return `<div class="panel"><div class="kicker">This week on the GPA calendar</div>${soon.map(e=>`<div class="rank-row"><b></b><div><strong>${e.name||''}</strong><span>${(e.tournament_date||'').slice(0,10)} · ${e.location||e.venue||''} · ${e.tier||''}</span></div><em>${e.host||''}</em></div>`).join('')}<a class="chip" href="/rankings">Full table</a><a class="chip" href="/history">Archive</a></div>`;
}
function followChips(){
  return ["Vietnam","USA","India","Waters","Johns","Bright"].map(k => {
    const label = PLAYERS[k]?.name.split(" ").slice(-1)[0] === k ? PLAYERS[k].name.replace("Anna Leigh ","A. ").replace("Anna ","A. ").replace("Ben ","B. ") : k;
    const short = {Waters:"A. Waters",Johns:"B. Johns",Bright:"A. Bright"}[k] || k;
    return `<button class="chip ${state.selected[k]?"on":""}" data-follow="${k}">${short}</button>`;
  }).join("");
}

function drawNext(m){
  if (m.tour !== "ppa" && m.tour !== "wc") return "";
  const nameBits = (m.a+" "+m.b).split(/[\/ ]+/).filter(w => w.length>2);
  const all = [];
  [state.brackets, state.wcBrackets].forEach(br => Object.values(br||{}).forEach(rounds => Object.values(rounds).forEach(arr => all.push(...arr))));
  const later = all.filter(x => x.id !== m.id && x.status !== "FT" && nameBits.some(n => (x.a+" "+x.b).includes(n)));
  if (!later.length) return `<p class="games"><a href="/draw">See the draw</a></p>`;
  return `<div class="panel"><div class="kicker">Up next in the draw</div>${later.slice(0,3).map(x=>`<a class="match" href="/match/${x.id}"><div class="line"><div class="a">${x.a}</div><div class="score">${x.score||"vs"}</div><div class="b">${x.b}</div></div></a>`).join("")}<a class="chip" href="/draw">Full draw</a></div>`;
}
function viewMatch(id){
  const raw = byId(id);
  const m = raw ? cleanLines(raw) : raw;
  if (!m) return `<div class="wrap"><p class="empty">Match not found.</p><a class="btn" href="/">Back to live</a></div>`;
  const st = effectiveStatus(m);
  const w = WATCH[m.watch];
  const games = (m.games||"").split("·").map(s=>s.trim()).filter(Boolean);
  const related = STORIES.filter(s => (m.tour==="wc" && s.tag==="World Cup") || (m.tour==="ppa" && s.tag==="PPA Tour"));
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
    ${related.length?`<div class="panel"><div class="kicker">From the magazine</div>${related.map(s=>`<a href="${s.href}"><h3 style="font-family:Syne,sans-serif;margin:8px 0">${s.title}</h3><p class="games">${s.stand}</p></a>`).join("")}</div>`:""}
    <div class="panel"><div class="kicker">Kit on this match</div>${PRODUCTS.filter(p => !(m.tags||[]).length || (p.tags||[]).some(t => (m.tags||[]).includes(t)) || p.cat==="balls" || p.cat==="grips").slice(0,3).map(productCard).join("")}</div>
  </div>`;
}

function lookupPerson(kind, id){
  id = decodeURIComponent(id||"");
  if (kind!=="player") return TEAMS[id] || {name:id, role:"Team", blurb:""};
  if (PLAYERS[id]) return PLAYERS[id];
  const elo = [ ...(((state.rankings||{}).elo||{}).singles||[]), ...(((state.rankings||{}).elo||{}).mensDoubles||[]) ].find(p => p.name===id || (p.name||"").toLowerCase()===id.toLowerCase());
  let gpa = null;
  Object.values((state.rankings||{}).gpa||{}).forEach(rows => {
    (rows||[]).forEach(r => { if (!gpa && r.name && r.name.toLowerCase()===id.toLowerCase()) gpa = r; });
  });
  const bits = [];
  if (gpa) bits.push(`GPA #${gpa.rank} · ${gpa.points} pts · ${gpa.country||""}`);
  if (elo) bits.push(`Pro ELO ${elo.elo}${elo.dupr?" · DUPR "+elo.dupr:""}`);
  return { name: (elo&&elo.name)||(gpa&&gpa.name)||id, role: bits.join(" · ") || "Player", blurb: bits.length ? "Profile built from the live rankings boards and this week’s ties." : "No ranking row yet. Ties that include this name still show below." };
}
function viewPerson(kind, id){
  id = decodeURIComponent(id||"");
  const rec = lookupPerson(kind, id);
  if (!rec) return `<div class="wrap"><p class="empty">Not found.</p></div>`;
  const needle = (rec.name||id).toLowerCase();
  const list = state.matches.filter(m => {
    if ((m.tags||[]).includes(id)) return true;
    return String(m.a||"").toLowerCase().includes(needle) || String(m.b||"").toLowerCase().includes(needle);
  })
    .sort((a,b) => (parseUtc(a.start)?.getTime()||0) - (parseUtc(b.start)?.getTime()||0));
  const today = list.filter(m => m.date === ymd(new Date()));
  return `<div class="wrap">
    <p class="kicker">${kind==="player"?"Player":"Team"}</p>
    <h2 style="font-family:Syne,sans-serif;font-size:32px;letter-spacing:-.03em">${rec.name}</h2>
    <p class="games">${rec.role}</p>
    <p style="margin:10px 0 16px;max-width:560px">${rec.blurb}</p>
    <button class="btn ${state.selected[id]?"gold":""}" data-follow="${id}">${state.selected[id]?"Following":"Follow"}</button>
    <div class="panel" style="margin-top:18px">
      <div class="kicker">${rec.name.split(" ").slice(-1)[0]} today</div>
      ${today.length?today.map(matchRow).join(""):"<p class='empty'>Nothing tagged for today.</p>"}
    </div>
    <div class="panel">
      <div class="kicker">This week</div>
      ${list.length?list.map(matchRow).join(""):"<p class='empty'>No tagged matches.</p>"}
    </div>
    ${playerMedals(rec.name)}
  </div>`;
}
function playerMedals(name){
  const n = (name||"").toLowerCase();
  const rows = ((state.history||{}).gpaMedals||[]).filter(m => (m.player||"").toLowerCase()===n);
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

function viewMagazine(){
  const stories = state.magazine.stories.length ? state.magazine.stories : STORIES.map(s => ({date:"", title:s.title, stand:s.stand, href:s.href}));
  const issues = [
    ["#19 Aug 2026","https://worldpickleballmagazine.com/magazines/"],
    ["#18 Jul 2026","https://worldpickleballmagazine.com/world-pickleball-magazine-july-2026-global-pickleball-news/"],
    ["#17 Jun 2026","https://worldpickleballmagazine.com/world-pickleball-magazine-june-2026-global-pickleball-news/"],
    ["#16 May 2026","https://worldpickleballmagazine.com/world-pickleball-magazine-may-2026-global-pickleball-news/"],
    ["#15 Apr 2026","https://worldpickleballmagazine.com/2026-april/"],
    ["#14 Mar 2026","https://worldpickleballmagazine.com/march-2026/"],
    ["#1 Feb 2025","https://worldpickleballmagazine.com/magazine/wpm-issue-1-february-2025/"]
  ];
  return `<div class="wrap">
    <h2 style="font-family:Syne,sans-serif;font-size:32px">Magazine</h2>
    <p class="games">The desk behind the scores. Issues from Feb 2025. Articles from the full site archive.</p>
    <div class="kicker" style="margin-top:16px">Issues</div>
    <div class="chips">${issues.map(([l,h])=>`<a class="chip" href="${h}">${l}</a>`).join("")}<a class="chip" href="https://worldpickleballmagazine.com/magazines/">All 19 issues</a></div>
    <div class="grid" style="margin-top:16px">
      ${stories.map(s=>`<a class="story" href="${s.href}"><div class="ph"${s.image?` style="background-image:url('${s.image}');background-size:cover;background-position:center"`:""}></div><div class="body"><small>${(s.date||"").slice(0,10)}</small><h3>${s.title}</h3><p class="games">${s.stand||""}</p></div></a>`).join("")}
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



function bracketsFromMatches(tour){
  const out = {};
  const stored = tour==="wc" ? state.wcBrackets : state.brackets;
  const looksFlat = stored && Object.values(stored).every(rounds => Object.keys(rounds).length<=1 && Object.keys(rounds)[0]==="Round");
  if (stored && Object.keys(stored).length && !looksFlat) {
    return stored;
  }
  (state.matches||[]).filter(m => m.tour===tour).forEach(m => {
    const parts = (m.div||"").split(" · ").map(s=>s.trim()).filter(Boolean);
    const div = parts[0] || (tour==="wc"?"World Cup":"PPA");
    const round = m.round || parts.find(p => /round|final|quarter|semi/i.test(p)) || parts[1] || "Round";
    (out[div] ||= {});
    (out[div][round] ||= []).push({id:m.id,a:m.a,b:m.b,score:m.score,status:effectiveStatus(m),games:m.games,date:m.date});
  });
  return out;
}
function drawBoard(){
  if (state.filter === "wc") state.drawTour = "wc";
  if (state.filter === "ppa") state.drawTour = "ppa";
  const tour = state.drawTour === "wc" ? "wc" : "ppa";
  const brackets = bracketsFromMatches(tour);
  const divs = Object.keys(brackets);
  const div = state.drawDiv && brackets[state.drawDiv] ? state.drawDiv : (divs[0] || "");
  const order = ["Round 1","Round 2","Round 3","Round 64","Round 32","Round of 32","Round 16","Round of 16","Quarterfinal","Quarter Finals","Third Place","Semifinal","Semi-Finals","Final","Finals"];
  const rounds = div ? Object.keys(brackets[div]).sort((a,b) => (order.indexOf(a)<0?50:order.indexOf(a)) - (order.indexOf(b)<0?50:order.indexOf(b))) : [];
  const hide = tour === "ppa" ? ["Round 64","Round 32"] : ["Round","Round 1","Round 2","Round 3"];
  const knockout = ["Quarterfinal","Quarter Finals","Semifinal","Semi-Finals","Third Place","Final","Finals"];
  let show = rounds.filter(r => !hide.includes(r));
  if (tour === "wc") {
    show = knockout.filter(r => rounds.includes(r));
    if (!show.length) show = rounds.filter(r => !hide.includes(r));
  }
  const cols = (show.length?show:rounds).map(r => {
    const items = (brackets[div][r] || []).slice(0, 24);
    return `<div class="bracket-col"><h3>${r}</h3>${items.map(m => `
      <a class="bracket-match ${m.status==="LIVE"?"live":""}" href="/match/${m.id}">
        <div><b>${m.a}</b><span>${m.status==="NEXT"?"":(m.score||"").split("-")[0]||""}</span></div>
        <div><b>${m.b}</b><span>${m.status==="NEXT"?"":(m.score||"").split("-")[1]||""}</span></div>
        <em>${m.status==="LIVE"?"LIVE":m.status==="FT"?"FT":"Next"}</em>
      </a>`).join("")}</div>`;
  }).join("");
  return `
    <div class="seg" style="margin:0 0 12px">
      <button data-drawtour="ppa" class="${tour==="ppa"?"on":""}">PPA</button>
      <button data-drawtour="wc" class="${tour==="wc"?"on":""}">World Cup</button>
    </div>
    <div class="seg" style="margin:0 0 12px;flex-wrap:wrap">${divs.map(d=>`<button data-draw="${d}" class="${d===div?"on":""}">${d}</button>`).join("")}</div>
    <div class="bracket">${cols || "<p class='empty'>Draw loads with the live board.</p>"}</div>`;
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
function viewHistory(){
  const h = state.history;
  if (!h) return `<div class="wrap"><p class="empty">Loading archive…</p></div>`;
  const armed = (h.armed||[]).map(e => `<div class="rank-row"><b></b><div><strong>${e.name}</strong><span>${e.start} → ${e.end} · ${e.host} · ${e.status}</span></div><em>${e.connector}</em></div>`).join("");
  const npl = (h.npl||[]).slice(0,30).map(m => `<div class="rank-row"><b>${m.score}</b><div><strong>${m.a} vs ${m.b}</strong><span>${m.date} · ${m.games||""}</span></div><em>NPL</em></div>`).join("");
  const medals = (h.gpaMedals||[]).filter(x=>x.place==="winner").slice(0,40).map(m => `<a class="rank-row" href="${playerPath(m.player)}"><b>W</b><div><strong>${m.player}</strong><span>${m.event} · ${m.category}</span></div><em>${m.points||""}</em></a>`).join("");
  return `<div class="hero"><h2>ARCHIVE</h2><p>Federation results. D-Joy Leg 3 armed 10 Sep.</p></div>
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
  const cats = [
    ["mens_singles","Men's S"],
    ["womens_singles","Women's S"],
    ["mens_doubles","Men's D"],
    ["womens_doubles","Women's D"],
    ["mens_mixed_doubles","Mixed (M)"],
    ["womens_mixed_doubles","Mixed (W)"]
  ];
  const cat = state.rankCat || "mens_singles";
  let rows = [];
  let note = "";
  if (board === "ppa") {
    const sex = (cat||"").indexOf("women")>=0 ? "women" : "men";
    rows = ((data.ppaWorld||{})[sex]||[]).map(r => ({...r, country:"PPA"}));
    note = "Official UPA / PPA World Pickleball Rankings · composite 50/35/15 · last 52 weeks · ppatour.com/rankings";
  } else if (board === "gpa") {
    rows = (data.gpa && data.gpa[cat]) || [];
    note = "GPA world rankings · rolling 12 months · best 10 · gpapickleball.org";
  } else {
    rows = [];
    note = "";
  }
  const list = rows.slice(0, 80).map(r => `
    <a class="rank-row" href="${playerPath(r.name)}">
      <b>${r.rank}</b>
      <div><strong>${r.name}</strong><span>${r.country||""}${r.dupr?" · DUPR "+r.dupr:""}</span></div>
      <em>${r.points!=null?r.points+" pts":(r.elo?r.elo+" ELO":"")}</em>
    </a>`).join("");
  const events = (data.events||[]).slice(0,8).map(e => `
    <div class="match"><div class="line"><div class="a">${e.name||""}</div><div class="b">${e.location||e.venue||""}</div></div>
    <div class="games">${(e.tournament_date||"").slice(0,10)} · ${e.tier||""} · ${e.host||""}</div></div>`).join("");
  return `<div class="hero"><h2>TABLE</h2><p>PPA World and GPA. <a href="/history" style="color:#f5c518">Archive</a> for past events.</p></div>
  <div class="wrap">
    <div class="panel">
      <div class="seg">
        <button data-rankboard="ppa" class="${board==="ppa"?"on":""}">PPA World</button>
        <button data-rankboard="gpa" class="${board==="gpa"?"on":""}">GPA</button>
      </div>
      <div class="seg" style="margin-top:10px;flex-wrap:wrap">${cats.map(([id,l])=>`<button data-rankcat="${id}" class="${cat===id?"on":""}">${l}</button>`).join("")}</div>
      <p class="games" style="margin-top:10px">${note}</p>
      ${list || "<p class='empty'>Board empty for this cut.</p>"}
    </div>
    <div class="panel"><div class="kicker">GPA calendar</div>${events||"<p class='empty'>No events.</p>"}</div>
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
    <p class="games">Password-gated score writer. This is what makes a match page live.</p>
    <p class="games">Last feed write: ${state.updated || "seed file only"}</p>
    <label class="games">Desk key<br><input class="field" id="deskKey" type="password" value="${state.deskKey}"></label>
    <div class="panel" style="overflow:auto">${rows}</div>
  </div>`;
}

function toggleFollow(k){
  state.selected[k] = !state.selected[k];
  localStorage.setItem("wpm-follows", JSON.stringify(state.selected));
  if (state.selected[k] && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  render();
}

function maybeNotify(m){
  if (effectiveStatus(m) !== "LIVE" || !followsMatch(m) || state.notified[m.id]) return;
  state.notified[m.id] = 1;
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("WPM LIVE", { body: `${m.a} vs ${m.b} is live`, tag: m.id }); } catch(e) {}
  }
}

function render(){
  if (!state.date) state.date = ymd(new Date());
  const p = path();
  let inner = "";
  let m;
  if (p === "/") inner = viewHome();
  else if (p === "/following") inner = viewFollowing();
  else if (p === "/magazine") inner = viewMagazine();
  else if (p === "/history") inner = viewHistory();
  else if (p === "/rankings") inner = viewRankings();
  else if (p === "/shop") inner = viewShop();
  else if (p === "/draw") { state.boardMode = "draw"; inner = viewHome(); }
  else if (p === "/desk") inner = viewDesk();
  else if ((m = p.match(/^\/match\/([^/]+)$/))) inner = viewMatch(m[1]);
  else if ((m = p.match(/^\/player\/([^/]+)$/))) inner = viewPerson("player", m[1]);
  else if ((m = p.match(/^\/team\/([^/]+)$/))) inner = viewPerson("team", m[1]);
  else inner = `<div class="wrap"><p class="empty">Not found.</p><a class="btn" href="/">Live</a></div>`;

  document.getElementById("app").innerHTML = chrome(inner);
  bind();
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
    render();
  }));
  document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
    state.boardMode = b.getAttribute("data-mode");
    if (state.boardMode === "draw" && state.filter === "wc") state.drawTour = "wc";
    if (state.boardMode === "draw" && state.filter === "ppa") state.drawTour = "ppa";
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
    render();
  }));
  document.querySelectorAll("[data-drawtour]").forEach(b => b.addEventListener("click", ev => {
    ev.preventDefault();
    ev.stopPropagation();
    state.drawTour = b.getAttribute("data-drawtour") || "ppa";
    state.drawDiv = "";
    state.filter = state.drawTour === "wc" ? "wc" : (state.drawTour === "ppa" ? "ppa" : state.filter);
    render();
  }));
  document.querySelectorAll("[data-rankboard]").forEach(b => b.addEventListener("click", () => { state.rankBoard = b.getAttribute("data-rankboard"); render(); }));
  document.querySelectorAll("[data-rankcat]").forEach(b => b.addEventListener("click", () => { state.rankCat = b.getAttribute("data-rankcat"); render(); }));
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
    } catch(e) {}
  }
  await overlay("/api/worldcup", "wc");
  await overlay("/api/ppa", "ppa");
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
  pullRankings().then(() => { if (path()==="/rankings") render(); });
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
  const el = ev.target && ev.target.closest ? ev.target.closest("[data-draw], [data-drawtour], [data-mode], [data-f], [data-shop], [data-day], [data-more]") : null;
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
    render();
  }
}, true);
