import { discFromAppBracket, discFromDivName, polishAppRound } from "../netlify/functions/app-rounds.mjs";

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

console.log("app-rounds ok");
