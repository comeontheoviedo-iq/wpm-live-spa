#!/usr/bin/env node
/**
 * Seeded slate honesty: Gijón delayed + draw PDF, Barcelona ended/unparked,
 * Rate Las Vegas Open is the live PPA EVENT, MLP Asia is not APP.
 */
import assert from "node:assert/strict";
import {
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  PPA_APRIL_LAS_VEGAS_PREFIX,
  APP_LIVE,
  ENDED_APP,
  ENDED_PPA,
  PARKED_PPA,
  GIJON,
  BARCELONA,
  SLATE,
  MLP_ASIA_NOTE,
  FILTER_COPY,
  applyAppCalendarCut,
  columbusArmedRow,
  isEndedAppDenId,
  isParkedPpaEventId,
  isEndedPpaEventId,
  isBlockedPpaEventId,
  isLivePpaEventId,
  ppaTickerTitleAligned,
  isAppAsiaName,
  matchesSlateName,
  asCalendarRow,
  staticWatchEvents,
} from "../netlify/functions/slate-events.mjs";

const LV = "86926aef-0566-4fbb-87cf-a48068a9f1c6";
const BCN = "1655a7c9-904a-44c9-aa29-b279fca900e8";
const MESA = "62c01642-1bb2-4f9a-9998-599f8fdefe5c";

assert.equal(PPA_LIVE_EVENT_ID, LV);
assert.equal(PPA_LIVE.eventId, LV);
assert.equal(PPA_LIVE.name, "PPA Rate Las Vegas Open");
assert.equal(PPA_LIVE.venue, "Darling Tennis Center, Las Vegas");
assert.equal(PPA_LIVE.tz, "America/Los_Angeles");
assert.equal(PPA_LIVE.start, "2026-09-28");
assert.equal(PPA_LIVE.firstServe, "8:00 AM PDT");
assert.equal(PPA_LIVE_EVENT_ID.startsWith(PPA_APRIL_LAS_VEGAS_PREFIX), false);
assert.notEqual(PPA_LIVE_EVENT_ID, BCN);
assert.notEqual(PPA_LIVE_EVENT_ID, MESA);

assert.equal(ENDED_PPA.barcelona.ppaEventId, BCN);
assert.equal(ENDED_PPA.barcelona.ended, true);
assert.equal(ENDED_PPA.barcelona.parked, false);
assert.equal(ENDED_PPA.barcelona.end, "2026-09-27");
assert.deepEqual(PARKED_PPA, {});
assert.equal(isParkedPpaEventId(BCN), false);
assert.equal(isEndedPpaEventId(BCN), true);
assert.equal(isBlockedPpaEventId(BCN), true);
assert.equal(isBlockedPpaEventId(PPA_APRIL_LAS_VEGAS_PREFIX + "-0000-0000-0000-000000000000"), true);
assert.equal(isBlockedPpaEventId(LV), false);
assert.equal(isLivePpaEventId(LV), true);
assert.equal(isLivePpaEventId(BCN), false);

assert.equal(ppaTickerTitleAligned("PPA Tour: Rate Las Vegas Open"), true);
assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Arizona Open"), false);
assert.equal(ppaTickerTitleAligned("Las Vegas Open"), false);
assert.equal(ppaTickerTitleAligned(""), true);

assert.equal(GIJON.onLive, false);
assert.equal(GIJON.status, "delayed");
assert.equal(GIJON.tour, "tpb");
assert.match(GIJON.drawUrl, /GIJON-GRUPOS\.pdf/);
assert.equal(GIJON.connector.type, "none");
assert.doesNotMatch(GIJON.tour, /^app$/);

assert.equal(BARCELONA.onLive, false);
assert.equal(BARCELONA.status, "ended");
assert.equal(BARCELONA.tour, "ppa-eu");
assert.equal(BARCELONA.connector.type, "none");
assert.equal(BARCELONA.connector.ppaEventId, BCN);
assert.match(FILTER_COPY["ppa-eu"], /ended 27 Sep 2026/);
assert.doesNotMatch(FILTER_COPY["ppa-eu"], /Arizona remains/);

assert.equal(SLATE.length, 2);
const during = SLATE.map((s) => asCalendarRow(s, "2026-09-18"));
assert.ok(during.every((r) => r.onLive === false));
assert.ok(during.every((r) => r.status !== "live-path"));
assert.ok(during.find((r) => r.drawUrl.includes("GIJON")));
const after = asCalendarRow(BARCELONA, "2026-09-28");
assert.equal(after.status, "ended");
assert.equal(after.onLive, false);
assert.equal(after.upcoming, false);

assert.equal(isAppAsiaName("APP Asia Chongqing Open"), true);
assert.equal(isAppAsiaName("APP Dillons Overland Park Open"), false);
assert.equal(isAppAsiaName("MLP Asia Invitational"), false);

