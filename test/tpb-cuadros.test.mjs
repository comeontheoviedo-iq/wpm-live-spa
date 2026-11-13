import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  SOMONTES,
  SOMONTES_CUADROS_ID,
  cuadrosUrl,
  loadTpb,
  parseCuadrosHtml,
  pinFor,
  resetTpbCache,
} from "../netlify/functions/tpb-cuadros.mjs";
import { OFFICIAL_SCHEDULE } from "../netlify/functions/official-schedule.mjs";
import { applyEventGuards } from "../netlify/functions/_shared/event-guard.mjs";
import { asCalendarRow } from "../netlify/functions/slate-events.mjs";
import { composeScores } from "../netlify/functions/_shared/scores-compose.mjs";

const fixture = JSON.parse(
  fs.readFileSync(new URL("./fixtures/tpb-somontes-cuadros.json", import.meta.url), "utf8")
);

/**
 * Stylesheet shape for a live card and a finished card.
 * The 14:49Z capture had zero tpgc-m-live / tpgc-m-fin / tpgc-sc nodes.
 * Points below are parser input, not a reported Somontes result.
 */
const LIVE_FIN = `
<div class="tpgc-pane" data-g="tab" data-k="horario">
<div class="tpgc-pane" data-g="dia" data-k="d2026-11-13">
<div class="tpgc-m tpgc-m-live"><div class="tpgc-meta"><span class="tpgc-time">16:40</span><span class="tpgc-court">Pista 3</span><span class="tpgc-cat">Individual Masculino 4.0 · Grupo A</span><span class="tpgc-st tpgc-st-live">En juego</span></div><div class="tpgc-team"><span class="tpgc-names">Ana López</span><span class="tpgc-sc"><b>11</b><b>3</b></span></div><div class="tpgc-team"><span class="tpgc-names">Luis Pérez</span><span class="tpgc-sc"><b>7</b><b>5</b></span></div></div>
<div class="tpgc-m tpgc-m-fin"><div class="tpgc-meta"><span class="tpgc-time">16:00</span><span class="tpgc-court">Pista 5</span><span class="tpgc-cat">Individual Femenino 3.5 · Grupo B</span><span class="tpgc-st tpgc-st-fin">Final</span></div><div class="tpgc-team tpgc-win"><span class="tpgc-names">Marta Soler</span><span class="tpgc-sc"><b>11</b><b>11</b></span></div><div class="tpgc-team"><span class="tpgc-names">Nuria Vidal</span><span class="tpgc-sc"><b>8</b><b>6</b></span></div></div>
<div class="tpgc-m tpgc-m-pend"><div class="tpgc-meta"><span class="tpgc-time">18:00</span><span class="tpgc-court">Pista 5</span><span class="tpgc-cat">Individual Femenino 3.5 · Grupo B</span></div><div class="tpgc-team"><span class="tpgc-names">Marta Soler</span><span class="tpgc-sc"><b>0</b></span></div><div class="tpgc-team"><span class="tpgc-names">Nuria Vidal</span><span class="tpgc-sc"><b>0</b></span></div></div>
</div></div>`;

