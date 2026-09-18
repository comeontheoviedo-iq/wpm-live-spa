#!/usr/bin/env node
/**
 * Same-day quick wins: APP court/clock honesty, event follows, SW=JS bust,
 * Gijón official draw CTA. Never invent scores.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import { matchHasClock, matchBoardDate } from "../netlify/functions/app-dates.mjs";
import { GIJON, asCalendarRow } from "../netlify/functions/slate-events.mjs";

const js = fs.readFileSync("js/wpm-20260918i.js", "utf8");
const shipped = fs.readFileSync("js/wpm-20260918h.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const siteIndex = fs.readFileSync("site/index.html", "utf8");
const siteSw = fs.readFileSync("site/sw.js", "utf8");
const ppa = fs.readFileSync("netlify/functions/ppa.mts", "utf8");

assert.ok(shipped.includes('SAFE_SW_MARK = "20260918h"'), "shipped Sunday-filter 18h stays on main");
assert.ok(js.includes('SAFE_SW_MARK = "20260918i"'));
assert.ok(js.includes("/sw.js?v=20260918i"));
assert.ok(index.includes("wpm-20260918i.js"));
assert.ok(index.includes("sw.js?v=20260918i"));
assert.ok(index.includes("app.css?v=20260918i"));
assert.ok(sw.includes("wpm-static-20260918i"));
assert.equal(index.includes("20260918f"), false, "index must not pin old SW f");
assert.ok(siteIndex.includes("wpm-20260918i.js"));
assert.ok(siteSw.includes("wpm-static-20260918i"));

assert.ok(js.includes("function isEventFollowKey"));
assert.ok(js.includes("if (isEventFollowKey(k)) continue"));
assert.ok(js.includes("event keys (ev:) stay in localStorage but never go to Web Push"));
assert.ok(js.includes("function calendarFollowKey"));
assert.ok(js.includes("Follow Overland, Arizona or a slate event"));
assert.ok(js.includes("function scheduledLocalLabel"));
assert.ok(js.includes("hasClock !== true"));
assert.ok(js.includes("m.tz || boardTz()"));
assert.ok(js.includes("function courtOnCard"));
assert.ok(js.includes("function officialDrawCta"));
assert.ok(js.includes("Official draw"));
assert.ok(js.includes("function boardToday"));
assert.equal(ppa.includes("T14:00:00Z"), false, "PPA must not invent 14:00Z start");

const DRAW = "https://toppickleballtour.com/wp-content/uploads/2026/09/TOP-PICKLEBALL-TOUR-GIJON-GRUPOS.pdf";
assert.equal(GIJON.drawUrl, DRAW);
assert.ok(js.includes(DRAW));
const row = asCalendarRow(GIJON, "2026-09-18");
assert.equal(row.drawUrl, DRAW);
assert.equal(row.status, "delayed");
assert.equal(row.onLive, false);

const wazirFinal = { matchType: "FINAL", startTime: null, scheduledTime: null };
assert.equal(matchHasClock(wazirFinal), false, "no invented clock");
assert.equal(matchBoardDate(wazirFinal, { bracketDate: "2026-09-17", eventEndDate: "2026-09-20" }), "2026-09-20");

console.log("ok quick-wins · 18i bust · 18h kept · event follows · Gijón draw · no invented APP clock");
