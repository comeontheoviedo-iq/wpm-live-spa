/**
 * TOP Pickleball Tour "Cuadros y horarios" widget.
 * GET https://toppickleballtour.com/wp-json/tpg/v1/cuadros?id=<id>
 * returns { top, body } where body is HTML.
 *
 * Match cards are .tpgc-m with tpgc-m-pend / tpgc-m-live / tpgc-m-fin.
 * Game points, when the widget prints them, are .tpgc-sc > b on each
 * .tpgc-team (one <b> per game). Group standings are .tpgc-table and
 * are not matches. A 0-0 table is not a score.
 *
 * The 13 Nov 2026 14:49Z capture was entirely tpgc-m-pend (no .tpgc-sc).
 * Live and finished cards follow the widget stylesheet:
 * tpgc-m-live + tpgc-st-live, tpgc-m-fin + tpgc-st-fin, scores in .tpgc-sc.
 * Pending cards stay NEXT with no score. Nothing here invents a line.
 */

import { tagsForSides } from "./follow-tags.mjs";
import { ppaGameLineScore, ppaListedScore, ppaResultNote, ppaWallInstant } from "./ppa-keep.mjs";

export const SOMONTES_CUADROS_ID = "6ad5eb60945dc4e56ae2c8ad";
export const CUADROS_URL = "https://toppickleballtour.com/wp-json/tpg/v1/cuadros?id=";
export const UPSTREAM_TTL_MS = 60_000;

const ID_RE = /^[a-f0-9]{16,40}$/i;

export const SOMONTES = {
  id: SOMONTES_CUADROS_ID,
  name: "TPB Somontes 2026",
  venue: "Club Deportivo Somontes, Madrid",
  tz: "Europe/Madrid",
  tour: "tpb",
  eventKey: "ev:tpb:somontes-2026",
  officialUrl: "https://toppickleballtour.com/tour/somontes/",
  start: "2026-11-13",
  end: "2026-11-15",
};

const MONTHS = {
  ene: "01",
  feb: "02",
  mar: "03",
  abr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dic: "12",
};

const memory = new Map();

export function resetTpbCache() {
  memory.clear();
}

export function pinFor(id) {
  const clean = ID_RE.test(String(id || "")) ? String(id).toLowerCase() : SOMONTES.id;
  if (clean === SOMONTES.id) return SOMONTES;
  return {
    id: clean,
    name: "TOP Pickleball",
    venue: "",
    tz: "Europe/Madrid",
    tour: "tpb",
    eventKey: `ev:tpb:${clean}`,
    officialUrl: "https://toppickleballtour.com/",
    start: "",
    end: "",
  };
}

export function cuadrosUrl(id) {
  return CUADROS_URL + pinFor(id).id;
}

