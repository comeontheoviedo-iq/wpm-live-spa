#!/usr/bin/env node
/**
 * Weekday desk radar (08:30 Europe/London routine).
 * Usage: node scripts/event-radar.mjs [--pretty] [--out path]
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildRadarReport } from "../netlify/functions/radar-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pretty = process.argv.includes("--pretty");
const outFlag = process.argv.indexOf("--out");
const outPath =
  outFlag >= 0 && process.argv[outFlag + 1]
    ? process.argv[outFlag + 1]
    : join(__dirname, "../docs/radar-latest.json");

const report = await buildRadarReport({
  prodBase: process.env.WPM_PROD_BASE || "https://live.worldpickleballmagazine.com",
});

const json = JSON.stringify(report, null, pretty ? 2 : 0);
writeFileSync(outPath, json + "\n");

const s = report.summary;
console.log(
  `radar ${report.generatedAt} · on_board=${s.on_board} missing=${s.missing} blocked=${s.blocked_by_intake} results_only=${s.results_only}`
);
for (const a of report.actions || []) {
  console.log(`  ${a.priority} [${a.tour}] ${a.name}: ${a.action}`);
}
if (!(report.actions || []).length) console.log("  (no P0/P1 actions)");
console.log("wrote", outPath);
