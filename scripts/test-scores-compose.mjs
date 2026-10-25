#!/usr/bin/env node
/**
 * /api/scores composition. Live tour rows replace the 4 Sep desk seed.
 * Top-level keys stay updated, heroByDate, matches.
 */
import assert from "node:assert/strict";
import { composeScores } from "../netlify/functions/_shared/scores-compose.mjs";

const seed = {
  updated: "2026-09-04T11:51:00Z",
  heroByDate: { "2026-09-04": "Nationals in Cary." },
  matches: [
    { id: "ppa-old", tour: "ppa", a: "A", b: "B", status: "FT", date: "2026-09-04" },
    { id: "wc-old", tour: "wc", a: "Vietnam", b: "Chile", status: "FT", date: "2026-09-03" },
    { id: "app-old", tour: "app", a: "Old", b: "App", status: "LIVE", date: "2026-09-04" },
    { id: "asia-old", tour: "app-asia", a: "KL", b: "Penang", status: "FT", date: "2026-09-01" },
    { id: "manual", tour: "gpa", a: "Desk", b: "Only", status: "NEXT", date: "2026-09-04" },
  ],
};

const now = new Date("2026-10-25T13:00:00Z");
const out = composeScores(
  seed,
  {
    wc: { updated: "2026-10-25T13:00:01Z", matches: [{ id: "wc-new", tour: "wc", a: "USA", b: "India", status: "FT" }] },
    ppa: { updated: "2026-10-25T13:00:02Z", matches: [{ id: "ppa-new", tour: "ppa", a: "Waters", b: "Bright", status: "LIVE" }] },
    app: { updated: "2026-10-25T13:00:03Z", matches: [], betweenEvents: true },
    sportssync: { updated: "2026-10-25T13:00:04Z", armed: false, matches: [] },
    rta: { updated: "2026-10-25T12:00:00Z", matches: [{ id: "rta-new", tour: "rta", a: "A", b: "B", status: "FT" }] },
  },
  now
);

assert.deepEqual(Object.keys(out).sort(), ["heroByDate", "matches", "updated"]);
assert.equal(out.updated, "2026-10-25T13:00:04Z");
assert.equal(out.heroByDate["2026-09-04"], "Nationals in Cary.");
assert.equal(out.heroByDate["2026-10-25"], "1 live now across the board.");
const ids = out.matches.map((m) => m.id).sort();
assert.deepEqual(ids, ["manual", "ppa-new", "rta-new", "wc-new"]);
assert.equal(out.matches.some((m) => m.tour === "app"), false);
assert.equal(out.matches.some((m) => m.tour === "app-asia"), false);

const kept = composeScores(seed, { wc: null, ppa: { matches: [] }, app: null, sportssync: null, rta: null }, now);
assert.equal(kept.updated, seed.updated);
assert.equal(kept.matches.length, seed.matches.length);

const appQuiet = composeScores(
  { updated: seed.updated, heroByDate: {}, matches: [] },
  { app: { updated: "2026-10-25T13:00:03Z", preServe: true, matches: [] } },
  now
);
assert.equal(appQuiet.heroByDate["2026-10-25"], "Play starts soon.");

const armedFt = composeScores(
  { updated: seed.updated, heroByDate: {}, matches: [{ id: "asia-old", tour: "app-asia", status: "LIVE" }] },
  {
    sportssync: {
      updated: "2026-10-25T13:00:04Z",
      armed: true,
      matches: [
        { id: "ss-ft", tour: "app-asia", status: "FT" },
        { id: "ss-next", tour: "app-asia", status: "NEXT" },
      ],
    },
  },
  now
);
assert.deepEqual(armedFt.matches.map((m) => m.id), ["ss-ft"]);

console.log("ok scores compose · seed tours replaced · manual gpa kept · shape unchanged");
