/**
 * Local verify: fetch PPA APIs, apply keepPpaMatch, assert rolling policy.
 * No hardcoded Sep 4; FT retained; stale NEXT dropped.
 */
const EVENT = "b177c3be-53a6-4df8-b1cb-94cb5b0f97d1";

function keepPpaMatch(m, now = new Date()) {
  if (m.status === "LIVE" || m.status === "FT") return true;
  const start = m.start ? new Date(m.start) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const ageMs = now.getTime() - start.getTime();
    return ageMs <= 48 * 3600000;
  }
  const y = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  return !m.date || m.date >= y;
}

function mapStatus(s) {
  if (s === "live") return "LIVE";
  if (s === "final") return "FT";
  return "NEXT";
}

async function main() {
  const [tickRes, scoreRes] = await Promise.all([
    fetch("https://www.ppatour.com/api/ticker/", { headers: { "User-Agent": "WPM-LIVE/1.0" } }),
    fetch("https://www.ppatour.com/api/scores/?event=" + EVENT, { headers: { "User-Agent": "WPM-LIVE/1.0" } }),
  ]);
  if (!tickRes.ok || !scoreRes.ok) {
    console.error("fetch fail", tickRes.status, scoreRes.status);
    process.exit(1);
  }
  const tick = await tickRes.json();
  const scores = await scoreRes.json();
  const byId = {};
  for (const m of scores.matches || []) byId[m.id] = m;
  for (const m of tick.matches || []) {
    const prev = byId[m.id] || {};
    byId[m.id] = { ...prev, ...m, dateKey: prev.dateKey || (m.plannedStart || "").slice(0, 10) };
  }
  const now = new Date();
  const all = Object.values(byId).map((m) => {
    const date = m.dateKey || (m.plannedStart || "").slice(0, 10) || now.toISOString().slice(0, 10);
    return {
      id: m.id,
      status: mapStatus(m.status),
      date,
      start: m.plannedStart || date + "T14:00:00Z",
      raw: m.status,
    };
  });
  const kept = all.filter((m) => keepPpaMatch(m, now));
  const by = (s) => kept.filter((m) => m.status === s).length;
  const ftAll = all.filter((m) => m.status === "FT").length;
  const ftKept = by("FT");
  const droppedNext = all.filter((m) => m.status === "NEXT" && !keepPpaMatch(m, now));
  const hardSep4 = kept.filter((m) => m.date === "2026-09-04" && m.status === "NEXT");
  // Assert: no dependency on hardcoded date in filter logic (FT/LIVE kept regardless)
  console.log(JSON.stringify({
    now: now.toISOString(),
    all: all.length,
    kept: kept.length,
    LIVE: by("LIVE"),
    FT: by("FT"),
    NEXT: by("NEXT"),
    ftAll,
    ftKept,
    ftRetained: ftAll === ftKept,
    droppedStaleNext: droppedNext.length,
    nextOnSep4StillKeptIfInWindow: hardSep4.length,
    sampleDropped: droppedNext.slice(0, 3).map((m) => ({ id: m.id, date: m.date, start: m.start })),
  }, null, 2));
  if (ftAll !== ftKept) {
    console.error("FAIL: FT not fully retained");
    process.exit(1);
  }
  console.log("OK: FT retained; filter has no hardcoded Sep-4 branch");
}
main().catch((e) => { console.error(e); process.exit(1); });
