#!/usr/bin/env node
/**
 * Virginia Beach is the live PPA pin. Ticker title must match before
 * ticker rows are stamped with that pin. Chicago Cup stays a finished archive.
 * plannedStart is venue wall time with a Z suffix — the board clock is the
 * ticker string, and the stored start is the real UTC instant.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  PPA_CHICAGO,
  PPA_LAS_VEGAS,
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  ENDED_PPA,
  ppaTickerTitleAligned,
} from "../netlify/functions/slate-events.mjs";
import {
  applyPpaTickerRows,
  isPpaTbaDate,
  keepPpaMatch,
  ppaBoardDate,
  ppaClockLabel,
  ppaCourtLabel,
  ppaListedScore,
  ppaLocalDayPrefix,
  ppaPublicStatus,
  ppaScoreRows,
  ppaStatus,
  ppaTickerLive,
  ppaWallInstant,
  rebasePpaLocalDates,
} from "../netlify/functions/ppa-keep.mjs";

const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };
const VB = PPA_LIVE_EVENT_ID;
const CHI = PPA_CHICAGO.eventId;
const LV = PPA_LAS_VEGAS.eventId;
const BCN = ENDED_PPA.barcelona.ppaEventId;

assert.equal(VB, "429c7980-e1b9-4800-805f-dfb160781cd9");
assert.equal(PPA_LIVE.name, "Mojo Energy Pouches Virginia Beach Open");
assert.equal(PPA_LIVE.venue, "Pickleball Virginia Beach, Virginia Beach, VA");
assert.equal(PPA_LIVE.tz, "America/New_York");
assert.equal(PPA_LIVE.firstServe, "8:00 AM EDT");
assert.equal(CHI, "203e1164-b4f9-47e9-bacf-ff81f8748025");
assert.equal(PPA_CHICAGO.name, "Veolia Chicago Cup");
assert.equal(PPA_CHICAGO.tz, "America/Chicago");
assert.equal(ppaTickerTitleAligned("PPA Tour: Mojo Energy Pouches Virginia Beach Open"), true);
assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Chicago Cup"), false);
assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Chicago Cup", PPA_CHICAGO), true);
assert.equal(ppaTickerTitleAligned("Virginia Beach"), false);

assert.equal(ppaWallInstant("2026-10-12T08:00:00Z", "America/New_York"), "2026-10-12T12:00:00.000Z");
assert.equal(ppaWallInstant("2026-10-12T11:00:00Z", "America/New_York"), "2026-10-12T15:00:00.000Z");
assert.equal(ppaWallInstant("2026-10-12T14:00:00Z", "America/New_York"), "2026-10-12T18:00:00.000Z");
assert.equal(ppaWallInstant("2026-10-07T14:00:00Z", "America/Chicago"), "2026-10-07T19:00:00.000Z");
assert.equal(ppaWallInstant("2026-10-12T20:00:00Z", "America/New_York"), "2026-10-13T00:00:00.000Z");
assert.equal(ppaBoardDate({ dateKey: "9999-12-31", plannedStart: "2026-10-12T20:00:00Z" }), "2026-10-12");
assert.equal(ppaLocalDayPrefix("2026-10-12T08:00:00Z"), "2026-10-12");
assert.equal(ppaBoardDate({ dateKey: "2026-10-07", plannedStart: "2026-10-06T22:00:00Z" }), "2026-10-06");
assert.equal(ppaBoardDate({ dateKey: "9999-12-31", plannedStart: "" }), "9999-12-31");

const keptStart = ppaWallInstant("2026-10-10T08:00:00Z", "America/New_York");
const keepNow = new Date("2026-10-12T11:30:00Z");
assert.equal(keepPpaMatch({ status: "NEXT", date: "2026-10-10", start: keptStart }, keepNow), true);
assert.equal(keepPpaMatch({ status: "NEXT", date: "2026-10-10", start: "2026-10-10T08:00:00Z" }, keepNow), false);

const foreign = applyPpaTickerRows(
  { "chi-1": { id: "chi-1", status: "final", dateKey: "2026-10-11", teams: [{ players: ["Anna Leigh Waters"] }] } },
  [{ id: "vb-1", status: "upnext", plannedStart: "2026-10-12T08:00:00Z", time: "8:00 AM EDT", teams: [{ players: ["A"] }] }],
  { aligned: ppaTickerTitleAligned("PPA Tour: Mojo Energy Pouches Virginia Beach Open", PPA_CHICAGO) }
);
assert.equal(foreign["vb-1"], undefined);
assert.equal(foreign["chi-1"].status, "final");

const spillNow = new Date("2026-10-07T12:00:00Z");
const spillIn = [
  { round: "Round 64", status: "FT", date: "2026-10-06", score: "2-0" },
  { round: "Round 64", status: "FT", date: "2026-10-07", score: "0-2" },
  { round: "Round 32", status: "NEXT", date: "2026-10-07", score: "" },
];
const spill = rebasePpaLocalDates(spillIn, "America/Chicago", spillNow);
assert.equal(spill[0].date, "2026-10-06");
assert.equal(spill[1].date, "2026-10-06");
assert.equal(spill[1].score, "0-2");
assert.equal(spill[2].date, "2026-10-07");
assert.equal(spill[2].score, "");
assert.equal(rebasePpaLocalDates(spillIn, "Europe/London", spillNow)[1].date, "2026-10-07");

const clientJs = fs.readFileSync("js/wpm-20261012a.js", "utf8");
const clientCtx = {};
vm.runInNewContext(
  clientJs.slice(clientJs.indexOf("function tzOffsetMinutes"), clientJs.indexOf("function addDaysIso")) +
    "\n" +
    clientJs.slice(clientJs.indexOf("function addDaysIso"), clientJs.indexOf("function boardTz")) +
    "\nthis.rebasePpaLocalDates = rebasePpaLocalDates;",
  clientCtx
);
assert.deepEqual(
  clientCtx.rebasePpaLocalDates(spillIn, "America/Chicago").map((m) => m.date),
  spill.map((m) => m.date)
);
assert.equal(LV, "86926aef-0566-4fbb-87cf-a48068a9f1c6");
assert.equal(PPA_LAS_VEGAS.end, "2026-10-04");
assert.equal(ppaTickerLive("live"), true);
assert.equal(ppaTickerLive("upnext"), false);
assert.equal(ppaTickerLive("LIVE"), true);
assert.equal(ppaPublicStatus("live", true), "LIVE");
assert.equal(ppaPublicStatus("live", false), "NEXT");
assert.equal(ppaPublicStatus("upnext", false), "NEXT");
assert.equal(ppaPublicStatus("final", false), "FT");
assert.equal(ppaPublicStatus("scheduled", false), "NEXT");
assert.equal(ppaClockLabel("8:00 AM EDT"), "8:00 AM EDT");
assert.equal(ppaClockLabel(""), "");
assert.equal(ppaClockLabel("In play G1"), "");
assert.equal(ppaCourtLabel(""), "");
assert.equal(ppaCourtLabel("3"), "Court 3");
assert.equal(ppaCourtLabel("Center Court"), "Center Court");
assert.equal(ppaStatus("upnext"), "NEXT");
assert.equal(ppaListedScore(0, 0, [{ live: true, score: "0–0" }]), "");
assert.equal(ppaListedScore(0, 0, [{ live: true, score: "5–3" }]), "0-0");
assert.equal(ppaListedScore(1, 0, []), "1-0");
assert.equal(ppaListedScore(0, 0, []), "");

const ppaSrc = fs.readFileSync("netlify/functions/ppa.mts", "utf8");
assert.ok(ppaSrc.includes("PPA_LIVE.eventId"));
assert.ok(ppaSrc.includes("rebasePpaLocalDates"));
assert.ok(ppaSrc.includes("pin.name"));
assert.ok(ppaSrc.includes("pin.tz"));
assert.ok(ppaSrc.includes("ppaTickerTitleAligned"));
assert.ok(ppaSrc.includes("applyPpaTickerRows"));
assert.ok(ppaSrc.includes("ppaWallInstant"));
assert.equal(ppaSrc.includes(LV), false, "ppa.mts must not hardcode the finished Las Vegas UUID");
assert.equal(ppaSrc.includes("92d37566"), false);
assert.equal(ppaSrc.includes("62c01642"), false);

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
assert.equal(ppaTickerTitleAligned(title, PPA_LIVE), true, title);
assert.match(title, /Mojo Energy Pouches Virginia Beach Open/);
assert.equal(ppaTickerTitleAligned(title, PPA_CHICAGO), false);
assert.equal(/chicago cup/i.test(title), false);
const tickMatches = tick.matches || [];
assert.ok(tickMatches.length > 0, "ticker has matches");

const now = new Date();
const clocks = new Map();
for (const m of tickMatches) {
  if (m.status !== "live" && m.status !== "final") {
    assert.equal(emptyGames(m), true, "non-live ticker row must not carry score lines");
  }
  const date = ppaBoardDate(m, now);
  assert.equal(isPpaTbaDate(date), false, "ticker row must not use the Date TBA sentinel");
  assert.equal(date, "2026-10-12");
  if (m.time) assert.match(String(m.time), /EDT/);
  const start = ppaWallInstant(m.plannedStart, PPA_LIVE.tz);
  assert.ok(start, "wall clock converts");
  clocks.set(m.time, start);
  assert.equal(
    keepPpaMatch({ status: ppaStatus(m.status), date, start }, now),
    true,
    "ticker row stays on the Virginia Beach board"
  );
}
assert.equal(clocks.get("8:00 AM EDT"), "2026-10-12T12:00:00.000Z");
assert.equal(clocks.get("11:00 AM EDT"), "2026-10-12T15:00:00.000Z");
assert.equal(clocks.get("2:00 PM EDT"), "2026-10-12T18:00:00.000Z");

const scores = await getJson("https://www.ppatour.com/api/scores/?event=" + VB);
assert.equal(scores.tournamentId, VB);
const scoreMatches = ppaScoreRows(scores);
const mainMatches = scores.matches || [];
assert.ok(mainMatches.length > 0, "Virginia Beach main draw is published");
assert.ok(scoreMatches.length > mainMatches.length, "qualifier rows are part of the draw");
const tickIds = new Set(tickMatches.map((m) => m.id));
const mainIds = new Set(mainMatches.map((m) => m.id));
assert.equal([...tickIds].some((id) => mainIds.has(id)), false, "ticker ids are not in the Date TBA main draw");
assert.ok([...tickIds].every((id) => scoreMatches.some((m) => m.id === id)), "ticker ids are in the qualifier draw");
let tba = 0;
for (const m of mainMatches) {
  if (isPpaTbaDate(m.dateKey) && m.status !== "live" && m.status !== "final") tba += 1;
}
assert.ok(tba > 0, "main draw Date TBA rows stay off the day board");

if (!process.execArgv.includes("--experimental-strip-types")) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, ["--experimental-strip-types", process.argv[1], "--handler"], {
    stdio: "inherit",
  });
  process.exit(r.status == null ? 1 : r.status);
}

const { default: ppaHandler } = await import("../netlify/functions/ppa.mts");
const res = await ppaHandler(new Request("https://live.worldpickleballmagazine.com/api/ppa"));
assert.equal(res.ok, true);
const body = await res.json();
assert.equal(body.event.id, VB);
assert.equal(body.event.name, PPA_LIVE.name);
assert.equal(body.event.venue, PPA_LIVE.venue);
assert.equal(body.event.tz, "America/New_York");
assert.equal(body.event.eventKey, "ev:ppa:" + VB);
assert.equal(body.event.smoke, undefined);
assert.ok(body.matches.length >= tickMatches.length, "ticker rows are on the default board");
const seenTick = new Set();
for (const m of body.matches) {
  assert.equal(m.comp, PPA_LIVE.name);
  assert.equal(m.venue, PPA_LIVE.venue);
  assert.equal(m.tz, "America/New_York");
  assert.equal(m.eventKey, "ev:ppa:" + VB);
  assert.equal(/chicago/i.test(m.comp + " " + m.venue + " " + m.tz), false);
  assert.equal(m.date, "2026-10-12");
  assert.equal(isPpaTbaDate(m.date), false);
  if (m.status === "LIVE") assert.equal(m.tickerLive, true);
  else {
    assert.equal(m.status, "NEXT");
    assert.equal(m.score, "", "NEXT rows do not invent a score");
  }
  if (m.clock) assert.match(m.clock, /^\d{1,2}:\d{2} (AM|PM) EDT$/);
  const id = String(m.id || "").replace(/^ppa-/, "");
  if (tickIds.has(id)) {
    seenTick.add(id);
    const src = tickMatches.find((t) => t.id === id);
    assert.equal(m.clock, src.time);
    assert.equal(m.start, ppaWallInstant(src.plannedStart, "America/New_York"));
    if (src.status !== "live") assert.equal(m.status, "NEXT");
  }
}
assert.equal(seenTick.size, tickIds.size, "every ticker id is on the board");
const eaby = body.matches.find((m) => /eaby/i.test(m.a + " " + m.b));
assert.ok(eaby, "qualifier name from the scores draw");
assert.equal(/G\. Eaby/.test(eaby.a + " " + eaby.b), false, "ticker abbreviation must not replace the scores name");

const chicago = await getJson("https://www.ppatour.com/api/scores/?event=" + CHI);
assert.equal(chicago.tournamentId, CHI);
const chicagoMatches = chicago.matches || [];
assert.ok(chicagoMatches.length > 0, "Chicago results are still on the scores API");
assert.ok(
  chicagoMatches.every((m) => String(m.status || "").toLowerCase() === "final"),
  "Chicago archive is final results only"
);
const chicagoDays = [
  ...new Set(chicagoMatches.map((m) => String(m.dateKey || "").slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))),
].sort();
assert.ok(chicagoDays.includes("2026-10-11"));
assert.equal(chicagoDays.some((d) => d > "2026-10-11"), false);

const vegas = await getJson("https://www.ppatour.com/api/scores/?event=" + LV);
assert.equal(vegas.tournamentId, LV);
const vegasMatches = vegas.matches || [];
assert.ok(vegasMatches.length > 0, "Las Vegas results are still on the scores API");
assert.ok(
  vegasMatches.every((m) => String(m.status || "").toLowerCase() === "final"),
  "Las Vegas archive is final results only"
);

const bcn = await getJson("https://www.ppatour.com/api/scores/?event=" + BCN);
assert.equal((bcn.matches || []).length, 0, "Barcelona window ended with no scores");

console.log(
  "ok ppa-virginia-beach · ticker " +
    title +
    " · " +
    tickMatches.length +
    " ticker · " +
    body.matches.length +
    " board · chicago " +
    chicagoMatches.length +
    " final · tba off board"
);
