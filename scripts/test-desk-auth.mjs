#!/usr/bin/env node
/**
 * Desk session is an HMAC, not the secret. Body key still authorizes POSTs.
 */
import assert from "node:assert/strict";
import {
  deskSecret,
  requestAuthorized,
  secretsEqual,
  sessionValid,
  signSession,
} from "../netlify/functions/_shared/desk-auth.mjs";

process.env.DESK_KEY = "desk-secret-for-test";
delete process.env.DESK_PASSWORD;

assert.equal(deskSecret(), "desk-secret-for-test");
assert.equal(await secretsEqual("desk-secret-for-test", deskSecret()), true);
assert.equal(await secretsEqual("nope", deskSecret()), false);
assert.equal(await secretsEqual("", deskSecret()), false);

const issued = 1_700_000_000_000;
const token = await signSession(deskSecret(), issued);
assert.equal(token.includes("desk-secret-for-test"), false);
assert.equal(await sessionValid(token, deskSecret(), issued), true);
assert.equal(await sessionValid(token, deskSecret(), issued + 13 * 60 * 60 * 1000), false);
assert.equal(await sessionValid(token, "other-secret", issued), false);
const liveToken = await signSession(deskSecret());

const authed = new Request("https://live.example/api/scores", {
  method: "POST",
  headers: { cookie: `wpm_desk=${liveToken}` },
});
assert.equal(await requestAuthorized(authed, ""), true);
assert.equal(await requestAuthorized(new Request("https://live.example/api/scores"), "desk-secret-for-test"), true);
assert.equal(await requestAuthorized(new Request("https://live.example/api/scores"), "nope"), false);

delete process.env.DESK_KEY;
process.env.DESK_PASSWORD = "password-only";
assert.equal(deskSecret(), "password-only");
assert.equal(await requestAuthorized(new Request("https://live.example/desk"), "password-only"), true);

console.log("ok desk auth · env only · cookie is not the secret");
