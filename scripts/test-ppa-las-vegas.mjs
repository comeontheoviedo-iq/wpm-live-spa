#!/usr/bin/env node
/**
 * Rate Las Vegas Open cut: official ticker + scores shape, no phantom 0-0,
 * LIVE only when the ticker says live, Date TBA kept off the day board.
 */
import assert from "node:assert/strict";
import { PPA_LIVE, PPA_LIVE_EVENT_ID, ENDED_PPA } from "../netlify/functions/slate-events.mjs";
import { isPpaTbaDate, keepPpaMatch, mergePpaDateKey, ppaBoardDate } from "../netlify/functions/ppa-keep.mjs";

const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };
const LV = PPA_LIVE_EVENT_ID;
const BCN = ENDED_PPA.barcelona.ppaEventId;

assert.equal(isPpaTbaDate("9999-12-31"), true);
assert.equal(isPpaTbaDate("2026-09-28"), false);
const morning = new Date("2026-09-28T15:00:00Z");
assert.equal(keepPpaMatch({ status: "NEXT", date: "9999-12-31", start: "" }, morning), false);
assert.equal(
  keepPpaMatch({ status: "NEXT", date: "2026-09-28", start: "2026-09-28T08:00:00Z" }, morning),
  true
);
assert.equal(keepPpaMatch({ status: "FT", date: "2026-09-20", start: "" }, morning), true);
assert.equal(ppaBoardDate({ dateKey: "9999-12-31", dateLabel: "Date TBA" }, morning), "9999-12-31");
assert.equal(ppaBoardDate({ plannedStart: "2026-09-28T08:00:00Z" }, morning), "2026-09-28");
assert.equal(
  mergePpaDateKey({ dateKey: "9999-12-31" }, { plannedStart: "2026-09-28T08:00:00Z" }),
  "2026-09-28"
);
assert.equal(
  mergePpaDateKey({ dateKey: "2026-09-29" }, { plannedStart: "2026-09-28T08:00:00Z" }),
  "2026-09-29"
);

function emptyGames(m) {
  return (m.teams || []).every((t) => (t.games || []).every((g) => g == null || g === ""));
}

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  assert.equal(res.ok, true, url + " " + res.status);
  return res.json();
}

const tick = await getJson("https://www.ppatour.com/api/ticker/");
const title = tick.tournament?.title || "";
assert.match(title, /Rate Las Vegas Open/);
assert.equal(/barcelona/i.test(title), false);
const tickMatches = tick.matches || [];
assert.ok(tickMatches.length > 0, "ticker has matches");

const tickIds = new Set(tickMatches.map((m) => m.id));
const tickLive = new Set(tickMatches.filter((m) => m.status === "live").map((m) => m.id));
const now = new Date();

for (const m of tickMatches) {
  assert.ok(tickIds.has(m.id));
  if (m.status !== "live" && m.status !== "final") {
    assert.equal(emptyGames(m), true, "non-live ticker row must not carry score lines");
  }
  const date = ppaBoardDate(m, now);
  assert.equal(isPpaTbaDate(date), false, "ticker row must not use the Date TBA sentinel");
  if (m.time) assert.match(String(m.time), /PDT|PST|AM|PM/);
}

const scores = await getJson("https://www.ppatour.com/api/scores/?event=" + LV);
assert.equal(scores.tournamentId, LV);
const scoreMatches = scores.matches || [];
for (const m of scoreMatches) {
  if (m.status === "live") {
    assert.equal(tickLive.has(m.id), true, "LIVE only from the ticker");
  }
  if (m.status !== "live" && m.status !== "final") assert.equal(emptyGames(m), true);
  if (isPpaTbaDate(m.dateKey) && m.status !== "live" && m.status !== "final") {
    const date = ppaBoardDate(m, now);
    assert.equal(date, "9999-12-31");
    assert.equal(keepPpaMatch({ status: "NEXT", date, start: m.plannedStart || "" }, now), false);
  }
}

const bcn = await getJson("https://www.ppatour.com/api/scores/?event=" + BCN);
assert.equal(bcn.tournamentId, BCN);
assert.equal((bcn.matches || []).length, 0, "Barcelona window ended with no scores");

const first = tickMatches.find((m) => m.time === "8:00 AM PDT") || tickMatches[0];
assert.ok(first, "ticker sample");
assert.match(ppaBoardDate(first, now), /^2026-(09|10)-/, "ticker date stays on the Vegas week");
assert.equal(PPA_LIVE.tz, "America/Los_Angeles");
assert.equal(PPA_LIVE.venue, "Darling Tennis Center, Las Vegas");

console.log(
  "ok ppa-las-vegas · ticker " +
    title +
    " · " +
    tickMatches.length +
    " ticker · " +
    scoreMatches.length +
    " scores · barcelona 0 · tba off board"
);
