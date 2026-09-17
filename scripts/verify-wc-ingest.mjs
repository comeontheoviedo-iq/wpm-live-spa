#!/usr/bin/env node
/**
 * Local verification of object-bounded World Cup ingest + rolling filter / tieId dedup.
 * Fetches Sporttora OOP + live, runs legacy window vs new object-bounded ingest,
 * asserts Sporttora truths for the five ghost NEXT pairs + England–Japan.
 * Does NOT deploy.
 */
import {
  ingest,
  ingestWindow,
  mapTies,
  dedupMatches,
  filterMatches,
  buildBrackets,
  keepNext,
  NAMES,
  name,
} from "../netlify/functions/wc-parse.mjs";

const HEADERS = { RSC: "1", "User-Agent": "WPM-LIVE/1.0" };
const OOP_URL = "https://www.sporttora.com/pwc2026/schedule?view=order-of-play&_rsc=wpm";
const LIVE_URL = "https://www.sporttora.com/pwc2026/live?_rsc=wpm";

function counts(matches) {
  const c = { FT: 0, NEXT: 0, LIVE: 0 };
  for (const m of matches) c[m.status] = (c[m.status] || 0) + 1;
  return c;
}

function findPair(matches, a, b, divHint) {
  return matches.find((m) => {
    const sides = new Set([m.a, m.b]);
    if (!sides.has(a) || !sides.has(b)) return false;
    if (divHint && !String(m.div).toLowerCase().includes(divHint.toLowerCase())) return false;
    return true;
  });
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAIL: " + msg);
}

function pairScore(m, a, b) {
  const [ta, tb] = String(m.score).split("-").map(Number);
  if (m.a === a && m.b === b) return [ta, tb];
  if (m.a === b && m.b === a) return [tb, ta];
  return [ta, tb];
}

function hasViet(s) {
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]/.test(
    s
  );
}

