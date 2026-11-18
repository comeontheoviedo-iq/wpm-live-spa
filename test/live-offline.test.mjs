import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LIVE_OFFLINE, offlineResponse } from "../cloudflare/src/live-offline.js";

const worker = fs.readFileSync(new URL("../cloudflare/src/index.js", import.meta.url), "utf8");

test("LIVE_OFFLINE is on", () => assert.equal(LIVE_OFFLINE, true));

test("pages get a neutral 503 with Retry-After, noindex, link to the magazine", async () => {
  for (const p of ["/", "/match/abc", "/archive", "/robots.txt", "/desk", "/scores.json"]) {
    const res = offlineResponse(new Request("https://live.worldpickleballmagazine.com" + p));
    assert.equal(res.status, 503, p);
    assert.ok(Number(res.headers.get("retry-after")) > 0);
    assert.match(res.headers.get("x-robots-tag"), /noindex/);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.match(res.headers.get("content-type"), /text\/html/);
    const html = await res.text();
    assert.match(html, /temporarily offline/);
    assert.match(html, /href="https:\/\/worldpickleballmagazine\.com\/"/);
    assert.match(html, /noindex/);
  }
});

test("/api/* gets a 503 JSON body, including /api/scores, /api/finished and /api/app", async () => {
  for (const p of ["/api/scores", "/api/finished?tour=ppa", "/api/app", "/api/archive?id=x"]) {
    const res = offlineResponse(new Request("https://live.worldpickleballmagazine.com" + p));
    assert.equal(res.status, 503, p);
    assert.ok(res.headers.get("retry-after"));
    const body = await res.json();
    assert.equal(body.offline, true);
  }
});

test("/sw.js is a self-removing service worker", async () => {
  const res = offlineResponse(new Request("https://live.worldpickleballmagazine.com/sw.js"));
  assert.equal(res.status, 200);
  assert.match(await res.text(), /unregister/);
});

test("worker: fetch and scheduled return before any handler, bindEnv or upstream work", () => {
  const f = worker.indexOf("async fetch(request, env, ctx) {");
  const fOff = worker.indexOf("if (LIVE_OFFLINE) return offlineResponse(request);", f);
  const fBind = worker.indexOf("bindEnv(env)", f);
  assert.ok(f > 0 && fOff > f && fOff < fBind);
  const s = worker.indexOf("async scheduled(event, env, ctx) {");
  const sOff = worker.indexOf("if (LIVE_OFFLINE) {", s);
  const sRet = worker.indexOf("return;", sOff);
  const sBind = worker.indexOf("bindEnv(env)", s);
  const sHandler = worker.indexOf("CRON_HANDLERS[cron]", s);
  assert.ok(s > 0 && sOff > s && sRet > sOff && sRet < sBind && sBind < sHandler);
});

test("wrangler runs the worker first for every path while offline", () => {
  const toml = fs.readFileSync(new URL("../cloudflare/wrangler.toml", import.meta.url), "utf8");
  assert.match(toml, /^run_worker_first = true$/m);
});
