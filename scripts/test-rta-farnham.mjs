#!/usr/bin/env node
/**
 * RTA2000 Farnham is its own tour. Game strings only — never seeds, ranks, or DUPR.
 * LIVE with no points is blank, not 0–0. Columbus 18448 and Las Vegas stay pinned.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import { APP_LIVE, PPA_LIVE, FARNHAM as FARNHAM_SLATE, SLATE } from "../netlify/functions/slate-events.mjs";
import { normalizeFollowKey, tourFollowMatches } from "../netlify/functions/follow-tags.mjs";
import {
  FARNHAM,
  keepRtaMatch,
  mapRtaPacks,
  mapRtaSeed,
  parseGameScores,
  wallTimeToIso,
} from "../netlify/functions/rta-map.mjs";

assert.equal(APP_LIVE.eventId, "18448");
assert.equal(PPA_LIVE.eventId, "203e1164-b4f9-47e9-bacf-ff81f8748025");
assert.equal(PPA_LIVE.name, "Veolia Chicago Cup");
assert.equal(FARNHAM.tour, "rta");
assert.equal(FARNHAM.tz, "Europe/London");
assert.match(FARNHAM.venue, /Hurlands/);
assert.equal(FARNHAM_SLATE.tour, "rta");
assert.equal(FARNHAM_SLATE.onLive, true);
assert.equal(SLATE.some((s) => s.id === FARNHAM_SLATE.id), true);
assert.equal(normalizeFollowKey("ev:rta:8510"), "tour:rta");
assert.equal(normalizeFollowKey("RTA2000 Farnham"), "tour:rta");
assert.equal(normalizeFollowKey("tour:rta"), "tour:rta");
assert.equal(normalizeFollowKey("ev:app:18448"), "tour:app");
assert.equal(normalizeFollowKey("ev:ppa:86926aef"), "tour:ppa");
assert.equal(tourFollowMatches({ tour: "rta", a: "A", b: "B" }, "tour:rta"), true);
assert.equal(tourFollowMatches({ tour: "rta", a: "A", b: "B" }, "tour:app"), false);
assert.equal(tourFollowMatches({ tour: "app", a: "A", b: "B" }, "tour:rta"), false);

assert.equal(parseGameScores("11:2 11:1").length, 2);
assert.equal(parseGameScores("5.084"), null);
assert.equal(parseGameScores("16"), null);
assert.deepEqual(wallTimeToIso("2026-10-03", "09:00", "Europe/London"), "2026-10-03T08:00:00.000Z");

function entry(seed, people, extra = {}) {
  return {
    id: seed,
    seed: String(seed),
    users: people.map((p) => ({
      rank: p.rank ?? 111,
      duprRating: p.dupr ?? 5.084,
      wprCompetitionRating: p.wpr ?? 4.5,
      user: { name: p.name, surname: p.surname },
    })),
    ...extra,
  };
}

const worrad = mapRtaSeed(
  {
    id: 1270019,
    score: "11:2 11:1",
    status: "completed",
    matchStatus: "Specific Time",
    isMatchInProgress: false,
    date: "2026-10-03T00:00:00.000Z",
    time: "09:00",
    court: { name: "Court 3" },
    winnerEntryId: 205745,
    entry1: entry(12, [
      { name: "Harry", surname: "Worrad", dupr: 4.751, rank: 134 },
      { name: "Jamie", surname: "Wright", dupr: 4.674, rank: 43 },
    ]),
    entry2: entry(0, [
      { name: "John Paul", surname: "O Connell", dupr: 4.542 },
      { name: "Luis", surname: "Marcano", dupr: 4.554 },
    ]),
  },
  { label: "Men's doubles", disc: "MD", round: "UB R1", categoryId: 34477 }
);
assert.equal(worrad.tour, "rta");
assert.equal(worrad.status, "FT");
assert.equal(worrad.score, "2-0");
assert.equal(worrad.games, "G1 11–2 · G2 11–1");
assert.equal(worrad.a, "Harry Worrad / Jamie Wright");
assert.equal(worrad.b, "John Paul O Connell / Luis Marcano");
assert.equal(worrad.court, "Court 3");
assert.equal(worrad.date, "2026-10-03");
assert.equal(worrad.start, "2026-10-03T08:00:00.000Z");
assert.equal(worrad.score.includes("4.7"), false);
assert.equal(worrad.score.includes("12"), false);
assert.equal(worrad.games.includes("134"), false);

const oke = mapRtaSeed(
  {
    id: 1270020,
    score: "11:2 11:4",
    status: "completed",
    matchStatus: "Specific Time",
    isMatchInProgress: false,
    date: "2026-10-03T00:00:00.000Z",
    time: "09:00",
    court: { name: "Court 4" },
    entry1: entry(15, [
      { name: "Lewis", surname: "Oke" },
      { name: "Tom", surname: "Corfield" },
    ]),
    entry2: entry(0, [
      { name: "Niall", surname: "Wareham" },
      { name: "Ed", surname: "Gateshill" },
    ]),
  },
  { label: "Men's doubles", disc: "MD", round: "UB R1", categoryId: 34477 }
);
assert.equal(oke.status, "FT");
assert.equal(oke.score, "2-0");
assert.equal(oke.games, "G1 11–2 · G2 11–4");

const liveBlank = mapRtaSeed(
  {
    id: 1270001,
    score: null,
    status: "inProgress",
    matchStatus: "Specific Time",
    isMatchInProgress: true,
    date: "2026-10-03T00:00:00.000Z",
    time: "09:00",
    court: { name: "CCourt" },
    entry1: entry(16, [
      { name: "Michaël", surname: "Goris", dupr: 5.05 },
      { name: "Pepijn", surname: "De Petter", dupr: 4.779 },
    ]),
    entry2: entry(0, [
      { name: "Andrew", surname: "Parker", dupr: 4.825 },
      { name: "Alex", surname: "Mcdonald", dupr: 4.796 },
    ]),
  },
  { label: "Men's doubles", disc: "MD", round: "UB R1", categoryId: 34477 }
);
assert.equal(liveBlank.status, "LIVE");
assert.equal(liveBlank.score, "");
assert.equal(liveBlank.games, "");
assert.deepEqual(liveBlank.lines, []);
assert.equal(liveBlank.court, "CCourt");
assert.equal(liveBlank.a.includes("Michaël Goris"), true);
assert.notEqual(liveBlank.score, "0-0");

const paddedLive = mapRtaSeed(
  {
    id: 9,
    score: "0:0",
    status: "inProgress",
    isMatchInProgress: true,
    date: "2026-10-03T00:00:00.000Z",
    time: "09:00",
    court: { name: "Court 5" },
    entry1: entry(1, [{ name: "Ada", surname: "A" }]),
    entry2: entry(2, [{ name: "Bea", surname: "B" }]),
  },
  { label: "Men's singles", disc: "MS", round: "UB R1", categoryId: 34475 }
);
assert.equal(paddedLive.status, "LIVE");
assert.equal(paddedLive.score, "");
assert.equal(paddedLive.lines.length, 0);

const partial = mapRtaSeed(
  {
    id: 10,
    score: "11:5 3:2",
    status: "inProgress",
    isMatchInProgress: true,
    date: "2026-10-03T00:00:00.000Z",
    time: "10:00",
    entry1: entry(1, [{ name: "Ada", surname: "A" }]),
    entry2: entry(2, [{ name: "Bea", surname: "B" }]),
  },
  { label: "Women's singles", disc: "WS", round: "UB R2", categoryId: 34474 }
);
assert.equal(partial.status, "LIVE");
assert.equal(partial.score, "1-0");
assert.equal(partial.lines[0].score, "11–5");
assert.equal(partial.lines[0].live, false);
assert.equal(partial.lines[1].score, "3–2");
assert.equal(partial.lines[1].live, true);

const three = mapRtaSeed(
  {
    id: 1269865,
    score: "11:3 5:11 11:3",
    status: "completed",
    isMatchInProgress: false,
    date: "2026-10-02T00:00:00.000Z",
    time: "11:00",
    entry1: entry(1, [{ name: "Eleana", surname: "Rodino" }]),
    entry2: entry(2, [{ name: "Valentine", surname: "Vernaz" }]),
  },
  { label: "Women's singles", disc: "WS", round: "UB R1", categoryId: 34474 }
);
assert.equal(three.status, "FT");
assert.equal(three.score, "2-1");
assert.equal(three.date, "2026-10-02");
assert.equal(three.games, "G1 11–3 · G2 5–11 · G3 11–3");

const bye = mapRtaSeed(
  {
    id: 99,
    score: null,
    status: "completed",
    isMatchInProgress: false,
    entry1: entry(1, [{ name: "Ben", surname: "Cawston" }, { name: "Louis", surname: "Laville" }]),
    entry2: null,
  },
  { label: "Men's doubles", disc: "MD", round: "UB R1", categoryId: 34477 }
);
assert.equal(bye, null);

const scheduled = mapRtaSeed(
  {
    id: 100,
    score: null,
    status: null,
    matchStatus: "Followed By",
    isMatchInProgress: false,
    date: "2026-10-03T00:00:00.000Z",
    time: "09:50",
    court: { name: "Court 7" },
    entry1: entry(1, [{ name: "Ben", surname: "Cawston" }, { name: "Louis", surname: "Laville" }]),
    entry2: entry(2, [{ name: "Andrew", surname: "Parker" }, { name: "Alex", surname: "Mcdonald" }]),
  },
  { label: "Men's doubles", disc: "MD", round: "UB R2", categoryId: 34477 }
);
assert.equal(scheduled.status, "NEXT");
assert.equal(scheduled.score, "");
assert.notEqual(scheduled.status, "LIVE");

const unplayedLb = {
  status: "NEXT",
  score: "",
  lines: [],
  date: "2026-10-02",
  round: "LB R6",
  rtaStatus: "upcoming",
};
assert.equal(keepRtaMatch(unplayedLb, new Date("2026-10-03T12:00:00Z")), true);
assert.equal(keepRtaMatch(unplayedLb, new Date("2026-10-05T08:00:00Z")), false);
assert.equal(keepRtaMatch({ ...unplayedLb, status: "FT", score: "2-0" }, new Date("2026-10-05T08:00:00Z")), true);
assert.equal(keepRtaMatch({ ...unplayedLb, status: "LIVE" }, new Date("2026-10-05T08:00:00Z")), true);
assert.equal(
  keepRtaMatch({ ...unplayedLb, lines: [{ score: "11–4" }] }, new Date("2026-10-05T08:00:00Z")),
  true
);

const { matches, categories } = mapRtaPacks([
  {
    categoryId: 34477,
    segment: "MD",
    draws: [
      {
        id: 1,
        title: "Men's Doubles",
        segment: "MD",
        hide: false,
        tournamentCategory: { id: 34477, category: { name: "RTA2000 Men's Doubles, 5.0+ OPEN" } },
        brackets: [
          {
            type: "upper",
            rounds: [
              {
                title: "UB R1",
                seeds: [
                  {
                    id: 1270019,
                    score: "11:2 11:1",
                    status: "completed",
                    isMatchInProgress: false,
                    date: "2026-10-03T00:00:00.000Z",
                    time: "09:00",
                    court: { name: "Court 3" },
                    entry1: entry(12, [
                      { name: "Harry", surname: "Worrad" },
                      { name: "Jamie", surname: "Wright" },
                    ]),
                    entry2: entry(0, [
                      { name: "John Paul", surname: "O Connell" },
                      { name: "Luis", surname: "Marcano" },
                    ]),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { categoryId: 34474, segment: "consolation", draws: [] },
  { categoryId: 34474, segment: "Q", draws: [] },
]);
assert.equal(matches.length, 1);
assert.equal(matches[0].tour, "rta");
assert.equal(matches[0].score, "2-0");
const md = categories.find((c) => c.id === 34477);
assert.equal(md.scored, 1);
assert.equal(md.segments.includes("consolation"), false);
const ws = categories.find((c) => c.id === 34474);
assert.deepEqual(ws.segments, []);

const js = fs.readFileSync("js/wpm-20261005a.js", "utf8");
const siteJs = fs.readFileSync("site/js/wpm-20261005a.js", "utf8");
assert.equal(siteJs, js);
assert.ok(js.includes('tour: "rta"') || js.includes('tour:"rta"') || js.includes("tour === \"rta\""));
assert.ok(js.includes("/api/rta"));
assert.ok(js.includes('m.tour !== "rta"'));
assert.ok(js.includes("RTA2000"));
assert.equal(js.includes("PickleLive"), false);
assert.ok(fs.readFileSync("site/index.html", "utf8").includes("wpm-20261005a.js"));
assert.ok(fs.readFileSync("netlify/functions/app.mts", "utf8").includes("18448"));
assert.ok(fs.readFileSync("netlify/functions/ppa.mts", "utf8").includes("PPA_LIVE"));
assert.equal(fs.readFileSync("netlify/functions/slate-events.mjs", "utf8").includes("86926aef-0566-4fbb-87cf-a48068a9f1c6"), true);

console.log("ok rta farnham · own tour · game scores only · unplayed after end not NEXT · Chicago live");
