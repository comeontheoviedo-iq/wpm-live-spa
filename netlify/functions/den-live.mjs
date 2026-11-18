/**
 * Pickleball Den / Den Live (denlive.pickleballden.com) kill switch.
 *
 * PAUSED 18 Nov 2026. Pickleball Den's User Terms of Service
 * (https://pickleballden.com/participant-terms) prohibit automated extraction of
 * content or data and redistribution without prior written consent. A licensing
 * conversation is pending. Until a licence is agreed in writing, WPM LIVE makes NO
 * requests to Den Live: not for the APP live board (/api/app), not for the
 * /api/archive APP results, not for the cron/backfill, not for the event radar.
 *
 * To re-enable after a written licence: set DEN_LIVE_ENABLED = true (and use only
 * what the licence allows). This file is the single place any Den URL is built;
 * every Den fetch goes through denUrl(), which throws while paused, so a missed
 * code path cannot reach the network.
 */
export const DEN_LIVE_ENABLED = false;

export const DEN_ORIGIN = "https://denlive.pickleballden.com";

let override = null; // tests only

export function denLiveEnabled() {
  return override === null ? DEN_LIVE_ENABLED === true : override === true;
}

/** Test hook. Pass null to restore the constant. Never called by production code. */
export function __setDenLiveEnabledForTest(value) {
  override = value === null ? null : Boolean(value);
}

export class DenLivePausedError extends Error {
  constructor() {
    super("Den Live is paused (licence pending)");
    this.name = "DenLivePausedError";
  }
}

/** Build a Den Live URL. Throws while paused, so nothing can fetch it. */
export function denUrl(pathAndQuery) {
  if (!denLiveEnabled()) throw new DenLivePausedError();
  return DEN_ORIGIN + pathAndQuery;
}

export const DEN_PAUSED_READER = "APP live scores are paused";
