/** Shared Sporttora WC parse helpers — object-bounded ingest + map. */

export const NAMES = {
  "Ấn Độ": "India",
  "Việt Nam": "Vietnam",
  "Viet Nam": "Vietnam",
  "Hoa Kỳ": "USA",
  Úc: "Australia",
  "Hàn Quốc": "South Korea",
  "Đài Bắc Trung Hoa": "Chinese Taipei",
  "Quần đảo Bắc Mariana": "Northern Mariana",
  "Hồng Kông": "Hong Kong, China",
  "Hồng Kông (Trung Quốc)": "Hong Kong, China",
  Anh: "England",
  "Nhật Bản": "Japan",
  Pháp: "France",
  Séc: "Czechia",
  "Quần đảo Cayman": "Cayman Islands",
  Singapore: "Singapore",
  Bỉ: "Belgium",
  "Bỉ ": "Belgium",
  Philippin: "Philippines",
  Philippines: "Philippines",
  Mexico: "Mexico",
  "New Zealand": "New Zealand",
  "Nam Phi": "South Africa",
  Samoa: "Samoa",
  Brazil: "Brazil",
  "Thái Lan": "Thailand",
  Malaysia: "Malaysia",
  Indonesia: "Indonesia",
  Đức: "Germany",
  Ý: "Italy",
  "Tây Ban Nha": "Spain",
  Canada: "Canada",
  Argentina: "Argentina",
  Chile: "Chile",
  Colombia: "Colombia",
  "Puerto Rico": "Puerto Rico",
  "Costa Rica": "Costa Rica",
  "Hà Lan": "Netherlands",
  "Hy Lạp": "Greece",
  "Trung Quốc": "China",
  "Ả Rập Xê Út": "Saudi Arabia",
  "Quần đảo Cook": "Cook Islands",
  "Antigua và Barbuda": "Antigua and Barbuda",
  "Ma Cao (Trung Quốc)": "Macao, China",
  Campuchia: "Cambodia",
  Litva: "Lithuania",
};

export function name(s) {
  return NAMES[s] || s;
}

/** Prefer non-empty roundName; else Round N from roundNum. */
export function roundLabel(roundName, roundNum, _group) {
  const rn = roundName != null ? String(roundName).trim() : "";
  if (rn) return rn;
  if (roundNum != null && Number.isFinite(Number(roundNum))) return `Round ${Number(roundNum)}`;
  return "";
}

const MS_48H = 48 * 60 * 60 * 1000;

/** NEXT keep policy: start within last 48h, or in the future, or missing start with date >= today-1. */
export function keepNext(m, now = new Date()) {
  if (m.status !== "NEXT") return true;
  const nowMs = now.getTime();
  if (m.start) {
    const t = new Date(m.start).getTime();
    if (Number.isFinite(t)) {
      if (t >= nowMs) return true; // future
      if (nowMs - t <= MS_48H) return true; // last 48h
      return false;
    }
  }
  // missing / bad start → keep if date >= today-1
  const today = now.toISOString().slice(0, 10);
  const d = new Date(today + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - 1);
  const floor = d.toISOString().slice(0, 10);
  return !m.date || m.date >= floor;
}

export function keepForMatches(m, now = new Date()) {
  if (m.status === "LIVE" || m.status === "FT") return true;
  return keepNext(m, now);
}

export function discLabel(d) {
  if (d === "FB") return "Dreambreaker";
  if (d === "XD#1") return "XD 1";
  if (d === "XD#2") return "XD 2";
  return d || "Game";
}

export function sideOf(win, a, b) {
  if (!win) return "";
  const w = win.toLowerCase().replace(/[_\s-]/g, "");
  const na = a.toLowerCase().replace(/[_\s-]/g, "");
  const nb = b.toLowerCase().replace(/[_\s-]/g, "");
  if (na && w.includes(na)) return "A";
  if (nb && w.includes(nb)) return "B";
  return "";
}

