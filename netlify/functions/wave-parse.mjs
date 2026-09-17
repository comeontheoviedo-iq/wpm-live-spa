/** PickleWave public HTML helpers — rankings boards + player recent/watch. No iframes. */

export const WAVE_ORIGIN = "https://www.picklewave.com";
export const WAVE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Seed follow keys → PickleWave player ids (Bright found on womens-doubles / singles boards). */
export const WAVE_SEED = {
  Waters: "477702",
  Johns: "367397",
  Bright: "128780",
};

export function slugifyName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function fetchWave(path, { timeoutMs = 12000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(WAVE_ORIGIN + path, {
      signal: ctrl.signal,
      headers: { "User-Agent": WAVE_UA, Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, status: res.status, html: "", url: res.url };
    return { ok: true, status: res.status, html: await res.text(), url: res.url };
  } catch (e) {
    return { ok: false, status: 0, html: "", url: "", error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

export function parseWaveBoard(html) {
  const out = [];
  const re = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = re.exec(html))) {
    const row = m[1];
    const nameM = row.match(/\/players\/\d+[^"]*"[^>]*>([^<]+)</);
    const name = nameM ? nameM[1].trim() : "";
    const pid = (row.match(/\/players\/(\d+)/) || [])[1];
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) =>
      x[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    if (!name || tds.length < 2) continue;
    out.push({
      rank: Number(tds[0]) || out.length + 1,
      name,
      id: pid,
      elo: Number(tds[tds.length - 1]) || 0,
      dupr: tds.find((s) => /^[0-9]\.\d+/.test(s)) || "",
    });
  }
  return out.slice(0, 100);
}

function stripScripts(html) {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, "");
}

function uncomment(html) {
  return String(html || "").replace(/<!--([\s\S]*?)-->/g, "$1");
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&#x2022;/g, "•")
    .replace(/&bull;/g, "•")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&\w+;/g, "");
}

/** YouTube watch cards from player profile (public). */
export function parsePlayerWatch(html) {
  const clean = stripScripts(html);
  const watch = [];
  const seen = new Set();
  for (const m of clean.matchAll(/ytimg\.com\/vi\/([^/]+)\/[^"]*"\s+alt="([^"]*)"/g)) {
    const youtubeId = m[1];
    if (seen.has(youtubeId)) continue;
    seen.add(youtubeId);
    watch.push({
      title: decodeEntities(m[2]).trim() || "Watch",
      youtubeId,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
    });
  }
  for (const raw of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try {
      data = JSON.parse(raw[1]);
    } catch {
      continue;
    }
    for (const v of data?.subjectOf || []) {
      if (v?.["@type"] !== "VideoObject") continue;
      const url = v.contentUrl || "";
      const ym = url.match(/[?&]v=([\w-]+)/) || (v.embedUrl || "").match(/embed\/([\w-]+)/);
      const youtubeId = ym?.[1];
      if (!youtubeId || seen.has(youtubeId)) continue;
      seen.add(youtubeId);
      watch.push({
        title: decodeEntities(v.name || "Watch"),
        youtubeId,
        url: url || `https://www.youtube.com/watch?v=${youtubeId}`,
        date: String(v.uploadDate || "").slice(0, 10),
      });
    }
  }
  return watch.slice(0, 12);
}

function parseSidePlayers(sideHtml) {
  const players = [];
  for (const m of sideHtml.matchAll(/href="\/players\/(\d+)(?:-[^"]*)?"[^>]*>([^<]+)<\/a>/g)) {
    const name = decodeEntities(m[2]).trim();
    if (!name || name === "/" || name === "View") continue;
    players.push({ id: m[1], name });
  }
  if (!players.length) {
    for (const m of sideHtml.matchAll(
      /href="\/players\/(\d+)(?:-[^"]*)?"[\s\S]*?<span>([^<]+)<\/span>/g
    )) {
      const name = decodeEntities(m[2]).trim();
      if (!name || name === "View") continue;
      players.push({ id: m[1], name });
    }
  }
  const wl = sideHtml.match(/>\s*([WL])\s*</);
  return { players, result: wl ? wl[1] : "" };
}

