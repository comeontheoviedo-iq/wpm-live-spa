#!/usr/bin/env node
/**
 * Same-day quick wins: APP court/clock honesty, event follows, SW=JS bust,
 * Gijón official draw CTA. Never invent scores.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import { matchHasClock, matchBoardDate } from "../netlify/functions/app-dates.mjs";
import { GIJON, asCalendarRow } from "../netlify/functions/slate-events.mjs";

const js = fs.readFileSync("js/wpm-20260930a.js", "utf8");
const prev = fs.readFileSync("js/wpm-20260929a.js", "utf8");
const shipped = fs.readFileSync("js/wpm-20260918i.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const siteIndex = fs.readFileSync("site/index.html", "utf8");
const siteSw = fs.readFileSync("site/sw.js", "utf8");
const siteJs = fs.readFileSync("site/js/wpm-20260930a.js", "utf8");
const ppa = fs.readFileSync("netlify/functions/ppa.mts", "utf8");
const appFn = fs.readFileSync("netlify/functions/app.mts", "utf8");

assert.ok(shipped.includes('SAFE_SW_MARK = "20260918i"'), "previous bundle 18i stays on disk");
assert.ok(prev.includes('SAFE_SW_MARK = "20260929a"'), "previous bundle 29a stays on disk");
assert.ok(js.includes('SAFE_SW_MARK = "20260930a"'));
assert.ok(js.includes("/sw.js?v=20260930a"));
assert.ok(index.includes("wpm-20260930a.js"));
assert.ok(index.includes("sw.js?v=20260930a"));
assert.ok(index.includes("app.css?v=20260930a"));
assert.equal(index.includes("wpm-20260929a.js"), false);
assert.equal(index.includes("wpm-20260928a.js"), false);
assert.equal(index.includes("wpm-20260918i.js"), false);
assert.ok(sw.includes("wpm-static-20260930a"));
assert.equal(index.includes("20260918f"), false, "index must not pin old SW f");
assert.ok(siteIndex.includes("wpm-20260930a.js"));
assert.ok(siteSw.includes("wpm-static-20260930a"));
assert.equal(siteJs, js);

assert.ok(js.includes("function isEventFollowKey"));
assert.ok(js.includes("if (isEventFollowKey(k)) continue"));
assert.ok(js.includes("event keys (ev:) stay in localStorage but never go to Web Push"));
assert.ok(js.includes("function calendarFollowKey"));
assert.ok(js.includes("Follow Columbus, Las Vegas or a slate event"));
assert.equal(js.includes("Follow Overland, Las Vegas"), false);
assert.ok(js.includes("Pickle & Chill, Columbus, OH"));
assert.ok(js.includes('placeholder="18448"'));
assert.ok(js.includes("18448"));
assert.ok(appFn.includes("isEndedAppDenId"));
assert.ok(appFn.includes("APP_LIVE.eventId"));
assert.equal(appFn.includes('FALLBACK_ID = "18453"'), false);
assert.ok(js.includes("86926aef"));
assert.equal(js.includes("92d37566"), false);
assert.ok(js.includes("Darling Tennis Center, Las Vegas"));
assert.ok(js.includes("PST|PDT"));
assert.ok(js.includes("Coming soon"));
assert.ok(js.includes("function scheduledLocalLabel"));
assert.ok(js.includes("hasClock !== true"));
assert.ok(js.includes("m.tz || boardTz()"));
assert.ok(js.includes("function courtOnCard"));
assert.ok(js.includes("function officialDrawCta"));
assert.ok(js.includes("Official draw"));
assert.ok(js.includes("function boardToday"));
assert.equal(ppa.includes("T14:00:00Z"), false, "PPA must not invent 14:00Z start");
assert.equal(ppa.includes("62c01642"), false, "PPA function must not keep the Mesa UUID");
assert.equal(ppa.includes("92d37566"), false, "PPA function must not use the April Las Vegas UUID");
assert.ok(ppa.includes("PPA_LIVE.eventId"));
assert.ok(ppa.includes("isPadZero"));

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

console.log("ok quick-wins · 30a bust · 29a kept · Columbus follow · Gijón draw · Las Vegas labels · no invented APP clock");
