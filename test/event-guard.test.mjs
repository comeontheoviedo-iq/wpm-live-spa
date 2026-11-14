import test from "node:test";
import assert from "node:assert/strict";
import { applyEventGuards, judgeCheck, parseOfficialDates, suppressionFor, checkKey } from "../netlify/functions/_shared/event-guard.mjs";
import { SLATE, staticWatchEvents } from "../netlify/functions/slate-events.mjs";

const NOW = Date.parse("2026-11-04T09:00:00Z");
const ev = (o) => ({ id: "slate:x", name: "X Open", start: "2026-11-02", end: "2026-11-07", status: "results-only", onLive: false, officialUrl: "https://e.x/a", connector: { type: "none" }, ...o });

test("Bangkok is gone from slate and watches and suppressed for GPA rows", () => {
  assert.equal(SLATE.some((s) => /bangkok/i.test(s.name)), false);
  assert.equal(staticWatchEvents().some((s) => /bangkok/i.test(s.name)), false);
  assert.ok(suppressionFor({ name: "APP Bangkok Open", id: "gpa:app%20bangkok%20open:2026-10-26" }));
  assert.equal(applyEventGuards([ev({ id: "gpa:app%20bangkok%20open:2026-10-26", name: "APP Bangkok Open" })], {}, NOW).length, 0);
});

test("cancelled Taipei City Open is gone from slate and watches and suppressed", () => {
  assert.equal(SLATE.some((s) => /taipei/i.test(s.name)), false);
  assert.equal(staticWatchEvents().some((s) => /taipei/i.test(s.name)), false);
  assert.ok(suppressionFor({ name: "TCI APP Asia Taipei City Open", id: "slate:app-asia-taipei-2026" }));
  assert.ok(suppressionFor({ name: "APP Asia Taipei Open", id: "gpa:app%20asia%20taipei%20open:2026-11-12" }));
  assert.equal(
    applyEventGuards(
      [ev({ id: "slate:app-asia-taipei-2026", name: "TCI APP Asia Taipei City Open", start: "2026-11-12", end: "2026-11-15" })],
      {},
      Date.parse("2026-11-14T09:00:00Z"),
    ).length,
    0,
  );
  // World Cup team names must not be swallowed by the Taipei suppression.
  assert.equal(suppressionFor({ name: "Chinese Taipei vs Brazil Masters", id: "wc:chinese-taipei-vs-brazil" }), null);
  assert.equal(
    applyEventGuards([ev({ id: "wc:chinese-taipei-vs-brazil", name: "Chinese Taipei vs Brazil Masters" })], {}, NOW).length,
    1,
  );
});

test("404/410 hides; date mismatch hides; match ok", () => {
  assert.equal(judgeCheck(ev(), 404, "", NOW).hidden, true);
  assert.equal(judgeCheck(ev(), 410, "", NOW).hidden, true);
  const html = '<div data-event-start="2026-12-10 6:00 am" data-event-end="2026-12-13 5:00 pm">';
  assert.deepEqual(parseOfficialDates(html), { start: "2026-12-10", end: "2026-12-13" });
  assert.equal(judgeCheck(ev(), 200, html, NOW).hidden, true);
  assert.equal(judgeCheck(ev({ start: "2026-12-10", end: "2026-12-13" }), 200, html, NOW).ok, true);
});

test("hidden check removes event", () => {
  const e = ev();
  const checks = { results: { [checkKey(e)]: { hidden: true, reason: "official page 404" } } };
  assert.equal(applyEventGuards([e], checks, NOW).length, 0);
});

test("current event without connector or fresh check is unconfirmed and never live", () => {
  const [r] = applyEventGuards([ev({ status: "live-path", onLive: true })], {}, NOW);
  assert.equal(r.onLive, false);
  assert.equal(r.status, "unconfirmed");
  assert.equal(r.todayEligible, false);
});

test("stale (>24h) official check does not qualify", () => {
  const e = ev();
  const checks = { results: { [checkKey(e)]: { ok: true, httpStatus: 200, datesMatch: true, checkedAt: "2026-11-02T00:00:00Z" } } };
  assert.equal(applyEventGuards([e], checks, NOW)[0].todayEligible, false);
});

test("fresh 200 + matching dates qualifies for today, but not live", () => {
  const e = ev();
  const checks = { results: { [checkKey(e)]: { ok: true, httpStatus: 200, datesMatch: true, checkedAt: "2026-11-04T06:00:00Z" } } };
  const [r] = applyEventGuards([e], checks, NOW);
  assert.equal(r.todayEligible, true);
  assert.equal(r.verification, "official");
  assert.equal(r.onLive, false);
});

test("verified connector can stay live", () => {
  const [r] = applyEventGuards([ev({ status: "live-path", onLive: true, connector: { type: "ppa", ppaEventId: "u", scorePath: "/api/ppa" } })], {}, NOW);
  assert.equal(r.onLive, true);
  assert.equal(r.verification, "connector");
});

test("GPA-only rows are unconfirmed, never live", () => {
  const [r] = applyEventGuards([ev({ id: "gpa:foo:2026-11-20", officialUrl: "", start: "2026-11-20", end: "2026-11-22", onLive: true, status: "live-path" })], {}, NOW);
  assert.equal(r.onLive, false);
  assert.equal(r.status, "unconfirmed");
});

test("listing pages / other-edition JSON-LD do not hide", () => {
  const many = '"startDate":"2026-11-02" "startDate":"2026-11-12"';
  assert.equal(parseOfficialDates(many), null);
  const stale = '"startDate": "2026-04-11", "endDate": "2026-04-18"';
  assert.equal(judgeCheck(ev({ start: "2027-04-17", end: "2027-04-24" }), 200, stale, NOW).hidden, false);
});
