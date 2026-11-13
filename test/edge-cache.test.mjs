import test from "node:test";
import assert from "node:assert/strict";
import { cachedResponse, cacheKeyFor, FRESH_MS, STALE_MS, _resetEdgeCache } from "../netlify/functions/_shared/edge-cache.mjs";

const json = (body, status = 200) => Response.json(body, { status });

test("cache key drops the t cache-buster and sorts params", () => {
  assert.equal(cacheKeyFor("https://x/api/tpb?t=123&id=b&a=1"), "/api/tpb?a=1&id=b");
  assert.equal(cacheKeyFor("https://x/api/rta/?t=9"), "/api/rta");
});

test("fresh hit, stale serve with background refresh, miss after stale window", async () => {
  _resetEdgeCache();
  let t = 1_000_000;
  const now = () => t;
  let calls = 0;
  const produce = async () => json({ n: ++calls, matches: [{ id: String(calls) }] });
  const waits = [];
  const ctx = { waitUntil: (p) => waits.push(p) };

  let res = await cachedResponse("/k", produce, { ctx, now });
  assert.equal(res.headers.get("x-wpm-cache"), "MISS");
  assert.equal((await res.json()).n, 1);

  t += FRESH_MS - 1;
  res = await cachedResponse("/k", produce, { ctx, now });
  assert.equal(res.headers.get("x-wpm-cache"), "HIT");
  assert.equal((await res.json()).n, 1);

  t += 2;
  res = await cachedResponse("/k", produce, { ctx, now });
  assert.equal(res.headers.get("x-wpm-cache"), "STALE");
  assert.equal((await res.json()).n, 1);
  await Promise.all(waits);
  res = await cachedResponse("/k", produce, { ctx, now });
  assert.equal((await res.json()).n, 2);

  t += STALE_MS + 1;
  res = await cachedResponse("/k", produce, { ctx, now });
  assert.equal(res.headers.get("x-wpm-cache"), "MISS");
  assert.equal((await res.json()).n, 3);
});

test("a delayed empty body does not blank recent rows; errors are not cached", async () => {
  _resetEdgeCache();
  let t = 5_000_000;
  const now = () => t;
  await cachedResponse("/tpb", async () => json({ delayed: false, matches: [{ id: "m1", score: "11-9" }] }), { now });
  t += FRESH_MS + 1;
  let res = await cachedResponse("/tpb", async () => json({ delayed: true, matches: [] }), { now });
  // stale copy served, background refresh returns delayed-empty and keeps the rows
  assert.equal((await res.json()).matches.length, 1);
  await new Promise((r) => setTimeout(r, 5));
  t += STALE_MS + 1;
  res = await cachedResponse("/tpb", async () => json({ delayed: true, matches: [] }), { now });
  assert.equal((await res.json()).matches.length, 0);

  _resetEdgeCache();
  res = await cachedResponse("/e", async () => json({ error: "x" }, 502), { now });
  assert.equal(res.status, 502);
  let n = 0;
  res = await cachedResponse("/e", async () => json({ ok: ++n, matches: [] }), { now });
  assert.equal(res.status, 200);
  assert.equal(n, 1);
});

test("concurrent misses share one upstream call", async () => {
  _resetEdgeCache();
  let calls = 0;
  const produce = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 20));
    return json({ matches: [] });
  };
  const [a, b] = await Promise.all([cachedResponse("/c", produce), cachedResponse("/c", produce)]);
  assert.equal(calls, 1);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
});