/**
 * Recent matches from /players/{id}-{slug}/ppa (public match cards).
 * Game-by-game scores are gated; W/L is public. Optional set score via enrichMatchScores.
 */
export function parsePpaRecentMatches(html, playerId) {
  const body = uncomment(stripScripts(html));
  const ids = [...body.matchAll(/id="match_(\d+)"/g)].map((m) => m[1]);
  const recent = [];
  for (const mid of ids.slice(0, 10)) {
    const re = new RegExp(`id="match_${mid}"([\\s\\S]*?)(?=id="match_\\d+"|$)`);
    const m = body.match(re);
    if (!m) continue;
    let chunk = `id="match_${mid}"${m[1]}`.slice(0, 9000);
    const nxt = chunk.indexOf("match-card", 80);
    if (nxt > 0) chunk = chunk.slice(0, nxt);

    const eventM = chunk.match(/href="\/tournaments\/(\d+)[^"]*"[^>]*>([^<]+)/);
    const event = eventM ? decodeEntities(eventM[2]).trim() : "";
    const eventId = eventM ? eventM[1] : "";
    const hdr = chunk.match(
      /truncate">\s*([^<]*?)\s*(?:&#x2022;|&bull;|•)\s*([^<]*?)\s*(?:&#x2022;|&bull;|•)\s*([^<]*?)\s*</
    );
    const round = hdr ? decodeEntities(hdr[1]).trim() : "";
    const category = hdr ? decodeEntities(hdr[2]).trim() : "";
    const date = hdr ? decodeEntities(hdr[3]).replace(/\s+/g, " ").trim() : "";

    const sides = [];
    for (const sm of chunk.matchAll(
      /Entry\s*[12]\s*<div class="flex items-center justify-between gap-2">([\s\S]*?)(?=Entry\s*[12]|Action Button|$)/g
    )) {
      const side = parseSidePlayers(sm[1]);
      if (side.players.length) sides.push(side);
    }
    if (sides.length < 2) {
      for (const sm of chunk.matchAll(
        /flex items-center justify-between gap-2">([\s\S]*?)(?=flex items-center justify-between|Action Button|$)/g
      )) {
        const side = parseSidePlayers(sm[1]);
        if (side.players.length && side.result) sides.push(side);
        if (sides.length >= 2) break;
      }
    }

    const mySide = sides.find((s) => s.players.some((p) => p.id === playerId));
    const oppSide = mySide ? sides.find((s) => s !== mySide) : null;
    const result = mySide?.result || "";
    const partner = (mySide?.players || []).filter((p) => p.id !== playerId);
    const opponent = oppSide?.players || [];
    const hrefM = chunk.match(new RegExp(`href="(/matches/${mid}-[^"]+)"`));

    recent.push({
      matchId: mid,
      event,
      eventId,
      round,
      category,
      date,
      result,
      score: "",
      opponent,
      partner,
      href: hrefM ? hrefM[1] : `/matches/${mid}`,
    });
  }
  return recent;
}

/** Pull set score "2-0" from match page ld+json description when present. Never invent. */
export function parseMatchSetScore(html) {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!raw) return "";
  try {
    const data = JSON.parse(raw[1]);
    const desc = data?.description || "";
    const m = desc.match(/Final score:\s*([0-9]+)\s*[-–]\s*([0-9]+)/i);
    return m ? `${m[1]}-${m[2]}` : "";
  } catch {
    return "";
  }
}

