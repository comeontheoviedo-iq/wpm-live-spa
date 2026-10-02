#!/usr/bin/env node
/**
 * SportsSync results connector. KL 89 / Penang 222 are dry-run fixtures.
 * Chongqing has no SportsSync id. Nothing in this file may mark LIVE.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { toReaderEvent } from "../netlify/functions/slate-events.mjs";
import {
  APP_ASIA_ORGANIZER_ID,
  CHONGQING,
  CHONGQING_DESK_NOTE,
  SPORTSSYNC_LIVE_SAFE,
  applySportsSyncArm,
  countLive,
  extractSportsSyncTournamentIds,
  listedSportsSyncEvent,
  mapScheduleHtml,
  mapScoresPayload,
  mapSportsSyncStatus,
  isChongqingBlockedSportsSyncId,
  summarizeOrganizerListing,
} from "../netlify/functions/sportssync-map.mjs";

assert.equal(SPORTSSYNC_LIVE_SAFE, false);
assert.equal(CHONGQING.sportsSyncTournamentId, null);
assert.equal(CHONGQING.denTournamentId, null);
assert.equal(CHONGQING.onLive, false);
assert.equal(APP_ASIA_ORGANIZER_ID, "1645900");
assert.match(CHONGQING_DESK_NOTE, /Calendar\/results-only only/);
assert.match(CHONGQING_DESK_NOTE, /Do not invent a SportsSync id/);
assert.equal(listedSportsSyncEvent("89").name.includes("Kuala Lumpur"), true);
assert.equal(listedSportsSyncEvent("222").name.includes("Penang"), true);
assert.equal(listedSportsSyncEvent("3001"), null);

for (const raw of ["LIVE", "In Progress", "in_progress", "PLAYING", "RUNNING", "STARTED", "live", ""]) {
  const mapped = mapSportsSyncStatus(raw, { hasScore: true, scoreLooksFinal: true, allowLive: true });
  assert.notEqual(mapped.status, "LIVE", raw);
}
assert.equal(mapSportsSyncStatus("Completed").status, "FT");
assert.equal(mapSportsSyncStatus("scheduled").status, "NEXT");
assert.equal(mapSportsSyncStatus("in_progress", { hasScore: true }).liveSuppressed, true);
assert.equal(mapSportsSyncStatus("in_progress", { hasScore: true }).status, "NEXT");

const html = fs.readFileSync("scripts/fixtures/sportssync-schedule-snippet.html", "utf8");
const parsed = mapScheduleHtml(html, {
  tournamentId: "89",
  name: "Leapmotor APP Kuala Lumpur Open 2026 (APP Malaysia)",
  venue: "Kuala Lumpur, Malaysia",
  tz: "Asia/Kuala_Lumpur",
});
assert.equal(parsed.partial, true);
assert.equal(countLive(parsed.matches), 0);
assert.equal(parsed.matches.some((m) => m.status === "LIVE"), false);
assert.equal(parsed.matches.some((m) => /tbd/i.test(m.a) || /tbd/i.test(m.b)), false);

const ft = parsed.matches.find((m) => m.id === "ss-89-53036");
assert.ok(ft);
assert.equal(ft.status, "FT");
assert.equal(ft.tour, "app-asia");
assert.equal(ft.a, "Sarsarith Yi");
assert.equal(ft.b, "Elton Pang");
assert.equal(ft.score, "1-0");
assert.equal(ft.games, "G1 11–8");
assert.equal(ft.lines[0].live, false);
assert.equal(ft.lines[0].winner, "Sarsarith Yi");
assert.equal(ft.date, "2026-02-09");
assert.equal(ft.start, "2026-02-09T00:00:00.000Z");
assert.equal(ft.disc, "MS");
assert.equal(ft.format, "pool");
assert.equal(ft.court, "Court 9");
assert.equal(ft.watch, "");
assert.equal(ft.end, "");

const scheduled = parsed.matches.find((m) => m.id === "ss-89-53100");
assert.ok(scheduled);
assert.equal(scheduled.status, "NEXT");
assert.equal(scheduled.score, "");
assert.equal(scheduled.lines.length, 0);
assert.equal(scheduled.disc, "WD");

const progress = parsed.matches.find((m) => m.id === "ss-89-53101");
assert.ok(progress);
assert.equal(progress.status, "NEXT");
assert.equal(progress.liveSuppressed, true);
assert.equal(progress.lines[0].live, false);
assert.equal(progress.lines[0].score, "5–3");
assert.equal(progress.disc, "XD");

const blank = parsed.matches.find((m) => m.id === "ss-89-53102");
assert.ok(blank);
assert.equal(blank.status, "FT");
assert.equal(blank.score, "");
assert.equal(blank.lines.length, 0);
assert.match(blank.note, /no game scores/);
assert.equal(JSON.stringify(blank).includes("0–0"), false);
assert.equal(JSON.stringify(blank).includes("0-0"), false);

const scores = mapScoresPayload(
  [
    {
      match_id: 7,
      status: "completed",
      score: "11-9, 11-7",
      player1: "Ann Lee",
      player2: "Bo Tan",
      category: "Men's Doubles",
      round: "Final",
      court: "Court 1",
    },
    { id: 8, status: "in_progress", score: "5-3", team1: "Cee", team2: "Dee", category: "Men's Singles" },
    { id: 9, status: "scheduled", player1: "Eve", player2: "Fay", category: "Women's Singles" },
    { id: 10, status: "LIVE", score: "11-4", player1: "Gil", player2: "Han", category: "Men's Singles" },
    { id: 11, status: "completed", score: "0-0", player1: "Ivy", player2: "Jan" },
  ],
  { tournamentId: "222", name: "Penang", tz: "Asia/Kuala_Lumpur", year: "2026" }
);
assert.equal(countLive(scores), 0);
assert.equal(scores.find((m) => m.id === "ss-222-7").status, "FT");
assert.equal(scores.find((m) => m.id === "ss-222-7").score, "2-0");
assert.equal(scores.find((m) => m.id === "ss-222-7").games, "G1 11–9 · G2 11–7");
assert.equal(scores.find((m) => m.id === "ss-222-8").status, "NEXT");
assert.equal(scores.find((m) => m.id === "ss-222-8").liveSuppressed, true);
assert.equal(scores.find((m) => m.id === "ss-222-9").status, "NEXT");
assert.equal(scores.find((m) => m.id === "ss-222-10").status, "NEXT");
assert.equal(scores.find((m) => m.id === "ss-222-10").liveSuppressed, true);
assert.equal(scores.find((m) => m.id === "ss-222-11").lines.length, 0);
assert.equal(scores.find((m) => m.id === "ss-222-11").score, "");
assert.equal(mapScoresPayload([], { tournamentId: "89" }).length, 0);
assert.equal(mapScoresPayload({ scores: [] }, { tournamentId: "89" }).length, 0);

const listedHtml = '<a href="/tournament/222">Penang</a><a href="/tournament/89">KL</a><a href="/tournament/89/schedule">sched</a>';
const listed = summarizeOrganizerListing(extractSportsSyncTournamentIds(listedHtml));
assert.deepEqual(listed.found, ["89", "222"]);
assert.deepEqual(listed.novel, []);
assert.equal(listed.chongqingSportsSyncId, null);
assert.equal(listed.liveSafe, false);

const novel = summarizeOrganizerListing(extractSportsSyncTournamentIds(listedHtml + '<a href="/tournament/3001">'));
assert.deepEqual(novel.novel, ["3001"]);
assert.equal(novel.chongqingSportsSyncId, null);

const cqDry = applySportsSyncArm({
  name: "APP Asia Chongqing Open",
  onLive: true,
  status: "live-path",
  connector: { type: "sportssync", sportsSyncTournamentId: "89", scorePath: "/api/sportssync" },
});
assert.equal(cqDry.onLive, false);
assert.equal(cqDry.status, "results-only");
assert.equal(cqDry.connector.type, "none");
assert.equal(cqDry.tour, "app-asia");

const cqPenang = applySportsSyncArm({
  name: "APP Asia Chongqing Open",
  onLive: true,
  status: "live-path",
  connector: { type: "sportssync", sportsSyncTournamentId: "222" },
});
assert.equal(cqPenang.connector.type, "none");
assert.equal(cqPenang.onLive, false);

for (const blocked of ["390", "391"]) {
  assert.equal(isChongqingBlockedSportsSyncId(blocked), true);
  const armed = applySportsSyncArm({
    name: "APP Asia Chongqing Open",
    onLive: true,
    status: "live-path",
    connector: { type: "sportssync", sportsSyncTournamentId: blocked },
  });
  assert.equal(armed.connector.type, "none", blocked);
  assert.equal(armed.onLive, false);
}
assert.equal(isChongqingBlockedSportsSyncId("3001"), false);

const cqReal = applySportsSyncArm({
  name: "APP Asia Chongqing Open",
  onLive: true,
  status: "live-path",
  connector: { type: "sportssync", sportsSyncTournamentId: "3001" },
});
assert.equal(cqReal.onLive, false);
assert.equal(cqReal.status, "results-only");
assert.equal(cqReal.connector.type, "sportssync");
assert.equal(cqReal.connector.sportsSyncTournamentId, "3001");
assert.equal(cqReal.connector.scorePath, "/api/sportssync");

const cqDen = applySportsSyncArm({
  name: "APP Asia Chongqing Open",
  onLive: true,
  status: "live-path",
  connector: { type: "app", denTournamentId: "18448", scorePath: "/api/app" },
});
assert.equal(cqDen.onLive, false);
assert.equal(cqDen.status, "results-only");
assert.equal(cqDen.connector.type, "none");
assert.equal(cqDen.connector.denTournamentId, undefined);

const kl = applySportsSyncArm({
  name: "Leapmotor APP Kuala Lumpur Open 2026",
  onLive: true,
  status: "live-path",
  tour: "app-asia",
  connector: { type: "sportssync", sportsSyncTournamentId: "89" },
});
assert.equal(kl.connector.sportsSyncTournamentId, "89");
assert.equal(kl.onLive, false);
assert.equal(kl.status, "results-only");

const columbus = applySportsSyncArm({
  name: "APP Columbus Open",
  onLive: true,
  status: "live-path",
  tour: "app",
  connector: { type: "app", denTournamentId: "18448", scorePath: "/api/app" },
});
assert.equal(columbus.onLive, true);
assert.equal(columbus.connector.denTournamentId, "18448");
assert.equal(columbus.connector.type, "app");

const publicCq = toReaderEvent({
  name: CHONGQING.name,
  tour: "app-asia",
  status: "results-only",
  onLive: false,
  connector: null,
  note: CHONGQING_DESK_NOTE,
});
assert.equal(publicCq.note, "Results will appear when available");
assert.equal(publicCq.onLive, false);
assert.equal(JSON.stringify(publicCq).includes("1645900"), false);
assert.equal(JSON.stringify(publicCq).includes("89"), false);

const fn = fs.readFileSync("netlify/functions/sportssync.mts", "utf8");
const cal = fs.readFileSync("netlify/functions/calendar.mts", "utf8");
const toml = fs.readFileSync("netlify.toml", "utf8");
assert.ok(fn.includes("No SportsSync tournamentId armed"));
assert.equal(fn.includes("allowLive"), false);
assert.doesNotMatch(fn, /sportsSyncTournamentId:\s*"\d+"/);
assert.doesNotMatch(fn, /FALLBACK/);
assert.ok(cal.includes("CHONGQING_DESK_NOTE"));
assert.ok(cal.includes("applySportsSyncArm"));
assert.ok(cal.includes("chongqingSportsSyncId: null"));
assert.ok(cal.includes('type: "sportssync"'));
assert.ok(toml.includes("/api/sportssync"));
assert.equal(toml.includes("sportsSyncTournamentId"), false);

const radar = fs.readFileSync("netlify/functions/radar-lib.mjs", "utf8");
assert.ok(radar.includes("probeSportsSyncOrganizer"));
assert.ok(radar.includes("Do not invent"));

console.log("ok sportssync · results only · Chongqing unarmed · KL/Penang dry-run · no LIVE");
