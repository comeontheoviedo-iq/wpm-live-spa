#!/usr/bin/env node
/**
 * Veolia Chicago Cup cut: ticker title matches the wired EVENT,
 * Date TBA stays off the day board, LIVE only from the ticker.
 * Rate Las Vegas stays a finished scores archive (all final, through 4 Oct).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PPA_LAS_VEGAS,
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  ENDED_PPA,
  ppaTickerTitleAligned,
} from "../netlify/functions/slate-events.mjs";
import {
  isPpaTbaDate,
  keepPpaMatch,
  mergePpaDateKey,
  ppaBoardDate,
  ppaClockLabel,
  ppaCourtLabel,
  ppaListedScore,
  ppaPublicStatus,
  ppaStatus,
  ppaTickerLive,
} from "../netlify/functions/ppa-keep.mjs";

const UA = { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" };
const CHI = PPA_LIVE_EVENT_ID;
const LV = PPA_LAS_VEGAS.eventId;
const BCN = ENDED_PPA.barcelona.ppaEventId;

assert.equal(CHI, "203e1164-b4f9-47e9-bacf-ff81f8748025");
assert.equal(PPA_LIVE.name, "Veolia Chicago Cup");
assert.equal(PPA_LIVE.venue, "Life Time North Shore Sport & Racquetball, Chicago, IL");
assert.equal(PPA_LIVE.tz, "America/Chicago");
assert.equal(PPA_LIVE.firstServe, "8:00 AM CDT");
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
assert.equal(ppaClockLabel("8:00 AM CDT"), "8:00 AM CDT");
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
assert.ok(ppaSrc.includes("PPA_LIVE.name"));
assert.ok(ppaSrc.includes("PPA_LIVE.venue"));
assert.ok(ppaSrc.includes("PPA_LIVE.tz"));
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
assert.equal(ppaTickerTitleAligned(title), true, title);
assert.match(title, /Veolia Chicago Cup/);
assert.equal(/las vegas/i.test(title), false);
const tickMatches = tick.matches || [];
assert.ok(tickMatches.length > 0, "ticker has matches");

const now = new Date();
for (const m of tickMatches) {
  if (m.status !== "live" && m.status !== "final") {
    assert.equal(emptyGames(m), true, "non-live ticker row must not carry score lines");
  }
  const date = ppaBoardDate(m, now);
  assert.equal(isPpaTbaDate(date), false, "ticker row must not use the Date TBA sentinel");
  if (m.time) assert.match(String(m.time), /CDT|CST|AM|PM/);
  assert.equal(
    keepPpaMatch(
      { status: ppaStatus(m.status), date, start: m.plannedStart || "" },
      now
    ),
    true,
    "ticker row stays on the Chicago board"
  );
}

const scores = await getJson("https://www.ppatour.com/api/scores/?event=" + CHI);
assert.equal(scores.tournamentId, CHI);
const scoreMatches = scores.matches || [];
assert.ok(scoreMatches.length > 0, "Chicago scores draw is published");
let tba = 0;
for (const m of scoreMatches) {
  if (m.status === "live") {
    assert.equal(
      tickMatches.some((t) => t.id === m.id && t.status === "live"),
      true,
      "LIVE only from the ticker"
    );
  }
  if (isPpaTbaDate(m.dateKey) && m.status !== "live" && m.status !== "final") {
    tba += 1;
    const merged = mergePpaDateKey(m, tickMatches.find((t) => t.id === m.id) || {});
    if (!tickMatches.some((t) => t.id === m.id)) {
      assert.equal(merged, "9999-12-31");
      assert.equal(
        keepPpaMatch({ status: "NEXT", date: "9999-12-31", start: "" }, now),
        false
      );
    }
  }
}
assert.ok(tba > 0, "unscheduled Chicago draw rows stay Date TBA");

const vegas = await getJson("https://www.ppatour.com/api/scores/?event=" + LV);
assert.equal(vegas.tournamentId, LV);
const vegasMatches = vegas.matches || [];
assert.ok(vegasMatches.length > 0, "Las Vegas results are still on the scores API");
assert.ok(
  vegasMatches.every((m) => String(m.status || "").toLowerCase() === "final"),
  "Las Vegas archive is final results only"
);
const vegasDays = [
  ...new Set(vegasMatches.map((m) => String(m.dateKey || "").slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))),
].sort();
assert.ok(vegasDays.includes("2026-10-04"));
assert.equal(vegasDays.some((d) => d > "2026-10-04"), false);

const bcn = await getJson("https://www.ppatour.com/api/scores/?event=" + BCN);
assert.equal((bcn.matches || []).length, 0, "Barcelona window ended with no scores");

console.log(
  "ok ppa-chicago · ticker " +
    title +
    " · " +
    tickMatches.length +
    " ticker · " +
    scoreMatches.length +
    " scores · las vegas " +
    vegasMatches.length +
    " final · tba off board"
);
