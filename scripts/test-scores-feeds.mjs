#!/usr/bin/env node
/**
 * /api/scores overlay runs in-process. Handlers are invoked directly.
 * global fetch must stay unused, including when a handler throws.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeScores } from "../netlify/functions/_shared/scores-compose.mjs";
import { collectFeedOverlays } from "../netlify/functions/_shared/scores-feeds.mjs";

const seed = {
  updated: "2026-09-04T11:51:00Z",
  heroByDate: { "2026-09-04": "Nationals in Cary." },
  matches: [
    { id: "ppa-old", tour: "ppa", a: "A", b: "B", status: "FT", date: "2026-09-04" },
    { id: "wc-old", tour: "wc", a: "Vietnam", b: "Chile", status: "FT", date: "2026-09-03" },
    { id: "manual", tour: "gpa", a: "Desk", b: "Only", status: "NEXT", date: "2026-09-04" },
  ],
};

const seen = [];
const json = (body, status = 200) => Response.json(body, { status });

const feeds = [
  {
    key: "wc",
    path: "/api/worldcup",
    handler: async (req) => {
      seen.push(req.url);
      return json({
        updated: "2026-10-25T13:00:01Z",
        matches: [{ id: "wc-new", tour: "wc", a: "USA", b: "India", status: "FT" }],
      });
    },
  },
  {
    key: "ppa",
    path: "/api/ppa",
    handler: async () => {
      throw new Error("upstream down");
    },
  },
  {
    key: "app",
    path: "/api/app",
    handler: async (req) => {
      seen.push(req.url);
      return json({ updated: "2026-10-25T13:00:03Z", betweenEvents: true, matches: [] });
    },
  },
  {
    key: "sportssync",
    path: "/api/sportssync",
    handler: async (req) => {
      seen.push(req.url);
      assert.equal(new URL(req.url).search, "");
      return json({ updated: "2026-10-25T13:00:04Z", armed: false, matches: [] });
    },
  },
  {
    key: "rta",
    path: "/api/rta",
    handler: async (req) => {
      seen.push(req.url);
      return json({
        updated: "2026-10-25T12:00:00Z",
        matches: [{ id: "rta-new", tour: "rta", a: "A", b: "B", status: "FT" }],
      });
    },
  },
];

const realFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("network self-fetch");
};

let overlays;
try {
  overlays = await collectFeedOverlays(feeds);
} finally {
  globalThis.fetch = realFetch;
}

assert.equal(fetchCalls, 0);
assert.equal(overlays.ppa, null);
assert.equal(overlays.wc.matches[0].id, "wc-new");
assert.deepEqual(
  seen.sort(),
  [
    "https://scores.internal/api/app",
    "https://scores.internal/api/rta",
    "https://scores.internal/api/sportssync",
    "https://scores.internal/api/worldcup",
  ]
);

const now = new Date("2026-10-25T13:00:00Z");
const out = composeScores(seed, overlays, now);
assert.deepEqual(Object.keys(out).sort(), ["heroByDate", "matches", "updated"]);
assert.equal(out.updated, "2026-10-25T13:00:04Z");
assert.notEqual(out.updated, seed.updated);
assert.deepEqual(out.matches.map((m) => m.id).sort(), ["manual", "ppa-old", "rta-new", "wc-new"]);

const empty = await collectFeedOverlays([
  { key: "wc", path: "/api/worldcup", handler: async () => json({ updated: "x" }) },
  { key: "ppa", path: "/api/ppa", handler: async () => json({ matches: [] }, 503) },
  { key: "app", path: "/api/app", handler: async () => null },
]);
assert.equal(empty.wc, null);
assert.equal(empty.ppa, null);
assert.equal(empty.app, null);

const src = readFileSync(new URL("../netlify/functions/scores.mts", import.meta.url), "utf8");
assert.match(src, /collectFeedOverlays/);
assert.match(src, /from "\.\/worldcup\.mts"/);
assert.match(src, /from "\.\/ppa\.mts"/);
assert.match(src, /from "\.\/app\.mts"/);
assert.match(src, /from "\.\/sportssync\.mts"/);
assert.match(src, /from "\.\/rta\.mts"/);
assert.doesNotMatch(src, /\bfetch\s*\(/);
assert.doesNotMatch(src, /siteOrigin/);
assert.equal(src.includes('path: "/api/scores"'), true);

console.log("ok scores feeds · in-process overlay · no network self-fetch");
