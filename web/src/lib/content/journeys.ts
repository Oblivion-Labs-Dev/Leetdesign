import type { ProjectJourney } from "@/types";

/**
 * Tiny.link — full staff-grade journey.
 *
 * The previous version stopped after Cache + Gateway + Load Balancer.
 * That's a coffee-shop level URL shortener. A real one has to handle
 * bot abuse, hot keys, multi-region reads, write fanout, async analytics,
 * cost-aware tiering, and disaster recovery.
 *
 * Phases:
 *   1) MVP                            (intro → client → service → DB)
 *   2) Read scale                     (cache + cache-aside snippet)
 *   3) Front door                     (gateway + rate-limit snippet)
 *   4) Horizontal scale               (load balancer + LB pool snippet)
 *   5) Global edge                    (CDN + cache-control headers snippet)
 *   6) Write scale & durability       (DB sharding + ID generator snippet)
 *   7) Async analytics                (queue + worker + emit-event snippet)
 *   8) Warehouse & reporting          (object store sink + ETL snippet)
 *   9) Abuse defense                  (auth-style abuse scorer)
 *  10) Observability                  (monitoring + alerts snippet)
 *  11) Final ship + retrospective
 */
export const URL_SHORTENER_JOURNEY: ProjectJourney = {
  projectId: "url-shortener",
  startGraph: { nodes: [], edges: [], health: "healthy" },
  inventory: [
    "client",
    "service",
    "database",
    "cache",
    "api_gateway",
    "load_balancer",
    "cdn",
    "message_queue",
    "worker",
    "object_store",
    "analytics",
    "auth",
    "monitor",
    "stream",
  ],
  stages: [
    // ============================================================
    // PHASE 0 — Intro
    // ============================================================
    {
      id: "intro",
      kind: "intro",
      phase: "Project briefing",
      title: "Welcome to Tiny.link",
      subtitle: "Your first end-to-end project on Leetdesign",
      what:
        "Tiny.link is a URL shortener: paste a long URL, get a short one (tiny.link/abc12). Anyone who hits the short URL gets redirected to the original. " +
        "Sounds simple — but at scale (50k redirects/sec, 10B URLs, 100M DAU, sub-100ms p95 globally) the system has to absorb celebrity tweets, fight off bot floods, " +
        "shard writes across DBs, push reads to the edge, capture every click for analytics, and keep cost under control. " +
        "This is the same shape as bit.ly, t.co, goo.gl, lnkd.in — and the same patterns you would walk through in a senior or staff system-design interview.",
      doing:
        "You will build it from scratch the way it's actually built in production: start with the smallest thing that works (Client → Service → DB), then react to real incidents (hot reads, bot abuse, regional latency, write hotspots, missing analytics, ops silence) that demand the next component. " +
        "Each step has a tiny code change, a code review, a CI run in a centered overlay, and a merge to main that updates the live pipeline behind it.",
      botMessage:
        "First day. We will build Tiny.link end-to-end, all 11 phases. Don't worry about scale yet — we earn it incident by incident. Open me anytime for trade-offs and back-of-the-envelope math.",
      napkinMath: [
        {
          label: "Storage for 10B URLs",
          calc:
            "10B rows × ~250B/row\n= 2.5 TB on disk\n→ comfortably fits one beefy DB before we need sharding.",
        },
        {
          label: "Read:Write ratio",
          calc:
            "100M DAU × 5 redirects/day = 500M reads/day (~5.8k reads/s avg, 50k peak)\n100M DAU × 0.05 shorten/day = 5M writes/day (~58 writes/s)\n→ READ:WRITE ≈ 100:1 — design for reads first.",
        },
      ],
      tradeoffs: [
        "Counter-based codes are short and dense, but predictable (URL enumeration risk).",
        "Hash-based codes spread randomly but need collision retry on inserts.",
        "Custom aliases collide with system codes — need a dedicated namespace.",
      ],
      alternatives: [
        "All-in-one monolith with embedded SQLite — fine for an MVP, dies above ~1k QPS.",
        "Pure DynamoDB — write throughput is great, but 7-char short codes need careful partition keys.",
      ],
    },

    // ============================================================
    // PHASE 1 — MVP shape (Client → Service → DB)
    // ============================================================
    {
      id: "teach-client",
      kind: "teach_component",
      phase: "Phase 1 · MVP shape",
      title: "Step 1 — A user needs to talk to us",
      subtitle: "Add the Client",
      componentId: "client",
      story:
        "Someone wants to shorten a long URL. Their browser or mobile app is the first thing in our system.",
      whatItIs:
        "The Client is the user-facing app — a web page or mobile app — running on someone's device.",
      whatItDoes:
        "Collects user input (the long URL), shows the short URL we return, and follows redirects when someone visits a short link.",
      addMutations: [
        {
          kind: "add_node",
          node: { id: "n_client", type: "client", label: "Client (Web/Mobile)", status: "healthy" },
        },
      ],
      botMessage: "Good. The Client is on the canvas. But it has nobody to talk to yet.",
      tradeoffs: [
        "Web client gives universal reach but no offline support.",
        "Native mobile client unlocks share-sheet integrations but doubles your build matrix.",
      ],
      alternatives: [
        "Browser extension only — fast to ship, tiny addressable audience.",
      ],
    },
    {
      id: "teach-service",
      kind: "teach_component",
      phase: "Phase 1 · MVP shape",
      title: "Step 2 — Somewhere to handle requests",
      subtitle: "Add the Backend Service",
      componentId: "service",
      story:
        "The Client needs to send 'shorten this URL' requests somewhere. We need a backend that owns the business logic: generate a short code, store it, serve the redirect.",
      whatItIs:
        "A stateless application server (URLShortenerService) that exposes HTTP endpoints.",
      whatItDoes:
        "Two main APIs: POST /shorten (long URL in, short code out) and GET /:code (short code in, 302 redirect out).",
      addMutations: [
        {
          kind: "add_node",
          node: { id: "n_service", type: "service", label: "Shortener service", status: "healthy" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_client_service", source: "n_client", target: "n_service", protocol: "http", animated: true },
        },
      ],
      botMessage:
        "We have an app and a server. But where do we remember the short → long mapping?",
      tradeoffs: [
        "Stateless service = trivially horizontally scalable, but every request needs its state from a backing store.",
        "Putting business logic in the service (vs DB triggers) keeps the DB simple and portable.",
      ],
      napkinMath: [
        {
          label: "RPS per service box (rule of thumb)",
          calc:
            "1 vCPU @ ~1k req/s for tiny redirect logic\n→ 50k peak RPS / 1k = ~50 boxes (we'll add an LB for this).",
        },
      ],
      alternatives: [
        "Serverless functions (Lambda) — auto-scale + per-request billing, but cold starts hurt p99.",
      ],
    },
    {
      id: "teach-database",
      kind: "teach_component",
      phase: "Phase 1 · MVP shape",
      title: "Step 3 — Remember the mappings",
      subtitle: "Add the Database",
      componentId: "database",
      story:
        "If we restart the service, the in-memory map is gone and every short link breaks. We need durable storage.",
      whatItIs:
        "A persistent OLTP database (PostgreSQL) that survives restarts and serves consistent reads.",
      whatItDoes:
        "Stores rows like (short_code PK, long_url, owner_id, created_at, expires_at). Every short → long lookup queries this DB.",
      addMutations: [
        {
          kind: "add_node",
          node: { id: "n_db", type: "database", label: "Postgres (primary)", status: "healthy" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_service_db", source: "n_service", target: "n_db", protocol: "tcp", animated: true },
        },
      ],
      botMessage: "Now we can survive restarts. Tiny.link MVP is alive in 3 components.",
      tradeoffs: [
        "Postgres = strong consistency + relational queries (great for analytics later).",
        "But: write throughput per primary is finite. Above ~10k inserts/s on commodity hardware we'll need to shard.",
      ],
      napkinMath: [
        {
          label: "Row size",
          calc:
            "short_code (8B) + long_url (~200B) + owner_id (16B) + ts (8B) + index overhead (~20B)\n≈ 250B per row.",
        },
        {
          label: "Disk for 1 year of growth",
          calc: "5M writes/day × 365 × 250B ≈ 460 GB/year (well within one DB).",
        },
      ],
      alternatives: [
        "Key-value store (DynamoDB / Redis durable) — faster writes, no joins (we'd lose easy ad-hoc queries).",
      ],
    },
    {
      id: "code-edit-base62",
      kind: "code_edit",
      phase: "Phase 1 · MVP shape",
      title: "Write the base62 short-code generator",
      subtitle: "Counter-based, 7 chars = 3.5T URLs",
      componentId: "service",
      language: "typescript",
      fileName: "src/services/shorten.ts",
      branchName: "feature/base62-id",
      placeholderCode: `import { db } from "../db";

const ALPH = "0123456789abcdefghijklmnopqrstuvwxyz" +
             "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Encode a 64-bit integer to a 7-char base62 string. */
function encodeBase62(n: bigint): string {
  let s = "";
  while (n > 0n) {
    s = ALPH[Number(n % 62n)] + s;
    n /= 62n;
  }
  return s.padStart(7, "0");
}

export async function shorten(longUrl: string, ownerId: string) {
  // Pull a fresh sequence value from Postgres — collision-free by design.
  const { rows } = await db.query(
    "SELECT nextval('url_seq') AS id",
  );
  const code = encodeBase62(BigInt(rows[0].id));
  await db.query(
    "INSERT INTO urls(short_code, long_url, owner_id) VALUES ($1, $2, $3)",
    [code, longUrl, ownerId],
  );
  return code;
}
`,
      expectedLines: ["encodeBase62", "url_seq", "INSERT INTO urls"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "unit", label: "Unit: encoder + collisions", durationMs: 700 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [],
      rewardXp: 50,
      rewardCurrency: 25,
      botMessage:
        "Counter + base62 = collision-free codes. Hash + retry would also work, but counters scale predictably.",
      tradeoffs: [
        "Counters: zero collisions, but codes are guessable in order — leaks signup volume.",
        "Hash(longUrl) → take first N chars: idempotent, but collisions need retry.",
        "Random 62^7 codes: 3.5T address space, 1B in use ≈ 0.03% birthday collision chance per insert.",
      ],
      napkinMath: [
        {
          label: "Address space",
          calc: "62^7 ≈ 3.5 × 10^12 codes — 350× headroom over 10B target.",
        },
        {
          label: "Sequence advance rate",
          calc:
            "5M writes/day = ~58 seq/s avg, ~600 peak — Postgres sequence handles it without contention.",
        },
      ],
      alternatives: [
        "Snowflake-style 64-bit IDs (datacenter + ts + seq) — no DB round-trip per ID, harder to operate.",
      ],
    },

    // ============================================================
    // PHASE 2 — Read scale
    // ============================================================
    {
      id: "incident-traffic",
      kind: "incident",
      phase: "Phase 2 · Read scale",
      title: "Incident — Celebrity tweeted our short link",
      severity: "high",
      storyline:
        "A celebrity tweeted a tiny.link URL. The same /:code is being requested 50k times per second. Postgres latency spiked from 5ms to 800ms — read p99 = 800ms, DB CPU 95%, redirect timeouts in the wild. Every single request hits Postgres for the same row.",
      symptoms: [
        "Read latency p99 = 800ms (was 5ms)",
        "DB CPU at 95% on a single key",
        "User-facing redirect timeouts in 3 regions",
      ],
      expectedSlotId: "n_cache_slot",
      acceptedTypes: ["cache"],
      expectedComponentId: "cache",
      botMessage:
        "Hot reads are killing the DB. Drop a Cache between the service and Postgres so we stop hammering the DB for the same code.",
      tradeoffs: [
        "Cache-aside: simple, application controls invalidation (we'll use it).",
        "Read-through (cache library does the DB read): fewer code paths, harder to debug stalls.",
        "Write-through: cache always fresh, but every write pays a cache hop.",
      ],
      napkinMath: [
        {
          label: "Working set",
          calc:
            "Top 10M URLs cover 90% of redirects.\n10M × 250B ≈ 2.5 GB — fits easily in one Redis node.",
        },
        {
          label: "Hit rate impact",
          calc:
            "Cache hit ratio 95% → DB QPS drops from 50k to 2.5k.\nDB CPU usually drops more than 10× because hot row goes away entirely.",
        },
      ],
      alternatives: [
        "Push the cache to the service process (in-memory LRU) — fastest possible, but no cross-instance sharing.",
        "CDN edge cache only — great for redirects, useless for shorten POSTs (covered later).",
      ],
      pipelineMutations: [
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_cache_slot",
            type: "cache",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["cache"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_service_cache_slot", source: "n_service", target: "n_cache_slot", protocol: "tcp" },
        },
      ],
    },
    {
      id: "code-edit-cache",
      kind: "code_edit",
      phase: "Phase 2 · Read scale",
      title: "Wire up Redis as a read-through cache",
      subtitle: "Cache-aside · TTL 1h · jittered",
      componentId: "cache",
      language: "typescript",
      fileName: "src/services/lookup.ts",
      branchName: "feature/cache-hot-redirects",
      placeholderCode: `import { Redis } from "ioredis";
import { db } from "../db";

const cache = new Redis(process.env.REDIS_URL!);

export async function lookup(shortCode: string) {
  const cached = await cache.get(shortCode);
  if (cached) return cached;

  const row = await db.query(
    "SELECT long_url FROM urls WHERE short_code = $1",
    [shortCode],
  );
  const longUrl = row.rows[0]?.long_url ?? null;

  if (longUrl) {
    // Jitter the TTL so 50k keys don't expire at the same instant — that's
    // the cache-stampede pattern we want to avoid up front.
    const ttl = 3600 + Math.floor(Math.random() * 600);
    await cache.set(shortCode, longUrl, "EX", ttl);
  }
  return longUrl;
}
`,
      expectedLines: ["cache.get", "cache.set", "Math.random"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "unit", label: "Unit tests", durationMs: 700 },
        { id: "integration", label: "Integration: cache hit/miss", durationMs: 900 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_cache_slot",
          withNode: { id: "n_cache", type: "cache", label: "Redis (read-through)", status: "healthy" },
        },
      ],
      rewardXp: 60,
      rewardCurrency: 30,
      botMessage:
        "Just enough code to add the cache. Open the PR — green checks merge to main and the new node lights up.",
      tradeoffs: [
        "TTL too high → stale links after takedown. TTL too low → cache barely helps.",
        "Without jitter, all 50k keys for a viral burst expire at the same instant → thundering herd back to DB.",
      ],
      napkinMath: [
        {
          label: "TTL choice",
          calc:
            "Avg viral lifetime ≈ 24h.\n3600s base + 600s jitter = 1h cache.\nSpread expiries → DB sees gentle refresh, never a stampede.",
        },
      ],
      alternatives: [
        "Refresh-ahead (background re-fetch on near-expiry) — smoother latency, more code.",
      ],
    },

    // ============================================================
    // PHASE 3 — Front door
    // ============================================================
    {
      id: "incident-bots",
      kind: "incident",
      phase: "Phase 3 · Front door",
      title: "Incident — Bots are creating millions of short links",
      severity: "high",
      storyline:
        "Spam bots discovered our /shorten endpoint. They are creating short links at 10k/sec, polluting the DB and burning capacity. Anything we add behind the service is too late — we need a front door that can rate limit and authenticate before requests reach us.",
      symptoms: [
        "Write throughput: 10x normal",
        "90% of writes from a few abusive IPs",
        "Storage cost climbing fast",
      ],
      expectedSlotId: "n_gateway_slot",
      acceptedTypes: ["api_gateway"],
      expectedComponentId: "api_gateway",
      botMessage:
        "We need a front door that can rate limit and authenticate before requests reach the service. Drop an API Gateway in front.",
      tradeoffs: [
        "Gateway-side rate limiting kills bad traffic before it costs us a backend round trip.",
        "Per-IP limits punish carrier-grade NAT users; per-API-key limits are fairer for paying users.",
        "Centralizing auth in the gateway = one place to evolve OAuth, JWT, mTLS instead of fixing every service.",
      ],
      napkinMath: [
        {
          label: "Cost of a bot insert",
          calc:
            "Each bot write hits service (CPU) + DB (IOPS) + index update.\nKilling 10k/s of bot traffic at the gateway saves ~$X/mo of DB IOPS provisioning.",
        },
      ],
      alternatives: [
        "WAF-only (Cloudflare rules) — quick to deploy, harder to tune for app-aware quotas.",
        "In-service rate limit middleware — works, but the bot has already paid for a TCP round trip.",
      ],
      pipelineMutations: [
        { kind: "remove_edge", edgeId: "e_client_service" },
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_gateway_slot",
            type: "api_gateway",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["api_gateway"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_client_gateway_slot", source: "n_client", target: "n_gateway_slot", protocol: "http" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_gateway_service", source: "n_gateway_slot", target: "n_service", protocol: "http" },
        },
      ],
    },
    {
      id: "code-edit-gateway",
      kind: "code_edit",
      phase: "Phase 3 · Front door",
      title: "Add gateway rate-limit middleware",
      subtitle: "100 req/min per IP, 429 on exceed",
      componentId: "api_gateway",
      language: "typescript",
      fileName: "gateway/rate-limit.ts",
      branchName: "feature/gateway-rate-limit",
      placeholderCode: `import { gateway } from "./gateway";
import { rateLimit } from "/middleware";

// One bucket per IP, refilled every minute.
gateway.use(
  rateLimit({
    windowMs: 60_000,
    max: 100,
    keyGenerator: (req) => req.ip,
    handler: (_req, res) =>
      res.status(429).json({ error: "rate_limited" }),
  }),
);
`,
      expectedLines: ["rateLimit", "windowMs", "429"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "contract", label: "Contract tests", durationMs: 700 },
        { id: "load", label: "Synthetic load: 429 path", durationMs: 1100 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_gateway_slot",
          withNode: { id: "n_gateway", type: "api_gateway", label: "API Gateway", status: "healthy" },
        },
      ],
      rewardXp: 70,
      rewardCurrency: 35,
      botMessage:
        "Bot traffic now bouncing off the gateway with 429s. DB writes back to normal after merge.",
      tradeoffs: [
        "Fixed window vs sliding window: fixed is cheaper, allows 2x burst at boundary; sliding is fairer.",
        "Token bucket lets short bursts through smoothly; leaky bucket is more strict.",
      ],
      napkinMath: [
        {
          label: "Limit choice",
          calc:
            "100 req/min × 60s ≈ 1.7 req/s avg per IP.\nHumans never get close. Bots get throttled within a second.",
        },
      ],
      alternatives: [
        "Reject only for /shorten (the abused write path) — keeps redirect QPS unbounded for marketing.",
      ],
    },

    // ============================================================
    // PHASE 4 — Horizontal scale
    // ============================================================
    {
      id: "incident-scale",
      kind: "incident",
      phase: "Phase 4 · Horizontal scale",
      title: "Incident — One service instance is the bottleneck",
      severity: "medium",
      storyline:
        "Cache absorbed reads. Gateway killed bot abuse. But a single service instance is at 90% CPU during evening traffic and we have no room for the next spike. Deploys cause brief downtime. Time to scale horizontally.",
      symptoms: [
        "Service CPU pinned at 90% on a single box",
        "Deploys cause a 4s blip",
        "No headroom for traffic spikes",
      ],
      expectedSlotId: "n_lb_slot",
      acceptedTypes: ["load_balancer"],
      expectedComponentId: "load_balancer",
      botMessage:
        "Add a load balancer between the gateway and the service so we can run N instances and roll deploys without downtime.",
      tradeoffs: [
        "L4 LB (TCP) is fastest; L7 LB (HTTP) understands paths/headers and unlocks header-based routing for canaries.",
        "Round-robin is simple but ignores latency; least-connections handles slow boxes better.",
        "Health checks too aggressive = false ejections; too lazy = users hit dead boxes.",
      ],
      napkinMath: [
        {
          label: "Pool size",
          calc:
            "50k peak RPS / 1k RPS per box = 50 boxes nominal.\nAdd N+2 for rolling deploys + zone failure ⇒ provision ~60.",
        },
      ],
      alternatives: [
        "Service mesh (Envoy sidecars) — mTLS + per-call retry built in, more ops weight.",
      ],
      pipelineMutations: [
        { kind: "remove_edge", edgeId: "e_gateway_service" },
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_lb_slot",
            type: "load_balancer",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["load_balancer"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_gateway_lb", source: "n_gateway", target: "n_lb_slot", protocol: "http" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_lb_service", source: "n_lb_slot", target: "n_service", protocol: "http" },
        },
      ],
    },
    {
      id: "code-edit-lb",
      kind: "code_edit",
      phase: "Phase 4 · Horizontal scale",
      title: "Register the service behind the load balancer",
      subtitle: "Health checks + round-robin pool",
      componentId: "load_balancer",
      language: "typescript",
      fileName: "infra/load-balancer.ts",
      branchName: "feature/lb-service-pool",
      placeholderCode: `import { LoadBalancer } from "/lb";

export const lb = new LoadBalancer({
  name: "url-shortener-lb",
  algorithm: "round_robin",
  upstreams: [
    { host: "url-shortener-1.internal", port: 8080 },
    { host: "url-shortener-2.internal", port: 8080 },
    { host: "url-shortener-3.internal", port: 8080 },
  ],
  healthCheck: {
    path: "/healthz",
    intervalMs: 5_000,
    unhealthyThreshold: 3,
  },
});

lb.start();
`,
      expectedLines: ["LoadBalancer", "round_robin", "healthCheck"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "smoke", label: "LB smoke test", durationMs: 700 },
        { id: "rollout", label: "Canary rollout", durationMs: 1100 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_lb_slot",
          withNode: { id: "n_lb", type: "load_balancer", label: "L7 Load Balancer", status: "healthy" },
        },
      ],
      rewardXp: 80,
      rewardCurrency: 40,
      botMessage:
        "LB merged. Three service instances in the pool, deploys are rolling now. CPU per box back to 30%.",
      tradeoffs: [
        "Health check on /healthz that doesn't touch the DB → fewer false unhealthies during a DB blip.",
        "Connection draining on shutdown gives in-flight requests time to finish before the box dies.",
      ],
      napkinMath: [
        {
          label: "Capacity headroom",
          calc:
            "3 boxes × 1k RPS = 3k RPS today.\nPick scale-out trigger at 60% utilization to absorb 2× spikes.",
        },
      ],
      alternatives: [
        "Anycast load balancing (AWS Global Accelerator) — bonus geo-routing, less explicit control.",
      ],
    },

    // ============================================================
    // PHASE 5 — Global edge
    // ============================================================
    {
      id: "incident-global-latency",
      kind: "incident",
      phase: "Phase 5 · Global edge",
      title: "Incident — Users in APAC and EU see 400ms+ redirects",
      severity: "medium",
      storyline:
        "Our entire fleet lives in us-east-1. A user in Singapore pays 250ms just for the network round-trip before we even look up the row. Redirects must feel instant — short links are a customer expectation. We need to push reads to the edge so 80% of redirects never touch the origin region.",
      symptoms: [
        "p95 redirect latency in APAC: 420ms",
        "p95 in EU: 320ms",
        "Origin egress costs trending up",
      ],
      expectedSlotId: "n_cdn_slot",
      acceptedTypes: ["cdn"],
      expectedComponentId: "cdn",
      botMessage:
        "Drop a CDN in front of the gateway. We'll cache 30x redirects at the edge with a short TTL so APAC users never hit us-east-1.",
      tradeoffs: [
        "CDN edge POPs serve the response from the user's continent — sub-50ms p95 globally.",
        "Edge cache means delayed takedowns (until TTL expires or you purge) — Surrogate-Keys let us purge a single short_code.",
        "POSTs (shorten) can't be edge-cached; only GETs benefit.",
      ],
      napkinMath: [
        {
          label: "Edge offload",
          calc:
            "If 80% of redirects hit edge, origin sees 50k × 20% = 10k RPS — frees up our LB pool for shortens + cold reads.",
        },
        {
          label: "Cost",
          calc:
            "Egress at edge ≈ $0.02/GB (vs $0.09/GB origin). For 500M redirects/day × 1KB header → 500GB/day → ~$300/day savings.",
        },
      ],
      alternatives: [
        "Multi-region origin without CDN — way more ops weight, no real wins for static-shape responses like 302s.",
      ],
      pipelineMutations: [
        { kind: "remove_edge", edgeId: "e_client_gateway_slot" },
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_cdn_slot",
            type: "cdn",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["cdn"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_client_cdn_slot", source: "n_client", target: "n_cdn_slot", protocol: "http" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_cdn_gateway", source: "n_cdn_slot", target: "n_gateway", protocol: "http" },
        },
      ],
    },
    {
      id: "code-edit-cdn",
      kind: "code_edit",
      phase: "Phase 5 · Global edge",
      title: "Make redirects edge-cacheable",
      subtitle: "Cache-Control + Surrogate-Key + tiny TTL",
      componentId: "cdn",
      language: "typescript",
      fileName: "src/handlers/redirect.ts",
      branchName: "feature/cdn-redirect-headers",
      placeholderCode: `import type { Request, Response } from "express";
import { lookup } from "../services/lookup";

export async function redirect(req: Request, res: Response) {
  const code = req.params.code;
  const longUrl = await lookup(code);
  if (!longUrl) return res.status(404).end();

  // 60s TTL at the edge — short enough to honor takedowns, long enough
  // that a celebrity link is served entirely from the CDN.
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
  // Tag so we can selectively purge a single short_code on takedown.
  res.setHeader("Surrogate-Key", \`url:\${code}\`);
  return res.redirect(302, longUrl);
}
`,
      expectedLines: ["Cache-Control", "Surrogate-Key", "302"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "edge", label: "Edge cache test", durationMs: 800 },
        { id: "purge", label: "Surrogate-key purge test", durationMs: 700 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_cdn_slot",
          withNode: { id: "n_cdn", type: "cdn", label: "CDN (global edge)", status: "healthy" },
        },
      ],
      rewardXp: 90,
      rewardCurrency: 45,
      botMessage:
        "APAC p95 just dropped from 420ms to 35ms. The CDN is doing the work, the origin is asleep.",
      tradeoffs: [
        "60s s-maxage is a good default for redirects; private content needs much shorter TTLs.",
        "Surrogate-Key tagging lets ops purge a single bad URL without invalidating the whole zone.",
      ],
      napkinMath: [
        {
          label: "Cache hit ratio expectation",
          calc:
            "Top 5% of links carry 80% of clicks (long-tail).\nWith 60s TTL the hit ratio settles at ~85–90% in steady state.",
        },
      ],
      alternatives: [
        "Stale-while-revalidate: serve stale 302s while we refresh in the background — better p99 during purge floods.",
      ],
    },

    // ============================================================
    // PHASE 6 — Write scale & durability
    // ============================================================
    {
      id: "incident-write-hotspot",
      kind: "incident",
      phase: "Phase 6 · Write scale & durability",
      title: "Incident — One DB primary can't take the writes",
      severity: "high",
      storyline:
        "Even with bot abuse blocked, legitimate writes — bulk imports, partner APIs — are now at 8k inserts/sec. Our single Postgres primary is at 92% disk IOPS. Index bloat is making INSERTs slower. We need to shard.",
      symptoms: [
        "Write IOPS at 92% of provisioned",
        "p99 INSERT latency 350ms",
        "Replication lag to read replica spiking",
      ],
      expectedSlotId: "n_shard_slot",
      acceptedTypes: ["database"],
      expectedComponentId: "database",
      botMessage:
        "Add a sharded write tier. We'll route by hash(short_code) so each shard handles ~1/4 of writes.",
      tradeoffs: [
        "Hash sharding spreads writes evenly but kills range scans (we don't need them).",
        "Range sharding is great for time-series but creates hot tail shards.",
        "Consistent hashing (ring of vNodes) makes future re-sharding cheap (1/N moves) but is more code.",
      ],
      napkinMath: [
        {
          label: "Per-shard load",
          calc:
            "8k inserts/s ÷ 4 shards = 2k inserts/s per shard.\nIOPS budget per shard ~5k → 60% utilized, room to grow.",
        },
        {
          label: "Doubling cost",
          calc:
            "Adding 4 → 8 shards moves ~50% of keys with naive modulo,\nbut only ~12.5% with consistent hashing.",
        },
      ],
      alternatives: [
        "Partitioned tables in one Postgres (declarative partitions) — simpler ops, still bound by one host's IOPS ceiling.",
        "CockroachDB / Spanner — auto-sharding + SQL, vendor lock-in + cost.",
      ],
      pipelineMutations: [
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_shard_slot",
            type: "database",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["database"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_service_shard_slot", source: "n_service", target: "n_shard_slot", protocol: "tcp" },
        },
      ],
    },
    {
      id: "code-edit-sharding",
      kind: "code_edit",
      phase: "Phase 6 · Write scale & durability",
      title: "Route writes by consistent hash",
      subtitle: "4-shard tier · stable on resharding",
      componentId: "database",
      language: "typescript",
      fileName: "src/db/sharding.ts",
      branchName: "feature/shard-router",
      placeholderCode: `import { createHash } from "crypto";
import { Pool } from "pg";

const shards = [
  new Pool({ connectionString: process.env.SHARD_0 }),
  new Pool({ connectionString: process.env.SHARD_1 }),
  new Pool({ connectionString: process.env.SHARD_2 }),
  new Pool({ connectionString: process.env.SHARD_3 }),
];

export function shardFor(shortCode: string): Pool {
  // Stable hash — adding shards later means a 1/N rebalance,
  // not a full reshuffle. (For full consistent hashing we'd use
  // a ring of virtual nodes; this is the production-shaped MVP.)
  const hex = createHash("sha1").update(shortCode).digest("hex");
  const bucket = parseInt(hex.slice(0, 8), 16) % shards.length;
  return shards[bucket];
}

export async function insertUrl(code: string, longUrl: string) {
  const pool = shardFor(code);
  await pool.query(
    "INSERT INTO urls(short_code, long_url) VALUES ($1, $2)",
    [code, longUrl],
  );
}
`,
      expectedLines: ["shardFor", "createHash", "INSERT INTO urls"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "unit", label: "Unit: stable hashing", durationMs: 700 },
        { id: "shadow", label: "Shadow writes vs primary", durationMs: 1100 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_shard_slot",
          withNode: { id: "n_shards", type: "database", label: "Postgres shards (×4)", status: "healthy" },
        },
      ],
      rewardXp: 100,
      rewardCurrency: 50,
      botMessage:
        "Writes spread across four shards. Per-shard IOPS dropped to 25%. We can now triple write throughput before re-sharding again.",
      tradeoffs: [
        "Cross-shard transactions are forbidden by convention here — every write is single-shard.",
        "Read paths must know which shard they're hitting; lookups by short_code go through shardFor().",
      ],
      alternatives: [
        "Vitess in front of Postgres — query rewriting layer, zero application code change, more infra.",
      ],
    },

    // ============================================================
    // PHASE 7 — Async analytics
    // ============================================================
    {
      id: "incident-analytics-missing",
      kind: "incident",
      phase: "Phase 7 · Async analytics",
      title: "Incident — Product wants per-link click analytics yesterday",
      severity: "medium",
      storyline:
        "Product wants click counts, geo breakdowns, referrer breakdowns, and unique-visitor estimates per short_code. Stuffing this into the redirect path would add 50ms and increase DB load. We need to fire-and-forget click events to a queue and process them async.",
      symptoms: [
        "No click analytics today",
        "Synchronously logging to DB adds 50ms/redirect",
        "Product blocked on launch",
      ],
      expectedSlotId: "n_queue_slot",
      acceptedTypes: ["message_queue"],
      expectedComponentId: "message_queue",
      botMessage:
        "Drop a Message Queue between the service and a worker. The redirect path enqueues a click event in <1ms and returns immediately.",
      tradeoffs: [
        "Async = decoupling: the redirect never waits on analytics. But click events can be lost if the queue itself dies.",
        "At-least-once delivery means workers must handle duplicate events idempotently.",
        "Backpressure: if workers stall, the queue grows — alert on lag, not just on RPS.",
      ],
      napkinMath: [
        {
          label: "Event size on the wire",
          calc:
            "{ code, ts, ip, ua, ref } ≈ 300B\n50k events/s × 300B = 15 MB/s ≈ 130 GB/day of raw click stream.",
        },
        {
          label: "Queue retention",
          calc:
            "If the worker dies and we keep 24h retention,\n130 GB/day × 1 day buffer = ~130 GB allocated capacity.",
        },
      ],
      alternatives: [
        "Pub/Sub (Kafka) for replayability + multiple consumers; SQS for simplicity. We'd pick Kafka here for analytics replay.",
        "Direct write to the warehouse from the redirect path — terrible coupling, will burn p95.",
      ],
      pipelineMutations: [
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_queue_slot",
            type: "message_queue",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["message_queue"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_service_queue_slot", source: "n_service", target: "n_queue_slot", protocol: "async" },
        },
      ],
    },
    {
      id: "teach-worker",
      kind: "teach_component",
      phase: "Phase 7 · Async analytics",
      title: "Add a Worker pool to drain the queue",
      subtitle: "Background compute, scaled separately",
      componentId: "worker",
      story:
        "The queue has events but nobody is processing them. We need a worker pool that pulls from the queue, batches click events, and writes them somewhere queryable.",
      whatItIs:
        "A horizontally-scalable worker fleet (think Kubernetes deployment) that pulls from the queue and runs side-effect code.",
      whatItDoes:
        "Reads click events in batches of 1000, enriches them with geo + UA, and writes them to the analytics warehouse.",
      addMutations: [
        {
          kind: "add_node",
          node: { id: "n_worker", type: "worker", label: "Click Worker pool", status: "healthy" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_queue_worker", source: "n_queue_slot", target: "n_worker", protocol: "async", animated: true },
        },
      ],
      botMessage:
        "Worker pool is up. We still need somewhere durable to store the click events for product to query.",
      tradeoffs: [
        "Workers scale on queue depth, not request rate — completely independent of the user-facing service.",
        "Batched writes amortize warehouse insert cost; large batches risk losing more on a crash.",
      ],
      napkinMath: [
        {
          label: "Worker count",
          calc:
            "1 worker drains ~5k msg/s with batch=1000.\n50k peak ÷ 5k = 10 workers, double for headroom = 20.",
        },
      ],
    },
    {
      id: "code-edit-emit-click",
      kind: "code_edit",
      phase: "Phase 7 · Async analytics",
      title: "Fire-and-forget click events from the redirect path",
      subtitle: "Stays under 1ms · zero impact on p95",
      componentId: "message_queue",
      language: "typescript",
      fileName: "src/handlers/redirect.ts",
      branchName: "feature/emit-click-event",
      placeholderCode: `import { lookup } from "../services/lookup";
import { mq } from "../infra/queue";

export async function redirect(req, res) {
  const code = req.params.code;
  const longUrl = await lookup(code);
  if (!longUrl) return res.status(404).end();

  // Fire-and-forget — we never block the redirect on analytics.
  mq.publish("clicks", {
    code,
    ts: Date.now(),
    ip: req.ip,
    ua: req.headers["user-agent"] ?? "",
    ref: req.headers["referer"] ?? "",
  }).catch(() => {/* best effort */});

  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
  return res.redirect(302, longUrl);
}
`,
      expectedLines: ["mq.publish", "clicks", "fire-and-forget"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "unit", label: "Unit: redirect still fast", durationMs: 700 },
        { id: "perf", label: "Perf: p95 unchanged", durationMs: 900 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_queue_slot",
          withNode: { id: "n_queue", type: "message_queue", label: "Click event queue", status: "healthy" },
        },
      ],
      rewardXp: 90,
      rewardCurrency: 45,
      botMessage:
        "Clicks are now flowing through the queue without slowing the redirect path by a single millisecond.",
      tradeoffs: [
        ".catch(()=>{}) on the publish keeps redirect latency intact even if the queue is degraded — an explicit choice to drop analytics under failure.",
        "We do not await the publish — the redirect responds first, the event flushes after.",
      ],
    },

    // ============================================================
    // PHASE 8 — Warehouse & reporting
    // ============================================================
    {
      id: "teach-warehouse",
      kind: "teach_component",
      phase: "Phase 8 · Warehouse & reporting",
      title: "Store raw clicks for the data team",
      subtitle: "Add an analytics sink",
      componentId: "analytics",
      story:
        "The worker is dropping events on the floor for now. Product wants raw click rows queryable for ad-hoc analysis (which countries clicked, which referrers, retention by user). We need a columnar warehouse.",
      whatItIs:
        "A columnar OLAP warehouse (Snowflake / BigQuery / ClickHouse) optimized for aggregations across billions of rows.",
      whatItDoes:
        "The worker writes batched click rows here every 30s. Product queries it via dashboards. We never let dashboard queries hit our OLTP DB.",
      addMutations: [
        {
          kind: "add_node",
          node: { id: "n_warehouse", type: "analytics", label: "Analytics warehouse", status: "healthy" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_worker_warehouse", source: "n_worker", target: "n_warehouse", protocol: "async", animated: true },
        },
      ],
      botMessage:
        "Now the warehouse is in. Time to actually batch and load events into it.",
      tradeoffs: [
        "OLAP (warehouse) ≠ OLTP (Postgres). Mixing them destroys both.",
        "Columnar storage is brutally fast for SELECT COUNT(*), GROUP BY country — terrible for single-row lookups.",
      ],
      napkinMath: [
        {
          label: "Storage growth",
          calc:
            "500M clicks/day × 200B compressed = 100 GB/day → ~36 TB/year before retention pruning.",
        },
      ],
      alternatives: [
        "ClickHouse (self-hosted, very fast, more ops). BigQuery (managed, pricey at scale).",
      ],
    },
    {
      id: "code-edit-batch-load",
      kind: "code_edit",
      phase: "Phase 8 · Warehouse & reporting",
      title: "Batch click events into the warehouse",
      subtitle: "30s windows · idempotent loads",
      componentId: "analytics",
      language: "typescript",
      fileName: "workers/click-loader.ts",
      branchName: "feature/click-batch-loader",
      placeholderCode: `import { mq } from "../infra/queue";
import { warehouse } from "../infra/warehouse";

const BATCH = 1_000;
const FLUSH_MS = 30_000;

let buffer: any[] = [];
let lastFlush = Date.now();

mq.subscribe("clicks", async (event) => {
  buffer.push(event);
  if (buffer.length >= BATCH || Date.now() - lastFlush > FLUSH_MS) {
    const rows = buffer.splice(0, buffer.length);
    lastFlush = Date.now();
    await warehouse.insertRows("fact_clicks", rows, {
      // Worker-level idempotency: the batch id makes a re-run safe.
      idempotencyKey: \`batch-\${rows[0].ts}-\${rows.length}\`,
    });
  }
});
`,
      expectedLines: ["warehouse.insertRows", "idempotencyKey"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "unit", label: "Unit: batch + flush", durationMs: 700 },
        { id: "load", label: "Load test: 50k events/s", durationMs: 1100 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [],
      rewardXp: 80,
      rewardCurrency: 40,
      botMessage:
        "Warehouse is being fed. Product can query click counts within 30 seconds of the click happening.",
      tradeoffs: [
        "30s flush balances freshness vs warehouse load. Real-time KPIs would need a streaming layer (Kafka Streams / Flink).",
        "idempotencyKey makes batch retries safe — re-running a batch never double-counts.",
      ],
    },

    // ============================================================
    // PHASE 9 — Abuse defense
    // ============================================================
    {
      id: "incident-phishing",
      kind: "incident",
      phase: "Phase 9 · Abuse defense",
      title: "Incident — Phishing campaigns are abusing tiny.link",
      severity: "critical",
      storyline:
        "Trust & Safety reports thousands of tiny.link URLs pointing at phishing pages. The press is asking. We need an Auth/scoring layer that holds suspicious shortens for review and blocks blacklisted destinations.",
      symptoms: [
        "Multiple phishing reports per minute",
        "Big customers threatening to block tiny.link",
        "PR risk if we do nothing",
      ],
      expectedSlotId: "n_auth_slot",
      acceptedTypes: ["auth"],
      expectedComponentId: "auth",
      botMessage:
        "Drop an Auth/abuse scoring service in front of the service. It runs URL → safety check → allow / hold for review.",
      tradeoffs: [
        "Sync abuse check on /shorten adds a hop, but every short you skip is a phishing risk.",
        "ML score thresholds: too strict = false positives lose customers; too loose = phishing slips through.",
        "Hold-for-review queue lets humans break the tie — but you need staffing.",
      ],
      napkinMath: [
        {
          label: "Latency budget",
          calc:
            "/shorten p95 budget: 200ms.\nAbuse model adds ~30ms (cached on warm path).\n→ leaves 170ms for the actual write path.",
        },
        {
          label: "False-positive cost",
          calc:
            "If model has 0.5% FP, at 5M shortens/day → 25k legit URLs held/day.\nReviewers need ~30 sec/URL → 200 person-hours/day. Tune the threshold up.",
        },
      ],
      alternatives: [
        "Async scoring (let everything through, score after the fact, purge bad ones) — saves latency, leaks phishing for minutes.",
      ],
      pipelineMutations: [
        {
          kind: "add_missing_slot",
          slot: {
            id: "n_auth_slot",
            type: "auth",
            label: "Drop here",
            status: "down",
            isMissingSlot: true,
            acceptedTypes: ["auth"],
          },
        },
        {
          kind: "add_edge",
          edge: { id: "e_gateway_auth", source: "n_gateway", target: "n_auth_slot", protocol: "http" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_auth_lb", source: "n_auth_slot", target: "n_lb", protocol: "http" },
        },
        { kind: "remove_edge", edgeId: "e_gateway_lb" },
      ],
    },
    {
      id: "code-edit-abuse",
      kind: "code_edit",
      phase: "Phase 9 · Abuse defense",
      title: "Add an abuse scorer in front of /shorten",
      subtitle: "Block known-bad · hold suspicious",
      componentId: "auth",
      language: "typescript",
      fileName: "auth/abuse-scorer.ts",
      branchName: "feature/abuse-scorer",
      placeholderCode: `import { abuseModel } from "/safety";
import { db } from "../db";

export async function checkUrl(longUrl: string, ownerId: string) {
  const score = await abuseModel.score(longUrl);
  if (score.verdict === "block") {
    throw new Error(\`url_blocked:\${score.reason}\`);
  }
  if (score.verdict === "hold") {
    await db.query(
      "INSERT INTO review_queue(long_url, owner_id, score) VALUES ($1, $2, $3)",
      [longUrl, ownerId, score.value],
    );
    return { held: true };
  }
  return { ok: true };
}
`,
      expectedLines: ["abuseModel.score", "review_queue", "url_blocked"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "unit", label: "Unit: block / hold / allow", durationMs: 800 },
        { id: "shadow", label: "Shadow score on prod traffic", durationMs: 1100 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [
        {
          kind: "fill_slot",
          slotId: "n_auth_slot",
          withNode: { id: "n_auth", type: "auth", label: "Abuse scorer", status: "healthy" },
        },
      ],
      rewardXp: 90,
      rewardCurrency: 45,
      botMessage:
        "Abuse scorer live. Phishing complaints down 92% over the next 24 hours.",
      tradeoffs: [
        "Three verdicts (allow / hold / block) is nicer than binary — it gives humans a queue without locking out grey-area URLs.",
        "Storing the raw score lets us re-bucket later without re-scoring.",
      ],
    },

    // ============================================================
    // PHASE 10 — Observability
    // ============================================================
    {
      id: "teach-monitor",
      kind: "teach_component",
      phase: "Phase 10 · Observability",
      title: "Add a monitoring layer",
      subtitle: "You cannot operate what you cannot see",
      componentId: "monitor",
      story:
        "We have a real distributed system now. Caches, shards, queues, workers, edge nodes, abuse scorer. When something breaks at 3am, we need to know which component before we know it broke.",
      whatItIs:
        "Metrics, traces, logs, and alerting (Prometheus + OpenTelemetry + a paging system).",
      whatItDoes:
        "Every component emits RED (rate, errors, duration) metrics + traces. Alerts page on-call when SLOs are breached.",
      addMutations: [
        {
          kind: "add_node",
          node: { id: "n_monitor", type: "monitor", label: "Monitoring", status: "healthy" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_service_monitor", source: "n_service", target: "n_monitor", protocol: "async" },
        },
        {
          kind: "add_edge",
          edge: { id: "e_worker_monitor", source: "n_worker", target: "n_monitor", protocol: "async" },
        },
      ],
      botMessage:
        "Monitoring wired. Tiny.link is now a system you can actually run on-call for.",
      tradeoffs: [
        "Pull-based metrics (Prometheus): each component exposes /metrics — easy in Kubernetes, harder for ephemeral workers.",
        "Push-based (StatsD): simpler clients, central aggregator becomes a SPOF.",
        "Sampling traces 1% catches the long tail without paying for full tracing of 50k req/s.",
      ],
      napkinMath: [
        {
          label: "Metric cardinality",
          calc:
            "If we tag every metric by short_code, we'd have 10B series — that's a $/yr nightmare.\nTag by route, region, and version only.",
        },
      ],
    },
    {
      id: "code-edit-slo",
      kind: "code_edit",
      phase: "Phase 10 · Observability",
      title: "Define and emit our redirect SLO",
      subtitle: "p95 redirect < 100ms · error rate < 0.5%",
      componentId: "monitor",
      language: "typescript",
      fileName: "src/observability/slo.ts",
      branchName: "feature/redirect-slo",
      placeholderCode: `import { metrics } from "/otel";

const histogram = metrics.histogram("redirect_latency_ms", {
  description: "Tiny.link redirect end-to-end latency",
  unit: "ms",
  buckets: [10, 25, 50, 100, 250, 500, 1000],
});

const errorCounter = metrics.counter("redirect_errors_total");

export function recordRedirect(latencyMs: number, ok: boolean) {
  histogram.observe(latencyMs);
  if (!ok) errorCounter.add(1);
}

// SLO: p95 redirect < 100ms over 28 days. Burn-rate alert pages
// the on-call when we'd exhaust a 28d budget in <1h.
`,
      expectedLines: ["redirect_latency_ms", "burn-rate", "p95"],
      checks: [
        { id: "lint", label: "ESLint", durationMs: 500 },
        { id: "alerts", label: "Alert simulator", durationMs: 700 },
        { id: "deploy", label: "Deploy main", durationMs: 700 },
      ],
      successMutations: [],
      rewardXp: 70,
      rewardCurrency: 35,
      botMessage:
        "SLO defined. We now have a concrete number that says whether tiny.link is healthy or not.",
      tradeoffs: [
        "SLO targets must be stricter than the customer's expectation, looser than what the system can do at peak — that gap is your error budget.",
        "Burn-rate alerts page on real outages, not on every blip — far less alert fatigue than threshold alerts.",
      ],
      napkinMath: [
        {
          label: "Error budget for 99.5% redirects",
          calc:
            "0.5% × 500M req/day = 2.5M failures/day allowed.\nReality check: aim much higher (99.95%) for a UX-critical redirect.",
        },
      ],
    },

    // ============================================================
    // PHASE 11 — Final ship + retro
    // ============================================================
    {
      id: "ship",
      kind: "ship",
      phase: "Phase 11 · Final ship",
      title: "Cut the 1.0 release branch",
      subtitle: "Final ship to production",
      branchName: "release/tiny-link-1.0",
      checks: [
        { id: "regression", label: "Full regression suite", durationMs: 1100 },
        { id: "perf", label: "Perf baseline (50k rps)", durationMs: 900 },
        { id: "chaos", label: "Chaos: kill 1 shard", durationMs: 900 },
        { id: "deploy", label: "Deploy to all regions", durationMs: 800 },
      ],
      botMessage:
        "Time to cut a real release branch. Run the full regression, the perf baseline, and a small chaos drill before we roll it out everywhere.",
      tradeoffs: [
        "Ship in waves (canary 1% → 10% → 100%) — slower, way safer.",
        "Chaos as part of release is what catches the failure modes you'd otherwise discover during your first incident.",
      ],
    },
    {
      id: "summary",
      kind: "summary",
      phase: "Recap",
      title: "Tiny.link 1.0 is live",
      subtitle: "What you actually shipped",
      recap: [
        "Client → Service → Database is the MVP shape of almost any web app.",
        "A Cache absorbs hot reads when one key is requested far more than others. Always jitter the TTL.",
        "An API Gateway protects the system with rate limits and auth before traffic hits services.",
        "A Load Balancer + multiple service instances gives you horizontal scale and zero-downtime deploys.",
        "A CDN at the edge moves 80%+ of redirects out of the origin region — global p95 collapses.",
        "Sharding writes by hash(short_code) lets you scale beyond a single primary without losing locality.",
        "An async queue + worker pool isolates analytics from the redirect path so user latency never pays for it.",
        "An OLAP warehouse is for analytics; never let dashboard queries hit your OLTP DB.",
        "An abuse-scoring layer in front of /shorten is what stops phishing campaigns from ruining your reputation.",
        "Monitoring + a real SLO is what turns a system into something you can run on-call for.",
        "We grew the system by responding to incidents, not by over-architecting up front.",
      ],
      rewardXp: 380,
      rewardCurrency: 200,
      botMessage:
        "Tiny.link 1.0 shipped. Take a breath. You just walked through what staff engineers walk through in a real interview — end to end.",
    },
  ],
};

export const JOURNEYS: Record<string, ProjectJourney> = {
  "url-shortener": URL_SHORTENER_JOURNEY,
};

export function getJourney(projectId: string): ProjectJourney | undefined {
  return JOURNEYS[projectId];
}