export async function enrichMatchScores(recent, { limit = 5 } = {}) {
  const out = [];
  for (const row of (recent || []).slice(0, limit)) {
    const copy = { ...row, opponent: [...(row.opponent || [])], partner: [...(row.partner || [])] };
    if (!copy.href) {
      out.push(copy);
      continue;
    }
    const { ok, html } = await fetchWave(copy.href, { timeoutMs: 8000 });
    if (ok) {
      const score = parseMatchSetScore(html);
      if (score) copy.score = score;
    }
    out.push(copy);
  }
  // keep any remaining without enrichment
  for (const row of (recent || []).slice(limit)) {
    out.push(row);
  }
  return out;
}

export function playerPath(id, name) {
  const slug = slugifyName(name);
  return slug ? `/players/${id}-${slug}` : `/players/${id}`;
}

/**
 * Fetch identity + recent (PPA tab) + watch for one player.
 * recent-matches-table turbo-frame is empty anonymously — documented degraded path.
 */
export async function fetchWavePlayer(id, name, { enrichScores = false, probeRecentTable = false } = {}) {
  const base = playerPath(id, name);
  // Skip empty anonymous recent-matches-table by default (saves a round-trip at runtime).
  const fetches = [fetchWave(base), fetchWave(`${base}/ppa`)];
  if (probeRecentTable) fetches.push(fetchWave(`${base}/recent-matches-table`));
  const [profile, ppa, recentFrame] = await Promise.all(fetches);

  const notes = [];
  let displayName = name || "";
  if (profile.ok) {
    const canon = profile.html.match(/rel="canonical"\s+href="[^"]*\/players\/\d+-([^"/]+)/);
    const h1 = profile.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!displayName && h1) displayName = decodeEntities(h1[1].replace(/<[^>]+>/g, "")).trim();
    if (!displayName && canon) {
      displayName = canon[1]
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  } else {
    notes.push("profile_fetch_failed");
  }

  let recent = [];
  if (ppa.ok) {
    recent = parsePpaRecentMatches(ppa.html, String(id));
    if (!recent.length) notes.push("ppa_tab_no_matches");
  } else {
    notes.push("ppa_tab_fetch_failed");
  }

  if (probeRecentTable) {
    if (recentFrame?.ok) {
      const body = stripScripts(recentFrame.html);
      if (!/id="match_\d+"/.test(body) && !/<tr[\s\S]*?<\/tr>/.test(body)) {
        notes.push("recent_matches_table_empty");
      }
    } else {
      notes.push("recent_matches_table_blocked");
    }
  } else {
    notes.push("recent_matches_table_skipped");
  }

  if (enrichScores && recent.length) {
    recent = await enrichMatchScores(recent, { limit: 5 });
  }

  const watch = profile.ok ? parsePlayerWatch(profile.html) : [];

  return {
    id: String(id),
    name: displayName || name || String(id),
    recent,
    watch,
    notes,
    scrapedAt: new Date().toISOString(),
  };
}

/** Build seed + top-N singles id list with names from boards. */
export function collectWaveTargets(singles, { topN = 10 } = {}) {
  const byId = new Map();
  for (const [key, id] of Object.entries(WAVE_SEED)) {
    byId.set(String(id), { id: String(id), name: key === "Waters" ? "Anna Leigh Waters" : key === "Johns" ? "Ben Johns" : "Anna Bright", seed: key });
  }
  for (const row of (singles || []).slice(0, topN)) {
    if (!row?.id) continue;
    const cur = byId.get(String(row.id));
    if (cur) {
      cur.name = row.name || cur.name;
      cur.elo = row.elo;
      cur.dupr = row.dupr;
      cur.rank = row.rank;
    } else {
      byId.set(String(row.id), {
        id: String(row.id),
        name: row.name,
        elo: row.elo,
        dupr: row.dupr,
        rank: row.rank,
      });
    }
  }
  // attach elo for seeds from board if present
  for (const row of singles || []) {
    const cur = byId.get(String(row.id));
    if (cur && cur.elo == null) {
      cur.elo = row.elo;
      cur.dupr = row.dupr;
      cur.rank = row.rank;
      cur.name = row.name || cur.name;
    }
  }
  return [...byId.values()];
}

export async function mapPool(items, limit, fn) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}
