#!/usr/bin/env node
/**
 * Identity + APP draw display: client copy stays honest, and the
 * in-browser wall bands match the tested helper.
 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { appWallBands } from "../netlify/functions/app-rounds.mjs";

const client = fs.readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
const shipped = fs.readFileSync(new URL("../site/index.html", import.meta.url), "utf8");

assert.match(shipped, /wpm-20261002d\.js/);
assert.match(shipped, /Coming soon|20261002d/);
assert.match(client, /function person-hero|class="person-hero"/);
assert.match(client, /WPR · Open mixed/);
assert.match(client, /Coming soon/);
assert.doesNotMatch(client, /Pro ELO/);
assert.doesNotMatch(client, /PickleLive/);
assert.match(client, /data-drawphase/);
assert.match(client, /Play starts soon/);

const start = client.indexOf("const APP_ELIM_LATE");
const end = client.indexOf("function appDivsForPhase");
assert.ok(start > 0 && end > start, "client wall helpers present");
const context = { console };
vm.runInNewContext(client.slice(start, end) + "\nthis.appWallBands = appWallBands;", context);

const slots = [
  { round: "Round 1", format: "pool", a: "Ada", b: "Bea", status: "NEXT" },
  { round: "QF", format: "ko", a: "Eve", b: "Fay", status: "NEXT" },
  { round: "SF", format: "ko", a: "TBD", b: "Gia", status: "NEXT" },
];
assert.equal(JSON.stringify(context.appWallBands(slots)), JSON.stringify(appWallBands(slots)));

const css = fs.readFileSync(new URL("../site/css/app.css", import.meta.url), "utf8");
assert.match(css, /\.person-hero/);
assert.match(css, /\.wpr-badge/);

console.log("identity ok");
