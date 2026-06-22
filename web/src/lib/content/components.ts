import type { InventoryComponent } from "@/types";

export const COMPONENT_LIBRARY: Record<string, InventoryComponent> = {
  client: {
    id: "client",
    type: "client",
    label: "Client",
    shortDescription: "Web or mobile app users open from their device.",
    whenToUse: "Always — the entry point of any user-facing system.",
    tradeoffs: ["Untrusted boundary; never trust client input."],
    iconKey: "Users",
  },
  load_balancer: {
    id: "load_balancer",
    type: "load_balancer",
    label: "Load Balancer",
    shortDescription:
      "Distributes traffic across many service instances for scale and availability.",
    whenToUse:
      "When a single service replica cannot handle the request volume or you need failover.",
    tradeoffs: [
      "Adds a hop and a small amount of latency.",
      "Requires health checks for instances.",
    ],
    iconKey: "Network",
  },
  api_gateway: {
    id: "api_gateway",
    type: "api_gateway",
    label: "API Gateway",
    shortDescription:
      "Single entry point handling auth, rate limiting, routing, and request shaping.",
    whenToUse:
      "When many services need a unified front door with cross-cutting policies.",
    tradeoffs: [
      "Becomes a critical path; needs to scale and be highly available.",
      "Misconfiguration can hide downstream failures.",
    ],
    iconKey: "ShieldCheck",
  },
  service: {
    id: "service",
    type: "service",
    label: "Microservice",
    shortDescription:
      "Stateless application service that runs business logic.",
    whenToUse:
      "When you can isolate a bounded responsibility behind an API.",
    tradeoffs: [
      "More services means more operational surface area.",
      "Require contracts and observability.",
    ],
    iconKey: "Server",
  },
  cache: {
    id: "cache",
    type: "cache",
    label: "Cache",
    shortDescription:
      "Fast in-memory store to reduce latency and database load.",
    whenToUse:
      "When the same hot data is read repeatedly and a small staleness is acceptable.",
    tradeoffs: [
      "Cache invalidation is famously hard.",
      "Can hide bugs and outdated data if misused.",
    ],
    iconKey: "Zap",
  },
  database: {
    id: "database",
    type: "database",
    label: "Database",
    shortDescription:
      "Durable storage for transactional or relational data.",
    whenToUse: "When you need durability, consistency, and rich query patterns.",
    tradeoffs: [
      "Vertical scale ceiling; sharding adds complexity.",
      "Schema changes can become bottlenecks.",
    ],
    iconKey: "Database",
  },
  object_store: {
    id: "object_store",
    type: "object_store",
    label: "Object Store",
    shortDescription:
      "Cheap, durable blob storage for files, images, and large payloads.",
    whenToUse:
      "When storing large unstructured assets that do not need transactional reads.",
    tradeoffs: [
      "Higher latency than databases.",
      "No native query/indexing — pair with a database for metadata.",
    ],
    iconKey: "Archive",
  },
  message_queue: {
    id: "message_queue",
    type: "message_queue",
    label: "Message Queue",
    shortDescription:
      "Asynchronous buffer between producers and consumers to absorb load and decouple work.",
    whenToUse:
      "When traffic is spiky, work is async, or producers and consumers must be decoupled.",
    tradeoffs: [
      "Adds eventual consistency.",
      "Requires retry, dead-letter, and ordering strategies.",
    ],
    iconKey: "Inbox",
  },
  stream: {
    id: "stream",
    type: "stream",
    label: "Event Stream",
    shortDescription:
      "Append-only log of events for high-throughput, multi-consumer pipelines.",
    whenToUse:
      "Real-time analytics, change capture, fan-out to many subscribers.",
    tradeoffs: [
      "Operational complexity; partitioning and consumer offsets matter.",
    ],
    iconKey: "Activity",
  },
  search: {
    id: "search",
    type: "search",
    label: "Search Index",
    shortDescription:
      "Specialized index for full-text or filtered search queries.",
    whenToUse:
      "When databases cannot serve search-style queries fast enough.",
    tradeoffs: [
      "Eventually consistent with the source of truth.",
      "Operational overhead of indexing pipelines.",
    ],
    iconKey: "Search",
  },
  cdn: {
    id: "cdn",
    type: "cdn",
    label: "CDN",
    shortDescription:
      "Globally distributed edge cache for static assets and read-heavy responses.",
    whenToUse:
      "When users are global or assets are large and read-mostly.",
    tradeoffs: [
      "Cache purges and TTL design are critical.",
      "Adds a layer to debug.",
    ],
    iconKey: "Globe",
  },
  auth: {
    id: "auth",
    type: "auth",
    label: "Auth Service",
    shortDescription:
      "Issues and verifies tokens for user identity and permissions.",
    whenToUse: "Whenever the system has authenticated users or partner APIs.",
    tradeoffs: ["Critical path; downtime affects entire app."],
    iconKey: "KeyRound",
  },
  scheduler: {
    id: "scheduler",
    type: "scheduler",
    label: "Scheduler",
    shortDescription:
      "Runs periodic or delayed jobs (cron-like) reliably.",
    whenToUse:
      "Cleanup, periodic reporting, retries, batch enrichment.",
    tradeoffs: ["Avoid duplicate runs; needs leader election or locks."],
    iconKey: "Clock",
  },
  worker: {
    id: "worker",
    type: "worker",
    label: "Worker Pool",
    shortDescription:
      "Background compute that drains a queue or stream into side effects.",
    whenToUse:
      "Image processing, notifications, ETL, expensive enrichments.",
    tradeoffs: ["Throughput tied to queue depth and concurrency tuning."],
    iconKey: "Cpu",
  },
  analytics: {
    id: "analytics",
    type: "analytics",
    label: "Analytics Sink",
    shortDescription: "Warehouse for product, usage, and BI analytics.",
    whenToUse: "Decisions, dashboards, post-hoc analysis, ML features.",
    tradeoffs: ["Not a system of record; separate from operational stores."],
    iconKey: "BarChart3",
  },
  monitor: {
    id: "monitor",
    type: "monitor",
    label: "Monitoring",
    shortDescription:
      "Metrics, traces, logs, and alerting for observability.",
    whenToUse: "Always — you cannot operate what you cannot see.",
    tradeoffs: ["Cardinality and cost can balloon if undisciplined."],
    iconKey: "Gauge",
  },
};

export const ALL_COMPONENTS: InventoryComponent[] = Object.values(
  COMPONENT_LIBRARY,
);

export function getComponent(id: string): InventoryComponent | undefined {
  return COMPONENT_LIBRARY[id];
}
