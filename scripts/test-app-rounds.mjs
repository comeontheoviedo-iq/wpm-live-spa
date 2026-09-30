import {
  appDrawQuery,
  appSlotPhase,
  appStructureLine,
  appWallBands,
  bracketIndexEntry,
  bracketReaderStatus,
  discFromAppBracket,
  discFromDivName,
  playoffBlurb,
  polishAppRound,
} from "../netlify/functions/app-rounds.mjs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Men's Pro Singles Overland: totalRounds 6, matchType on last round
assert(polishAppRound({ round: 6, roundDisplayName: "Round 6", matchType: "FINAL", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "Final", "MPS Final");
assert(polishAppRound({ round: 6, roundDisplayName: "Round 6", matchType: "THIRD_PLACE", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "Bronze", "MPS Bronze");
assert(polishAppRound({ round: 5, roundDisplayName: "Round 5", matchType: "STANDARD", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "SF", "MPS SF");
assert(polishAppRound({ round: 4, roundDisplayName: "Round 4", matchType: "STANDARD", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "QF", "MPS QF");
assert(polishAppRound({ round: 3, roundDisplayName: "Round 3", matchType: "STANDARD", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "R16", "MPS R16");
assert(polishAppRound({ round: 2, roundDisplayName: "Round 2", matchType: "STANDARD", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "R32", "MPS R32");
assert(polishAppRound({ round: 1, roundDisplayName: "Round 1", matchType: "STANDARD", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "R64", "MPS R64");

// Women's Pro Singles: totalRounds 4 — Round 6 is NOT Final here
assert(polishAppRound({ round: 4, roundDisplayName: "Round 4", matchType: "FINAL", totalRounds: 4, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "Final", "WPS Final");
assert(polishAppRound({ round: 3, roundDisplayName: "Round 3", matchType: "STANDARD", totalRounds: 4, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "SF", "WPS SF");
assert(polishAppRound({ round: 2, roundDisplayName: "Round 2", matchType: "STANDARD", totalRounds: 4, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "QF", "WPS QF");

// Mixed Pro Doubles: Round 2 is R32 not Final
assert(polishAppRound({ round: 2, roundDisplayName: "Round 2", matchType: "STANDARD", totalRounds: 6, bracketType: "SingleEliminationBronze", hasThirdPlaceMatch: true }) === "R32", "XD R32");

// Round Robin must stay Round N
assert(polishAppRound({ round: 6, roundDisplayName: "Round 6", matchType: "STANDARD", totalRounds: 6, bracketType: "RoundRobin", hasThirdPlaceMatch: true }) === "Round 6", "RR stays Round 6");

// disc
assert(discFromAppBracket({ teamType: "MensSingleFull", bracketName: "Men's Pro Singles" }) === "MS", "MS");
assert(discFromAppBracket({ teamType: "WomensSingleFull", bracketName: "Women's Pro Singles" }) === "WS", "WS");
assert(discFromAppBracket({ teamType: "MixedDoubles", bracketName: "Mixed Pro Doubles" }) === "XD", "XD");
assert(discFromDivName("Women's Doubles · Quarter Finals") === "WD", "PPA WD");
assert(discFromDivName("Men's Singles") === "MS", "PPA MS");

// Columbus-shaped index: pending elim is not LIVE, pools stay pools
const mensPro = bracketIndexEntry({
  bracketId: 191491,
  bracketName: "Men's Pro Singles",
  bracketType: "DoubleEliminationConsolation9thPlace",
  bracketStructureType: "DOUBLE_ELIMINATION_9TH_PLACE",
  status: "Pending",
  totalRounds: 0,
  teamType: "MensSingleFull",
});
assert(mensPro.phase === "elim", "MPS phase");
assert(mensPro.status === "pending", "MPS pending");
assert(mensPro.status !== "LIVE", "MPS not LIVE");
assert(mensPro.line === "Elimination", "MPS line");
assert(mensPro.rounds == null, "pending elim has no invented round count");

const pool = bracketIndexEntry({
  bracketName: "Men's Singles 4.5/5.0: 7-34+,35+",
  bracketType: "RoundRobin",
  bracketStructureType: "ROUND_ROBIN",
  status: "Pending",
  playoffType: "SeededEliminationBronze",
  poolNumber: 2,
  poolCount: 2,
  totalRounds: 3,
});
assert(pool.phase === "pool", "pool phase");
assert(pool.poolNumber === 2, "pool number");
assert(pool.playoff === "then seeded playoff", "playoff blurb");
assert(pool.line === "Pools · Pool 2 of 2 · 3 rounds · then seeded playoff", "pool line");
assert(playoffBlurb("TopFour") === "then top 4", "top 4");
assert(bracketReaderStatus("RUNNING") === "in-progress", "running bracket");
assert(bracketReaderStatus("RUNNING") !== "LIVE", "running is not a LIVE chip");
assert(appSlotPhase({ format: "pool", round: "Round 1" }) === "pool", "format pool");
assert(appSlotPhase({ format: "ko", round: "Final" }) === "elim", "format ko");

const bands = appWallBands([
  { round: "Round 1", format: "pool", a: "Ada", b: "Bea", status: "NEXT" },
  { round: "Round 2", format: "pool", a: "Cy", b: "Dee", status: "NEXT" },
  { round: "QF", format: "ko", a: "Eve", b: "Fay", status: "NEXT" },
  { round: "SF", format: "ko", a: "TBD", b: "Gia", status: "NEXT" },
  { round: "Round", format: "ko", a: "Hai", b: "Ivy", status: "FT" },
  { round: "R64", format: "ko", a: "Jo", b: "Kay", status: "FT" },
]);
assert(JSON.stringify(bands.pool) === JSON.stringify(["Round 1", "Round 2"]), "pools kept beside elim");
assert(JSON.stringify(bands.elim) === JSON.stringify(["QF"]), "ghost SF, bare Round, cold R64 dropped");

const hot = appWallBands([
  { round: "R32", format: "ko", a: "Jo", b: "Kay", status: "NEXT" },
  { round: "QF", format: "ko", a: "Eve", b: "Fay", status: "NEXT" },
  { round: "Final", format: "ko", a: "Ann", b: "Bea", status: "NEXT" },
]);
assert(JSON.stringify(hot.elim) === JSON.stringify(["R32", "QF", "Final"]), "NEXT early round stays");
assert(appStructureLine({ phase: "elim" }) === "Elimination", "elim line");
assert(appDrawQuery({ div: "Men's Pro Singles", phase: "elim" }).includes("phase=elim"), "deep link phase");
assert(appDrawQuery({ div: "Men's Singles", phase: "pool", pool: 2 }).includes("pool=2"), "deep link pool");
assert(!appDrawQuery({ div: "Men's Pro Singles", phase: "elim" }).includes("pool="), "no empty pool");

console.log("app-rounds ok");
