/**
 * Live Den scan: APP Overland 18453 day truth.
 * Wazir–Dussault Final and Bower–Camron Bronze must date to Sunday 20 Sep,
 * not Friday 18. Soft-fail on Den 429.
 */
import { keepAppMatch, matchBoardDate, matchHasClock } from "../netlify/functions/app-dates.mjs";

const DEN = "https://denlive.pickleballden.com";
const ID = "18453";
const TODAY = "2026-09-18";
const SUN = "2026-09-20";
const TZ = "America/Chicago";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "WPM-LIVE/1.0", Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

function sideName(team) {
  const names = (team?.players || []).map((p) => p?.name || "").filter(Boolean);
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  return names.map((n) => n.split(/\s+/).slice(-1)[0]).join(" / ");
}

async function main() {
  let br;
  try {
    br = await fetchJson(`${DEN}/api/tournament-brackets?tournamentId=${ID}`);
  } catch (e) {
    console.log(JSON.stringify({ ok: false, residual: "Den 429/soft-fail", error: String(e.message || e) }, null, 2));
    process.exit(0);
  }
  const eventEnd = br?.tournament?.endDate;
  const brackets = br?.brackets?.content || [];
  const want = brackets.filter((b) => /Pro Singles/.test(b.bracketName || "") && !/Backdraw|AARP/.test(b.bracketName || ""));
  const rows = [];
  for (const b of want) {
    let payload;
    try {
      payload = await fetchJson(`${DEN}/api/bracket-matches?bracketId=${b.bracketId}&size=200`);
    } catch (e) {
      console.log(JSON.stringify({ ok: false, residual: "Den 429/soft-fail", bracket: b.bracketName, error: String(e.message || e) }, null, 2));
      process.exit(0);
    }
    const content = payload?.payload?.content || payload?.content || [];
    for (const m of content) {
      const a = sideName(m.team1);
      const bnm = sideName(m.team2);
      if (!/Wazir|Dussault|Bower|Camron/.test(a + " " + bnm)) continue;
      const date = matchBoardDate(m, { bracketDate: b.startDate, eventEndDate: eventEnd });
      const mapped = {
        id: m.matchId,
        a,
        b: bnm,
        matchType: m.matchType,
        status: m.status,
        startTime: m.startTime,
        scheduledTime: m.scheduledTime,
        date,
        hasClock: matchHasClock(m),
        keepFri: keepAppMatch({ status: m.completed ? "FT" : "NEXT", date, start: "" }, TODAY, eventEnd),
      };
      rows.push(mapped);
    }
  }
  const medals = rows.filter((r) => r.matchType === "FINAL" || r.matchType === "THIRD_PLACE");
  const wazir = medals.find((r) => /Wazir/.test(r.a + r.b) && r.matchType === "FINAL");
  const bronze = medals.find((r) => /Bower/.test(r.a + r.b) && r.matchType === "THIRD_PLACE");
  const fail = [];
  if (!wazir) fail.push("missing Wazir Final");
  if (!bronze) fail.push("missing Bower Bronze");
  if (wazir && wazir.date === TODAY) fail.push("Wazir Final still Friday");
  if (bronze && bronze.date === TODAY) fail.push("Bower Bronze still Friday");
  if (wazir && wazir.date !== SUN) fail.push(`Wazir Final date ${wazir.date} ≠ ${SUN}`);
  if (bronze && bronze.date !== SUN) fail.push(`Bower Bronze date ${bronze.date} ≠ ${SUN}`);
  if (wazir && wazir.hasClock) fail.push("Wazir Final unexpectedly has a match clock");
  if (eventEnd !== SUN) fail.push(`tournament.endDate ${eventEnd} ≠ ${SUN}`);

  const clientFri = (m) => m.date === TODAY; // default today board, no LIVE
  const clientSun = (m) => m.date === SUN;

  const out = {
    ok: fail.length === 0,
    tz: TZ,
    eventEnd,
    medals: medals.map((m) => ({ id: m.id, a: m.a, b: m.b, type: m.matchType, date: m.date, keepFri: m.keepFri })),
    fridayTodayShowsFinals: medals.some(clientFri),
    sundayTabShowsFinals: medals.every(clientSun),
    fail,
  };
  console.log(JSON.stringify(out, null, 2));
  if (fail.length) process.exit(1);
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, residual: "Den 429/soft-fail", error: String(e.message || e) }, null, 2));
  process.exit(0);
});
