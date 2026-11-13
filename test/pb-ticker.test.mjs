import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LILLE,
  MLP_ASIA,
  buildMatchBoard,
  buildMatchupBoard,
  loadMlpAsia,
  loadPpaEu,
  pbStatus,
  resetTickerCache,
} from "../netlify/functions/pb-ticker.mjs";
import { ppaWallInstant } from "../netlify/functions/ppa-keep.mjs";
import { PPA_LIVE, PPA_LILLE, MLP_ASIA_SEASON, asCalendarRow } from "../netlify/functions/slate-events.mjs";
import { applyEventGuards } from "../netlify/functions/_shared/event-guard.mjs";
import { composeScores } from "../netlify/functions/_shared/scores-compose.mjs";

const lilleFeed = JSON.parse(fs.readFileSync(new URL("./fixtures/ppa-eu-lille-ticker.json", import.meta.url), "utf8"));
const mlpFeed = JSON.parse(fs.readFileSync(new URL("./fixtures/mlp-asia-ticker.json", import.meta.url), "utf8"));
const NOW = new Date("2026-11-13T16:00:00Z");

function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("status codes and the Paris wall-clock quirk", () => {
  assert.equal(pbStatus(2), "LIVE");
  assert.equal(pbStatus(4), "FT");
  assert.equal(pbStatus(1), "NEXT");
  assert.equal(pbStatus(3), "NEXT");
  assert.equal(pbStatus("COMPLETED_MATCHUP_STATUS"), "FT");
  assert.equal(pbStatus("IN_PROGRESS_MATCHUP_STATUS"), "LIVE");
  assert.equal(ppaWallInstant("2026-11-13T13:20:00Z", "Europe/Paris"), "2026-11-13T12:20:00.000Z");
});

test("Lille fixture maps live, final, and withdrawal without invented scores", () => {
  const matches = buildMatchBoard(lilleFeed.data.matches, LILLE, NOW);
  assert.equal(matches.length, lilleFeed.data.matches.length);
  assert.ok(matches.every((m) => m.tour === "ppa-eu"));
  assert.ok(matches.every((m) => m.eventKey === LILLE.eventKey));
  assert.ok(matches.every((m) => m.score !== "0-0"));

  const live = matches.find((m) => m.id === "ppa-eu-7e0cd704-abd7-46e4-8ed3-0e230b6f92c6");
  assert.ok(live);
  assert.equal(live.status, "LIVE");
  assert.equal(live.tickerLive, true);
  assert.equal(live.a, "Myriam Enmer");
  assert.equal(live.b, "Viktoria Kanichova");
  assert.equal(live.score, "0-1");
  assert.equal(live.lines.length, 1);
  assert.equal(live.lines[0].score, "1–11");
  assert.equal(live.lines[0].live, false);
  assert.equal(live.date, "2026-11-13");
  assert.equal(live.court, "Court 6");
  assert.equal(live.venue, "JOCO Pickleball, Villeneuve d'Ascq");

  const ft = matches.find((m) => m.id === "ppa-eu-0318b756-2e1f-4b06-ae8e-e92c2112d72d");
  assert.equal(ft.status, "FT");
  assert.equal(ft.score, "0-2");
  assert.equal(ft.lines.length, 2);
  assert.equal(ft.lines[0].score, "8–11");
  assert.equal(ft.lines[1].score, "7–11");

  const three = matches.find((m) => m.a === "Raquel Amaro");
  assert.equal(three.score, "1-2");
  assert.equal(three.lines.length, 3);

  const wd = matches.find((m) => /Biedermann/.test(m.a));
  assert.equal(wd.status, "FT");
  assert.equal(wd.score, "");
  assert.equal(wd.lines.length, 0);
  assert.match(wd.note, /Withdrawal/);
  assert.match(wd.note, /Martin Thomas/);

  const up = matches.find((m) => m.status === "NEXT");
  assert.ok(up);
  assert.equal(up.score, "");
  assert.equal(up.lines.length, 0);
});

