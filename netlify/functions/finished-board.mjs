/**
 * Keeps every finished match LIVE shows, from every feed, in the same store as
 * finished-store.mjs (/api/finished). Works on the board rows each feed already
 * returns (/api/ppa, /api/app, /api/tpb, /api/rta, /api/worldcup, /api/sportssync,
 * the desk rows in /api/scores, and /api/archive), so it makes no upstream request
 * of its own. All draws are kept, amateur and age groups included, labelled by
 * division; Heat Check filters to pro on its side.
 *
 * Played results (status FT with real game scores) are stored as played: true.
 * FT rows with no game scores (walkover, withdrawal, retirement before a ball,
 * an unscored final) are stored as played: false with the feed's note, and a
 * winner only when the note names one side. Nothing is inferred beyond the feed.
 *
 * PPA Europe and MLP Asia are stored from their raw ticker rows by pb-ticker.mjs,
 * so their board rows are skipped here (one record per match, never two).
 *
 * One KV write per event, only when a new or corrected result appears.
 */
import { persistFinished } from "./finished-store.mjs";

export const RAW_TICKER_TOURS = new Set(["ppa-eu", "mlp-asia"]);
const NOT_PLAYED_RE = /\b(walk ?over|w\/o|withdr[a-z]*|retir[a-z]*|forfeit[a-z]*|abandon[a-z]*|descalif[a-z]*|no presentado|incomparecencia|bye)\b/i;
const SCORE_RE = /^\s*(\d{1,2})\s*[–—-]\s*(\d{1,2})\s*$/;

function clean(v) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

