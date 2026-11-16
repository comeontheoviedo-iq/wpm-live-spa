/**
 * Keeps every finished, played match LIVE has seen on the pickleball.com tickers
 * (PPA Tour Europe via pickleballtournaments.com, MLP Asia via pickleballteamleagues.com).
 *
 * Those tickers only list current matches. Once an event ends they return 0 rows, so
 * the results LIVE showed during play were lost (Lille 13–15 Nov 2026). This store lets
 * Heat Check and the archive read them afterwards from /api/finished.
 *
 * Only real results are stored: match ended (status 4), played (completed type 5 or
 * blank), both sides named, at least one real game score, and a winner the scores agree
 * with. Forfeits, withdrawals, retirements, TBD/BYE and 0–0 padding are never stored.
 * No extra upstream requests: it reads the rows the loaders already fetched.
 * One KV write per event, and only when a new finished match appears.
 */
import { getStore } from "@netlify/blobs";
import { cleanName, instantDay, pbPerson } from "./pb-ticker.mjs";
import { ppaLocalDayPrefix } from "./ppa-keep.mjs";

export const FINISHED_STORE = "wpm-finished";
const GAME_WORDS = ["One", "Two", "Three", "Four", "Five"];
const memory = new Map(); // store key -> { event, updated, matches: {id: record} }

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Played games only, from side A's view. 0–0 padding slots are dropped. */
export function playedGames(raw) {
  const out = [];
  for (const w of GAME_WORDS) {
    const a = num(raw?.[`teamOneGame${w}Score`]);
    const b = num(raw?.[`teamTwoGame${w}Score`]);
    if (a == null || b == null || (a === 0 && b === 0)) continue;
    out.push([a, b]);
  }
  return out;
}

/**
 * One finished, played match row (ticker match or a team-league rubber) to a
 * normalised record, or null when it is not a real final result.
 */
export function finishedRecord(raw, ctx) {
  if (!raw) return null;
  const id = cleanName(raw.matchUuid);
  if (!id) return null;
  if (String(raw.matchStatus ?? "") !== "4") return null;
  const ct = String(raw.matchCompletedType ?? "");
  if (ct && ct !== "5") return null;
  const sideA = [pbPerson(raw, "teamOne", "One"), pbPerson(raw, "teamOne", "Two")].filter(Boolean);
  const sideB = [pbPerson(raw, "teamTwo", "One"), pbPerson(raw, "teamTwo", "Two")].filter(Boolean);
  if (!sideA.length || !sideB.length || sideA.length !== sideB.length) return null;
  const games = playedGames(raw);
  if (!games.length || !games.some(([a, b]) => Math.max(a, b) >= 11)) return null;
  const wA = games.filter(([a, b]) => a > b).length;
  const wB = games.filter(([a, b]) => b > a).length;
  const named = Number(raw.winner);
  let winner = named === 1 ? 0 : named === 2 ? 1 : wA > wB ? 0 : wB > wA ? 1 : -1;
  if (winner < 0) return null;
  // The listed winner must agree with the game count; otherwise it is not stored.
  if ((winner === 0 && wA < wB) || (winner === 1 && wB < wA)) return null;
  const date =
    ppaLocalDayPrefix(raw.localDateMatchCompleted) ||
    ppaLocalDayPrefix(raw.localDateMatchStart) ||
    ppaLocalDayPrefix(raw.localDateMatchPlannedStart) ||
    ctx.date ||
    "";
  return {
    id,
    date,
    event: ctx.event,
    division: cleanName(ctx.division || raw.eventTitle || raw.divisionTitle),
    round: cleanName(raw.roundText),
    disc: cleanName(raw.matchAbbreviation).toUpperCase(),
    format: cleanName(raw.formatTitle),
    sides: [sideA, sideB],
    games,
    winner,
    ...(ctx.matchup ? { matchup: ctx.matchup } : {}),
  };
}

/** PPA Europe ticker rows (one row per match). */
export function finishedFromTicker(rows, pin) {
  const out = [];
  for (const raw of rows || []) {
    const r = finishedRecord(raw, { event: pin.name });
    if (r) out.push(r);
  }
  return out;
}

