#!/usr/bin/env node
/**
 * Reader board copy: ended / results-only / parked cards.
 * Desk notes stay in source and radar. The public note is a short status.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import {
  APP_LIVE,
  BARCELONA,
  ENDED_PPA,
  FILTER_COPY,
  GIJON,
  READER_FILTER_COPY,
  READER_LINES,
  asCalendarRow,
  columbusArmedRow,
  appBoardPhase,
  isDenLiveStatus,
  isDenPendingBracket,
  isReaderStatusLine,
  matchCountsAsLive,
  readerStatusLine,
  textHasDeskJargon,
  toReaderEvent,
} from "../netlify/functions/slate-events.mjs";

const COLUMBUS_NOTE =
  "Den registration external-tournament/8057937 exists; Den Live tournamentId not published yet (no denlive link on APP page)";
const EUROPE_BEFORE =
  "PPA Tour Europe. Barcelona window ended 27 Sep 2026 with no scores. Not the live board — Rate Las Vegas Open is /api/ppa.";

assert.equal(FILTER_COPY["ppa-eu"], EUROPE_BEFORE);
assert.equal(textHasDeskJargon(EUROPE_BEFORE), true);
assert.equal(textHasDeskJargon(COLUMBUS_NOTE), true);
assert.equal(textHasDeskJargon(BARCELONA.note), true);
assert.equal(textHasDeskJargon(READER_LINES.ended), false);
assert.equal(textHasDeskJargon(READER_LINES.results), false);

const europe = toReaderEvent(asCalendarRow(BARCELONA, "2026-09-29"));
assert.equal(europe.status, "ended");
assert.equal(europe.onLive, false);
assert.equal(europe.note, "Event ended");
assert.equal(europe.statusNote, "Event ended");
assert.equal(READER_FILTER_COPY["ppa-eu"], "Event ended");
for (const key of ["note", "statusNote", "blurb", "detail", "description"]) {
  assert.equal(textHasDeskJargon(europe[key]), false, key);
}
assert.doesNotMatch(europe.note, /api\/ppa|1655a7c9|radar|intake|blocker/);
assert.equal(europe.upcoming, false);

const columbus = toReaderEvent({
  id: "gpa:app%20columbus%20open:2026-10-01",
  name: "APP Columbus Open",
  start: "2026-10-01",
  end: "2026-10-04",
  tour: "app",
  host: "APP",
  status: "results-only",
  onLive: false,
  note: COLUMBUS_NOTE,
  statusNote: COLUMBUS_NOTE,
  blurb: COLUMBUS_NOTE,
  detail: COLUMBUS_NOTE,
  description: COLUMBUS_NOTE,
  blocker: "intake",
  reason: "radar uuid",
  drawUrl: "",
});
assert.equal(columbus.note, "Results will appear when available");
assert.equal(columbus.statusNote, "Results will appear when available");
assert.equal(columbus.blurb, "Results will appear when available");
assert.equal(columbus.detail, "Results will appear when available");
assert.equal(columbus.description, "Results will appear when available");
assert.equal(columbus.blocker, undefined);
assert.equal(columbus.reason, undefined);
assert.equal(JSON.stringify(columbus).includes("8057937"), false);
assert.equal(JSON.stringify(columbus).includes("external-tournament"), false);
assert.equal(JSON.stringify(columbus).includes("tournamentId"), false);

const delayed = toReaderEvent(asCalendarRow(GIJON, "2026-09-18"));
assert.equal(delayed.note, "Scores delayed");
assert.equal(delayed.status, "delayed");
assert.equal(delayed.onLive, false);
assert.match(delayed.drawUrl, /GIJON-GRUPOS\.pdf/);
assert.equal(READER_FILTER_COPY.tpb, "Scores delayed");

const draw = toReaderEvent({
  status: "results-only",
  onLive: false,
  drawUrl: "",
  note: "Official draw not published yet — desk only",
});
assert.equal(draw.note, "Draw not published yet");
assert.equal(isReaderStatusLine(draw.note), true);

const live = toReaderEvent({
  status: "live-path",
  onLive: true,
  note: "Known Den id 18453 — arm via desk; /api/app reads calendar-armed",
});
assert.equal(live.note, "");
assert.equal(live.onLive, true);
assert.equal(readerStatusLine({ status: "ended", ended: true }), "Event ended");

const endedPublic = {
  ...ENDED_PPA.barcelona,
  note: readerStatusLine({ status: "ended", ended: true }),
};
assert.equal(endedPublic.note, "Event ended");
assert.equal(textHasDeskJargon(endedPublic.note), false);
assert.equal(ENDED_PPA.barcelona.ppaEventId, "1655a7c9-904a-44c9-aa29-b279fca900e8");
assert.match(ENDED_PPA.barcelona.note, /\/api\/ppa/);
assert.match(ENDED_PPA.barcelona.note, /86926aef/, "desk seed keeps the live UUID");

const cal = fs.readFileSync("netlify/functions/calendar.mts", "utf8");
assert.ok(cal.includes("applyAppCalendarCut"));
assert.ok(cal.includes("18448"));
assert.equal(cal.includes("not published yet"), false);
assert.ok(cal.includes("Chongqing"));
assert.ok(cal.includes("CHONGQING_DESK_NOTE"));
assert.ok(cal.includes("Calendar/results-only only") || fs.readFileSync("netlify/functions/sportssync-map.mjs", "utf8").includes("Calendar/results-only only"));
assert.ok(cal.includes(".map(toReaderEvent)"));
assert.ok(cal.includes("readerStatusLine({ status: \"ended\", ended: true })"));

const liveColumbus = toReaderEvent(columbusArmedRow());
assert.equal(liveColumbus.id, APP_LIVE.calendarId);
assert.equal(liveColumbus.onLive, true);
assert.equal(liveColumbus.status, "live-path");
assert.equal(liveColumbus.note, "");
assert.equal(liveColumbus.connector.denTournamentId, "18448");
assert.equal(JSON.stringify(liveColumbus).includes("8057937"), false);

const chongqing = toReaderEvent({
  name: "APP Asia Chongqing Open",
  tour: "app-asia",
  status: "results-only",
  onLive: false,
  connector: null,
  note: "APP Asia Tour (not MLP Asia). Den Live tournamentId not found — calendar/results-only only. Do not fake LIVE.",
});
assert.equal(chongqing.note, "Results will appear when available");
assert.equal(chongqing.onLive, false);
assert.equal(JSON.stringify(chongqing).includes("18448"), false);

const js = fs.readFileSync("js/wpm-20261002c.js", "utf8");
const siteJs = fs.readFileSync("site/js/wpm-20261002c.js", "utf8");
assert.equal(siteJs, js);
assert.equal(js.includes("Barcelona window ended"), false);
assert.equal(js.includes("Rate Las Vegas Open is /api/ppa"), false);
assert.equal(js.includes("8057937"), false);
assert.ok(js.includes("external-tournament|"), "client drops external-tournament prose before render");
assert.equal(js.includes("const hint=e.note"), false);
assert.ok(js.includes('copy:"Event ended"'));
assert.ok(js.includes('copy:"Scores delayed"'));
assert.ok(js.includes('copy:"Results will appear when available"'));
assert.ok(js.includes("Draw not published yet"));
assert.ok(js.includes("function readerStatusLine"));
assert.ok(js.includes("Official draw"));
assert.ok(js.includes('href="/calendar">Calendar</a>'));
assert.ok(js.includes("function tourFollowButton"));
assert.equal(js.includes('data-follow="${esc(fk)}"'), false);
assert.ok(js.includes("Coming soon"));
const emptyFn = js.slice(js.indexOf("function slateEmpty"), js.indexOf("function drawHref"));
assert.equal(emptyFn.split("meta.copy").length - 1, 1, "status sentence is printed once");
assert.equal(emptyFn.includes("<p class=\"empty\">${meta.copy}"), false);

assert.equal(isDenLiveStatus("RUNNING"), true);
assert.equal(isDenLiveStatus("IN_PROGRESS"), true);
assert.equal(isDenLiveStatus("STARTED"), true);
assert.equal(isDenLiveStatus("PLAYING"), true);
assert.equal(isDenLiveStatus("Pending"), false);
assert.equal(isDenLiveStatus("PENDING"), false);
assert.equal(isDenLiveStatus("SCHEDULED"), false);
assert.equal(isDenPendingBracket("Pending"), true);
assert.equal(isDenPendingBracket("Running"), false);
assert.equal(matchCountsAsLive({ status: "LIVE", denStatus: "PENDING" }), false);
assert.equal(matchCountsAsLive({ status: "LIVE", denStatus: "RUNNING" }), true);
assert.equal(matchCountsAsLive({ status: "LIVE", denStatus: "IN_PROGRESS" }), true);
assert.equal(matchCountsAsLive({ status: "FT", denStatus: "RUNNING" }), false);

const columbusQuiet = appBoardPhase({
  liveCount: 0,
  matches: [],
  brackets: [{ status: "Pending" }, { status: "Pending" }],
  startDate: "2026-10-01",
  endDate: "2026-10-04",
  today: "2026-09-30",
});
assert.equal(columbusQuiet.preServe, true);
assert.equal(columbusQuiet.live, false);
assert.equal(columbusQuiet.reader, "Play starts soon");
assert.equal(textHasDeskJargon(columbusQuiet.reader), false);

const nextOnly = appBoardPhase({
  liveCount: 0,
  matches: [{ status: "NEXT", denStatus: "SCHEDULED" }],
  brackets: [{ status: "Pending" }],
  startDate: "2026-10-01",
  endDate: "2026-10-04",
  today: "2026-10-01",
});
assert.equal(nextOnly.preServe, true);
assert.equal(nextOnly.reader, "Play starts soon");
assert.equal(nextOnly.live, false);

const running = appBoardPhase({
  liveCount: 1,
  matches: [{ status: "LIVE", denStatus: "RUNNING" }],
  brackets: [{ status: "Running" }],
  startDate: "2026-10-01",
  endDate: "2026-10-04",
  today: "2026-10-01",
});
assert.equal(running.live, true);
assert.equal(running.preServe, false);
assert.equal(running.reader, "");

const leaked = appBoardPhase({
  liveCount: 1,
  matches: [{ status: "LIVE", denStatus: "PENDING" }],
  brackets: [{ status: "Pending" }],
  startDate: "2026-10-01",
  endDate: "2026-10-04",
  today: "2026-09-30",
});
assert.equal(leaked.live, false);
assert.equal(leaked.preServe, true);
assert.equal(leaked.reader, "Play starts soon");

const delayedFeed = appBoardPhase({
  delayed: true,
  matches: [],
  startDate: "2026-10-01",
  today: "2026-09-30",
});
assert.equal(delayedFeed.preServe, false);
assert.equal(delayedFeed.reader, "Scores delayed");

assert.equal(liveColumbus.onLive, true);
assert.equal(liveColumbus.status, "live-path");
assert.ok(js.includes("Play starts soon"));
assert.ok(js.includes("function preServeBoard"));
assert.ok(js.includes("function isDenLiveStatus"));
assert.ok(js.includes("Pending brackets stay NEXT"));
assert.equal(js.includes("Den has no bracket sides"), false);
assert.ok(js.includes("Coming soon"));
assert.equal(js.includes("92d37566"), false);
const preFn = js.slice(js.indexOf("function preServeCard"), js.indexOf("function heroLine"));
assert.equal(preFn.includes("LIVE"), false, "pre-serve card must not paint a LIVE chip");
assert.equal(preFn.includes("Play starts soon"), false, "status sentence is the line argument");
assert.equal(preFn.split("${line}").length - 1, 1, "status sentence is printed once");
assert.ok(js.includes('return "Play starts soon"'));

console.log("ok reader-cards · Event ended · Play starts soon · Results will appear when available · no desk prose");
