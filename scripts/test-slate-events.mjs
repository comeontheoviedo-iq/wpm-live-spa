#!/usr/bin/env node
/**
 * Seeded slate honesty: Gijón delayed + draw PDF, Barcelona ended/unparked,
 * Veolia Chicago Cup is the live PPA EVENT, MLP Asia is not APP.
 */
import assert from "node:assert/strict";
import {
  PPA_LIVE,
  PPA_LIVE_EVENT_ID,
  PPA_LAS_VEGAS,
  PPA_LAS_VEGAS_EVENT_ID,
  PPA_APRIL_LAS_VEGAS_PREFIX,
  APP_LIVE,
  APP_COLUMBUS,
  APP_NEXT,
  PPA_NEXT,
  ENDED_APP,
  ENDED_PPA,
  PARKED_PPA,
  FARNHAM,
  GIJON,
  BARCELONA,
  SLATE,
  MLP_ASIA_NOTE,
  FILTER_COPY,
  applyAppCalendarCut,
  columbusArmedRow,
  isEndedAppDenId,
  isPreparedNextDenId,
  isPreparedNextPpaId,
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

const CHI = "203e1164-b4f9-47e9-bacf-ff81f8748025";
const LV = "86926aef-0566-4fbb-87cf-a48068a9f1c6";
const BCN = "1655a7c9-904a-44c9-aa29-b279fca900e8";
const MESA = "62c01642-1bb2-4f9a-9998-599f8fdefe5c";

assert.equal(PPA_LIVE_EVENT_ID, CHI);
assert.equal(PPA_LIVE.eventId, CHI);
assert.equal(PPA_LIVE.name, "Veolia Chicago Cup");
assert.equal(PPA_LIVE.venue, "Life Time North Shore Sport & Racquetball, Chicago, IL");
assert.equal(PPA_LIVE.tz, "America/Chicago");
assert.equal(PPA_LIVE.start, "2026-10-05");
assert.equal(PPA_LIVE.end, "2026-10-11");
assert.equal(PPA_LIVE.firstServe, "8:00 AM CDT");
assert.equal(PPA_LAS_VEGAS_EVENT_ID, LV);
assert.equal(PPA_LAS_VEGAS.eventId, LV);
assert.equal(PPA_LAS_VEGAS.name, "PPA Rate Las Vegas Open");
assert.equal(PPA_LAS_VEGAS.end, "2026-10-04");
assert.equal(PPA_LAS_VEGAS.tz, "America/Los_Angeles");
assert.notEqual(PPA_LIVE_EVENT_ID, LV);
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
assert.equal(isBlockedPpaEventId(CHI), false);
assert.equal(isLivePpaEventId(CHI), true);
assert.equal(isLivePpaEventId(LV), false);
assert.equal(isLivePpaEventId(BCN), false);

assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Chicago Cup"), true);
assert.equal(ppaTickerTitleAligned("PPA Tour: Rate Las Vegas Open"), false);
assert.equal(ppaTickerTitleAligned("PPA Tour: Veolia Arizona Open"), false);
assert.equal(ppaTickerTitleAligned("Chicago"), false);
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

assert.equal(SLATE.some((s) => s.id === GIJON.id), true);
assert.equal(SLATE.some((s) => s.id === BARCELONA.id), true);
assert.ok(SLATE.length > 2);
const during = SLATE.map((s) => asCalendarRow(s, "2026-09-18"));
const quiet = during.filter((r) => r.id !== FARNHAM.id);
assert.ok(quiet.every((r) => r.onLive === false));
assert.ok(quiet.every((r) => r.status !== "live-path"));
const farnhamRow = during.find((r) => r.id === FARNHAM.id);
assert.equal(farnhamRow.tour, "rta");
assert.equal(farnhamRow.onLive, true);
assert.equal(farnhamRow.status, "live-path");
assert.equal(farnhamRow.timezone, "Europe/London");
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
assert.equal(mlp.name, "MLP Asia 2026");
assert.equal(mlp.tour, "mlp-asia");
assert.notEqual(mlp.tour, "app");
assert.match(mlp.note, /≠ APP/);
assert.match(mlp.note, /never chip MLP Asia as APP/);
assert.match(MLP_ASIA_NOTE, /never chip MLP Asia as APP/);
assert.equal(mlp.onLive, false);
assert.equal(mlp.board, "results_only");
const lou = watch.find((e) => /louisville/i.test(e.name));
assert.ok(lou);
assert.equal(lou.denId, "18454");
assert.equal(lou.tour, "app");
assert.equal(lou.onLive, false);
assert.equal(lou.nextPin, true);
assert.equal(lou.board, "results_only");
assert.equal(lou.scorePath, null);
assert.match(lou.note, /APP_LIVE = APP_NEXT/);
assert.equal(watch.some((e) => /chicago cup/i.test(e.name)), false);
const vb = watch.find((e) => /virginia beach/i.test(e.name));
assert.ok(vb);
assert.equal(vb.tour, "ppa");
assert.equal(vb.ppaEventId, "429c7980-e1b9-4800-805f-dfb160781cd9");
assert.notEqual(vb.ppaEventId, CHI);
assert.equal(vb.scorePath, null);
assert.equal(vb.onLive, false);
assert.equal(vb.nextPin, true);
assert.equal(vb.board, "results_only");
assert.match(vb.note, /PPA_LIVE = PPA_NEXT/);
assert.equal(PPA_NEXT.eventId, "429c7980-e1b9-4800-805f-dfb160781cd9");
assert.equal(PPA_NEXT.name, "Mojo Energy Pouches Virginia Beach Open");
assert.equal(PPA_NEXT.venue, "Pickleball Virginia Beach, Virginia Beach, VA");
assert.equal(PPA_NEXT.tz, "America/New_York");
assert.equal(PPA_NEXT.start, "2026-10-12");
assert.equal(PPA_NEXT.end, "2026-10-18");
assert.equal(PPA_NEXT.scorePath, "/api/ppa");
assert.equal(PPA_NEXT.live, false);
assert.equal(PPA_NEXT.ready, true);
assert.notEqual(PPA_LIVE.eventId, PPA_NEXT.eventId);
assert.equal(isPreparedNextPpaId(PPA_NEXT.eventId), true);
assert.equal(isPreparedNextPpaId(CHI), false);
const cqWatch = watch.find((e) => /chongqing/i.test(e.name));
assert.ok(cqWatch);
assert.equal(cqWatch.tour, "app-asia");
assert.equal(cqWatch.sportsSyncTournamentId, null);
assert.equal(cqWatch.denId, null);
assert.equal(cqWatch.onLive, false);
assert.equal(isAppAsiaName("APP Arizona Open"), false);
assert.equal(isAppAsiaName("MLP Asia 2026"), false);

import { WIRED } from "../netlify/functions/radar-lib.mjs";
assert.equal(WIRED.ppa.eventId, CHI);
assert.equal(WIRED.ppa.name, PPA_LIVE.name);
assert.equal(WIRED.ppa.venue, PPA_LIVE.venue);
assert.equal(WIRED.ppa.tz, "America/Chicago");
assert.equal(WIRED.ppa.scorePath, "/api/ppa");
assert.notEqual(WIRED.ppa.eventId, BCN);
assert.equal(String(WIRED.ppa.eventId).startsWith(PPA_APRIL_LAS_VEGAS_PREFIX), false);

assert.equal(APP_COLUMBUS.eventId, "18448");
assert.equal(APP_LIVE, APP_COLUMBUS);
assert.equal(APP_NEXT.eventId, "18454");
assert.equal(APP_NEXT.name, "Humana APP Louisville Open");
assert.equal(APP_NEXT.venue, "Kentucky International Convention Center, Louisville, KY");
assert.equal(APP_NEXT.tz, "America/New_York");
assert.equal(APP_NEXT.start, "2026-10-15");
assert.equal(APP_NEXT.end, "2026-10-18");
assert.equal(APP_NEXT.scorePath, "/api/app");
assert.equal(APP_NEXT.live, false);
assert.equal(APP_NEXT.ready, true);
assert.notEqual(APP_LIVE.eventId, APP_NEXT.eventId);
assert.equal(isPreparedNextDenId("18454"), true);
assert.equal(isPreparedNextDenId("18448"), false);
assert.equal(isPreparedNextDenId("18453"), false);
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

console.log("ok slate-events · Gijón delayed · Barcelona ended · Chicago Cup live · Las Vegas archived · Columbus 18448 · MLP ≠ APP");