/** Team-league ticker matchups: each played rubber is its own match record. */
export function finishedFromMatchups(rows, pin) {
  const out = [];
  for (const mu of rows || []) {
    if (!mu) continue;
    const group = cleanName(mu.matchupGroupTitle);
    const stop = group.split(/\s+-\s+/).slice(1).join(" - ") || group;
    const tz = cleanName(mu.timezone?.ianaTzIdentifier || mu.timezone);
    const date = instantDay(cleanName(mu.plannedStartDate), tz.includes("/") ? tz : pin.tz);
    const matchup = {
      id: cleanName(mu.uuid),
      teams: [cleanName(mu.teamOneTitle), cleanName(mu.teamTwoTitle)],
      stop,
    };
    for (const raw of mu.matches || []) {
      const r = finishedRecord(raw, {
        event: [pin.name, stop].filter(Boolean).join(" · "),
        division: cleanName(mu.divisionTitle),
        date,
        matchup,
      });
      if (r) out.push(r);
    }
  }
  return out;
}

/** A stored result was corrected upstream (scores, winner or played flag changed). */
function resultChanged(prev, next) {
  return (
    JSON.stringify(prev.games || []) !== JSON.stringify(next.games || []) ||
    prev.winner !== next.winner ||
    (prev.played ?? true) !== (next.played ?? true)
  );
}

/** Stored event keys (one KV list call). */
export async function finishedKeys({ store = null } = {}) {
  const s = store || getStore({ name: FINISHED_STORE, consistency: "strong" });
  const listed = await s.list({ prefix: "" });
  return new Set((listed.blobs || []).map((b) => b.key));
}

export function storeKey(pin) {
  return `${pin.tour}:${pin.id || pin.seasonUuid}`;
}

function eventMeta(pin) {
  return {
    key: storeKey(pin),
    tour: pin.tour,
    id: pin.id || pin.seasonUuid,
    name: pin.name,
    venue: pin.venue || "",
    tz: pin.tz || "",
    start: pin.start || "",
    end: pin.end || "",
    officialUrl: pin.officialUrl || "",
  };
}

/** Merge new finished records into the store. Returns how many were new. Never throws. */
export async function persistFinished(pin, records, { store = null, now = new Date(), replaceChanged = false } = {}) {
  if (!records?.length) return 0;
  try {
    const s = store || getStore({ name: FINISHED_STORE, consistency: "strong" });
    const key = storeKey(pin);
    let doc = memory.get(key);
    if (!doc) {
      doc = (await s.get(key, { type: "json" })) || { event: eventMeta(pin), updated: "", matches: {} };
      if (!doc.matches || typeof doc.matches !== "object") doc.matches = {};
    }
    let added = 0;
    const iso = now.toISOString();
    for (const r of records) {
      const prev = doc.matches[r.id];
      if (prev && !(replaceChanged && resultChanged(prev, r))) continue;
      doc.matches[r.id] = prev ? { ...r, firstSeen: prev.firstSeen || iso, corrected: iso } : { ...r, firstSeen: iso };
      added += 1;
    }
    memory.set(key, doc);
    if (!added) return 0;
    // Another isolate may have written since this copy was read: merge its matches
    // back in so a write never drops a stored result.
    try {
      const fresh = await s.get(key, { type: "json" });
      for (const [id, r] of Object.entries(fresh?.matches || {})) if (!doc.matches[id]) doc.matches[id] = r;
    } catch {
      /* write what we have */
    }
    doc.event = { ...eventMeta(pin), ...(doc.event?.start && !pin.start ? { start: doc.event.start, end: doc.event.end } : {}) };
    doc.updated = iso;
    await s.setJSON(key, doc);
    return added;
  } catch (e) {
    console.warn("[finished-store] persist failed", String(e?.message || e));
    return 0;
  }
}

/** All stored events, optionally for one tour. Matches are returned as a list, oldest first. */
export async function readFinished({ tour = "", event = "", store = null } = {}) {
  const s = store || getStore({ name: FINISHED_STORE, consistency: "strong" });
  const listed = await s.list({ prefix: tour ? `${tour}:${event}` : "" });
  const events = [];
  for (const b of listed.blobs || []) {
    if (event && b.key !== `${tour}:${event}`) continue;
    const doc = await s.get(b.key, { type: "json" });
    if (!doc) continue;
    const matches = Object.values(doc.matches || {}).sort(
      (a, b2) => String(a.date).localeCompare(String(b2.date)) || String(a.id).localeCompare(String(b2.id))
    );
    events.push({ ...doc.event, updated: doc.updated, count: matches.length, matches });
  }
  return events;
}

export function resetFinishedMemory() {
  memory.clear();
}
