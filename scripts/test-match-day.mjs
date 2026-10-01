#!/usr/bin/env node
/**
 * Columbus match-day density + Web Push follow coverage.
 * LIVE only from Den running tokens. No invented clocks, scores, or LIVE.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import { matchFollowKeys, normalizeFollowKey, rosterText, tagsFor, tourFollowMatches } from "../netlify/functions/follow-tags.mjs";
import {
  followLabel,
  isMatchLive,
  notifyPayload,
  selectPushBatch,
  MAX_PUSH_PER_SUB_PER_RUN,
} from "../netlify/functions/push-lib.mjs";

const js = fs.readFileSync("js/wpm-20261001a.js", "utf8");
const siteJs = fs.readFileSync("site/js/wpm-20261001a.js", "utf8");
assert.equal(siteJs, js);

const columbus = {
  id: "app-1",
  tour: "app",
  tier: "pro",
  status: "LIVE",
  denStatus: "RUNNING",
  a: "Waters / Bright",
  b: "Johns / Patriquin",
  roster: "Anna Leigh Waters / Anna Bright vs Ben Johns / Catherine Patriquin",
  games: "",
  tags: ["Waters", "Bright", "Johns", "Patriquin"],
  comp: "APP Columbus Open presented by The James",
  venue: "Pickle & Chill, Columbus, OH",
  eventKey: "ev:app:18448",
  div: "Mixed Pro Doubles · QF",
  court: "Court 3",
  start: "2026-10-01T14:00:00.000Z",
};

assert.equal(isMatchLive(columbus), true);
assert.equal(isMatchLive({ ...columbus, status: "NEXT", denStatus: "SCHEDULED" }), false);
assert.equal(isMatchLive({ ...columbus, status: "LIVE", denStatus: "PENDING" }), false);
assert.equal(isMatchLive({ ...columbus, status: "LIVE", denStatus: "SCHEDULED", lines: [{ live: true }] }), false);
assert.equal(isMatchLive({ ...columbus, status: "NEXT", denStatus: "WAITING_FOR_COURT" }), false);
assert.equal(isMatchLive({ tour: "ppa", status: "LIVE", a: "Waters", b: "Bright" }), true);
assert.equal(isMatchLive({ tour: "ppa", status: "NEXT", a: "Waters", b: "Bright" }), false);

assert.deepEqual(matchFollowKeys(columbus, ["Waters"]), ["Waters"]);
assert.equal(normalizeFollowKey("ev:app:18448"), "tour:app");
assert.equal(normalizeFollowKey("ev:gpa:app%20columbus%20open:2026-10-01"), "tour:app");
assert.equal(normalizeFollowKey("ev:ppa:86926aef"), "tour:ppa");
assert.equal(normalizeFollowKey("ev:foo:nope"), "");
assert.equal(normalizeFollowKey("Waters"), "Waters");
assert.equal(normalizeFollowKey("tour:nope"), "");
assert.deepEqual(matchFollowKeys(columbus, ["ev:app:18448"]), ["tour:app"]);
assert.deepEqual(matchFollowKeys(columbus, ["tour:app"]), ["tour:app"]);
assert.deepEqual(
  matchFollowKeys(columbus, ["ev:gpa:app%20columbus%20open:2026-10-01"]),
  ["tour:app"]
);
assert.deepEqual(matchFollowKeys(columbus, ["ev:ppa:86926aef"]), []);
assert.deepEqual(matchFollowKeys(columbus, ["tour:ppa"]), []);
assert.equal(tourFollowMatches(columbus, "tour:ppa"), false);
assert.equal(tourFollowMatches(columbus, "ev:app:18453"), true);
assert.deepEqual(matchFollowKeys(columbus, ["ev:foo:nope"]), []);
assert.deepEqual(matchFollowKeys({ ...columbus, status: "NEXT", denStatus: "SCHEDULED" }, ["tour:app"]), ["tour:app"]);

const fullName = {
  ...columbus,
  a: "Smith / Jones",
  b: "Lee / Ng",
  tags: [],
  roster: "Anna Leigh Waters / Someone Jones vs Other Lee / Other Ng",
};
assert.deepEqual(matchFollowKeys(fullName, ["Anna Leigh Waters"]), ["Anna Leigh Waters"]);
assert.ok(tagsFor(fullName.a + " " + fullName.roster).includes("Waters"));

const roster = rosterText([
  { players: [{ name: "Anna Leigh Waters" }, { name: "Anna Bright" }] },
  { players: [{ name: "Ben Johns" }] },
]);
assert.match(roster, /Anna Leigh Waters/);
assert.match(roster, /Ben Johns/);

assert.equal(followLabel("ev:app:18448"), "APP");
assert.equal(followLabel("tour:app"), "APP");
assert.equal(followLabel("ev:gpa:app%20columbus%20open:2026-10-01"), "APP");
assert.equal(followLabel("Waters"), "Waters");
const payload = notifyPayload(columbus, ["Waters", "ev:app:18448"]);
assert.match(payload.body, /Following · Waters, APP/);
assert.equal(payload.title, "WPM LIVE");
assert.equal(payload.tag, "app-1");
assert.equal(payload.data.url, "/match/app-1");
assert.equal(payload.body.includes("PickleLive"), false);

const flood = [];
for (let i = 0; i < 20; i++) {
  flood.push({
    m: { id: "ev-" + i, tier: i % 2 ? "pro" : "amateur", start: "2026-10-01T" + String(10 + (i % 8)).padStart(2, "0") + ":00:00.000Z", status: "LIVE", denStatus: "RUNNING" },
    who: ["tour:app"],
  });
}
flood.push({
  m: { id: "player-1", tier: "amateur", start: "2026-10-01T18:00:00.000Z", status: "LIVE", denStatus: "PLAYING" },
  who: ["Waters", "tour:app"],
});
const batch = selectPushBatch(flood);
assert.equal(batch.send[0].m.id, "player-1");
assert.equal(batch.send.length, 1 + MAX_PUSH_PER_SUB_PER_RUN);
assert.ok(batch.defer.length > 0);
assert.ok(batch.defer.every((c) => !c.who.some((k) => k === "Waters")));
assert.equal(batch.send.concat(batch.defer).length, flood.length);

assert.ok(js.includes("function boardList"));
assert.ok(js.includes("function upcomingAhead"));
assert.ok(js.includes("function slateSections"));
assert.ok(js.includes("function cardQuietLine"));
assert.ok(js.includes('return "Play starts soon"'));
assert.ok(js.includes("function cardFacts"));
assert.ok(js.includes("function tierMark"));
assert.ok(js.includes("class=\"tier-chip\">Pro"));
assert.ok(js.includes("function tourFollowHit"));
assert.ok(js.includes("function migrateFollows"));
assert.ok(js.includes("function tourFollowButton"));
assert.ok(js.includes("tour:app"));
assert.ok(js.includes("Tours and players you follow show here."));
assert.equal(js.includes("function matchDayFollowStrip"), false);
assert.equal(js.includes("function followChips"), false);
assert.equal(js.includes("Follow Columbus"), false);
assert.ok(js.includes("Scheduled · not live until Den says so"));
assert.ok(js.includes("Time to be assigned"));
assert.ok(js.includes("amateur"));
assert.ok(js.includes("on the APP chip"));
assert.ok(js.includes("wpm-event-notify-hold"));
assert.equal(js.includes("PickleLive"), false);
assert.ok(js.includes("Coming soon"));
assert.ok(js.includes("hasClock !== true"));

const quiet = js.slice(js.indexOf("function cardQuietLine"), js.indexOf("function slateSections"));
assert.match(quiet, /return "Play starts soon"/);
assert.equal(quiet.includes("st LIVE"), false, "quiet line must not paint a LIVE chip");
assert.equal(quiet.includes("livecount"), false);

const appFn = fs.readFileSync("netlify/functions/app.mts", "utf8");
assert.ok(appFn.includes("rosterText"));
assert.ok(appFn.includes("isDenLiveStatus"));
assert.equal(appFn.includes("clock-promote"), true);

console.log("ok match-day · Columbus slate sections · tour push · no fake LIVE");
