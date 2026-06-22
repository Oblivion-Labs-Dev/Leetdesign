import type { PracticeExercise } from "@/types";

const COMMON_INVENTORY = [
  "client",
  "cdn",
  "load_balancer",
  "api_gateway",
  "service",
  "cache",
  "database",
  "message_queue",
  "stream",
  "analytics",
  "monitor",
  "auth",
];

export const PRACTICE_EXERCISES: PracticeExercise[] = [
  // ----- Tied to URL Shortener project -----
  {
    id: "url-shortener-global",
    projectId: "url-shortener",
    title: "Design Tiny.link for global scale",
    prompt:
      "Design a URL shortener that can serve 50k redirects per second globally with sub-100ms p95 latency. Reads dominate writes by 100:1. Custom aliases must be unique. Abuse must be detectable.",
    nfrs: [
      "p95 latency under 100ms globally",
      "99.95% availability",
      "Resilient to 10x traffic spikes",
      "No oversell of custom aliases",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Separate read and write paths.",
      "Edge caching for hot redirects.",
      "Async pipeline for analytics and abuse signals.",
    ],
    rewardXp: 220,
    rewardCurrency: 90,
  },
  {
    id: "tiny-link-analytics",
    projectId: "url-shortener",
    title: "Add real-time link analytics",
    prompt:
      "Extend Tiny.link with real-time analytics: total clicks, unique visitors, geo and referrer breakdowns, available within 30 seconds. Must not slow the redirect path.",
    nfrs: [
      "Redirect path stays p95 < 100ms",
      "Analytics dashboard freshness < 30s",
      "Survive 1B events/day",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Fire-and-forget event capture from the redirect path.",
      "Batched aggregation in a stream processor.",
      "Pre-aggregated tables for fast dashboard reads.",
    ],
    rewardXp: 180,
    rewardCurrency: 70,
  },

  // ----- Standalone classics (no project yet) -----
  {
    id: "rate-limiter",
    title: "Build a distributed rate limiter",
    prompt:
      "Design a rate limiter used across all internal services. 100k req/s aggregate. Per-key (user, IP, API key) limits. Must work across multiple data centers.",
    nfrs: [
      "Per-key correctness within 1% of configured limit",
      "p99 add-latency under 5ms",
      "Survive single-DC failure",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Sliding window vs token bucket trade-offs.",
      "Local cache + global counter sync strategy.",
      "How you distribute keys across shards.",
    ],
    rewardXp: 200,
    rewardCurrency: 80,
  },
  {
    id: "newsfeed",
    title: "Design a Twitter-like news feed",
    prompt:
      "Design a feed for 200M DAU. Celebrities have 100M followers. Median user follows 200 accounts. Reads must be fast; writes can lag a bit.",
    nfrs: [
      "Feed open p95 < 200ms",
      "New tweet visible to followers in < 5s for normal users",
      "Celebrity tweets must not melt the system",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Push (fan-out on write) vs Pull (fan-out on read).",
      "Hybrid for celebrities.",
      "Caching the timeline blob per user.",
    ],
    rewardXp: 280,
    rewardCurrency: 120,
  },
  {
    id: "chat-1to1",
    title: "Design a 1:1 chat service (WhatsApp-lite)",
    prompt:
      "Design a 1:1 messaging service with delivery, read receipts, and offline queueing. 500M users, 50M concurrent.",
    nfrs: [
      "p95 message send → delivered < 500ms",
      "Survive partial DC outages",
      "End-to-end ordered per conversation",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "WebSocket gateway sharding.",
      "Conversation-keyed message store.",
      "Push notifications for offline users.",
    ],
    rewardXp: 260,
    rewardCurrency: 110,
  },
  {
    id: "ride-hail-matching",
    title: "Design a ride-hailing matcher (Uber-lite)",
    prompt:
      "Design the rider↔driver matching service. 1M concurrent drivers, 5M concurrent riders. Match within 5s. Surge pricing applies.",
    nfrs: [
      "Match latency p95 < 5s",
      "Geo-index updates within 1s",
      "Fair surge pricing per region",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Geo-sharded matching service.",
      "Quad-tree / S2 cells for proximity.",
      "Stream of driver location updates.",
    ],
    rewardXp: 300,
    rewardCurrency: 140,
  },
  {
    id: "ticketing-flash",
    title: "Design Ticketmaster-style flash sales",
    prompt:
      "Sell 100k concert tickets in 30 seconds. Strict no-oversell. Fair queueing. Survive bot floods.",
    nfrs: [
      "Strict consistency on inventory",
      "Survive 100x normal traffic",
      "User-perceived fairness",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Virtual waiting room.",
      "Inventory reservation with TTL.",
      "Single-master inventory shards per event.",
    ],
    rewardXp: 320,
    rewardCurrency: 150,
  },
  {
    id: "video-streaming",
    title: "Design a video streaming pipeline",
    prompt:
      "Design the upload → encode → distribute → playback pipeline for a YouTube-style service. 500h uploaded per minute.",
    nfrs: [
      "Time to first byte for playback < 2s globally",
      "Original quality preserved",
      "Cost-optimized cold storage for tail content",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Async encoding pipeline with priorities.",
      "CDN strategy for hot vs cold content.",
      "ABR ladder selection.",
    ],
    rewardXp: 280,
    rewardCurrency: 120,
  },
  {
    id: "feature-flag-service",
    title: "Design a feature flag service",
    prompt:
      "Design a feature flag service used by all internal services. Sub-millisecond eval at the SDK level. Centralized config, instant rollback.",
    nfrs: [
      "SDK eval p99 < 1ms",
      "Config rollout < 30s globally",
      "Audit log of every flag change",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Edge config push vs poll.",
      "SDK-side caching with versioned ETags.",
      "Canary rollout primitives.",
    ],
    rewardXp: 200,
    rewardCurrency: 80,
  },
  {
    id: "metrics-pipeline",
    title: "Design a metrics ingestion pipeline",
    prompt:
      "Design ingestion for 10M metrics-per-second from internal services. Queryable in dashboards within 30s. 30-day retention.",
    nfrs: [
      "10M points/s sustained",
      "Query freshness < 30s",
      "Cost-aware retention",
    ],
    inventory: COMMON_INVENTORY,
    rubricHints: [
      "Batch + stream split paths.",
      "Tiered storage (hot/warm/cold).",
      "Time-series DB shape.",
    ],
    rewardXp: 240,
    rewardCurrency: 100,
  },
];

export function getPractice(id: string): PracticeExercise | undefined {
  return PRACTICE_EXERCISES.find((p) => p.id === id);
}

export function getPracticeForProject(projectId: string): PracticeExercise[] {
  return PRACTICE_EXERCISES.filter((p) => p.projectId === projectId);
}
