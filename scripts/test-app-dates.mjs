/**
 * APP day truth: Sunday Finals stay off Friday's board.
 * Fixtures match Den Live Overland 18453 (2026-09-18 scan).
 */
import {
  addDays,
  keepAppMatch,
  matchBoardDate,
  matchHasClock,
  ymdFromDenValue,
} from "../netlify/functions/app-dates.mjs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const TODAY = "2026-09-18";
const SUN = "2026-09-20";
const BRACKET = "2026-09-17";

const wazirFinal = {
  matchId: 598218,
  matchType: "FINAL",
  status: "WAITING_FOR_COURT",
  completed: false,
  startTime: null,
  scheduledTime: null,
  endTime: null,
  roundDisplayName: "Round 6",
};
const bowerBronze = {
  matchId: 598219,
  matchType: "THIRD_PLACE",
  status: "WAITING_FOR_COURT",
  completed: false,
  startTime: null,
  scheduledTime: null,
  endTime: null,
};
const sfPlayed = {
  matchId: 598217,
  matchType: "STANDARD",
  status: "COMPLETED",
  completed: true,
  startTime: [2026, 9, 17, 14, 18, 59, 278000000],
  scheduledTime: null,
};
const mixedFriday = {
  matchId: 599000,
  matchType: "STANDARD",
  status: "SCHEDULED",
  completed: false,
  startTime: null,
  scheduledTime: null,
};

assert(ymdFromDenValue([2026, 9, 17, 11, 42, 29]) === "2026-09-17", "array ymd");
assert(matchBoardDate(wazirFinal, { bracketDate: BRACKET, eventEndDate: SUN }) === SUN, "Wazir Final → Sunday");
assert(matchBoardDate(bowerBronze, { bracketDate: BRACKET, eventEndDate: SUN }) === SUN, "Bower Bronze → Sunday");
assert(matchBoardDate(sfPlayed, { bracketDate: BRACKET, eventEndDate: SUN }) === "2026-09-17", "SF keeps Thursday clock");
assert(matchBoardDate(mixedFriday, { bracketDate: "2026-09-18", eventEndDate: SUN }) === "2026-09-18", "XD uses Friday bracket day");
assert(!matchHasClock(wazirFinal), "Final has no match clock — do not invent 09:00");
assert(matchHasClock(sfPlayed), "SF has Den startTime");

// Old bug: WAITING_FOR_COURT rolled to today
assert(matchBoardDate(wazirFinal, { bracketDate: BRACKET, eventEndDate: SUN }) !== TODAY, "Final not Friday");

const wazirRow = { status: "NEXT", date: SUN, start: "" };
const mixedRow = { status: "NEXT", date: "2026-09-18", start: "2026-09-18T13:00:00.000Z" };
const sfRow = { status: "FT", date: "2026-09-17", start: "2026-09-17T19:18:59.000Z" };
const liveRow = { status: "LIVE", date: "2026-09-17", start: "2026-09-17T19:18:59.000Z" };

assert(keepAppMatch(wazirRow, TODAY, SUN) === true, "Sunday Final kept on Friday payload");
assert(keepAppMatch(mixedRow, TODAY, SUN) === true, "Friday XD kept");
assert(keepAppMatch(sfRow, TODAY, SUN) === true, "Thursday FT kept");
assert(keepAppMatch(liveRow, TODAY, SUN) === true, "LIVE always");
assert(keepAppMatch({ status: "NEXT", date: "2026-09-16" }, TODAY, SUN) === false, "stale NEXT dropped");
assert(addDays(TODAY, 2) === SUN, "Fri+2=Sun");

// On Sunday the same Final belongs on today's board
assert(keepAppMatch(wazirRow, SUN, SUN) === true, "Sunday Final kept on Sunday");
assert(wazirRow.date === SUN, "date truth Sunday");

console.log("app-dates ok");
