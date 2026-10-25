/**
 * Desk auth. DESK_KEY / DESK_PASSWORD are read from the environment only.
 * The browser session is an HMAC of an expiry, not the secret itself.
 */

const COOKIE = "wpm_desk";
const MAX_AGE_SEC = 12 * 60 * 60;

function envGet(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env && typeof Netlify.env.get === "function") {
      const v = Netlify.env.get(name);
      if (v) return String(v);
    }
  } catch (_) {}
  const fromProcess = process.env[name];
  return fromProcess ? String(fromProcess) : "";
}

/** Effective desk secret. DESK_KEY wins when both are set. */
export function deskSecret() {
  return envGet("DESK_KEY") || envGet("DESK_PASSWORD") || "";
}

function bytesToB64url(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToB64url(new Uint8Array(sig));
}

function xorEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function secretsEqual(presented, secret) {
  if (!presented || !secret) return false;
  const a = await hmac(secret, "presented:" + presented);
  const b = await hmac(secret, "presented:" + secret);
  return xorEqual(a, b);
}

export async function signSession(secret, now = Date.now()) {
  const exp = String(now + MAX_AGE_SEC * 1000);
  const sig = await hmac(secret, exp);
  return `${exp}.${sig}`;
}

export async function sessionValid(token, secret, now = Date.now()) {
  if (!secret || !token) return false;
  const parts = String(token).split(".");
  if (parts.length !== 2) return false;
  const [exp, sig] = parts;
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < now) return false;
  const expect = await hmac(secret, exp);
  return xorEqual(sig, expect);
}

export function readCookie(req, name = COOKIE) {
  const raw = (req && req.headers && req.headers.get("cookie")) || "";
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return "";
}

export async function requestAuthorized(req, bodyKey) {
  const secret = deskSecret();
  if (!secret) return false;
  const presented = typeof bodyKey === "string" ? bodyKey : "";
  if (presented && (await secretsEqual(presented, secret))) return true;
  return sessionValid(readCookie(req), secret);
}

export function requestIsSecure(req) {
  try {
    if (new URL(req.url).protocol === "https:") return true;
  } catch (_) {}
  const forwarded = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  return forwarded === "https";
}

export function sessionCookie(token, secure) {
  const bits = [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${MAX_AGE_SEC}`,
  ];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

export function clearSessionCookie(secure) {
  const bits = [`${COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (secure) bits.push("Secure");
  return bits.join("; ");
}

export { COOKIE, MAX_AGE_SEC };
