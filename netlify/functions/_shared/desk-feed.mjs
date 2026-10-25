import { getStore } from "@netlify/blobs";

const SEED_URL = "https://wpm-live.netlify.app/scores.json";

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
  try {
    const res = await fetch(SEED_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      try {
        await s.setJSON("feed", data);
      } catch (_) {}
      return data;
    }
  } catch (_) {}
  return { updated: new Date().toISOString(), heroByDate: {}, matches: [] };
}

export async function saveDeskFeed(feed) {
  await store().setJSON("feed", feed);
}