function jsonRes(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("recorded Somontes fixture is pending only and ignores 0-0 group tables", () => {
  assert.equal(fixture.statesAtCapture["tpgc-m-live"], 0);
  assert.equal(fixture.statesAtCapture["tpgc-m-fin"], 0);
  assert.equal(fixture.statesAtCapture["tpgc-sc"], 0);
  const matches = parseCuadrosHtml(fixture.body, SOMONTES, fixture.top);
  assert.equal(matches.length, 5);
  assert.ok(matches.every((m) => m.tour === "tpb"));
  assert.ok(matches.every((m) => m.status === "NEXT"));
  assert.ok(matches.every((m) => m.score === ""));
  assert.ok(matches.every((m) => m.lines.length === 0));
  assert.ok(matches.every((m) => m.score !== "0-0"));
  assert.equal(matches.some((m) => m.a === "David Álvarez"), false);

  const aitor = matches.find((m) => m.a === "Aitor Aramburu");
  assert.ok(aitor);
  assert.equal(aitor.b, "Miguel Alonso");
  assert.equal(aitor.date, "2026-11-13");
  assert.equal(aitor.court, "Pista 1");
  assert.equal(aitor.disc, "MS");
  assert.match(aitor.div, /Individual Masculino 3\.5 · Grupo B/);
  assert.equal(aitor.start, "2026-11-13T15:00:00.000Z");
  assert.equal(aitor.eventKey, SOMONTES.eventKey);
  assert.equal(aitor.venue, "Club Deportivo Somontes, Madrid");

  const mix = matches.find((m) => /Paloma Díaz/.test(m.a));
  assert.equal(mix.disc, "XD");
  assert.equal(mix.date, "2026-11-14");
  assert.match(mix.a, /Alvaro Lacalle/);
  assert.match(mix.b, /Paula Álvarez/);

  const adrian = matches.find((m) => /Adrian Rojo/.test(m.a));
  assert.equal(adrian.date, "2026-11-14");
  assert.equal(adrian.court, "Pista 2");
  assert.equal(adrian.disc, "MD");
  assert.equal(adrian.score, "");
  assert.match(adrian.div, /Dobles Masculino/);

  const ph = matches.find((m) => /Grupo A/.test(m.a));
  assert.ok(ph);
  assert.equal(ph.status, "NEXT");
  assert.equal(ph.score, "");
  assert.match(ph.b, /Grupo C/);
});

test("live and finished cards use printed game scores only", () => {
  const matches = parseCuadrosHtml(LIVE_FIN, SOMONTES, fixture.top);
  const live = matches.find((m) => m.status === "LIVE");
  assert.ok(live);
  assert.equal(live.tickerLive, true);
  assert.equal(live.a, "Ana López");
  assert.equal(live.b, "Luis Pérez");
  assert.equal(live.score, "1-0");
  assert.deepEqual(
    live.lines.map((l) => `${l.disc} ${l.score}${l.live ? " live" : ""}`),
    ["G1 11–7", "G2 3–5 live"]
  );
  assert.match(live.note, /In play G2/);

  const ft = matches.find((m) => m.status === "FT");
  assert.equal(ft.a, "Marta Soler");
  assert.equal(ft.score, "2-0");
  assert.deepEqual(ft.lines.map((l) => l.score), ["11–8", "11–6"]);
  assert.equal(ft.disc, "WS");

  const pending = matches.find((m) => m.status === "NEXT");
  assert.equal(pending.score, "");
  assert.equal(pending.lines.length, 0);
});

test("loadTpb caches upstream for 60s and fails soft", async () => {
  resetTpbCache();
  const now = new Date("2026-11-13T15:10:00Z");
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    assert.equal(url, cuadrosUrl(SOMONTES_CUADROS_ID));
    return jsonRes({ top: fixture.top, body: fixture.body });
  };
  const first = await loadTpb({ fetchImpl, now });
  assert.equal(first.delayed, false);
  assert.equal(first.matches.length, 5);
  assert.equal(first.cuadrosId, SOMONTES_CUADROS_ID);
  assert.equal(first.event.officialUrl, SOMONTES.officialUrl);
  const second = await loadTpb({ fetchImpl, now: new Date(now.getTime() + 30_000) });
  assert.equal(calls, 1);
  assert.equal(second.matches.length, 5);

  const failed = await loadTpb({
    fetchImpl: async () => {
      throw new Error("upstream down");
    },
    now: new Date(now.getTime() + 90_000),
  });
  assert.equal(failed.delayed, true);
  assert.equal(failed.matches.length, 5);
  assert.equal(failed.reader, "Scores delayed");

  resetTpbCache();
  const cold = await loadTpb({
    fetchImpl: async () => jsonRes({ nope: true }, 500),
    now,
  });
  assert.equal(cold.delayed, true);
  assert.deepEqual(cold.matches, []);

  const other = "abcdef0123456789abcdef";
  assert.equal(pinFor(other).id, other);
  assert.equal(pinFor("javascript:alert(1)").id, SOMONTES_CUADROS_ID);
  let seen = "";
  await loadTpb({
    id: other,
    now,
    fetchImpl: async (url) => {
      seen = url;
      return jsonRes({ top: "", body: fixture.body });
    },
  });
  assert.equal(seen, cuadrosUrl(other));
  resetTpbCache();
});

test("Somontes is a live-path connector and the other TPB rows stay results-only", () => {
  const som = OFFICIAL_SCHEDULE.find((e) => e.id === "official:tpb-somontes-2026");
  assert.equal(som.venue, "Club Deportivo Somontes, Madrid");
  assert.equal(som.officialUrl, "https://toppickleballtour.com/tour/somontes/");
  assert.equal(som.status, "live-path");
  assert.equal(som.onLive, true);
  assert.equal(som.connector.type, "url");
  assert.equal(som.connector.scorePath, "/api/tpb");
  const [row] = applyEventGuards(
    [asCalendarRow(som, "2026-11-13")],
    {},
    Date.parse("2026-11-13T15:00:00Z")
  );
  assert.equal(row.verification, "connector");
  assert.equal(row.status, "live-path");
  assert.equal(row.onLive, true);
  assert.equal(row.todayEligible, true);

  for (const id of ["official:tpb-almeria-2026", "official:tpb-andorra-2026"]) {
    const row = OFFICIAL_SCHEDULE.find((e) => e.id === id);
    assert.equal(row.connector.type, "none");
    assert.equal(row.status, "results-only");
    assert.equal(row.onLive, false);
    assert.equal(row.officialUrl, "https://toppickleballtour.com/");
  }

  const board = composeScores(
    {
      updated: "2026-09-04T11:51:00Z",
      heroByDate: {},
      matches: [{ id: "ppa-1", tour: "ppa", a: "A", b: "B", status: "FT", score: "2-0" }],
    },
    { tpb: { updated: "2026-11-13T15:10:00Z", matches: [{ id: "tpb-1", tour: "tpb", a: "Aitor Aramburu", b: "Miguel Alonso", status: "NEXT", score: "" }] } },
    new Date("2026-11-13T15:10:00Z")
  );
  assert.equal(board.matches.find((m) => m.tour === "ppa").score, "2-0");
  assert.equal(board.matches.find((m) => m.tour === "tpb").score, "");
});

test("worker route and the client overlay include /api/tpb", () => {
  const worker = fs.readFileSync(new URL("../cloudflare/src/index.js", import.meta.url), "utf8");
  assert.match(worker, /"\/api\/tpb":/);
  const client = fs.readFileSync(new URL("../site/js/wpm-20261104a.js", import.meta.url), "utf8");
  const legacy = fs.readFileSync(new URL("../js/wpm-20261102a.js", import.meta.url), "utf8");
  assert.match(client, /overlay\("\/api\/tpb", "tpb"\)/);
  assert.match(legacy, /overlay\("\/api\/tpb", "tpb"\)/);
  const scores = fs.readFileSync(new URL("../netlify/functions/scores.mts", import.meta.url), "utf8");
  assert.match(scores, /\/api\/tpb/);
});