export function lineDone(s) {
  if (s.win) return true;
  if (s.st === "completed" && s.ga != null && s.gb != null && s.ga !== s.gb) return true;
  if (s.ga == null || s.gb == null) return false;
  const hi = Math.max(s.ga, s.gb);
  const lo = Math.min(s.ga, s.gb);
  if (s.d === "FB") return hi >= 15 && hi - lo >= 2;
  return hi >= 20 && (hi - lo >= 2 || hi >= 21);
}

/** Brace-balance extract one JSON object starting at `start` (`{`). */
export function extractObjectAt(text, start) {
  if (text[start] !== "{") return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function scoresFromObj(j) {
  const cg = j.liveScore && j.liveScore.currentGame;
  if (cg && (cg.scoreA != null || cg.scoreB != null)) {
    return {
      ga: cg.scoreA != null ? Number(cg.scoreA) : null,
      gb: cg.scoreB != null ? Number(cg.scoreB) : null,
    };
  }
  if (j.scoreA != null || j.scoreB != null) {
    return {
      ga: j.scoreA != null ? Number(j.scoreA) : null,
      gb: j.scoreB != null ? Number(j.scoreB) : null,
    };
  }
  return { ga: null, gb: null };
}

/**
 * Object-bounded ingest: each Sporttora `__sub-` match object is isolated
 * via brace-balance so tieId / sides / scores never bleed across neighbors.
 */
export function ingest(t, ties) {
  const re = /\{"id":"[^"]+__sub-[^"]+"/g;
  let m;
  while ((m = re.exec(t))) {
    const blob = extractObjectAt(t, m.index);
    if (!blob) continue;
    let j;
    try {
      j = JSON.parse(blob);
    } catch {
      continue;
    }
    const cat = String(j.categoryId || "");
    if (!cat.includes("team")) continue;
    const tieId = String(j.tieId || "");
    if (!tieId) continue;
    const disc = String(j.discipline || "");
    if (!disc) continue;

    const sa = j.sideA && j.sideA.name ? String(j.sideA.name) : "";
    const sb = j.sideB && j.sideB.name ? String(j.sideB.name) : "";
    const entryA = j.entryA && j.entryA.entryId ? String(j.entryA.entryId) : "";
    const entryB = j.entryB && j.entryB.entryId ? String(j.entryB.entryId) : "";
    const st = String(j.status || "");
    const { ga, gb } = scoresFromObj(j);
    const win = j.winnerId != null && j.winnerId !== "" ? String(j.winnerId) : "";

    const rec = (ties[tieId] ||= {
      id: "st-" + tieId.replace(/[^a-z0-9]+/gi, "-").slice(0, 60),
      a: "",
      b: "",
      entryA: "",
      entryB: "",
      cat,
      venue: "",
      start: "",
      live: false,
      group: "",
      round: "",
      roundName: "",
      roundNum: null,
      subs: [],
    });
    if (sa) rec.a = name(sa);
    if (sb) rec.b = name(sb);
    if (entryA) rec.entryA = entryA;
    if (entryB) rec.entryB = entryB;
    if (j.venueName) rec.venue = String(j.venueName);
    if (j.scheduledAt) rec.start = String(j.scheduledAt);
    if (j.roundName) rec.roundName = String(j.roundName).trim();
    if (j.roundNum != null && j.roundNum !== "") rec.roundNum = Number(j.roundNum);
    if (j.groupId) rec.group = String(j.groupId);
    rec.round = roundLabel(rec.roundName, rec.roundNum, rec.group);

    const sub = {
      st,
      d: disc,
      win,
      ga,
      gb,
      court: j.courtName ? String(j.courtName) : "",
    };
    const prev = rec.subs.find((s) => s.d === disc);
    if (!prev) rec.subs.push(sub);
    else {
      if (st === "in_progress") prev.st = st;
      if (st === "completed") prev.st = "completed";
      if (sub.ga != null) prev.ga = sub.ga;
      if (sub.gb != null) prev.gb = sub.gb;
      if (sub.win) prev.win = sub.win;
      if (sub.court) prev.court = sub.court;
    }
    if (st === "in_progress") rec.live = true;
  }
}

function resolveWinner(s, tie) {
  if (s.win) {
    if (tie.entryA && s.win === tie.entryA) return "A";
    if (tie.entryB && s.win === tie.entryB) return "B";
    return sideOf(s.win, tie.a, tie.b);
  }
  return "";
}

/** Map ingested ties → match objects (status / lines / score). */
export function mapTies(ties) {
  return Object.values(ties)
    .filter((tie) => tie.a && tie.b)
    .map((tie) => {
      const order = ["WD", "MD", "MS", "WS", "XD", "XD#1", "XD#2", "FB"];
      const subs = [...tie.subs].sort((a, b) => order.indexOf(a.d) - order.indexOf(b.d));
      const lines = subs.map((s) => {
        const done = lineDone(s);
        const liveLine = s.st === "in_progress" && !done;
        let won = "";
        const who = resolveWinner(s, tie);
        if (who === "A") won = tie.a;
        else if (who === "B") won = tie.b;
        if (!won && done && s.ga != null && s.gb != null && s.ga !== s.gb) {
          won = Number(s.ga) > Number(s.gb) ? tie.a : tie.b;
        }
        return {
          disc: discLabel(s.d),
          score: s.ga != null && s.gb != null ? `${s.ga}–${s.gb}` : "",
          winner: liveLine ? "" : won,
          live: liveLine,
          court: s.court || "",
        };
      });
      for (const l of lines) {
        if (l.live || l.winner) continue;
        const pts = String(l.score || "")
          .split(/[–-]/)
          .map((x) => Number(x));
        if (pts.length < 2 || !Number.isFinite(pts[0]) || !Number.isFinite(pts[1]) || pts[0] === pts[1]) continue;
        const hi = Math.max(pts[0], pts[1]);
        const lo = Math.min(pts[0], pts[1]);
        const finished =
          l.disc === "Dreambreaker" ? hi >= 15 && hi - lo >= 2 : hi >= 20 && (hi - lo >= 2 || hi >= 21);
        if (finished) l.winner = pts[0] > pts[1] ? tie.a : tie.b;
      }
      const ta = lines.filter((l) => l.winner === tie.a).length;
      const tb = lines.filter((l) => l.winner === tie.b).length;
      const liveLine = lines.find((l) => l.live);
      const cat = String(tie.cat || "");
      const label = cat.includes("open")
        ? "Open team"
        : cat.includes("junior")
          ? "Juniors"
          : cat.includes("kid")
            ? "Kids"
            : cat.includes("senior")
              ? "Seniors"
              : cat.includes("master")
                ? "Masters"
                : "Team";
      const start = tie.start
        ? new Date(tie.start + (tie.start.endsWith("Z") ? "" : "Z")).toISOString()
        : new Date().toISOString();
      const round = roundLabel(tie.roundName, tie.roundNum, tie.group) || tie.round || "";
      return {
        id: tie.id,
        date: start.slice(0, 10),
        tour: "wc",
        comp: "World Cup · Da Nang",
        div: [label, round].filter(Boolean).join(" · "),
        round,
        roundNum: tie.roundNum,
        session: tie.venue || "",
        a: tie.a,
        b: tie.b,
        tags: ["Vietnam", "USA", "India"].filter((x) => tie.a === x || tie.b === x),
        status: liveLine ? "LIVE" : ta + tb > 0 ? "FT" : "NEXT",
        start,
        score: `${ta}-${tb}`,
        games: lines
          .map((l) => [l.disc, l.score, l.live ? "LIVE" : l.winner].filter(Boolean).join(" "))
          .join(" · "),
        lines,
        note: liveLine ? `In play: ${liveLine.disc} ${liveLine.score}` : "Order of play · Sporttora.",
        watch: "wcyoutube",
      };
    });
}

/** Dedup by stable match id (tieId-derived); prefer LIVE > FT > NEXT. */
export function dedupMatches(mapped) {
  const seen = {};
  for (const m of mapped) {
    const key = m.id || [String(m.div).split(" · ")[0], m.a, m.b].sort().join("|");
    const rank = (x) => (x.status === "LIVE" ? 2 : x.status === "FT" ? 1 : 0);
    if (!seen[key] || rank(m) > rank(seen[key])) seen[key] = m;
  }
  return Object.values(seen);
}

export function filterMatches(unique, today = new Date().toISOString().slice(0, 10), now = new Date()) {
  void today; // retained for call-site compat; rolling policy uses now
  return unique
    .filter((m) => keepForMatches(m, now))
    .sort((a, b) => Number(b.status === "LIVE") - Number(a.status === "LIVE"));
}

export function buildBrackets(unique, now = new Date()) {
  const brackets = {};
  for (const m of unique) {
    // Same NEXT age policy as matches strip — drop ancient empty ghosts from draw
    if (m.status === "NEXT" && !keepNext(m, now)) continue;
    const div = String(m.div).split(" · ")[0] || "World Cup";
    const round = m.round || (m.roundNum != null ? `Round ${m.roundNum}` : "Round");
    (brackets[div] ||= {});
    (brackets[div][round] ||= []).push({
      id: m.id,
      a: m.a,
      b: m.b,
      score: m.score,
      status: m.status,
      games: m.games,
      date: m.date,
    });
  }
  return brackets;
}

/** Legacy ±350/450 window ingest — for before/after verification only. */
export function ingestWindow(t, ties) {
  const field = (w, key) => {
    const m = w.match(new RegExp(`"${key}":"([^"]*)"`));
    return m ? m[1] : "";
  };
  const num = (w, key) => {
    const m = w.match(new RegExp(`"${key}":(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  const re = /"discipline":"([^"]+)"/g;
  let m;
  while ((m = re.exec(t))) {
    const w = t.slice(Math.max(0, m.index - 350), m.index + 450);
    const cat = field(w, "categoryId");
    if (!cat.includes("team")) continue;
    const tieId = field(w, "tieId");
    if (!tieId) continue;
    const sa = (w.match(/"sideA":\{"name":"([^"]+)"/) || [])[1];
    const sb = (w.match(/"sideB":\{"name":"([^"]+)"/) || [])[1];
    const st = field(w, "status");
    const rec = (ties[tieId] ||= {
      id: "st-" + tieId.replace(/[^a-z0-9]+/gi, "-").slice(0, 60),
      a: "",
      b: "",
      entryA: "",
      entryB: "",
      cat,
      venue: "",
      start: "",
      live: false,
      group: "",
      round: "",
      roundName: "",
      roundNum: null,
      subs: [],
    });
    if (sa) rec.a = name(sa);
    if (sb) rec.b = name(sb);
    rec.venue = field(w, "venueName") || rec.venue;
    rec.start = field(w, "scheduledAt") || rec.start;
    const rn = field(w, "roundName");
    if (rn) rec.roundName = rn;
    const rnum = (w.match(/"roundNum":(\d+)/) || [])[1];
    if (rnum) rec.roundNum = Number(rnum);
    rec.group = field(w, "groupId") || rec.group;
    rec.round = roundLabel(rec.roundName, rec.roundNum, rec.group);
    const disc = m[1];
    const sub = {
      st,
      d: disc,
      win: field(w, "winnerId"),
      ga: num(w, "scoreA"),
      gb: num(w, "scoreB"),
      court: field(w, "courtName"),
    };
    const prev = rec.subs.find((s) => s.d === disc);
    if (!prev) rec.subs.push(sub);
    else {
      if (st === "in_progress") prev.st = st;
      if (st === "completed") prev.st = "completed";
      if (sub.ga != null) prev.ga = sub.ga;
      if (sub.gb != null) prev.gb = sub.gb;
      if (sub.win) prev.win = sub.win;
      if (sub.court) prev.court = sub.court;
    }
    if (st === "in_progress") rec.live = true;
  }
}
