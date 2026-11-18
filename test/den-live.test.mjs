import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DEN_LIVE_ENABLED, DenLivePausedError, __setDenLiveEnabledForTest, denLiveEnabled, denUrl } from "../netlify/functions/den-live.mjs";
import app from "../netlify/functions/app.mts";
import { FINISHED_EVENTS, loadFinished } from "../netlify/functions/finished-archive.mjs";
import { buildRadarReport } from "../netlify/functions/radar-lib.mjs";

function trapFetch() {
  const calls = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    throw new Error("network blocked in test");
  };
  return { calls, restore: () => (globalThis.fetch = real) };
}

test("Den Live is paused by the constant and denUrl refuses to build a URL", () => {
  assert.equal(DEN_LIVE_ENABLED, false);
  assert.equal(denLiveEnabled(), false);
  assert.throws(() => denUrl("/api/tournament-info?tournamentId=1"), DenLivePausedError);
});

test("/api/app answers 200 with no matches key and never fetches", async () => {
  const t = trapFetch();
  try {
    for (const q of ["", "?tournamentId=18443"]) {
      const res = await app(new Request("https://live.test/api/app" + q));
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.paused, true);
      assert.equal(body.source, "paused");
      assert.equal(body.delayed, false);
      assert.equal(body.liveCount, 0);
      assert.ok(!("matches" in body), "no matches key, so /api/scores keeps its other rows");
      assert.ok(!body.error);
    }
    assert.deepEqual(t.calls, []);
  } finally {
    t.restore();
  }
});

test("/api/archive for every APP event is a paused 200-shape and never fetches", async () => {
  const t = trapFetch();
  try {
    const appEvents = FINISHED_EVENTS.filter((e) => e.tour === "app" && e.denTournamentId);
    assert.ok(appEvents.length > 0);
    for (const ev of appEvents) {
      const data = await loadFinished(ev.id);
      assert.equal(data.paused, true);
      assert.deepEqual(data.matches, []);
      assert.ok(!data.error);
    }
    assert.deepEqual(t.calls, []);
  } finally {
    t.restore();
  }
});

test("radar report makes no request to Den", async () => {
  const t = trapFetch();
  try {
    const report = await buildRadarReport({ prodBase: "https://live.test" });
    const appEv = (report.events || []).find((e) => e.tour === "app");
    assert.ok(appEv);
    assert.equal(appEv.board, "results_only");
    assert.ok(!t.calls.some((u) => /pickleballden\.com/.test(u)), t.calls.join("\n"));
  } finally {
    t.restore();
  }
});

test("the Den hostname appears in exactly one source file", () => {
  const root = new URL("..", import.meta.url).pathname;
  const hits = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (name.name === "node_modules" || name.name.startsWith(".") || name.name === "docs") continue;
      const p = path.join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (/\.(mjs|mts|js|ts|html|json|toml)$/.test(name.name) && !p.includes("/test/") && !p.includes("package-lock")) {
        if (/pickleballden\.com/i.test(fs.readFileSync(p, "utf8"))) hits.push(path.relative(root, p));
      }
    }
  };
  walk(root);
  assert.deepEqual(hits, ["netlify/functions/den-live.mjs"]);
});

test("when explicitly enabled the URL builder works (re-enable path)", () => {
  __setDenLiveEnabledForTest(true);
  try {
    assert.equal(denUrl("/x"), "https://denlive.pickleballden.com/x");
  } finally {
    __setDenLiveEnabledForTest(null);
  }
  assert.equal(denLiveEnabled(), false);
});
