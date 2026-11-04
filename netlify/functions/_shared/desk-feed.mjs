import { getStore } from "@netlify/blobs";

function store() {
  return getStore({ name: "wpm-desk", consistency: "strong" });
}

/**
 * Manual desk feed. Written only by an authorized POST.
 * There is no schedule that refreshes this blob.
 */
export async function loadDeskFeed() {
  try {
    const existing = await store().get("feed", { type: "json" });
    if (existing && existing.matches) return existing;
  } catch (_) {}
  // No remote fallback (Netlify seed removed 2026-11-04). Empty KV degrades to an empty feed.
  return { updated: new Date().toISOString(), heroByDate: {}, matches: [] };
}

export async function saveDeskFeed(feed) {
  await store().setJSON("feed", feed);
}