export function slug(v) {
  return clean(v)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Store event for a board row: ev:<tour>:<id> → <tour>:<id>; otherwise tour + comp slug. */
export function boardEvent(m) {
  const tour = slug(m?.tour) || "other";
  const ek = clean(m?.eventKey);
  const hit = /^ev:([a-z0-9-]+):(.+)$/i.exec(ek);
  const id = hit && slug(hit[1]) === tour ? clean(hit[2]) : slug(m?.comp) || "unknown";
  return { tour, id, name: clean(m?.comp) || id, venue: clean(m?.venue), tz: clean(m?.tz) };
}

/** Full names per side from the roster ("A B / C D vs E F / G H"), else the board names. */
export function boardSides(m) {
  const roster = clean(m?.roster);
  const parts = roster ? roster.split(/\s+vs\.?\s+/i) : [];
  const split = (s) => clean(s).split(/\s+\/\s+/).map(clean).filter((x) => x && x !== "TBD");
  if (parts.length === 2) {
    const sides = parts.map(split);
    if (sides[0].length && sides[1].length) return { sides, from: "roster" };
  }
  const sides = [split(m?.a), split(m?.b)];
  return { sides, from: "board" };
}

function parseScore(s) {
  const hit = SCORE_RE.exec(String(s ?? ""));
  if (!hit) return null;
  const a = Number(hit[1]);
  const b = Number(hit[2]);
  if (a === 0 && b === 0) return null;
  return [a, b];
}

/** One FT board row → stored record, or null when it is not a finished match. */
export function boardRecord(m, { source = "" } = {}) {
  if (!m || clean(m.status).toUpperCase() !== "FT") return null;
  const id = clean(m.id);
  if (!id) return null;
  const { sides, from } = boardSides(m);
  if (!sides[0].length || !sides[1].length) return null;
  const a = clean(m.a);
  const b = clean(m.b);
  const lines = [];
  const games = [];
  let wA = 0;
  let wB = 0;
  let named = 0;
  for (const l of Array.isArray(m.lines) ? m.lines : []) {
    if (!l || l.live) continue;
    const g = parseScore(l.score);
    const w = clean(l.winner);
    if (!g && !w) continue;
    lines.push({ disc: clean(l.disc), score: g ? `${g[0]}-${g[1]}` : "", winner: w === a ? 0 : w === b ? 1 : null });
    if (g) games.push(g);
    if (w && (w === a || w === b)) {
      named += 1;
      if (w === a) wA += 1;
      else wB += 1;
    }
  }
  if (!named) {
    for (const [x, y] of games) {
      if (x > y) wA += 1;
      else if (y > x) wB += 1;
    }
  }
  const note = clean(m.note);
  const notPlayed = NOT_PLAYED_RE.exec(note);
  let winner = wA > wB ? 0 : wB > wA ? 1 : null;
  if (winner == null) {
    // Listed match score ("2-1") when the line winners tie or are missing.
    const sc = parseScore(m.score);
    if (sc && sc[0] !== sc[1]) winner = sc[0] > sc[1] ? 0 : 1;
  }
  const played = games.length > 0;
  if (!played) {
    // Winner only when the note names exactly one side.
    const lowNote = note.toLowerCase();
    const hitA = a && lowNote.includes(a.toLowerCase());
    const hitB = b && lowNote.includes(b.toLowerCase());
    winner = hitA && !hitB ? 0 : hitB && !hitA ? 1 : null;
  }
  const div = clean(m.div);
  const round = clean(m.round);
  const division = round && div.endsWith(` · ${round}`) ? div.slice(0, -(round.length + 3)) : div.split(" · ")[0] || div;
  return {
    id,
    date: clean(m.date).slice(0, 10),
    event: clean(m.comp),
    tour: clean(m.tour),
    division,
    divLabel: div,
    round,
    disc: clean(m.disc).toUpperCase(),
    ...(m.tier ? { tier: clean(m.tier) } : {}),
    ...(m.format ? { format: clean(m.format) } : {}),
    sides,
    names: from,
    games,
    lines,
    score: clean(m.score),
    winner,
    played,
    ...(notPlayed ? { outcome: notPlayed[0].toLowerCase() } : !played ? { outcome: "unscored" } : {}),
    ...(note ? { note } : {}),
    ...(source ? { source } : {}),
  };
}

/** Group finished board rows by store event. */
export function finishedFromBoard(matches, { source = "", eventFor = boardEvent } = {}) {
  const groups = new Map();
  for (const m of matches || []) {
    if (!m || RAW_TICKER_TOURS.has(clean(m.tour))) continue;
    const r = boardRecord(m, { source });
    if (!r) continue;
    const ev = eventFor(m);
    const key = `${ev.tour}:${ev.id}`;
    if (!groups.has(key)) groups.set(key, { pin: ev, records: [] });
    groups.get(key).records.push(r);
  }
  return groups;
}

/** Persist every finished board row. Returns { "<tour>:<id>": added }. Never throws. */
export async function archiveBoard(matches, { source = "", eventFor, store = null, now = new Date() } = {}) {
  const out = {};
  for (const [key, { pin, records }] of finishedFromBoard(matches, { source, eventFor })) {
    out[key] = await persistFinished(pin, records, { store, now, replaceChanged: true });
  }
  return out;
}

/** /api/archive catalog entry → the same store event the live board uses. */
export function archiveEvent(ev) {
  const id = ev.tour === "ppa" ? ev.ppaEventId : ev.tour === "app" ? ev.denTournamentId : ev.id;
  return { tour: ev.tour, id: clean(id || ev.id), name: ev.name, venue: ev.venue || "", tz: ev.tz || "", start: ev.start || "", end: ev.end || "" };
}

/** True while day (YYYY-MM-DD, UTC) is within [start − pad, end + pad]. */
export function dayInWindow(start, end, now = new Date(), padDays = 1) {
  if (!start) return false;
  const day = now.toISOString().slice(0, 10);
  const lo = new Date(Date.parse(start) - padDays * 864e5).toISOString().slice(0, 10);
  const hi = new Date(Date.parse(end || start) + padDays * 864e5).toISOString().slice(0, 10);
  return day >= lo && day <= hi;
}
