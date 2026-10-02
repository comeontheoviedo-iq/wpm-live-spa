#!/usr/bin/env node
/**
 * Following cleanup, finished-event archive, player form.
 * Real scores only. LIVE stays a Den/ticker status — archive rows are FT.
 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { looksLikeStoredEvent, normalizeFollowKey } from "../netlify/functions/follow-tags.mjs";
import {
  FINISHED_EVENTS,
  CURRENT_PINS,
  mapAppArchiveMatch,
  mapPpaArchiveMatch,
  pinEnded,
  selectProBrackets,
  weekIsFinished,
} from "../netlify/functions/finished-archive.mjs";
import { APP_LIVE, PPA_LIVE } from "../netlify/functions/slate-events.mjs";

const js = fs.readFileSync("js/wpm-20261002b.js", "utf8");
const start = js.indexOf("const TOUR_IDS");
const end = js.indexOf("function migrateFollows");
const context = {};
vm.runInNewContext(js.slice(start, end) + "\nthis.normalizeFollowKey = normalizeFollowKey;\nthis.looksLikeStoredEvent = looksLikeStoredEvent;", context);

for (const fn of [normalizeFollowKey, context.normalizeFollowKey]) {
  assert.equal(fn("Waters"), "Waters");
  assert.equal(fn("tour:app"), "tour:app");
  assert.equal(fn("tour:nope"), "");
  assert.equal(fn("ev:app:18448"), "tour:app");
  assert.equal(fn("ev:app:18453"), "tour:app");
  assert.equal(fn("Overland"), "tour:app");
  assert.equal(fn("Arizona"), "tour:ppa");
  assert.equal(fn("Gijón"), "tour:tpb");
  assert.equal(fn("Gijon"), "tour:tpb");
  assert.equal(fn("Las Vegas"), "tour:ppa");
  assert.equal(fn("slate:tpb-gijon-2026"), "tour:tpb");
  assert.equal(fn("APP Dillons Overland Park Open"), "tour:app");
  assert.equal(fn("PPA Veolia Arizona Open"), "tour:ppa");
  assert.equal(fn("ev:foo:nope"), "");
}

assert.equal(looksLikeStoredEvent("Waters"), false);
assert.equal(looksLikeStoredEvent("Anna Leigh Waters"), false);
assert.equal(context.looksLikeStoredEvent("Overland"), true);
assert.equal(looksLikeStoredEvent("Ben Johns"), false);

const overland = FINISHED_EVENTS.find((e) => e.id === "overland");
const arizona = FINISHED_EVENTS.find((e) => e.id === "arizona");
assert.equal(overland.denTournamentId, "18453");
assert.equal(arizona.ppaEventId, "62c01642-1bb2-4f9a-9998-599f8fdefe5c");
assert.equal(APP_LIVE.eventId, "18448");
assert.equal(PPA_LIVE.eventId, "86926aef-0566-4fbb-87cf-a48068a9f1c6");
assert.equal(CURRENT_PINS.find((e) => e.id === "columbus").denTournamentId, "18448");
assert.equal(CURRENT_PINS.find((e) => e.id === "las-vegas").ppaEventId, PPA_LIVE.eventId);

const kept = selectProBrackets([
  { bracketName: "Men's Pro Singles" },
  { bracketName: "Men's Pro Singles - Backdraw" },
  { bracketName: "Mixed Amateur Doubles" },
  { bracketName: "Women's Pro Doubles" },
]);
assert.deepEqual(kept.map((b) => b.bracketName), ["Men's Pro Singles", "Women's Pro Doubles"]);

const fu = mapAppArchiveMatch(
  {
    matchId: 598179,
    status: "COMPLETED",
    round: 1,
    roundDisplayName: "Round 1",
    matchType: "STANDARD",
    team1: { players: [{ name: "Ryan Fu" }] },
    team2: { players: [{ name: "Mike Svetlic" }] },
    scores: [
      { gameNumber: 1, team1Score: 11, team2Score: 0 },
      { gameNumber: 2, team1Score: 11, team2Score: 5 },
    ],
    startTime: [2026, 9, 17, 9, 49, 44],
  },
  { bracketName: "Men's Pro Singles", bracketType: "SingleEliminationBronze", totalRounds: 6, startDate: "2026-09-17" },
  overland
);
assert.equal(fu.status, "FT");
assert.equal(fu.denStatus, "COMPLETED");
assert.equal(fu.score, "2-0");
assert.equal(fu.a, "Ryan Fu");
assert.equal(fu.b, "Mike Svetlic");
assert.equal(fu.lines.length, 2);
assert.equal(fu.lines.some((l) => l.live), false);
assert.equal(JSON.stringify(fu).includes('"status":"LIVE"'), false);

const skipped = mapAppArchiveMatch(
  { matchId: 1, status: "RUNNING", team1: { players: [{ name: "A" }] }, team2: { players: [{ name: "B" }] }, scores: [] },
  { bracketName: "Men's Pro Singles", totalRounds: 6 },
  overland
);
assert.equal(skipped, null);

const waters = mapPpaArchiveMatch(
  {
    id: "5ebc2a0d-f0b3-4280-96c9-f94669d8522d",
    division: "Women's Singles",
    roundLabel: "Finals",
    dateKey: "2026-09-21",
    status: "final",
    teams: [
      { players: ["Anna Leigh Waters"], games: [11, 11, 0], winner: true },
      { players: ["Kate Fahey"], games: [9, 4, 0], winner: false },
    ],
  },
  arizona
);
assert.equal(waters.status, "FT");
assert.equal(waters.score, "2-0");
assert.equal(waters.lines.length, 2);
assert.equal(waters.lines.map((l) => l.score).join(","), "11–9,11–4");
assert.ok(waters.tags.includes("Waters"));
assert.equal(waters.lines.some((l) => l.live), false);
assert.equal(mapPpaArchiveMatch({ id: "x", status: "scheduled", teams: [] }, arizona), null);

assert.equal(weekIsFinished([{ status: "final", dateKey: "2026-10-02" }, { status: "scheduled", dateKey: "2026-10-02" }], "2026-10-03"), false);
assert.equal(weekIsFinished([{ status: "FT", date: "2026-10-04" }, { status: "FT", date: "2026-10-02" }], "2026-10-05"), true);
assert.equal(weekIsFinished([{ status: "FT", date: "2026-10-04" }], "2026-10-04"), false);
assert.equal(pinEnded("2026-10-04", "2026-10-02"), false);
assert.equal(pinEnded("2026-10-04", "2026-10-05"), true);

assert.ok(js.includes('class="past-nav"'));
assert.ok(js.includes("function personFormHtml"));
assert.ok(js.includes("function archiveBoardHtml"));
assert.ok(js.includes("function pullArchive"));
assert.equal(js.includes("function tourChoiceButtons"), false);
assert.equal(js.includes("function followChips"), false);
assert.equal(js.includes("Follow Overland"), false);
assert.equal(js.includes("Follow Columbus, Las Vegas"), false);
assert.ok(js.includes("rail-empty\">None."));
assert.ok(js.includes("const badge = snap ?"));
assert.ok(js.includes("Coming soon"));
assert.ok(js.includes("18448"));
assert.ok(js.includes("86926aef"));
assert.equal(js.includes("92d37566"), false);

const rail = js.slice(js.indexOf("function followingBox"), js.indexOf("function followingRail"));
assert.equal(rail.includes("Overland"), false);
assert.equal(rail.includes("data-follow"), false);
assert.equal(rail.includes("Open following"), false);

console.log("ok product-passes · event follows migrate · archive FT only · no suggestion bar");