function strip(raw) {
  return String(raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function norm(raw) {
  return strip(raw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function discFromSpanish(raw) {
  const s = String(raw || "").toLowerCase();
  if (!s) return "";
  if (/mixto|mixed/.test(s)) return "XD";
  if (/doble/.test(s) && /femen/.test(s)) return "WD";
  if (/doble/.test(s) && /mascul/.test(s)) return "MD";
  if (/individual|singl/.test(s) && /femen/.test(s)) return "WS";
  if (/individual|singl/.test(s) && /mascul/.test(s)) return "MS";
  if (/femen/.test(s) && /doble/.test(s)) return "WD";
  return "";
}

function parseWhen(text, year) {
  const raw = String(text || "");
  const hm = raw.match(/(\d{1,2}):(\d{2})/);
  const time = hm ? `${hm[1].padStart(2, "0")}:${hm[2]}` : "";
  const dm = raw.match(/(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i);
  let date = "";
  if (dm && year) {
    date = `${year}-${MONTHS[dm[2].toLowerCase()]}-${dm[1].padStart(2, "0")}`;
  }
  return { date, time };
}

function spanInner(html, className) {
  const re = new RegExp(`<span class="${className}"[^>]*>`, "i");
  const m = re.exec(String(html || ""));
  if (!m) return "";
  let depth = 1;
  const tag = /<\/?span\b[^>]*>/gi;
  tag.lastIndex = m.index + m[0].length;
  let t;
  while ((t = tag.exec(html))) {
    if (t[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(m.index + m[0].length, t.index);
  }
  return "";
}

function people(teamHtml) {
  const inner = spanInner(teamHtml, "tpgc-names").replace(/<span class="tpgi-sep">[\s\S]*?<\/span>/gi, " / ");
  const text = strip(inner);
  if (!text || /^(tbd|tba|bye)$/i.test(text)) return [];
  return text
    .split(/\s+\/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function points(teamHtml) {
  const m = String(teamHtml || "").match(/<span class="tpgc-sc">([\s\S]*?)<\/span>/i);
  if (!m) return [];
  const cells = [...m[1].matchAll(/<b[^>]*>([\s\S]*?)<\/b>/gi)].map((b) => strip(b[1]));
  const raw = cells.length ? cells : [strip(m[1])].filter(Boolean);
  return raw.map((cell) => {
    if (!/^\d{1,2}$/.test(cell)) return null;
    return Number(cell);
  });
}

function cardStatus(card) {
  const open = (String(card).match(/^<div class="([^"]*)"/) || [, ""])[1];
  const chip = (String(card).match(/<span class="(tpgc-st[^"]*)"/) || [, ""])[1];
  const blob = `${open} ${chip}`;
  if (/\btpgc-m-live\b/.test(blob) || /\btpgc-st-live\b/.test(blob)) return "LIVE";
  if (/\btpgc-m-fin\b/.test(blob) || /\btpgc-st-fin\b/.test(blob)) return "FT";
  return "NEXT";
}

function chipText(card) {
  const m = String(card).match(/<span class="tpgc-st[^"]*">([\s\S]*?)<\/span>/i);
  return m ? strip(m[1]) : "";
}

function spanText(card, cls) {
  const m = String(card).match(new RegExp(`<span class="${cls}">([\\s\\S]*?)<\\/span>`, "i"));
  return m ? strip(m[1]) : "";
}

function gameComplete(a, b) {
  if (a == null || b == null) return false;
  if (a === 0 && b === 0) return false;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return hi >= 11 && hi - lo >= 2;
}

/**
 * Played games only. Empty cells and 0-0 slots are dropped.
 * Pending cards never receive a line, even if a zero leaked in.
 */
export function gameLines(aPts, bPts, status, sideA, sideB) {
  if (status === "NEXT") return [];
  const n = Math.max(aPts.length, bPts.length);
  const games = [];
  for (let i = 0; i < n; i++) {
    const a = aPts[i];
    const b = bPts[i];
    if (a == null || b == null) continue;
    if (a === 0 && b === 0) continue;
    games.push({ a, b });
  }
  return games.map((g, i) => {
    const later = games.slice(i + 1).some((x) => x.a || x.b);
    const done = status === "FT" || later || (status === "LIVE" && gameComplete(g.a, g.b));
    const current = status === "LIVE" && !done;
    return {
      disc: "G" + (i + 1),
      score: ppaGameLineScore(g.a, g.b),
      winner: done && g.a !== g.b ? (g.a > g.b ? sideA : sideB) : "",
      live: current,
      court: "",
    };
  });
}

function sliceCards(html) {
  const cards = [];
  const re = /<div class="tpgc-m\b/g;
  let m;
  while ((m = re.exec(html))) {
    const start = m.index;
    let depth = 0;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = start;
    let t;
    let end = html.length;
    while ((t = tagRe.exec(html))) {
      if (t[0].startsWith("</")) depth -= 1;
      else depth += 1;
      if (depth === 0) {
        end = t.index + t[0].length;
        break;
      }
    }
    cards.push({ index: start, html: html.slice(start, end) });
    re.lastIndex = end;
  }
  return cards;
}

function contextDay(html, index) {
  const before = html.slice(0, index);
  const days = [...before.matchAll(/data-k="d(\d{4}-\d{2}-\d{2})"/g)];
  const tabs = [...before.matchAll(/<div class="tpgc-pane"[^>]*data-g="tab"[^>]*data-k="([^"]+)"/g)];
  const day = days.length ? days[days.length - 1] : null;
  const tab = tabs.length ? tabs[tabs.length - 1] : null;
  if (!day) return "";
  if (tab && tab.index > day.index) return "";
  return day[1];
}

function contextAfterPane(html, index, re) {
  const before = html.slice(0, index);
  const hits = [...before.matchAll(re)];
  if (!hits.length) return "";
  const last = hits[hits.length - 1];
  const pane = before.lastIndexOf('<div class="tpgc-pane"');
  if (pane > last.index) return "";
  return strip(last[1]);
}

function contextTab(html, index, labels) {
  const before = html.slice(0, index);
  const tabs = [...before.matchAll(/<div class="tpgc-pane"[^>]*data-g="tab"[^>]*data-k="([^"]+)"/g)];
  if (!tabs.length) return "";
  const key = tabs[tabs.length - 1][1];
  if (key === "horario") return "";
  return labels[key] || "";
}

export function tabLabels(top) {
  const labels = {};
  for (const m of String(top || "").matchAll(/data-k="([^"]+)"[^>]*>([^<]+)/g)) {
    labels[m[1]] = strip(m[2]);
  }
  return labels;
}

function hashId(text) {
  let h = 2166136261;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function rankStatus(status) {
  if (status === "FT") return 3;
  if (status === "LIVE") return 2;
  return 1;
}

/**
 * Parse widget HTML into board rows. Group tables are ignored.
 * Duplicate cards (horario + cuadro) collapse to one row.
 */
export function parseCuadrosHtml(html, pin, top = "") {
  const source = String(html || "");
  if (!source.includes("tpgc-m")) return [];
  const labels = tabLabels(top);
  const year = String(pin?.start || "").slice(0, 4) || "2026";
  const byKey = new Map();
  for (const card of sliceCards(source)) {
    const teams = [...card.html.matchAll(/<div class="tpgc-team[^"]*">([\s\S]*?)<\/div>/gi)];
    if (teams.length < 2) continue;
    const aPeople = people(teams[0][1]);
    const bPeople = people(teams[1][1]);
    if (!aPeople.length && !bPeople.length) continue;
    const sideA = aPeople.join(" / ") || "TBD";
    const sideB = bPeople.join(" / ") || "TBD";
    const when = parseWhen(spanText(card.html, "tpgc-time"), year);
    const date = when.date || contextDay(source, card.index);
    if (!date) continue;
    const court = spanText(card.html, "tpgc-court");
    const cat = spanText(card.html, "tpgc-cat");
    const tab = contextTab(source, card.index, labels);
    const heading = contextAfterPane(source, card.index, /<h3 class="tpgc-h3">([\s\S]*?)<\/h3>/gi);
    const round = contextAfterPane(source, card.index, /<p class="tpgc-round">([\s\S]*?)<\/p>/gi);
    const div = cat || [tab, heading, round].filter(Boolean).join(" · ");
    const status = cardStatus(card.html);
    const lines = gameLines(points(teams[0][1]), points(teams[1][1]), status, sideA, sideB);
    const liveLine = lines.find((l) => l.live);
    if (liveLine && court) liveLine.court = court;
    const w0 = lines.filter((l) => l.winner && l.winner === sideA).length;
    const w1 = lines.filter((l) => l.winner && l.winner === sideB).length;
    const chip = chipText(card.html);
    const key = [date, when.time, norm(court), norm(sideA), norm(sideB)].join("|");
    const swap = [date, when.time, norm(court), norm(sideB), norm(sideA)].join("|");
    const idKey = byKey.has(swap) ? swap : key;
    const row = {
      id: `tpb-${hashId(idKey)}`,
      date,
      tour: pin?.tour || "tpb",
      comp: pin?.name || "TOP Pickleball",
      div,
      round: round || (cat.includes("·") ? cat.split("·").slice(1).join("·").trim() : ""),
      disc: discFromSpanish(cat || tab || div),
      session: court,
      a: sideA,
      b: sideB,
      roster: `${aPeople.join(" / ") || "TBD"} vs ${bPeople.join(" / ") || "TBD"}`,
      status,
      tickerLive: status === "LIVE",
      start: when.time ? ppaWallInstant(`${date}T${when.time}:00`, pin?.tz || "Europe/Madrid") : "",
      hasClock: Boolean(when.time),
      clock: "",
      score: ppaListedScore(w0, w1, lines),
      games: lines.map((l) => `${l.disc} ${l.score}${l.live ? " LIVE" : ""}`).join(" · "),
      lines,
      court,
      note: liveLine
        ? ppaResultNote({ liveLine })
        : chip && !/^(en juego|live|final|fin|pendiente|programado)$/i.test(chip)
          ? chip
          : "",
      watch: "",
      tz: pin?.tz || "Europe/Madrid",
      venue: pin?.venue || "",
      eventKey: pin?.eventKey || "ev:tpb",
      _time: when.time,
    };
    row.tags = tagsForSides(sideA, sideB, row.roster);
    const prev = byKey.get(idKey);
    if (!prev || rankStatus(row.status) > rankStatus(prev.status) || (row.status === prev.status && row.lines.length > prev.lines.length)) {
      if (prev && prev.div && !row.div) row.div = prev.div;
      if (prev && prev.disc && !row.disc) row.disc = prev.disc;
      byKey.set(idKey, row);
    } else if (prev && row.div && !prev.div) {
      prev.div = row.div;
      prev.disc = prev.disc || row.disc;
    }
  }
  return [...byKey.values()]
    .map((row) => {
      const { _time, ...rest } = row;
      return rest;
    })
    .sort((a, b) => {
      const live = Number(b.status === "LIVE") - Number(a.status === "LIVE");
      if (live) return live;
      const ta = a.start ? Date.parse(a.start) : 0;
      const tb = b.start ? Date.parse(b.start) : 0;
      if (ta !== tb) return ta - tb;
      return String(a.id).localeCompare(String(b.id));
    });
}

function eventBlock(pin) {
  return {
    id: pin.id,
    name: pin.name,
    venue: pin.venue,
    tz: pin.tz,
    startDate: pin.start || "",
    endDate: pin.end || "",
    eventKey: pin.eventKey,
    tour: pin.tour,
    officialUrl: pin.officialUrl,
    cuadrosId: pin.id,
  };
}

function emptyBody(pin, source) {
  return {
    updated: new Date().toISOString(),
    source,
    delayed: true,
    reader: "Scores delayed",
    liveCount: 0,
    cuadrosId: pin.id,
    matches: [],
    event: eventBlock(pin),
  };
}

function staleOrEmpty(pin) {
  const prev = memory.get(pin.id);
  if (prev && prev.body && Array.isArray(prev.body.matches)) {
    return { ...prev.body, delayed: true, reader: "Scores delayed" };
  }
  return emptyBody(pin, "toppickleballtour-cuadros");
}

async function fetchCuadros(id, fetchImpl) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetchImpl(cuadrosUrl(id), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WPM-LIVE/1.0; +https://live.worldpickleballmagazine.com)",
        Accept: "application/json",
        Referer: "https://toppickleballtour.com/tour/somontes/",
      },
      signal: ctrl.signal,
    });
    if (!res || !res.ok) return { ok: false, error: `HTTP ${res?.status || 0}` };
    const json = await res.json();
    if (!json || typeof json.body !== "string") return { ok: false, error: "invalid json" };
    return { ok: true, top: typeof json.top === "string" ? json.top : "", body: json.body };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

function looksLikeWidget(body) {
  return /tpgc-m\b|tpgc-pane|tpgc-upd/.test(String(body || ""));
}

export async function loadTpb({ id = "", fetchImpl = fetch, now = new Date() } = {}) {
  const pin = pinFor(id);
  const hit = memory.get(pin.id);
  if (hit && hit.body && !hit.body.delayed && now.getTime() - hit.at < UPSTREAM_TTL_MS) {
    return hit.body;
  }
  const fetched = await fetchCuadros(pin.id, fetchImpl);
  if (!fetched.ok || !looksLikeWidget(fetched.body)) return staleOrEmpty(pin);
  const matches = parseCuadrosHtml(fetched.body, pin, fetched.top);
  const body = {
    updated: now.toISOString(),
    source: "toppickleballtour-cuadros",
    delayed: false,
    reader: "",
    liveCount: matches.filter((m) => m.status === "LIVE").length,
    cuadrosId: pin.id,
    matches,
    event: eventBlock(pin),
  };
  memory.set(pin.id, { at: now.getTime(), body });
  return body;
}
