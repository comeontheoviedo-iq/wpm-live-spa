import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { archiveBoard, archiveEvent, boardEvent, boardRecord, dayInWindow, finishedFromBoard } from "../netlify/functions/finished-board.mjs";
import { readFinished, resetFinishedMemory } from "../netlify/functions/finished-store.mjs";
import { FINISHED_EVENTS } from "../netlify/functions/finished-archive.mjs";

// Real board rows captured from live.worldpickleballmagazine.com on 16 Nov 2026.
const fx = JSON.parse(fs.readFileSync(new URL("./fixtures/board-finished.json", import.meta.url), "utf8"));

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

test("APP rows keep full names, amateur/age draw labels and games", () => {
  const rows = fx.app;
  const r = boardRecord(rows[0], { source: "app" });
  assert.equal(r.id, rows[0].id);
  assert.equal(r.played, true);
  assert.equal(r.names, "roster");
  assert.deepEqual(r.sides[0], ["Paul Salmela", "Chris Wilton"]);
  assert.deepEqual(r.games, [[11, 7], [11, 3]]);
  assert.equal(r.winner, 0);
  assert.match(r.division, /AARP .*Champions \(50\+\) Men's Pro Doubles$/);
  assert.equal(r.round, "R32");
  assert.deepEqual(boardEvent(rows[0]), { tour: "app", id: "18443", name: "APP Arizona Open", venue: rows[0].venue || "", tz: rows[0].tz || "" });
});

test("TPB amateur draw (rally scoring to 21) is kept with its division", () => {
  const r = boardRecord(fx.tpb[0]);
  assert.equal(r.division, "Individual Masculino 3.5");
  assert.deepEqual(r.games, [[21, 22]]);
  assert.equal(r.winner, 1);
  assert.equal(boardEvent(fx.tpb[0]).id, "somontes-2026");
});

test("World Cup ties keep the rubbers and the team winner", () => {
  const r = boardRecord(fx.worldcup[0]);
  assert.deepEqual(r.sides, [["Singapore"], ["Chinese Taipei"]]);
  assert.equal(r.winner, 0);
  assert.ok(r.lines.length >= 4);
  assert.ok(r.lines.every((l) => l.score || l.winner != null));
  const ev = boardEvent(fx.worldcup[0]);
  assert.equal(ev.tour, "wc");
  assert.equal(ev.id, "world-cup-da-nang");
});

test("FT rows with no games are kept as not played, never with a made-up winner", () => {
  const wo = fx.archive_opendoor.find((m) => !m.lines.length);
  const r = boardRecord(wo);
  assert.equal(r.played, false);
  assert.equal(r.winner, null);
  assert.deepEqual(r.games, []);
  const named = boardRecord({ ...wo, note: "Walkover · Trevino / Dunlap" });
  assert.equal(named.outcome, "walkover");
  assert.equal(named.winner, 1);
});

test("non-final rows, live games and ticker tours are not stored here", () => {
  assert.equal(boardRecord({ ...fx.app[0], status: "LIVE" }), null);
  assert.equal(boardRecord({ ...fx.app[0], status: "NEXT" }), null);
  const g = finishedFromBoard([{ ...fx.app[0], tour: "ppa-eu" }, { ...fx.app[0], tour: "mlp-asia" }]);
  assert.equal(g.size, 0);
  const live = boardRecord({ ...fx.app[0], lines: [{ disc: "G1", score: "11–7", winner: fx.app[0].a }, { disc: "G2", score: "5–3", winner: "", live: true }] });
  assert.deepEqual(live.games, [[11, 7]]);
});

test("archive and live rows of one event share a store key and dedupe", async () => {
  resetFinishedMemory();
  const store = memStore();
  const od = FINISHED_EVENTS.find((e) => e.id === "opendoor");
  const e = archiveEvent(od);
  assert.equal(`${e.tour}:${e.id}`, `ppa:${od.ppaEventId}`);
  const live = fx.archive_opendoor.map((m) => ({ ...m, eventKey: `ev:ppa:${od.ppaEventId}` }));
  const a1 = await archiveBoard(fx.archive_opendoor, { store, eventFor: () => e });
  assert.equal(a1[`ppa:${od.ppaEventId}`], fx.archive_opendoor.length);
  const a2 = await archiveBoard(live, { store });
  assert.equal(a2[`ppa:${od.ppaEventId}`], 0);
  assert.equal(store.writes, 1, "nothing new, no second write");
  // A corrected score is a change and rewrites once.
  const fixed = live.map((m, i) => (i === 0 ? { ...m, lines: [{ disc: "G1", score: "11–5", winner: m.a }, ...m.lines.slice(1)] } : m));
  const a3 = await archiveBoard(fixed, { store });
  assert.equal(a3[`ppa:${od.ppaEventId}`], 1);
  assert.equal(store.writes, 2);
  const ev = await readFinished({ tour: "ppa", event: od.ppaEventId, store });
  assert.equal(ev.length, 1);
  assert.equal(ev[0].count, fx.archive_opendoor.length);
});

test("one write per event per poll across feeds; ppa: does not list ppa-eu:", async () => {
  resetFinishedMemory();
  const store = memStore();
  await archiveBoard([...fx.app, ...fx.tpb, ...fx.rta, ...fx.worldcup], { store });
  assert.equal(store.writes, 4);
  store.m.set("ppa-eu:x", JSON.stringify({ event: { key: "ppa-eu:x" }, matches: {} }));
  assert.equal((await readFinished({ tour: "ppa", store })).length, 0);
  assert.equal((await readFinished({ tour: "rta", store })).length, 1);
});

test("a write merges matches another isolate stored meanwhile", async () => {
  resetFinishedMemory();
  const store = memStore();
  await archiveBoard(fx.app.slice(0, 1), { store });
  resetFinishedMemory();
  await archiveBoard(fx.app.slice(1, 2), { store }); // isolate B
  // Isolate A still holds its old copy in memory? Simulate by a fresh doc missing B's row.
  const key = [...store.m.keys()][0];
  assert.equal(Object.keys(JSON.parse(store.m.get(key)).matches).length, 2);
});

test("calendar window is a day either side", () => {
  assert.equal(dayInWindow("2026-11-16", "2026-11-22", new Date("2026-11-15T10:00:00Z")), true);
  assert.equal(dayInWindow("2026-11-16", "2026-11-22", new Date("2026-11-23T23:00:00Z")), true);
  assert.equal(dayInWindow("2026-11-16", "2026-11-22", new Date("2026-11-24T00:10:00Z")), false);
  assert.equal(dayInWindow("", "", new Date()), false);
});
