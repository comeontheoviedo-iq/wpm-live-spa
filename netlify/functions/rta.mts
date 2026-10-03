import type { Config, Context } from "@netlify/functions";
import { tagsFor } from "./follow-tags.mjs";
import {
  FARNHAM,
  RTA_CATEGORIES,
  RTA_GRAPHQL,
  RTA_SEGMENTS,
  RTA_TOURNAMENT_ID,
  mapRtaPacks,
} from "./rta-map.mjs";

const UA = {
  "User-Agent": "WPM-LIVE/1.0",
  Accept: "application/json",
  "Content-Type": "application/json",
  Origin: "https://play.rtapickleballtour.com",
  Referer: FARNHAM.officialUrl,
};

const DRAWS_QUERY = `query drawsDetail($filter: ListDrawInput) {
  drawsDetail: drawsDetailPublic(filter: $filter) {
    total
    draws {
      id
      title
      segment
      hide
      tournamentCategory {
        id
        category { id name type gender }
      }
      rounds {
        title
        seeds { ...RtaSeed }
        lowerPlaceMatch { ...RtaSeed }
      }
      brackets {
        type
        rounds {
          title
          seeds { ...RtaSeed }
          lowerPlaceMatch { ...RtaSeed }
        }
        lowerPlaceMatch { ...RtaSeed }
      }
      lowerPlaceMatch { ...RtaSeed }
    }
  }
}
fragment RtaSeed on DrawDetailSeedPublic {
  id
  round
  score
  status
  isMatchInProgress
  isBye
  isWalkover
  date
  time
  court { id name }
  entry1 { users { user { name surname } } team { title } }
  entry2 { users { user { name surname } } team { title } }
}`;

async function graphql(filter: Record<string, unknown>) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(RTA_GRAPHQL, {
      method: "POST",
      headers: UA,
      body: JSON.stringify({
        operationName: "drawsDetail",
        query: DRAWS_QUERY,
        variables: { filter },
      }),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    if (!res.ok || !json || json.errors) {
      const message = json?.errors?.[0]?.message || `HTTP ${res.status}`;
      return { ok: false, draws: [], error: message };
    }
    const draws = json?.data?.drawsDetail?.draws;
    return { ok: true, draws: Array.isArray(draws) ? draws : [], error: "" };
  } catch (e: any) {
    return { ok: false, draws: [], error: String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

export default async (_req: Request, _context?: Context) => {
  const jobs = RTA_CATEGORIES.flatMap((cat) =>
    RTA_SEGMENTS.map(async (segment) => {
      const filter = {
        tournament: RTA_TOURNAMENT_ID,
        tournamentCategory: cat.id,
        segment,
      };
      const result = await graphql(filter);
      return { categoryId: cat.id, segment, ...result };
    })
  );

  const settled = await Promise.all(jobs);
  const failed = settled.filter((row) => !row.ok);
  const packs = settled
    .filter((row) => row.ok)
    .map((row) => ({
      categoryId: row.categoryId,
      segment: row.segment,
      draws: row.draws,
    }));

  const mapped = mapRtaPacks(packs, { tagsFor });
  const liveCount = mapped.matches.filter((m) => m.status === "LIVE").length;
  const allFailed = failed.length === settled.length;
  const delayed = allFailed;

  return Response.json(
    {
      updated: new Date().toISOString(),
      source: "tournated-graphql",
      operation: "drawsDetail",
      endpoint: RTA_GRAPHQL,
      delayed,
      reader: delayed ? "Scores delayed" : "",
      liveCount,
      matches: delayed ? [] : mapped.matches,
      categories: mapped.categories,
      segments: RTA_SEGMENTS,
      degraded: failed.length
        ? failed.map((row) => `${row.categoryId}:${row.segment}:${row.error}`)
        : undefined,
      event: {
        id: FARNHAM.id,
        name: FARNHAM.name,
        title: FARNHAM.title,
        venue: FARNHAM.venue,
        tz: FARNHAM.tz,
        startDate: FARNHAM.start,
        endDate: FARNHAM.end,
        eventKey: FARNHAM.eventKey,
        tour: "rta",
        officialUrl: FARNHAM.officialUrl,
      },
    },
    {
      headers: { "Cache-Control": delayed ? "public, max-age=10" : "public, max-age=15" },
    }
  );
};

export const config: Config = { path: "/api/rta" };
