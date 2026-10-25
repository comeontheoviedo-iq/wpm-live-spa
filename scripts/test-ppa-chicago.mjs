#!/usr/bin/env node
/**
 * Hong Kong Slam is the live PPA pin. Ticker title must match before
 * ticker rows are stamped with that pin. Date TBA is not a day and not a clock.
 * Virginia Beach and Chicago Cup stay finished archives.
 * plannedStart is venue wall time with a Z suffix — the board clock is the
 * ticker string, and the stored start is the real UTC instant.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  PPA_CHICAGO,
  PPA_HONG_KONG,
  PPA_LAS_VEGAS,
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  PPA_VIRGINIA_BEACH,
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
const HK = PPA_LIVE_EVENT_ID;
const CHI = PPA_CHICAGO.eventId;
const LV = PPA_LAS_VEGAS.eventId;
const VB = PPA_VIRGINIA_BEACH.eventId;
const BCN = ENDED_PPA.barcelona.ppaEventId;

assert.equal(HK, "c7e4fd72-d159-4211-82a2-21adbb21defe");
assert.equal(PPA_LIVE, PPA_HONG_KONG);
assert.equal(PPA_LIVE.name, "PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026");
assert.equal(PPA_LIVE.venue, "Kai Tak Arena, Hong Kong");
assert.equal(PPA_LIVE.tz, "Asia/Hong_Kong");
assert.equal(PPA_LIVE.firstServe, undefined);
assert.equal(VB, "429c7980-e1b9-4800-805f-dfb160781cd9");
assert.equal(PPA_VIRGINIA_BEACH.firstServe, "8:00 AM EDT");
assert.notEqual(PPA_LIVE.eventId, VB);
assert.equal(CHI, "203e1164-b4f9-47e9-bacf-ff81f8748025");
assert.equal(PPA_CHICAGO.name, "Veolia Chicago Cup");
assert.equal(PPA_CHICAGO.tz, "America/Chicago");
assert.equal(
  ppaTickerTitleAligned("PPA Tour: PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026"),
  true
);
assert.equal(ppaTickerTitleAligned("PPA Tour: Mojo Energy Pouches Virginia Beach Open"), false);
assert.equal(ppaTickerTitleAligned("Hong Kong"), false);
assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Chicago Cup"), false);
assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Chicago Cup", PPA_CHICAGO), true);
assert.equal(ppaTickerTitleAligned(""), true);
assert.equal(ppaWallInstant("9999-12-31T08:00:00Z", "Asia/Hong_Kong"), "");

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

const clientJs = fs.readFileSync("js/wpm-20261025a.js", "utf8");
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
assert.equal(ppaTickerTitleAligned(title, PPA_LIVE), true, title || "(empty ticker title)");
if (title) {
  assert.match(title, /PPA Asia 1500 Hang Seng Bank Hong Kong Slam 2026/);
  assert.equal(ppaTickerTitleAligned(title, PPA_CHICAGO), false);
  assert.equal(ppaTickerTitleAligned(title, PPA_VIRGINIA_BEACH), false);
}
assert.equal(/chicago cup/i.test(title), false);
assert.equal(/virginia beach/i.test(title), false);
const tickMatches = tick.matches || [];
const tickerLive = tickMatches.some((m) => String(m.status || "").toLowerCase() === "live");

const scores = await getJson("https://www.ppatour.com/api/scores/?event=" + HK);
assert.equal(scores.tournamentId, HK);
const scoreMatches = ppaScoreRows(scores);
const mainMatches = scores.matches || [];
assert.ok(mainMatches.length > 0, "Hong Kong main draw is published");
const mainTba = mainMatches.filter((m) => isPpaTbaDate(m.dateKey) || m.dateLabel === "Date TBA");
assert.ok(mainTba.length > 0, "Hong Kong still has Date TBA rows");
for (const m of mainTba) {
  assert.notEqual(String(m.status || "").toLowerCase(), "live", "Date TBA is not LIVE");
  const games = (m.teams || []).flatMap((t) => t.games || []);
  assert.ok(games.every((g) => g == null || g === ""), "Date TBA row must not carry a score");
}
const qual = (scores.qualifier && scores.qualifier.matches) || [];
const datedQual = qual.filter((m) => !isPpaTbaDate(m.dateKey));
assert.ok(scoreMatches.length >= mainMatches.length, "scores rows include the main draw");
const tickIds = new Set(tickMatches.map((m) => m.id));
const mainIds = new Set(mainMatches.map((m) => m.id));

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
assert.equal(body.event.id, HK);
assert.equal(body.event.name, PPA_LIVE.name);
assert.equal(body.event.venue, PPA_LIVE.venue);
assert.equal(body.event.tz, "Asia/Hong_Kong");
assert.equal(body.event.eventKey, "ev:ppa:" + HK);
assert.equal(body.event.smoke, undefined);
assert.notEqual(body.event.id, VB);
assert.ok(body.matches.length >= tickMatches.length, "aligned ticker rows are on the default board");
const seenTick = new Set();
const boardIds = new Set();
for (const m of body.matches) {
  assert.equal(m.comp, PPA_LIVE.name);
  assert.equal(m.venue, PPA_LIVE.venue);
  assert.equal(m.tz, "Asia/Hong_Kong");
  assert.equal(m.eventKey, "ev:ppa:" + HK);
  assert.equal(/virginia beach|chicago cup/i.test(m.comp + " " + m.venue), false);
  assert.equal(isPpaTbaDate(m.date), false, "Date TBA stays off the day board");
  assert.notEqual(m.note, "Date TBA");
  const id = String(m.id || "").replace(/^ppa-/, "");
  boardIds.add(id);
  assert.equal(mainTba.some((row) => row.id === id), false, "Date TBA main-draw id is not on the day board");
  if (m.status === "LIVE") {
    assert.equal(m.tickerLive, true, "LIVE only when the ticker says live");
    assert.equal(tickerLive, true);
  } else {
    assert.ok(m.status === "NEXT" || m.status === "FT", m.status);
  }
  if (m.status === "NEXT" && !m.clock && !m.start) assert.equal(m.hasClock, false);
  if (m.clock) assert.match(m.clock, /^\d{1,2}:\d{2} (AM|PM)/);
  if (tickIds.has(id)) {
    seenTick.add(id);
    const src = tickMatches.find((t) => t.id === id);
    assert.equal(m.clock, src.time || "");
    assert.equal(m.start, ppaWallInstant(src.plannedStart, "Asia/Hong_Kong"));
    if (String(src.status || "").toLowerCase() !== "live") assert.notEqual(m.status, "LIVE");
  }
}
assert.equal(seenTick.size, tickIds.size, "every aligned ticker id is on the board");
if (!tickerLive) assert.equal(body.matches.some((m) => m.status === "LIVE"), false, "no fake LIVE");
const scoredFt = body.matches.filter((m) => m.status === "FT" && m.score && m.score !== "0-0" && m.score !== "");
if (datedQual.length) assert.ok(scoredFt.length > 0, "dated qualifier finals keep real scores");
assert.equal([...boardIds].some((id) => mainIds.has(id) && mainTba.some((row) => row.id === id)), false);

const beach = await getJson("https://www.ppatour.com/api/scores/?event=" + VB);
assert.equal(beach.tournamentId, VB);
const beachMatches = beach.matches || [];
const beachFinal = beachMatches.filter((m) => String(m.status || "").toLowerCase() === "final");
assert.ok(beachFinal.length >= 180, "Virginia Beach finals stay on the scores API");
assert.ok(beachMatches.some((m) => isPpaTbaDate(m.dateKey)), "the undated Virginia Beach row is not invented as FT");

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
  "ok ppa-hong-kong · ticker " +
    (title || "(empty)") +
    " · main " +
    mainMatches.length +
    " · tba " +
    mainTba.length +
    " · board " +
    body.matches.length +
    " · ft " +
    scoredFt.length +
    " · beach final " +
    beachFinal.length +
    " · chicago " +
    chicagoMatches.length
);