test("MLP Asia fixture maps team scores and line games, and skips the unplayed DreamBreaker", () => {
  const matches = buildMatchupBoard(mlpFeed.data.matchups, MLP_ASIA, NOW);
  assert.equal(matches.length, 2);
  assert.ok(matches.every((m) => m.tour === "mlp-asia"));
  assert.ok(matches.every((m) => m.tour !== "app"));
  const helios = matches.find((m) => m.b === "Manila Helios");
  assert.equal(helios.a, "THE DOTS TOKYO");
  assert.equal(helios.score, "4-0");
  assert.equal(helios.status, "FT");
  assert.deepEqual(helios.lines.map((l) => l.disc), ["WD", "MD", "MX1", "MX2"]);
  assert.equal(helios.lines[0].score, "11–3");
  assert.equal(helios.date, "2026-11-13");
  assert.equal(helios.tz, "Asia/Tokyo");
  assert.equal(helios.venue, "Sansan Pickleball Court Ikebukuro");
  assert.match(helios.div, /Tokyo/);

  const stripes = matches.find((m) => m.b === "Malayan Stripes");
  assert.equal(stripes.score, "3-2");
  assert.deepEqual(stripes.lines.map((l) => `${l.disc} ${l.score}`), [
    "WD 6–11",
    "MD 11–4",
    "MX1 11–5",
    "MX2 4–11",
    "TB 21–19",
  ]);
  assert.equal(stripes.lines[4].winner, "THE DOTS TOKYO");

  const hongKong = buildMatchupBoard(
    [
      {
        uuid: "hk-1",
        teamOneTitle: "Hong Kong Smash",
        teamTwoTitle: "THE DOTS TOKYO",
        teamOneScore: 0,
        teamTwoScore: 0,
        matchupStatus: "SCHEDULED_MATCHUP_STATUS",
        winner: 0,
        plannedStartDate: "2026-11-14T10:00:00Z",
        venue: "Hong Kong",
        timezone: { ianaTzIdentifier: "Asia/Hong_Kong" },
        matchupGroupTitle: "MLP Asia 2026 - Hong Kong",
        divisionTitle: "Pro",
        matches: [],
      },
    ],
    MLP_ASIA,
    NOW
  );
  assert.equal(hongKong.length, 1);
  assert.equal(hongKong[0].tour, "mlp-asia");
  assert.equal(hongKong[0].date, "2026-11-14");
  assert.match(hongKong[0].div, /Hong Kong/);
  assert.equal(hongKong[0].score, "");
  assert.equal(hongKong[0].status, "NEXT");
});

