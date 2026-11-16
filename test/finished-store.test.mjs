import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LILLE, MLP_ASIA, loadPpaEu } from "../netlify/functions/pb-ticker.mjs";
import {
  finishedFromMatchups,
  finishedFromTicker,
  finishedRecord,
  persistFinished,
  readFinished,
  resetFinishedMemory,
  storeKey,
} from "../netlify/functions/finished-store.mjs";

const lilleFeed = JSON.parse(fs.readFileSync(new URL("./fixtures/ppa-eu-lille-ticker.json", import.meta.url), "utf8"));
const mlpFeed = JSON.parse(fs.readFileSync(new URL("./fixtures/mlp-asia-ticker.json", import.meta.url), "utf8"));

function memStore() {
  const m = new Map();
  let writes = 0;
  return {
    m,
    get writes() { return writes; },
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v) { writes++; m.set(k, JSON.stringify(v)); },
    async list({ prefix = "" } = {}) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
  };
}

test("only ended, played matches with real games are kept", () => {
  const rows = lilleFeed.data.matches;
  const kept = finishedFromTicker(rows, LILLE);
  const played = rows.filter((r) => String(r.matchStatus) === "4" && String(r.matchCompletedType) === "5");
  assert.equal(kept.length, played.length);
  for (const r of kept) {
    assert.ok(r.games.length);
    assert.ok(r.games.some(([a, b]) => Math.max(a, b) >= 11));
    assert.ok(r.sides[0].length && r.sides[1].length);
    assert.ok(r.division);
    assert.equal(r.event, LILLE.name);
  }
  // Withdrawal (completed type 4), live and scheduled rows are never stored.
  for (const r of rows.filter((x) => !played.includes(x))) assert.equal(finishedRecord(r, { event: "x" }), null);
});

test("a winner the game count contradicts is not stored", () => {
  const raw = { matchUuid: "x", matchStatus: 4, matchCompletedType: 5, winner: 2, teamOnePlayerOneName: "A B", teamTwoPlayerOneName: "C D", teamOneGameOneScore: 11, teamTwoGameOneScore: 4 };
  assert.equal(finishedRecord(raw, { event: "e" }), null);
  assert.equal(finishedRecord({ ...raw, winner: 1 }, { event: "e" }).winner, 0);
  assert.equal(finishedRecord({ ...raw, winner: 1, teamOneGameOneScore: 0, teamTwoGameOneScore: 0 }, { event: "e" }), null);
});

test("MLP Asia rubbers keep players, team matchup and stop", () => {
  const kept = finishedFromMatchups(mlpFeed.data.matchups, MLP_ASIA);
  assert.ok(kept.length > 0);
  for (const r of kept) {
    assert.ok(r.matchup?.id && r.matchup.teams.length === 2);
    assert.match(r.event, /^MLP Asia 2026/);
    assert.equal(r.date, "2026-11-13");
    assert.equal(r.sides[0].length, r.disc === "TB" ? 1 : 2);
    assert.equal(r.sides[1].length, r.sides[0].length);
  }
});

test("persist merges, writes only on new matches, and reads back", async () => {
  resetFinishedMemory();
  const store = memStore();
  const recs = finishedFromTicker(lilleFeed.data.matches, LILLE);
  assert.equal(await persistFinished(LILLE, recs, { store }), recs.length);
  assert.equal(store.writes, 1);
  assert.equal(await persistFinished(LILLE, recs, { store }), 0);
  assert.equal(store.writes, 1);
  resetFinishedMemory();
  assert.equal(await persistFinished(LILLE, recs, { store }), 0, "reload from store, still no write");
  assert.equal(store.writes, 1);
  const events = await readFinished({ tour: "ppa-eu", store });
  assert.equal(events.length, 1);
  assert.equal(events[0].key, storeKey(LILLE));
  assert.equal(events[0].count, recs.length);
  assert.deepEqual((await readFinished({ tour: "mlp-asia", store })).length, 0);
});

test("loader still serves the board when the store is unavailable", async () => {
  resetFinishedMemory();
  const fetchImpl = async () => new Response(JSON.stringify(lilleFeed), { status: 200, headers: { "content-type": "application/json" } });
  const body = await loadPpaEu({ fetchImpl, now: new Date("2026-11-13T16:00:00Z") });
  assert.equal(body.delayed, false);
  assert.ok(body.matches.length > 0);
});
