#!/usr/bin/env node
/**
 * Following cleanup, finished-event archive, player form across tours.
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
  eventIsFinished,
  selectProBrackets,
  weekIsFinished,
} from "../netlify/functions/finished-archive.mjs";
import { APP_LIVE, PPA_LIVE } from "../netlify/functions/slate-events.mjs";

const js = fs.readFileSync("js/wpm-20261002d.js", "utf8");
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
  assert.equal(fn("APP Arizona Open"), "tour:app");
  assert.equal(fn("APP Asia Chongqing Open"), "tour:app-asia");
  assert.equal(fn("APP India Open"), "tour:app-asia");
  assert.equal(fn("MLP Asia 2026"), "tour:mlp-asia");
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

const columbusPin = CURRENT_PINS.find((e) => e.id === "columbus");
const vegasPin = CURRENT_PINS.find((e) => e.id === "las-vegas");
assert.equal(eventIsFinished(columbusPin, [], "2026-10-02"), false);
assert.equal(eventIsFinished(columbusPin, [], "2026-10-05"), true);
assert.equal(eventIsFinished(vegasPin, [{ status: "final", dateKey: "2026-10-02" }, { status: "scheduled", dateKey: "2026-10-03" }], "2026-10-02"), false);
assert.equal(eventIsFinished(overland, [], "2026-10-02"), true);
assert.equal(eventIsFinished(arizona, [], "2026-10-02"), true);

const archiveSrc = fs.readFileSync("netlify/functions/finished-archive.mjs", "utf8");
const appLoad = archiveSrc.slice(archiveSrc.indexOf("async function loadAppFinished"), archiveSrc.indexOf("async function loadPpaFinished"));
const ppaLoad = archiveSrc.slice(archiveSrc.indexOf("async function loadPpaFinished"), archiveSrc.indexOf("function pack"));
assert.equal(appLoad.includes("matches: []"), false, "Columbus FT rows stay available before the pin ends");
assert.equal(ppaLoad.includes("matches: []"), false, "Las Vegas final rows stay available before the week ends");
assert.ok(appLoad.includes("eventIsFinished"));
assert.ok(ppaLoad.includes("eventIsFinished"));
assert.equal(appLoad.includes('"status":"LIVE"'), false);
assert.equal(ppaLoad.includes("LIVE"), false);

function extractFunction(src, name) {
  const start = src.indexOf("function " + name + "(");
  assert.ok(start > 0, "missing " + name);
  let i = src.indexOf("{", start);
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error("unclosed " + name);
}

const formFns = [
  "normName",
  "nameTokens",
  "rankingNameMatches",
  "personInText",
  "splitSides",
  "denStatusToken",
  "isDenLiveStatus",
  "parseUtc",
  "effectiveStatus",
  "sidePartIsPerson",
  "personOnSide",
  "personOutcome",
  "profileScore",
  "byRecent",
  "personFormMarks",
].map((name) => extractFunction(js, name)).join("\n");
const formCtx = {};
vm.runInNewContext(formFns + "\nthis.personFormMarks = personFormMarks;\nthis.personOutcome = personOutcome;\nthis.personOnSide = personOnSide;\nthis.profileScore = profileScore;", formCtx);

const watersRec = { name: "Anna Leigh Waters", followKey: "Waters" };
const fuRec = { name: "Ryan Fu", followKey: "Fu" };
const crossTour = [
  { id: "az-f", status: "FT", tour: "ppa", date: "2026-09-21", start: "2026-09-21T18:00:00.000Z", comp: "PPA Veolia Arizona Open", round: "Finals", a: "Anna Leigh Waters", b: "Kate Fahey", score: "2-0" },
  { id: "az-sf", status: "FT", tour: "ppa", date: "2026-09-20", start: "2026-09-20T18:00:00.000Z", comp: "PPA Veolia Arizona Open", round: "SF", a: "Waters / Parenteau", b: "Fahey / Bright", score: "2-1" },
  { id: "ov-qf", status: "FT", tour: "app", date: "2026-09-18", start: "2026-09-18T16:00:00.000Z", comp: "APP Dillons Overland Park Open", round: "QF", a: "Ryan Fu", b: "Mike Svetlic", score: "2-0" },
  { id: "col-qf", status: "FT", tour: "app", date: "2026-10-02", start: "2026-10-02T18:00:00.000Z", comp: "APP Columbus Open presented by The James", round: "QF", a: "Waters / Bright", b: "Johns / Patriquin", score: "2-1" },
  { id: "lv-r16", status: "FT", tour: "ppa", date: "2026-10-01", start: "2026-10-01T20:00:00.000Z", comp: "PPA Rate Las Vegas Open", round: "R16", a: "Kate Fahey", b: "Anna Leigh Waters", score: "2-0" },
  { id: "live", status: "LIVE", tour: "ppa", denStatus: "RUNNING", date: "2026-10-02", comp: "PPA Rate Las Vegas Open", a: "Anna Leigh Waters", b: "Kate Fahey", score: "0-0" },
  { id: "blank", status: "FT", tour: "app", date: "2026-10-02", start: "2026-10-02T15:00:00.000Z", comp: "APP Columbus Open presented by The James", round: "R1", a: "Anna Leigh Waters", b: "Someone", score: "" },
];
const watersForm = formCtx.personFormMarks(crossTour, watersRec);
assert.equal(watersForm.string, "WLWW");
assert.equal(watersForm.wins, 3);
assert.equal(watersForm.losses, 1);
assert.equal(JSON.stringify(watersForm.tours.slice().sort()), JSON.stringify(["app", "ppa"]));
assert.ok(watersForm.events.includes("APP Columbus Open presented by The James"));
assert.ok(watersForm.events.includes("PPA Veolia Arizona Open"));
assert.ok(watersForm.events.includes("PPA Rate Las Vegas Open"));
assert.equal(formCtx.personOutcome(crossTour.find((m) => m.id === "live"), watersRec), "");
assert.equal(formCtx.personOutcome(crossTour.find((m) => m.id === "blank"), watersRec), "");
assert.equal(formCtx.personOnSide("Waters / Bright", watersRec), true);
assert.equal(formCtx.personOnSide("Johns / Patriquin", watersRec), false);
assert.equal(formCtx.personFormMarks(crossTour, fuRec).string, "W");
assert.equal(formCtx.personFormMarks([], watersRec).string, "");

const fuColumbus = { id: "col-fu", status: "FT", tour: "app", date: "2026-10-02", comp: "APP Columbus Open presented by The James", round: "R16", a: "Fu / Jardim", b: "Devilliers / Black", score: "2-1" };
const fuOverland = { id: "ov-fu", status: "FT", tour: "app", date: "2026-09-18", comp: "APP Dillons Overland Park Open", round: "R32", a: "Mike Svetlic", b: "Ryan Fu", score: "2-0" };
const fuForm = formCtx.personFormMarks([fuColumbus, fuOverland], fuRec);
assert.equal(fuForm.string, "WL");
assert.equal(formCtx.profileScore(fuOverland, fuRec), "0-2");
assert.equal(formCtx.profileScore({ status: "LIVE", denStatus: "IN_PROGRESS", tour: "app", a: "Fu / Bui", b: "Matthews / Beasley", score: "0-0", lines: [{ score: "–", live: true }] }, fuRec), "");
assert.equal(formCtx.profileScore({ status: "FT", tour: "app", a: "DuVally / Fu", b: "Palm / Camron", score: "1-2" }, fuRec), "1-2");
assert.equal(JSON.stringify(fuForm.events), JSON.stringify(["APP Columbus Open presented by The James", "APP Dillons Overland Park Open"]));

assert.ok(js.includes('class="past-nav"'));
assert.ok(js.includes("function personFormHtml"));
assert.ok(js.includes("function personFormMarks"));
assert.ok(js.includes("function pullProfileArchives"));
assert.ok(js.includes('class="form-string"'));
assert.ok(js.includes("No finished matches yet"));
assert.ok(js.includes('class="statuscol wl'));
const viewPerson = js.slice(js.indexOf("function viewPerson"), js.indexOf("function playerMedals"));
assert.ok(viewPerson.includes("pullProfileArchives()"));
assert.ok(viewPerson.includes('data-follow="'));
assert.equal(viewPerson.includes("Follow Overland"), false);
assert.equal(viewPerson.includes("suggestion"), false);
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