async function main() {
  console.log("Fetching Sporttora OOP + live…");
  const [oopRes, liveRes] = await Promise.all([
    fetch(OOP_URL, { headers: HEADERS }),
    fetch(LIVE_URL, { headers: HEADERS }),
  ]);
  assert(oopRes.ok, `OOP fetch ${oopRes.status}`);
  assert(liveRes.ok, `live fetch ${liveRes.status}`);
  const oopText = await oopRes.text();
  const liveText = await liveRes.text();
  console.log(`OOP ${oopText.length} chars · live ${liveText.length} chars`);

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // BEFORE — legacy window ingest
  const tiesOld = {};
  ingestWindow(oopText, tiesOld);
  ingestWindow(liveText, tiesOld);
  const mappedOld = mapTies(tiesOld);
  const uniqueOld = dedupMatches(mappedOld);
  const matchesOld = filterMatches(uniqueOld, today, now);
  const before = counts(matchesOld);

  // AFTER — object-bounded ingest
  const tiesNew = {};
  ingest(oopText, tiesNew);
  ingest(liveText, tiesNew);
  const mappedNew = mapTies(tiesNew);
  const uniqueNew = dedupMatches(mappedNew);
  const matchesNew = filterMatches(uniqueNew, today, now);
  const after = counts(matchesNew);
  const brackets = buildBrackets(uniqueNew, now);

  console.log("\n=== Counts (filtered matches) ===");
  console.log(
    `BEFORE (window): FT ${before.FT} · NEXT ${before.NEXT} · LIVE ${before.LIVE} · total ${matchesOld.length}`
  );
  console.log(
    `AFTER  (object): FT ${after.FT} · NEXT ${after.NEXT} · LIVE ${after.LIVE} · total ${matchesNew.length}`
  );

  // Dedup by id: unique count should equal distinct ids
  const ids = new Set(uniqueNew.map((m) => m.id));
  assert(ids.size === uniqueNew.length, `dedup by id: ${uniqueNew.length} rows but ${ids.size} ids`);
  console.log(`\n=== Dedup ===\n  PASS tieId/id dedup: ${uniqueNew.length} unique ids`);

  // Rolling filter: all FT kept; stale NEXT dropped
  const allFt = uniqueNew.filter((m) => m.status === "FT");
  const ftInMatches = matchesNew.filter((m) => m.status === "FT");
  assert(
    ftInMatches.length === allFt.length,
    `rolling filter must keep all FT: filtered ${ftInMatches.length} vs unique FT ${allFt.length}`
  );
  for (const m of matchesNew.filter((m) => m.status === "NEXT")) {
    assert(keepNext(m, now), `filtered NEXT should pass keepNext: ${m.id} ${m.start}`);
  }
  const staleNextUnique = uniqueNew.filter((m) => m.status === "NEXT" && !keepNext(m, now));
  for (const m of staleNextUnique) {
    assert(!matchesNew.some((x) => x.id === m.id), `stale NEXT ${m.id} should be filtered out`);
  }
  console.log(
    `  PASS rolling filter: all ${allFt.length} FT kept; NEXT kept ${after.NEXT}; stale NEXT dropped ${staleNextUnique.length}`
  );

  // Round labels: no empty/"Round" dump when roundNum exists
  const withNum = uniqueNew.filter((m) => m.roundNum != null);
  assert(withNum.length > 0, "expected ties with roundNum");
  const badRound = withNum.filter((m) => !m.round || m.round === "Round");
  assert(
    badRound.length === 0,
    `roundNum ties with empty/generic Round: ${badRound.slice(0, 3).map((m) => m.id + ":" + m.round)}`
  );
  const bracketRounds = Object.values(brackets).flatMap((r) => Object.keys(r));
  assert(
    !bracketRounds.every((r) => r === "Round"),
    "brackets collapsed to single Round bucket"
  );
  console.log(
    `  PASS rounds: ${withNum.length} ties labeled (sample: ${[...new Set(withNum.map((m) => m.round))].slice(0, 8).join(", ")})`
  );

  // Bracket stale NEXT hidden
  let bracketNext = 0;
  for (const div of Object.values(brackets)) {
    for (const arr of Object.values(div)) {
      for (const e of arr) if (e.status === "NEXT") bracketNext++;
    }
  }
  for (const m of staleNextUnique) {
    for (const div of Object.values(brackets)) {
      for (const arr of Object.values(div)) {
        assert(!arr.some((e) => e.id === m.id), `stale NEXT ${m.id} in brackets`);
      }
    }
  }
  console.log(`  PASS brackets: stale NEXT hidden; remaining NEXT entries ${bracketNext}`);

  // Names: no Vietnamese diacritics left on match sides
  const vietSides = matchesNew.filter((m) => hasViet(m.a) || hasViet(m.b));
  assert(
    vietSides.length === 0,
    `Vietnamese labels remain: ${vietSides.slice(0, 5).map((m) => `${m.a} vs ${m.b}`)}`
  );
  // Spot-check key NAMES
  for (const [vi, en] of [
    ["Pháp", "France"],
    ["Đức", "Germany"],
    ["Hà Lan", "Netherlands"],
    ["Nhật Bản", "Japan"],
    ["Thái Lan", "Thailand"],
    ["Séc", "Czechia"],
    ["Bỉ", "Belgium"],
    ["Nam Phi", "South Africa"],
    ["Quần đảo Cayman", "Cayman Islands"],
    ["Ý", "Italy"],
  ]) {
    assert(name(vi) === en, `NAMES[${vi}] => ${name(vi)} want ${en}`);
  }
  console.log(`  PASS NAMES: ${Object.keys(NAMES).length} mappings; no VIET sides in filtered matches`);

  // Ghost NEXT ids
  const ghostChecks = [
    { suffix: "default__m34", label: "m34" },
    { suffix: "default__m24", label: "m24" },
    { suffix: "default__m38", label: "m38" },
    { suffix: "default__m4", label: "m4", exactEnd: true },
    { suffix: "default__m61", label: "m61" },
  ];

  console.log("\n=== Ghost NEXT ids (should not be the five wrong pairs stuck NEXT) ===");
  for (const g of ghostChecks) {
    const byId = matchesNew.filter((m) => {
      const id = m.id;
      if (g.label === "m4") return /(^|-)m4$/.test(id);
      return id.endsWith(`-${g.label}`) || id.includes(`-${g.label}-`);
    });
    const row = byId[0];
    if (!row) {
      console.log(`  ${g.label}: not in filtered matches (ok if scheduled empty filtered or FT elsewhere)`);
    } else {
      console.log(`  ${g.label}: ${row.status} ${row.a} vs ${row.b} ${row.score} (${row.id})`);
    }
  }

  // Truth cases
  const cases = [
    {
      name: "Chinese Taipei vs Brazil Masters",
      a: "Chinese Taipei",
      b: "Brazil",
      div: "Masters",
      expectWinner: "Brazil",
      expectScore: [0, 3],
      tieSuffix: "m35",
    },
    {
      name: "India vs Chinese Taipei Juniors",
      a: "India",
      b: "Chinese Taipei",
      div: "Juniors",
      expectWinner: "India",
      expectScore: [3, 0],
      tieSuffix: "m25",
    },
    {
      name: "New Zealand vs Australia Masters",
      a: "New Zealand",
      b: "Australia",
      div: "Masters",
      expectWinner: "Australia",
      expectScore: [0, 3],
      tieSuffix: "m39",
    },
    {
      name: "USA vs Brazil Masters",
      a: "USA",
      b: "Brazil",
      div: "Masters",
      expectWinner: "USA",
      expectScore: [3, 0],
      tieSuffix: "m40",
    },
    {
      name: "South Africa vs Samoa Seniors",
      a: "South Africa",
      b: "Samoa",
      div: "Seniors",
      expectWinner: "South Africa",
      expectScore: [3, 0],
      tieSuffix: "m62",
    },
  ];

  console.log("\n=== Five Sporttora truths ===");
  for (const c of cases) {
    const m = findPair(matchesNew, c.a, c.b, c.div);
    assert(m, `${c.name}: not found in matches`);
    assert(m.status === "FT", `${c.name}: status=${m.status} want FT`);
    const [sa, sb] = pairScore(m, c.a, c.b);
    assert(
      sa === c.expectScore[0] && sb === c.expectScore[1],
      `${c.name}: score ${sa}-${sb} (as ${c.a}-${c.b}) want ${c.expectScore[0]}-${c.expectScore[1]} (got raw ${m.a} ${m.score} ${m.b})`
    );
    const winnerSide = sa > sb ? c.a : c.b;
    assert(winnerSide === c.expectWinner, `${c.name}: winner ${winnerSide} want ${c.expectWinner}`);
    assert(
      String(m.id).includes(c.tieSuffix),
      `${c.name}: id ${m.id} should include ${c.tieSuffix}`
    );
    console.log(`  PASS ${c.name}: FT ${m.score} (${m.a} vs ${m.b}) id=${m.id}`);
  }

  // England vs Japan
  console.log("\n=== England vs Japan ===");
  const ej = findPair(matchesNew, "England", "Japan", "Open");
  assert(ej, "England vs Japan not found");
  assert(ej.status === "FT", `England-Japan status=${ej.status}`);
  const [ea, eb] = pairScore(ej, "England", "Japan");
  assert(ea === 3 && eb === 4, `England-Japan score ${ea}-${eb} want 3-4`);
  const db = (ej.lines || []).find((l) => l.disc === "Dreambreaker");
  assert(db, "Dreambreaker line missing");
  assert(db.score === "16–20" || db.score === "16-20", `DB score ${db.score} want 16–20`);
  assert(db.winner === "Japan", `DB winner ${db.winner} want Japan`);
  console.log(`  PASS England vs Japan FT ${ej.score}; Dreambreaker ${db.score} ${db.winner}`);

  // Zero FT 0-0
  console.log("\n=== FT 0-0 guard ===");
  const ft00 = matchesNew.filter((m) => m.status === "FT" && (m.score === "0-0" || m.score === "0–0"));
  assert(ft00.length === 0, `FT 0-0 count ${ft00.length}`);
  console.log("  PASS zero FT matches with score 0-0");

  // Ghost NEXT pairs: the five *named* pairs must not be NEXT
  console.log("\n=== Named pairs must not be NEXT ghosts ===");
  for (const c of cases) {
    const m = findPair(matchesNew, c.a, c.b, c.div);
    assert(m && m.status === "FT", `${c.name} still NEXT or missing`);
  }
  console.log("  PASS all five named pairs are FT (ghost NEXT gone)");

  // NEXT count sensible (no ancient ghosts)
  assert(after.NEXT <= 20, `NEXT count ${after.NEXT} looks inflated`);
  console.log("\n=== Summary ===");
  console.log(
    `PASS — box-off OK. Filtered: FT ${after.FT} / NEXT ${after.NEXT} / LIVE ${after.LIVE} (window was FT ${before.FT} / NEXT ${before.NEXT} / LIVE ${before.LIVE})`
  );
}

main().catch((err) => {
  console.error("\nFAIL:", err.message || err);
  process.exit(1);
});