test("handlers paginate, fail soft, and do not replace a PPA board", async () => {
  resetTickerCache();
  let pages = 0;
  const first = await loadPpaEu({
    now: NOW,
    fetchImpl: async (url) => {
      pages += 1;
      const page = Number(new URL(url).searchParams.get("current_page"));
      if (page === 1) {
        return jsonRes({
          data: { totalRecords: 2, matches: lilleFeed.data.matches.slice(0, 1) },
        });
      }
      return jsonRes({
        data: { totalRecords: 2, matches: lilleFeed.data.matches.slice(1, 2) },
      });
    },
  });
  assert.equal(pages, 2);
  assert.equal(first.matches.length, 2);
  assert.equal(first.delayed, false);
  assert.equal(first.event.tour, "ppa-eu");
  assert.equal(first.event.id, LILLE.id);

  const stale = await loadPpaEu({
    now: NOW,
    fetchImpl: async () => {
      throw new Error("upstream down");
    },
  });
  assert.equal(stale.delayed, true);
  assert.equal(stale.matches.length, 2);
  assert.equal(stale.reader, "Scores delayed");

  resetTickerCache();
  const cold = await loadMlpAsia({
    now: NOW,
    fetchImpl: async () => jsonRes({ error: "nope" }, 503),
  });
  assert.equal(cold.delayed, true);
  assert.deepEqual(cold.matches, []);

  let mlpUrl = "";
  const ok = await loadMlpAsia({
    now: NOW,
    fetchImpl: async (url) => {
      mlpUrl = url;
      return jsonRes(mlpFeed);
    },
  });
  assert.match(mlpUrl, /season_uuid=efd7f2ff-351a-4ad4-81c8-75cc009ec39c/);
  assert.match(mlpUrl, /team_league_uuid=3a6def91-3e1c-4f81-adb5-0308a490a2b9/);
  assert.doesNotMatch(mlpUrl, /matchup_uuid=/);
  assert.equal(ok.matches.length, 2);
  assert.equal(ok.matches[0].tour, "mlp-asia");

  const board = composeScores(
    {
      updated: "2026-09-04T11:51:00Z",
      heroByDate: {},
      matches: [{ id: "ppa-worlds", tour: "ppa", a: "A", b: "B", status: "FT", score: "2-0" }],
    },
    { ppa: { updated: "2026-11-13T16:00:00Z", matches: [{ id: "ppa-worlds", tour: "ppa", a: "A", b: "B", status: "LIVE", score: "1-0" }] }, "ppa-eu": first, "mlp-asia": ok },
    NOW
  );
  assert.equal(board.matches.find((m) => m.tour === "ppa").status, "LIVE");
  assert.equal(board.matches.find((m) => m.tour === "ppa").score, "1-0");
  assert.equal(board.matches.filter((m) => m.tour === "ppa-eu").length, 2);
  assert.equal(board.matches.filter((m) => m.tour === "mlp-asia").length, 2);
});

test("slate cards stay live-path when the connector is real", () => {
  assert.equal(PPA_LIVE.scorePath, "/api/ppa");
  assert.notEqual(PPA_LILLE.connector.scorePath, "/api/ppa");
  const now = Date.parse("2026-11-13T12:00:00Z");
  for (const seed of [PPA_LILLE, MLP_ASIA_SEASON]) {
    const [row] = applyEventGuards([asCalendarRow(seed, "2026-11-13")], {}, now);
    assert.equal(row.status, "live-path", seed.id);
    assert.equal(row.onLive, true, seed.id);
    assert.equal(row.verification, "connector", seed.id);
    assert.equal(row.todayEligible, true, seed.id);
    assert.notEqual(row.connector.type, "none", seed.id);
    assert.ok(row.connector.scorePath, seed.id);
  }
  const [ottawa] = applyEventGuards(
    [asCalendarRow({ id: "slate:x", name: "Ottawa", start: "2026-11-13", end: "2026-11-13", status: "results-only", onLive: false, connector: { type: "none" }, officialUrl: "" }, "2026-11-13")],
    {},
    now
  );
  assert.equal(ottawa.verification, "unconfirmed");
  assert.equal(ottawa.onLive, false);
});

test("worker routes the new feeds and /api/ppa is untouched", () => {
  const worker = fs.readFileSync(new URL("../cloudflare/src/index.js", import.meta.url), "utf8");
  assert.match(worker, /"\/api\/ppa-eu":/);
  assert.match(worker, /"\/api\/mlp-asia":/);
  assert.match(worker, /"\/api\/ppa":/);
  const ppa = fs.readFileSync(new URL("../netlify/functions/ppa.mts", import.meta.url), "utf8");
  assert.doesNotMatch(ppa, /pb-ticker|ppa-eu|mlp-asia/);
  assert.match(ppa, /path: "\/api\/ppa"/);
  const client = fs.readFileSync(new URL("../site/js/wpm-20261104a.js", import.meta.url), "utf8");
  assert.match(client, /overlay\("\/api\/ppa-eu", "ppa-eu"\)/);
  assert.match(client, /overlay\("\/api\/mlp-asia", "mlp-asia"\)/);
});
