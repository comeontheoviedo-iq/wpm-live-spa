#!/usr/bin/env node
/**
 * Seeded slate honesty: Gijón delayed + draw PDF, Barcelona UUID parked,
 * Arizona remains the live PPA EVENT, MLP Asia is not APP.
 */
import assert from "node:assert/strict";
import {
  PPA_LIVE_EVENT_ID,
  PARKED_PPA,
  GIJON,
  BARCELONA,
  SLATE,
  MLP_ASIA_NOTE,
  isParkedPpaEventId,
  isLivePpaEventId,
  isAppAsiaName,
  matchesSlateName,
  asCalendarRow,
  staticWatchEvents,
} from "../netlify/functions/slate-events.mjs";

assert.notEqual(PPA_LIVE_EVENT_ID, PARKED_PPA.barcelona.ppaEventId, "live PPA id must not be Barcelona");
assert.equal(PPA_LIVE_EVENT_ID, "62c01642-1bb2-4f9a-9998-599f8fdefe5c");
assert.equal(PARKED_PPA.barcelona.ppaEventId, "1655a7c9-904a-44c9-aa29-b279fca900e8");
assert.equal(isParkedPpaEventId(PARKED_PPA.barcelona.ppaEventId), true);
assert.equal(isParkedPpaEventId(PPA_LIVE_EVENT_ID), false);
assert.equal(isLivePpaEventId(PPA_LIVE_EVENT_ID), true);

assert.equal(GIJON.onLive, false);
assert.equal(GIJON.status, "delayed");
assert.equal(GIJON.tour, "tpb");
assert.match(GIJON.drawUrl, /GIJON-GRUPOS\.pdf/);
assert.equal(GIJON.connector.type, "none");
assert.doesNotMatch(GIJON.tour, /^app$/);

assert.equal(BARCELONA.onLive, false);
assert.equal(BARCELONA.status, "results-only");
assert.equal(BARCELONA.tour, "ppa-eu");
assert.equal(BARCELONA.connector.type, "none");
assert.equal(BARCELONA.connector.ppaEventId, PARKED_PPA.barcelona.ppaEventId);

assert.equal(SLATE.length, 2);
const today = "2026-09-18";
const rows = SLATE.map((s) => asCalendarRow(s, today));
assert.ok(rows.every((r) => r.onLive === false));
assert.ok(rows.every((r) => r.status !== "live-path"));
assert.ok(rows.find((r) => r.drawUrl.includes("GIJON")));

assert.equal(isAppAsiaName("APP Asia Chongqing Open"), true);
assert.equal(isAppAsiaName("APP Dillons Overland Park Open"), false);
assert.equal(isAppAsiaName("MLP Asia Invitational"), false);

assert.equal(matchesSlateName("TPB Gijon 2026", GIJON.name), true);
assert.equal(matchesSlateName("PPA Barcelona Open", BARCELONA.name), true);

const watch = staticWatchEvents();
assert.ok(watch.some((e) => e.tour === "tpb" && e.board === "results_only" && e.drawUrl));
assert.ok(watch.some((e) => e.tour === "ppa-eu" && e.parked && e.ppaEventId === PARKED_PPA.barcelona.ppaEventId));
const mlp = watch.find((e) => e.tour === "mlp-asia");
assert.ok(mlp);
assert.match(mlp.note, /≠ APP/);
assert.match(MLP_ASIA_NOTE, /never chip MLP Asia as APP/);

import { WIRED } from "../netlify/functions/radar-lib.mjs";
assert.equal(WIRED.ppa.eventId, PPA_LIVE_EVENT_ID);
assert.notEqual(WIRED.ppa.scorePath, null);
assert.notEqual(WIRED.ppa.eventId, PARKED_PPA.barcelona.ppaEventId);

console.log("ok slate-events · Gijón delayed + Barcelona parked · Arizona live · MLP ≠ APP");
