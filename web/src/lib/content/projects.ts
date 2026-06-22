import type { ProjectDefinition } from "@/types";

export const PROJECTS: ProjectDefinition[] = [
  {
    id: "url-shortener",
    title: "Tiny.link — URL Shortener",
    shortTitle: "URL Shortener",
    summary:
      "Take a tiny redirect service from a single instance to a globally scaled, sharded, abuse-resilient, observable platform — the way bit.ly / t.co actually look.",
    difficulty: "intern",
    estimatedMinutes: 90,
    tags: [
      "caching",
      "rate-limiting",
      "sharding",
      "cdn",
      "queues",
      "analytics",
      "abuse",
      "observability",
    ],
    paid: false,
    scenarios: ["url-shortener-traffic-spike"],
    cover: "tiny-link",
    briefing: {
      oneLiner:
        "Design a URL shortener that turns a long URL into a 7-character short URL and redirects every click in <200ms — at 100M DAU and 1B URLs.",
      functional: [
        "Create a short URL from a long original URL.",
        "Be redirected from the short URL to the original long URL.",
        "Optional: support a custom alias for the short URL.",
        "Optional: support an expiration time (e.g. for a one-off conference link).",
      ],
      nonFunctional: [
        "Low latency on redirects (~200ms p95 globally).",
        "Scale to 100M DAU and 1B URLs.",
        "Guarantee uniqueness of short codes (no two long URLs collide on the same short code).",
        "CAP: pick high availability + eventual consistency over strong consistency — a brand new short URL can be unavailable for a few seconds with a clear 'still saving' message.",
        "Back-of-the-envelope numbers are deferred to the deep dive — they only matter when they change a decision.",
      ],
      coreEntities: [
        {
          name: "OriginalURL",
          description: "The full URL the user wants to shorten.",
        },
        {
          name: "ShortURL",
          description:
            "The 7-character base62 code we serve and redirect from. Owned by exactly one OriginalURL.",
        },
        {
          name: "User",
          description:
            "The owner of the short URL. Optional for anonymous shortens, required for custom aliases / analytics.",
        },
      ],
      api: [
        {
          method: "POST",
          path: "/urls",
          body: {
            originalUrl: "string (required, the long URL)",
            alias: "string? (optional custom short code)",
            expirationTime: "ISO timestamp? (optional)",
          },
          returns: "{ shortUrl: string }",
          notes:
            "One-to-one with the 'shorten a URL' functional requirement.",
        },
        {
          method: "GET",
          path: "/{shortCode}",
          returns: "302 redirect to originalUrl",
          notes:
            "Returns 302 (temporary) — not 301 (permanent) — so we keep analytics. 301s would be cached by browsers/DNS and never come back to us. We accept the higher origin load for the visibility.",
        },
      ],
      highLevel: {
        paragraph:
          "The high-level design follows directly from the API: a write path (POST /urls) and a read path (GET /:code). Both flow through an API gateway (rate-limit + auth) into a stateless URL shortener service backed by a primary database. The read path is fronted by a cache so the same hot short code never hits the DB twice.",
        bullets: [
          "Client → API Gateway → URL Shortener Service → Database (primary write path).",
          "Client → API Gateway → URL Shortener Service → Cache → Database (cache-aside read path).",
          "302 redirect on read so every click is observable for analytics.",
          "Black-box the short-code generation here — we deep-dive it next.",
        ],
      },
      deepDives: [
        {
          title: "Deep Dive 1 — Generating a short, unique 5–7 char code",
          body:
            "Three options on the table: (a) take a prefix of the long URL — bad, many URLs share prefixes. (b) generate a random base62 code — 62^6 ≈ 56B combinations, but the birthday paradox means collisions are very likely well before that, so we'd need to check the DB before insert. (c) hash the long URL with md5/sha256 then base62-encode the prefix — same collision-check problem and now hashes leak structure. (d) maintain a counter and base62-encode it — collision-free by construction, but predictable (security risk). The fix: counter → bijective obfuscation function (sqids.org-style). Counter scales linearly with writes; obfuscation hides it; the result still looks like a random base62 string.",
          takeaways: [
            "Counter-based codes are the only collision-free option without a DB round trip.",
            "Wrap the counter in a bijective obfuscator so codes aren't enumerable.",
            "Pre-allocate counter ranges (1000 at a time) so the counter call isn't a per-write hop.",
          ],
        },
        {
          title: "Deep Dive 2 — Low latency on redirect (~200ms)",
          body:
            "The most expensive part of the redirect is the DB lookup against ~1B rows. We add a B-tree (or hash) index on short_code to make that O(log n) — but disk I/O still hurts. The real win is putting Redis in front as a read-through cache (key=short_code, value=long_url, LRU eviction). 95% of redirects never touch the DB. CDN-level caching is tempting but breaks 302 analytics, so we don't use it for the redirect path.",
          takeaways: [
            "Index short_code (hash index for O(1), B-tree for range queries you'll never need).",
            "Redis in front of Postgres, cache-aside, jittered TTL to avoid stampedes.",
            "No CDN on /:code — it would steal the 302 we need for click analytics.",
          ],
        },
        {
          title: "Deep Dive 3 — Scale to 100M DAU / 1B URLs",
          body:
            "100M DAU × 1 redirect/day = ~1k RPS avg, ~100k peak. A single t3.medium handles ~1k RPS, so a single box is dead at peak. Horizontally scale the read service behind an API gateway + load balancer with autoscaling triggers (>75% CPU scales out, <25% scales in). The write path has a global counter — keep it in Redis so all instances share it (Redis INCR is atomic, single-threaded). Pre-allocate batches of 1000 IDs to avoid a Redis round trip per write. Storage: 500B/row × 1B URLs = ~500GB — fits in one DB. If we ever need to shard, hash by short_code.",
          takeaways: [
            "Auto-scale the stateless service horizontally; the LB handles round-robin.",
            "Global ID counter in Redis (single-threaded → no concurrency bugs).",
            "Pre-fetch batches of IDs so the counter isn't on the per-write hot path.",
            "Storage is small (500GB); shard only when write IOPS demands it.",
          ],
        },
        {
          title: "Deep Dive 4 — High availability",
          body:
            "Most of the design is already HA: stateless services behind a load balancer, multi-AZ Postgres with a replica, Redis with a replica + AOF persistence so the global counter survives a reboot. The two SPOFs to fix are (1) the Redis cache for short_code → long_url (read-through means it just refills from the DB after a failure), and (2) the Redis counter (replica + persistent log so we don't lose the global counter and start re-issuing colliding IDs). Hourly DB snapshots to S3 cover the disaster scenario.",
          takeaways: [
            "Cache failure ⇒ slower (DB-bound) but correct — read-through self-heals.",
            "Counter failure is the dangerous one — replicate + persist.",
            "Hourly Postgres snapshots to S3 give us an RPO of 1 hour at near-zero cost.",
          ],
        },
      ],
    },
  },
  {
    id: "feed-service",
    title: "PulseFeed — Social Feed",
    shortTitle: "Social Feed",
    summary:
      "Design a personalized feed that survives celebrity-tier write fan-out.",
    difficulty: "sde1",
    estimatedMinutes: 60,
    tags: ["fan-out", "queues", "ranking"],
    paid: true,
    scenarios: [],
    cover: "pulse-feed",
  },
  {
    id: "ride-dispatch",
    title: "Orbit — Ride Dispatch",
    shortTitle: "Ride Dispatch",
    summary:
      "Match riders and drivers in near real time with surge handling.",
    difficulty: "sde1",
    estimatedMinutes: 90,
    tags: ["geospatial", "streaming", "matching"],
    paid: true,
    scenarios: [],
    cover: "orbit",
  },
  {
    id: "ticket-flash",
    title: "FrontRow — Ticket Flash Sales",
    shortTitle: "Ticket Flash",
    summary:
      "Sell out 100k tickets in 30 seconds without overselling or melting your DB.",
    difficulty: "sde1",
    estimatedMinutes: 75,
    tags: ["consistency", "queues", "load shedding"],
    paid: true,
    scenarios: [],
    cover: "frontrow",
  },
];

export function getProject(id: string): ProjectDefinition | undefined {
  return PROJECTS.find((p) => p.id === id);
}