assert.equal(matchesSlateName("TPB Gijon 2026", GIJON.name), true);
assert.equal(matchesSlateName("PPA Barcelona Open", BARCELONA.name), true);

const watch = staticWatchEvents();
assert.ok(watch.some((e) => e.tour === "tpb" && e.board === "results_only" && e.drawUrl));
const bcnWatch = watch.find((e) => e.tour === "ppa-eu");
assert.ok(bcnWatch);
assert.equal(bcnWatch.parked, false);
assert.equal(bcnWatch.ended, true);
assert.equal(bcnWatch.ppaEventId, BCN);
assert.equal(bcnWatch.scorePath, null);
const mlp = watch.find((e) => e.tour === "mlp-asia");
assert.ok(mlp);
assert.match(mlp.note, /≠ APP/);
assert.match(MLP_ASIA_NOTE, /never chip MLP Asia as APP/);

import { WIRED } from "../netlify/functions/radar-lib.mjs";
assert.equal(WIRED.ppa.eventId, LV);
assert.equal(WIRED.ppa.name, PPA_LIVE.name);
assert.equal(WIRED.ppa.venue, PPA_LIVE.venue);
assert.equal(WIRED.ppa.tz, "America/Los_Angeles");
assert.equal(WIRED.ppa.scorePath, "/api/ppa");
assert.notEqual(WIRED.ppa.eventId, BCN);
assert.equal(String(WIRED.ppa.eventId).startsWith(PPA_APRIL_LAS_VEGAS_PREFIX), false);

assert.equal(APP_LIVE.eventId, "18448");
assert.equal(APP_LIVE.name, "APP Columbus Open presented by The James");
assert.equal(APP_LIVE.shortName, "APP Columbus Open");
assert.equal(APP_LIVE.venue, "Pickle & Chill, Columbus, OH");
assert.equal(APP_LIVE.tz, "America/New_York");
assert.equal(APP_LIVE.scorePath, "/api/app");
assert.equal(APP_LIVE.start, "2026-10-01");
assert.equal(APP_LIVE.end, "2026-10-04");
assert.equal(APP_LIVE.calendarId, "gpa:app%20columbus%20open:2026-10-01");
assert.equal(ENDED_APP.overland.denTournamentId, "18453");
assert.equal(ENDED_APP.overland.ended, true);
assert.equal(isEndedAppDenId("18453"), true);
assert.equal(isEndedAppDenId("18448"), false);
assert.equal(WIRED.app.eventId, "18448");
assert.equal(WIRED.app.name, APP_LIVE.name);
assert.equal(WIRED.app.venue, APP_LIVE.venue);
assert.equal(WIRED.app.tz, "America/New_York");
assert.equal(WIRED.app.scorePath, "/api/app");
assert.notEqual(WIRED.app.eventId, "18453");

const seeded = columbusArmedRow();
assert.equal(seeded.id, APP_LIVE.calendarId);
assert.equal(seeded.status, "live-path");
assert.equal(seeded.onLive, true);
assert.equal(seeded.connector.type, "app");
assert.equal(seeded.connector.denTournamentId, "18448");
assert.equal(seeded.connector.scorePath, "/api/app");
const cut = applyAppCalendarCut([
  {
    id: "gpa:app%20overland%20park%20open:2026-09-17",
    name: "APP Overland Park Open",
    onLive: true,
    status: "live-path",
    connector: { type: "app", denTournamentId: "18453", scorePath: "/api/app" },
  },
  {
    id: "gpa:app%20asia%20chongqing%20open:2026-10-02",
    name: "APP Asia Chongqing Open",
    onLive: false,
    status: "results-only",
    connector: { type: "none" },
  },
]);
assert.equal(cut.some((e) => /overland/i.test(e.name)), false);
assert.equal(cut.some((e) => String(e.connector?.denTournamentId) === "18453"), false);
const col = cut.find((e) => e.id === APP_LIVE.calendarId);
assert.ok(col);
assert.equal(col.onLive, true);
assert.equal(col.status, "live-path");
assert.equal(col.venue, "Pickle & Chill, Columbus, OH");
assert.equal(col.timezone, "America/New_York");
const cq = cut.find((e) => /chongqing/i.test(e.name));
assert.ok(cq);
assert.equal(cq.onLive, false);
assert.equal(cq.status, "results-only");
assert.notEqual(cq.connector?.denTournamentId, "18448");
assert.equal(isAppAsiaName("APP Asia Chongqing Open"), true);
assert.equal(isAppAsiaName("APP Columbus Open"), false);

console.log("ok slate-events · Gijón delayed · Barcelona ended · Las Vegas live · Columbus 18448 · MLP ≠ APP");
