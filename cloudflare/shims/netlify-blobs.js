// shims/netlify-blobs.js
function kv() {
  const binding = globalThis.__WPM_KV__;
  if (!binding) throw new Error("WPM KV binding missing (__WPM_KV__)");
  return binding;
}
function getStore(opts) {
  const name2 = typeof opts === "string" ? opts : opts?.name;
  if (!name2) throw new Error("getStore requires name");
  const prefix = `${name2}:`;
  return {
    async get(key, options) {
      const raw = await kv().get(prefix + key);
      if (raw == null) return null;
      if (options?.type === "json") {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return raw;
    },
    async set(key, value) {
      const body = typeof value === "string" ? value : String(value);
      await kv().put(prefix + key, body);
    },
    async setJSON(key, value) {
      await kv().put(prefix + key, JSON.stringify(value));
    },
    async delete(key) {
      await kv().delete(prefix + key);
    },
    async list({ prefix: p = "" } = {}) {
      const full = prefix + p;
      const out = await kv().list({ prefix: full });
      return {
        blobs: (out.keys || []).map((k) => ({
          key: k.name.slice(prefix.length)
        }))
      };
    }
  };
}

export { getStore };
