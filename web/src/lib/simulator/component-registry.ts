/**
 * Component definitions — config fields, routing behavior, teaching copy.
 * @see docs/COMPONENT-MODEL.md
 */
import {
  Users,
  ShieldCheck,
  Network,
  Globe,
  Server,
  ArrowLeftRight,
  Timer,
  Database,
  HardDrive,
  Archive,
  Search,
  GitBranch,
  TrendingUp,
  Container,
  Warehouse,
  Zap,
  MapPin,
  Cpu,
  Layers,
  Inbox,
  Radio,
  Megaphone,
  Activity,
  Wifi,
  Bell,
  AtSign,
  Hexagon,
  Box,
  Shield,
  KeyRound,
  BookOpen,
  BarChart3,
  FileText,
  Route,
  AlertTriangle,
  HeartPulse,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import type {
  SimComponentType,
  ComponentDef,
  ConfigFieldDef,
  CategoryDef,
  ArchLayer,
  RoutingBehavior,
} from "./types";
import { clientConfigToStorage, DEFAULT_CLIENT_TRAFFIC } from "./client-traffic";
import { appServerConfigToStorage, DEFAULT_APP_SERVER } from "./app-server-model";

// ── helpers ────────────────────────────────────────────────────────

function num(
  key: string,
  label: string,
  def: number,
  extra?: Partial<ConfigFieldDef>,
): ConfigFieldDef {
  return { key, label, type: "number", default: def, ...extra };
}

function bool(key: string, label: string, def: boolean): ConfigFieldDef {
  return { key, label, type: "boolean", default: def };
}

function sel(
  key: string,
  label: string,
  def: string,
  pairs: string[],
): ConfigFieldDef {
  return {
    key,
    label,
    type: "select",
    default: def,
    options: pairs.map((p) => {
      const [value, lbl] = p.split(":");
      return { value, label: lbl };
    }),
  };
}

function defaults(fields: ConfigFieldDef[]): Record<string, string | number | boolean> {
  const cfg: Record<string, string | number | boolean> = {};
  for (const f of fields) cfg[f.key] = f.default;
  return cfg;
}

interface CompOpts {
  isTrafficSource?: boolean;
  layer: ArchLayer;
  routingBehavior: RoutingBehavior;
  explain: string;
  analogy: string;
  whenToUse: string;
  tradeoffs: string[];
  defaultConfig?: Record<string, string | number | boolean>;
}

function comp(
  type: SimComponentType,
  label: string,
  category: ComponentDef["category"],
  description: string,
  configFields: ConfigFieldDef[],
  opts: CompOpts,
): ComponentDef {
  return {
    type,
    label,
    category,
    description,
    layer: opts.layer,
    routingBehavior: opts.routingBehavior,
    explain: opts.explain,
    analogy: opts.analogy,
    whenToUse: opts.whenToUse,
    tradeoffs: opts.tradeoffs,
    configFields,
    defaultConfig: opts.defaultConfig ?? defaults(configFields),
    isTrafficSource: opts.isTrafficSource,
  };
}

// ── shared field presets ────────────────────────────────────────────

const REPLICAS = num("replicas", "Replicas", 1, { min: 1, max: 100 });
const MAX_CONN = num("maxConnections", "Max Connections", 10_000, { min: 10, max: 1_000_000 });
const FAILOVER = bool("failoverEnabled", "Auto Failover", true);
const STORAGE_TB = num("storageTB", "Storage", 1, { min: 0.01, max: 10_000, unit: "TB", step: 0.1 });
const RETENTION = num("retentionHours", "Retention", 168, { min: 1, max: 87_600, unit: "hrs" });

// ── component definitions ──────────────────────────────────────────

const COMPONENTS: ComponentDef[] = [
  // ─── Core ────────────────────────────────────────────
  comp("client", "Client", "core", "Browsers, mobile apps, or integrations sending requests into your system.", [], {
    isTrafficSource: true,
    routingBehavior: "source",
    layer: "client_layer",
    explain: "Browsers, mobile apps, or partner clients generating demand toward your system.",
    analogy: "Like diners in a restaurant — their orders (requests) keep the kitchen busy.",
    whenToUse: "Every system has clients. They represent active users and the traffic they create.",
    tradeoffs: [
      "More active users means more requests — but failure only happens when backends cannot keep up.",
      "Bursty traffic patterns can overwhelm a system sized only for average load.",
      "Retries during failures can amplify overload.",
    ],
    defaultConfig: clientConfigToStorage(DEFAULT_CLIENT_TRAFFIC),
  }),

  comp("api_gateway", "API Gateway", "core", "Unified entry point handling auth, routing, and rate limiting.", [
    REPLICAS,
    num("rateLimitRps", "Rate Limit", 5000, { min: 1, max: 1_000_000, unit: "rps" }),
    bool("authEnabled", "Auth Enabled", true),
    num("authLatencyMs", "Auth Latency", 5, { min: 1, max: 100, unit: "ms" }),
    num("timeoutMs", "Timeout", 30_000, { min: 100, max: 300_000, unit: "ms" }),
    MAX_CONN,
  ], {
    routingBehavior: "split",
    layer: "gateway_layer",
    explain: "A single front door for your entire system that checks who you are, decides where to send your request, and makes sure nobody sends too many requests.",
    analogy: "Like a building's reception desk — they check your ID, tell you which floor to go to, and limit how many visitors enter at once.",
    whenToUse: "When you have multiple backend services and want one consistent entry point for authentication, routing, and rate limiting.",
    tradeoffs: [
      "Becomes a single point of failure — if it goes down, everything behind it is unreachable.",
      "Adds processing time to every single request that passes through.",
      "Can become a bottleneck if not scaled properly as traffic grows.",
    ],
  }),

  comp("load_balancer", "Load Balancer", "core", "Distributes traffic across service pools for scale and availability.", [
    REPLICAS,
    sel("algorithm", "Routing Algorithm", "round_robin", [
      "round_robin:Round Robin",
      "weighted:Weighted Round Robin",
      "least_connections:Least Connections",
      "least_response_time:Least Response Time",
      "path_based:Path-based Routing",
      "header_based:Header-based Routing",
      "ip_hash:IP Hash (sticky)",
    ]),
    MAX_CONN,
    num("healthCheckMs", "Health Check Interval", 5000, { min: 500, max: 60_000, unit: "ms" }),
    bool("stickySession", "Sticky Sessions", false),
  ], {
    routingBehavior: "split",
    layer: "gateway_layer",
    explain: "A traffic cop that splits incoming visitors across multiple servers so no single one gets overwhelmed.",
    analogy: "Like a restaurant host directing guests to available tables instead of seating everyone at table 1.",
    whenToUse: "When a single server can't handle all the traffic, or you need to keep the system running even if one server crashes.",
    tradeoffs: [
      "Adds a network hop and a tiny bit of latency to every request.",
      "Needs health checks to avoid sending traffic to dead servers.",
      "Session-based features need sticky sessions or external state.",
    ],
  }),

  comp("web_server", "Web Server", "core", "Serves static files and forwards dynamic requests to app servers.", [
    REPLICAS,
    MAX_CONN,
    num("workerProcesses", "Worker Processes", 4, { min: 1, max: 64 }),
    num("staticCacheHitRate", "Static Cache Hit Rate", 0.8, { min: 0, max: 1, step: 0.05 }),
    bool("compressionEnabled", "Compression", true),
    num("avgStaticLatencyMs", "Static Serve Latency", 2, { min: 1, max: 50, unit: "ms" }),
  ], {
    routingBehavior: "filter",
    layer: "service_layer",
    explain: "A server that hands out static files like images, CSS, and HTML pages, and passes any complex requests along to the app server.",
    analogy: "Like a librarian who can hand you books from the shelf instantly but sends you to a specialist for research questions.",
    whenToUse: "When you need to serve web pages or static files, and want to offload dynamic work to a separate app server.",
    tradeoffs: [
      "Adding a separate web server layer means another machine to manage and monitor.",
      "Caching static files saves work but stale caches can serve outdated content.",
      "Compression saves bandwidth but uses CPU on every response.",
    ],
  }),

  comp("app_server", "Application Server Pool", "core", "Runs backend logic across a pool of service instances.", [], {
    routingBehavior: "passthrough",
    layer: "service_layer",
    defaultConfig: appServerConfigToStorage(DEFAULT_APP_SERVER),
    explain: "Application server pools run business logic across many identical replicas. The load balancer sends each pool a share of traffic; the pool divides that load across healthy instances.",
    analogy: "Like the kitchen in a restaurant — it takes the order, cooks the meal, and coordinates with the pantry (database) and suppliers (APIs).",
    whenToUse: "Every system with custom logic needs at least one application server. Scale instances when traffic grows.",
    tradeoffs: [
      "Stateless servers are easy to scale but require external storage for session data.",
      "Each downstream call per request adds latency and load on databases and caches.",
      "Too much traffic without enough capacity causes queues, timeouts, and errors that reach users.",
    ],
  }),

  comp("reverse_proxy", "Reverse Proxy", "core", "Forwards requests, handles TLS termination and caching.", [
    REPLICAS,
    MAX_CONN,
    num("cacheHitRate", "Cache Hit Rate", 0.3, { min: 0, max: 1, step: 0.05 }),
    bool("compressionEnabled", "Compression", true),
  ], {
    routingBehavior: "filter",
    layer: "gateway_layer",
    explain: "A middleman server that sits in front of your real servers, handling encryption, caching, and hiding your internal setup from the outside world.",
    analogy: "Like a personal assistant who takes all your calls, handles the easy stuff, and only passes through the important ones.",
    whenToUse: "When you want to terminate SSL in one place, cache responses, or hide your internal server structure from the internet.",
    tradeoffs: [
      "Adds an extra hop to every request, slightly increasing latency.",
      "Cached responses can become stale if cache invalidation isn't set up carefully.",
      "Another component to configure, secure, and maintain.",
    ],
  }),

  comp("rate_limiter", "Rate Limiter", "core", "Throttles requests above a configured threshold.", [
    num("maxRps", "Rate Limit", 1000, { min: 1, max: 1_000_000, unit: "rps" }),
    sel("algorithm", "Algorithm", "token_bucket", [
      "token_bucket:Token Bucket",
      "sliding_window:Sliding Window",
      "fixed_window:Fixed Window",
      "leaky_bucket:Leaky Bucket",
    ]),
    num("windowMs", "Window", 1000, { min: 100, max: 60_000, unit: "ms" }),
    num("burstSize", "Burst Size", 50, { min: 1, max: 10_000 }),
  ], {
    routingBehavior: "throttle",
    layer: "gateway_layer",
    explain: "A bouncer that counts how many requests each user sends and blocks them if they're sending too many too fast.",
    analogy: "Like a theme park ride that only lets a certain number of people on per minute, making the rest wait in line.",
    whenToUse: "When you need to protect your system from being overwhelmed by a single user, a bot, or a denial-of-service attack.",
    tradeoffs: [
      "Legitimate users can get blocked during traffic spikes if limits are too tight.",
      "Distributed rate limiting across multiple servers requires shared state.",
      "Different endpoints may need different limits, adding configuration complexity.",
    ],
  }),

  // ─── Storage ─────────────────────────────────────────
  comp("sql_database", "SQL Database", "storage", "Relational database with ACID transactions.", [
    sel("engine", "Engine", "postgres", [
      "postgres:PostgreSQL", "mysql:MySQL", "aurora:Aurora", "cockroach:CockroachDB",
    ]),
    num("connectionPoolSize", "Connection Pool", 100, { min: 5, max: 10_000 }),
    num("avgQueryTimeMs", "Avg Query Time", 5, { min: 1, max: 5000, unit: "ms" }),
    num("readReplicas", "Read Replicas", 0, { min: 0, max: 20 }),
    num("shards", "Shards", 1, { min: 1, max: 1024 }),
    STORAGE_TB,
    sel("replicationMode", "Replication", "async", [
      "sync:Synchronous", "async:Asynchronous", "semi_sync:Semi-Sync",
    ]),
    sel("consistencyLevel", "Consistency", "strong", [
      "strong:Strong", "eventual:Eventual", "causal:Causal",
    ]),
    FAILOVER,
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A structured database that stores data in tables with rows and columns, and guarantees that your data stays consistent even during failures.",
    analogy: "Like a well-organized spreadsheet where every entry follows strict rules, and you can undo mistakes automatically.",
    whenToUse: "When your data has clear relationships (like users, orders, and products) and you need guarantees that transactions either fully succeed or fully roll back.",
    tradeoffs: [
      "Scaling beyond a single machine (sharding) is complex and can break cross-shard queries.",
      "Strong consistency comes at the cost of write speed compared to NoSQL.",
      "Schema changes on large tables can lock the database and cause downtime.",
    ],
  }),

  comp("nosql_database", "NoSQL Database", "storage", "Flexible schema store optimized for scale.", [
    sel("engine", "Engine", "mongodb", [
      "mongodb:MongoDB", "cassandra:Cassandra", "dynamodb:DynamoDB", "couchbase:Couchbase",
    ]),
    num("connectionPoolSize", "Connection Pool", 200, { min: 10, max: 50_000 }),
    num("avgQueryTimeMs", "Avg Query Time", 3, { min: 1, max: 5000, unit: "ms" }),
    num("shards", "Shards", 3, { min: 1, max: 1024 }),
    REPLICAS, STORAGE_TB,
    sel("consistencyLevel", "Consistency", "eventual", [
      "strong:Strong", "eventual:Eventual", "causal:Causal",
    ]),
    FAILOVER,
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A flexible database that doesn't require a fixed table structure, making it great for data that changes shape often or needs to scale massively.",
    analogy: "Like a filing cabinet where each folder can contain different types of documents — no rigid template required.",
    whenToUse: "When your data doesn't fit neatly into tables, you need to handle huge volumes, or your data model changes frequently.",
    tradeoffs: [
      "Eventual consistency means reads might return slightly stale data.",
      "No built-in joins — you may need to restructure data or make multiple queries.",
      "Flexible schemas can lead to messy, inconsistent data if discipline isn't maintained.",
    ],
  }),

  comp("object_storage", "Object Storage", "storage", "Blob/file store for unstructured data (S3-like).", [
    STORAGE_TB,
    num("avgLatencyMs", "Avg Latency", 50, { min: 10, max: 500, unit: "ms" }),
    num("replicationFactor", "Replication Factor", 3, { min: 1, max: 6 }),
    bool("versioningEnabled", "Versioning", true),
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A massive storage locker for files like images, videos, backups, and documents — think of it as a cloud hard drive built to hold unlimited data.",
    analogy: "Like a self-storage facility where you can rent as many units as you need and retrieve any box by its label.",
    whenToUse: "When you need to store large files (images, videos, logs, backups) cheaply and reliably, without worrying about running out of space.",
    tradeoffs: [
      "Slower to access than a database — not suitable for data that changes frequently.",
      "Retrieving lots of small files is inefficient compared to databases.",
      "Costs can grow quickly with high bandwidth usage or frequent access to rarely-used data.",
    ],
  }),

  comp("search_index", "Search Index", "storage", "Full-text search engine (Elasticsearch-like).", [
    REPLICAS,
    num("shards", "Shards", 5, { min: 1, max: 100 }),
    num("avgQueryTimeMs", "Avg Query Time", 15, { min: 1, max: 5000, unit: "ms" }),
    num("connectionPoolSize", "Connection Pool", 50, { min: 5, max: 1000 }),
    STORAGE_TB,
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A specialized engine that lets you search through text really fast — like the search bar on a shopping site that finds products as you type.",
    analogy: "Like the index at the back of a textbook — instead of reading every page, you look up keywords and jump straight to the right spot.",
    whenToUse: "When users need to search through large amounts of text, like product catalogs, articles, or log files.",
    tradeoffs: [
      "Keeping the search index in sync with your main database adds complexity.",
      "Uses significant memory and storage, especially for large datasets.",
      "Not a replacement for your primary database — it's a secondary store you must keep updated.",
    ],
  }),

  comp("graph_database", "Graph Database", "storage", "Relationship-optimized store for connected data.", [
    sel("engine", "Engine", "neo4j", ["neo4j:Neo4j", "neptune:Neptune", "tigergraph:TigerGraph"]),
    num("connectionPoolSize", "Connection Pool", 50, { min: 5, max: 1000 }),
    num("avgQueryTimeMs", "Avg Query Time", 10, { min: 1, max: 5000, unit: "ms" }),
    REPLICAS, STORAGE_TB,
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A database built for data that's all about connections — like social networks, recommendation engines, or fraud detection where relationships matter most.",
    analogy: "Like a detective's investigation board with photos connected by strings — the connections between things are just as important as the things themselves.",
    whenToUse: "When your queries are about relationships (friends-of-friends, shortest path, pattern matching) and relational joins would be too slow or complex.",
    tradeoffs: [
      "Not ideal for simple tabular data — a SQL database would be simpler and faster.",
      "Scaling graph databases horizontally is harder than scaling document stores.",
      "Querying deeply connected data can be slow if graphs become very large.",
    ],
  }),

  comp("time_series_db", "Time-Series DB", "storage", "Optimized for append-heavy, time-stamped data.", [
    sel("engine", "Engine", "influxdb", [
      "influxdb:InfluxDB", "timescale:TimescaleDB", "prometheus:Prometheus",
    ]),
    REPLICAS,
    num("avgWriteTimeMs", "Avg Write Time", 2, { min: 1, max: 500, unit: "ms" }),
    num("maxConcurrentWrites", "Max Concurrent Writes", 5000, { min: 100, max: 100_000 }),
    num("retentionDays", "Retention", 90, { min: 1, max: 3650, unit: "days" }),
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A database designed for data that arrives with timestamps — like temperature readings, stock prices, or server performance metrics over time.",
    analogy: "Like a fitness tracker that records your heart rate every second and lets you see trends over days, weeks, or months.",
    whenToUse: "When you're collecting data points over time (metrics, sensor data, financial ticks) and need to query time ranges efficiently.",
    tradeoffs: [
      "Not designed for complex queries or joins — it's optimized for time-range lookups only.",
      "Old data must be downsampled or deleted to manage storage costs.",
      "Write-heavy workloads can overwhelm under-provisioned instances.",
    ],
  }),

  comp("data_lake", "Data Lake", "storage", "Raw storage layer for analytics and ML pipelines.", [
    STORAGE_TB,
    num("partitions", "Partitions", 100, { min: 1, max: 10_000 }),
    bool("compressionEnabled", "Compression", true),
    sel("format", "Format", "parquet", [
      "parquet:Parquet", "orc:ORC", "avro:Avro", "json:JSON",
    ]),
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A giant raw data dump where you store everything — logs, images, CSVs, JSON — in its original format for later analysis.",
    analogy: "Like a warehouse where you throw all your receipts, photos, and documents into boxes to sort through later.",
    whenToUse: "When you want to collect large volumes of raw data now and figure out how to analyze it later, like for machine learning or big data analytics.",
    tradeoffs: [
      "Without organization, it becomes a 'data swamp' that nobody can navigate.",
      "Querying raw data is slow — you often need to transform it into a structured format first.",
      "Storage is cheap but processing costs can be high for large-scale analytics.",
    ],
  }),

  comp("data_warehouse", "Data Warehouse", "storage", "Columnar store for analytical queries.", [
    sel("engine", "Engine", "redshift", [
      "redshift:Redshift", "bigquery:BigQuery", "snowflake:Snowflake",
    ]),
    num("nodes", "Nodes", 4, { min: 1, max: 128 }),
    STORAGE_TB,
    num("avgQueryTimeMs", "Avg Query Time", 2000, { min: 100, max: 300_000, unit: "ms" }),
    num("maxConcurrentQueries", "Max Concurrent Queries", 20, { min: 1, max: 500 }),
  ], {
    routingBehavior: "passthrough",
    layer: "data_layer",
    explain: "A structured analytics database where cleaned, organized data lives so business teams can run reports and dashboards.",
    analogy: "Like a well-organized library with cataloged books, compared to the data lake which is more like an unsorted pile of documents.",
    whenToUse: "When business teams need to run complex reports, build dashboards, or answer analytical questions across large historical datasets.",
    tradeoffs: [
      "Loading and transforming data into the warehouse (ETL) takes time and engineering effort.",
      "Queries on huge datasets can be slow and expensive.",
      "Not designed for real-time data — there's typically a delay before new data appears.",
    ],
  }),

  // ─── Caching ─────────────────────────────────────────
  comp("redis_cache", "In-Memory Cache", "caching", "Fast key-value store for hot data (Redis/Memcached).", [
    sel("engine", "Engine", "redis", ["redis:Redis", "memcached:Memcached"]),
    REPLICAS,
    num("maxMemoryMB", "Max Memory", 4096, { min: 64, max: 524_288, unit: "MB" }),
    sel("evictionPolicy", "Eviction", "lru", [
      "lru:LRU", "lfu:LFU", "random:Random", "ttl:TTL-based",
    ]),
    num("hitRate", "Cache Hit Rate", 0.85, { min: 0, max: 0.99, step: 0.01 }),
    num("ttlSeconds", "Default TTL", 3600, { min: 1, max: 86_400, unit: "sec" }),
    bool("clusterEnabled", "Cluster Mode", false),
  ], {
    routingBehavior: "filter",
    layer: "data_layer",
    explain: "A super-fast memory store that keeps frequently used data ready to go, so your app doesn't have to hit the slower database every time.",
    analogy: "Like keeping your most-used contacts on speed dial instead of looking them up in the phone book every time.",
    whenToUse: "When your database is getting hammered with the same reads, or you need sub-millisecond response times for things like session data or leaderboards.",
    tradeoffs: [
      "Data in memory is lost if the server restarts (unless persistence is configured).",
      "Limited by available RAM — you can't store everything.",
      "Keeping cached data in sync with the database requires careful invalidation logic.",
    ],
  }),

  comp("cdn", "CDN", "caching", "Edge network caching static assets close to users.", [
    num("edgeLocations", "Edge Locations", 50, { min: 1, max: 500 }),
    num("cacheHitRate", "Cache Hit Rate", 0.9, { min: 0, max: 0.99, step: 0.01 }),
    num("cacheTtlSeconds", "Cache TTL", 86_400, { min: 60, max: 2_592_000, unit: "sec" }),
    num("originBandwidthGbps", "Origin Bandwidth", 10, { min: 1, max: 100, unit: "Gbps" }),
  ], {
    routingBehavior: "filter",
    layer: "edge_layer",
    explain: "A network of servers spread around the world that stores copies of your static files (images, videos, CSS) close to where your users are.",
    analogy: "Like a chain of local newsstands that stock copies of a magazine so people don't have to travel to the publisher's headquarters.",
    whenToUse: "When your users are globally distributed and you want fast load times for static content like images, scripts, and stylesheets.",
    tradeoffs: [
      "Cached content can become stale — you need cache invalidation or versioned URLs.",
      "Adds cost per gigabyte of data transferred.",
      "Dynamic, personalized content can't be cached as effectively as static files.",
    ],
  }),

  comp("local_cache", "Local Cache", "caching", "In-process cache on the application server.", [
    num("maxMemoryMB", "Max Memory", 512, { min: 32, max: 16_384, unit: "MB" }),
    sel("evictionPolicy", "Eviction", "lru", [
      "lru:LRU", "lfu:LFU", "fifo:FIFO",
    ]),
    num("hitRate", "Cache Hit Rate", 0.7, { min: 0, max: 0.99, step: 0.01 }),
    num("ttlSeconds", "Default TTL", 300, { min: 1, max: 86_400, unit: "sec" }),
  ], {
    routingBehavior: "filter",
    layer: "data_layer",
    explain: "A small, fast cache that lives inside your application's own memory, avoiding any network calls to fetch frequently used data.",
    analogy: "Like keeping a sticky note on your monitor with today's meeting times instead of opening your calendar app every time.",
    whenToUse: "When you have data that's read often but changes rarely, and you want the absolute fastest access without any network overhead.",
    tradeoffs: [
      "Each server has its own copy, so caches can be out of sync across instances.",
      "Uses your app server's limited memory.",
      "No sharing between servers — the same data may be cached differently on each one.",
    ],
  }),

  comp("distributed_cache", "Distributed Cache", "caching", "Multi-node cache for high availability and large datasets.", [
    num("nodes", "Nodes", 3, { min: 2, max: 100 }),
    num("maxMemoryMB", "Memory per Node", 8192, { min: 256, max: 524_288, unit: "MB" }),
    sel("evictionPolicy", "Eviction", "lru", [
      "lru:LRU", "lfu:LFU", "random:Random",
    ]),
    num("hitRate", "Cache Hit Rate", 0.8, { min: 0, max: 0.99, step: 0.01 }),
    num("ttlSeconds", "Default TTL", 3600, { min: 1, max: 86_400, unit: "sec" }),
    sel("consistencyMode", "Consistency", "eventual", [
      "eventual:Eventual", "strong:Strong",
    ]),
  ], {
    routingBehavior: "filter",
    layer: "data_layer",
    explain: "A shared cache spread across multiple machines, so all your app servers see the same cached data and can handle more of it than one machine's memory allows.",
    analogy: "Like a shared office supply closet that all employees can access, instead of each person keeping supplies at their own desk.",
    whenToUse: "When your cached data is too large for a single machine, or you need all app servers to see the same cached values.",
    tradeoffs: [
      "Network calls to the cache add latency compared to local in-process caches.",
      "Managing a cluster of cache nodes adds operational complexity.",
      "Cache consistency across nodes can lag — reads might see slightly stale data.",
    ],
  }),

  // ─── Messaging ───────────────────────────────────────
  comp("message_queue", "Message Queue", "messaging", "Async message broker decoupling producers and consumers.", [
    sel("engine", "Engine", "rabbitmq", [
      "rabbitmq:RabbitMQ", "sqs:AWS SQS", "activemq:ActiveMQ",
    ]),
    num("partitions", "Partitions", 4, { min: 1, max: 1000 }),
    num("consumerCount", "Consumer Count", 2, { min: 1, max: 1000 }),
    num("consumerProcessingMs", "Consumer Processing Time", 100, { min: 1, max: 30_000, unit: "ms" }),
    num("maxQueueDepth", "Max Queue Depth", 100_000, { min: 100, max: 100_000_000 }),
    RETENTION,
    sel("deliveryGuarantee", "Delivery", "at_least_once", [
      "at_most_once:At Most Once",
      "at_least_once:At Least Once",
      "exactly_once:Exactly Once",
    ]),
  ], {
    routingBehavior: "buffer",
    layer: "async_layer",
    explain: "A waiting line for tasks — one part of your system drops a message into the queue, and another part picks it up and processes it when ready.",
    analogy: "Like a to-do list where one person writes tasks and another person works through them at their own pace.",
    whenToUse: "When you want to decouple slow tasks (like sending emails or processing images) from the main user request so the user doesn't have to wait.",
    tradeoffs: [
      "Messages can be processed out of order unless you enforce ordering (which reduces throughput).",
      "Failed message processing needs retry logic and dead-letter queues to avoid losing data.",
      "Adds eventual consistency — the user won't see the result immediately.",
    ],
  }),

  comp("event_bus", "Event Bus / Kafka", "messaging", "Distributed event streaming platform for high-throughput.", [
    num("partitions", "Partitions", 12, { min: 1, max: 10_000 }),
    REPLICAS, RETENTION,
    num("consumerGroups", "Consumer Groups", 3, { min: 1, max: 1000 }),
    num("consumerCount", "Consumers per Group", 3, { min: 1, max: 1000 }),
    num("consumerProcessingMs", "Consumer Processing Time", 50, { min: 1, max: 30_000, unit: "ms" }),
    sel("deliveryGuarantee", "Delivery", "at_least_once", [
      "at_most_once:At Most Once",
      "at_least_once:At Least Once",
      "exactly_once:Exactly Once",
    ]),
  ], {
    routingBehavior: "buffer",
    layer: "async_layer",
    explain: "A high-speed highway for events that lets many services publish and subscribe to streams of data in real time, built for massive throughput.",
    analogy: "Like a newsroom wire service — reporters file stories, and every newspaper subscribed to the feed gets every story automatically.",
    whenToUse: "When you need to stream large volumes of events (clicks, transactions, sensor data) to multiple consumers in real time.",
    tradeoffs: [
      "Operationally complex — managing partitions, replication, and consumer offsets takes expertise.",
      "Ordering is only guaranteed within a single partition, not across all of them.",
      "High throughput comes with higher infrastructure costs and a steep learning curve.",
    ],
  }),

  comp("pub_sub", "Pub/Sub", "messaging", "Publish-subscribe messaging for fan-out patterns.", [
    num("maxSubscribers", "Max Subscribers", 1000, { min: 1, max: 1_000_000 }),
    num("consumerProcessingMs", "Subscriber Processing Time", 50, { min: 1, max: 30_000, unit: "ms" }),
    sel("deliveryGuarantee", "Delivery", "at_least_once", [
      "at_most_once:At Most Once",
      "at_least_once:At Least Once",
    ]),
    RETENTION,
  ], {
    routingBehavior: "buffer",
    layer: "async_layer",
    explain: "A broadcast system where one service publishes a message and every interested subscriber gets a copy, like a group text.",
    analogy: "Like a school intercom — when an announcement is made, every classroom with a speaker hears it.",
    whenToUse: "When one event needs to trigger actions in multiple independent services — like a new signup triggering a welcome email, an analytics event, and a CRM update.",
    tradeoffs: [
      "If a subscriber is down, it might miss messages unless the system supports replay.",
      "Fan-out to many subscribers can create load spikes in downstream services.",
      "Debugging is harder because the publisher doesn't know who received what.",
    ],
  }),

  comp("stream_processor", "Stream Processor", "messaging", "Real-time event processing (Flink / Spark Streaming).", [
    num("parallelism", "Parallelism", 4, { min: 1, max: 1024 }),
    num("avgProcessingTimeMs", "Avg Processing Time", 20, { min: 1, max: 30_000, unit: "ms" }),
    num("windowMs", "Window Size", 5000, { min: 100, max: 3_600_000, unit: "ms" }),
    num("checkpointMs", "Checkpoint Interval", 10_000, { min: 1000, max: 600_000, unit: "ms" }),
  ], {
    routingBehavior: "passthrough",
    layer: "async_layer",
    explain: "A real-time data processor that reads events as they arrive and transforms, filters, or aggregates them on the fly.",
    analogy: "Like a factory assembly line where each worker inspects, modifies, or sorts items as they pass by on a conveyor belt.",
    whenToUse: "When you need to react to data in real time — like detecting fraud as transactions happen, or computing live dashboards from event streams.",
    tradeoffs: [
      "Exactly-once processing is hard to achieve and often comes with a performance cost.",
      "Stateful operations (like counting over time windows) need checkpointing to survive failures.",
      "Debugging real-time pipelines is much harder than debugging batch jobs.",
    ],
  }),

  comp("websocket_server", "WebSocket Server", "messaging", "Persistent bidirectional connections for real-time features.", [
    REPLICAS,
    num("maxConnections", "Max Connections", 50_000, { min: 100, max: 10_000_000 }),
    num("heartbeatMs", "Heartbeat Interval", 30_000, { min: 1000, max: 120_000, unit: "ms" }),
    bool("compressionEnabled", "Compression", true),
  ], {
    routingBehavior: "passthrough",
    layer: "async_layer",
    explain: "A server that keeps a two-way connection open with each client, so both sides can send messages instantly without constantly reconnecting.",
    analogy: "Like a phone call — once connected, both people can talk anytime without redialing, unlike texting where each message is a separate action.",
    whenToUse: "When you need real-time features like live chat, multiplayer games, stock tickers, or collaborative editing.",
    tradeoffs: [
      "Each open connection uses server memory, so thousands of users means significant resource usage.",
      "Scaling across multiple servers requires sticky sessions or a shared pub/sub layer.",
      "Connections can drop due to network issues, requiring reconnection logic on the client.",
    ],
  }),

  comp("notification_service", "Notification Service", "messaging", "Push notifications, emails, and SMS delivery.", [
    REPLICAS,
    num("avgProcessingTimeMs", "Avg Processing Time", 200, { min: 10, max: 30_000, unit: "ms" }),
    num("maxConcurrentSends", "Max Concurrent Sends", 100, { min: 1, max: 10_000 }),
    num("retryAttempts", "Retry Attempts", 3, { min: 0, max: 10 }),
    num("batchSize", "Batch Size", 100, { min: 1, max: 10_000 }),
  ], {
    routingBehavior: "passthrough",
    layer: "async_layer",
    explain: "A service that sends alerts to users through push notifications, emails, or text messages when something important happens.",
    analogy: "Like a postal service that delivers letters, packages, and telegrams — you hand it a message and pick the delivery method.",
    whenToUse: "When your app needs to reach users outside the app itself — like order confirmations, password resets, or breaking news alerts.",
    tradeoffs: [
      "Delivery isn't guaranteed — push notifications can be blocked and emails can land in spam.",
      "Sending too many notifications annoys users and increases unsubscribe rates.",
      "Each channel (email, SMS, push) has its own API, rate limits, and failure modes.",
    ],
  }),

  // ─── Infrastructure ──────────────────────────────────
  comp("dns", "DNS", "infrastructure", "Domain name resolution and service discovery.", [
    num("ttlSeconds", "TTL", 300, { min: 1, max: 86_400, unit: "sec" }),
    FAILOVER,
  ], {
    routingBehavior: "none",
    layer: "edge_layer",
    explain: "The internet's phone book — it turns human-friendly names like 'google.com' into the numeric IP addresses that computers use to find each other.",
    analogy: "Like looking up a contact name in your phone to find their actual phone number.",
    whenToUse: "Every internet-facing system needs DNS. You configure it to point your domain name at your servers.",
    tradeoffs: [
      "DNS changes take time to spread globally because of caching (TTL).",
      "If your DNS provider goes down, nobody can find your servers even if they're running fine.",
      "Low TTL gives faster updates but increases DNS lookup traffic and latency.",
    ],
  }),

  comp("service_mesh", "Service Mesh", "infrastructure", "Sidecar proxies managing service-to-service communication.", [
    bool("mTlsEnabled", "mTLS", true),
    bool("circuitBreakerEnabled", "Circuit Breaker", true),
    num("retryAttempts", "Retry Attempts", 3, { min: 0, max: 10 }),
    bool("tracingEnabled", "Tracing", true),
  ], {
    routingBehavior: "none",
    layer: "service_layer",
    explain: "An invisible networking layer that manages how your microservices talk to each other — handling encryption, retries, and traffic routing automatically.",
    analogy: "Like a telephone switchboard operator who connects calls between office extensions, automatically rerouting if a line is busy.",
    whenToUse: "When you have many microservices and need consistent security, observability, and reliability for service-to-service communication.",
    tradeoffs: [
      "Adds a sidecar proxy to every service, increasing memory and CPU usage.",
      "Significant operational complexity — another system to learn, configure, and debug.",
      "Adds latency to every inter-service call because traffic flows through the proxy.",
    ],
  }),

  comp("kubernetes", "Container Orchestrator", "infrastructure", "Container scheduling and scaling (K8s).", [
    num("pods", "Pods", 3, { min: 1, max: 10_000 }),
    num("cpuLimitCores", "CPU Limit", 4, { min: 0.25, max: 128, step: 0.25, unit: "cores" }),
    num("memoryLimitMB", "Memory Limit", 4096, { min: 128, max: 524_288, unit: "MB" }),
    bool("autoScaling", "Auto Scaling", true),
    num("minReplicas", "Min Replicas", 2, { min: 1, max: 100 }),
    num("maxReplicas", "Max Replicas", 20, { min: 1, max: 1000 }),
  ], {
    routingBehavior: "none",
    layer: "service_layer",
    explain: "A system that automatically manages, scales, and heals your applications running in containers — if something crashes, it restarts it automatically.",
    analogy: "Like a building manager who assigns offices to tenants, moves them if a floor floods, and adds more space when the building gets crowded.",
    whenToUse: "When you're running multiple services in containers and need automated deployment, scaling, and self-healing across a cluster of machines.",
    tradeoffs: [
      "Steep learning curve — Kubernetes has many concepts (pods, services, ingress) to master.",
      "Adds infrastructure overhead — you need cluster management, monitoring, and networking.",
      "Overkill for simple apps — a single server or managed platform may be simpler and cheaper.",
    ],
  }),

  comp("firewall", "Firewall / WAF", "infrastructure", "Filters traffic, blocks attacks, enforces security rules.", [
    num("maxConnections", "Max Connections", 100_000, { min: 1000, max: 10_000_000 }),
    num("rules", "Rule Count", 50, { min: 1, max: 10_000 }),
    sel("defaultAction", "Default Action", "allow", ["allow:Allow", "deny:Deny"]),
    bool("geoBlockEnabled", "Geo Blocking", false),
  ], {
    routingBehavior: "split",
    layer: "edge_layer",
    explain: "A security guard that inspects every incoming request and blocks anything that looks malicious, like hacking attempts or traffic from banned regions.",
    analogy: "Like airport security screening — everyone must pass through, and anything suspicious gets flagged or rejected.",
    whenToUse: "When your system is exposed to the internet and you need to block attacks, filter traffic by geography, or enforce security rules.",
    tradeoffs: [
      "Overly strict rules can accidentally block legitimate users.",
      "Adds a small amount of latency to every request as traffic is inspected.",
      "Rules need regular updates to keep up with new attack patterns.",
    ],
  }),

  comp("secrets_manager", "Secrets Manager", "infrastructure", "Secure storage and rotation of credentials.", [
    bool("rotationEnabled", "Auto Rotation", true),
    num("rotationDays", "Rotation Interval", 90, { min: 1, max: 365, unit: "days" }),
    sel("encryption", "Encryption", "aes256", [
      "aes256:AES-256", "rsa:RSA-4096",
    ]),
  ], {
    routingBehavior: "none",
    layer: "infra_layer",
    explain: "A secure vault that stores passwords, API keys, and other sensitive credentials so they're never hard-coded in your application's source code.",
    analogy: "Like a safety deposit box at a bank — your valuables are locked away and you need proper credentials to access them.",
    whenToUse: "When your applications need to access databases, APIs, or other services using passwords or keys that should never appear in code or logs.",
    tradeoffs: [
      "Adds a network call to fetch secrets, which can slow down application startup.",
      "If the secrets manager is down, your apps may fail to start or authenticate.",
      "Auto-rotation can break connections if consuming services aren't configured to handle credential changes.",
    ],
  }),

  comp("service_registry", "Service Registry", "infrastructure", "Tracks live service instances for discovery.", [
    num("healthCheckMs", "Health Check Interval", 10_000, { min: 1000, max: 60_000, unit: "ms" }),
    num("deregisterTimeoutMs", "Deregister Timeout", 30_000, { min: 5000, max: 300_000, unit: "ms" }),
    FAILOVER,
  ], {
    routingBehavior: "none",
    layer: "service_layer",
    explain: "A directory that keeps track of which service instances are currently running and where they live, so other services can find them automatically.",
    analogy: "Like a company phone directory that's updated in real time — when someone changes desks, the directory is updated so people can still reach them.",
    whenToUse: "When you have multiple instances of services that start and stop dynamically, and other services need to discover them automatically.",
    tradeoffs: [
      "Stale entries can send traffic to dead instances if health checks are too slow.",
      "Adds a dependency — if the registry goes down, services can't discover each other.",
      "Requires health check configuration to keep the registry accurate.",
    ],
  }),

  // ─── Observability ───────────────────────────────────
  comp("metrics_collector", "Metrics Collector", "observability", "Scrapes and stores time-series metrics from services.", [
    num("scrapeIntervalMs", "Scrape Interval", 15_000, { min: 1000, max: 300_000, unit: "ms" }),
    num("retentionDays", "Retention", 30, { min: 1, max: 3650, unit: "days" }),
    num("maxTimeSeries", "Max Time Series", 1_000_000, { min: 1000, max: 100_000_000 }),
  ], {
    routingBehavior: "none",
    layer: "observability_layer",
    explain: "A system that regularly collects performance numbers (CPU usage, request count, error rates) from all your services so you can see trends over time.",
    analogy: "Like a fitness tracker that records your steps, heart rate, and sleep — you can look back and see how things changed over time.",
    whenToUse: "When you need to monitor the health and performance of your system, set up alerts, or debug performance issues with historical data.",
    tradeoffs: [
      "High-cardinality metrics (like per-user stats) can explode storage costs.",
      "Too-frequent scraping adds load to the services being monitored.",
      "Metrics show what's happening but not why — you often need logs and traces too.",
    ],
  }),

  comp("log_aggregator", "Log Aggregator", "observability", "Collects, indexes, and queries logs (ELK-like).", [
    num("retentionDays", "Retention", 30, { min: 1, max: 365, unit: "days" }),
    bool("indexEnabled", "Full-text Index", true),
    num("maxIngestMBps", "Max Ingest Rate", 50, { min: 1, max: 10_000, unit: "MB/s" }),
  ], {
    routingBehavior: "none",
    layer: "observability_layer",
    explain: "A centralized place that collects log messages from all your services so you can search through them in one place instead of logging into each server.",
    analogy: "Like a central filing room where copies of every department's paperwork are stored, so you can find any document without visiting each department.",
    whenToUse: "When you have multiple services generating logs and need to search, filter, and correlate log entries across all of them.",
    tradeoffs: [
      "Ingesting and storing high volumes of logs can be expensive.",
      "Full-text indexing uses significant storage and memory.",
      "Sensitive data in logs needs to be scrubbed to avoid security and privacy risks.",
    ],
  }),

  comp("distributed_tracing", "Distributed Tracing", "observability", "End-to-end request tracing across services.", [
    num("sampleRate", "Sample Rate", 0.1, { min: 0.001, max: 1, step: 0.01, unit: "%" }),
    num("retentionDays", "Retention", 14, { min: 1, max: 90, unit: "days" }),
    num("maxSpansPerTrace", "Max Spans", 1000, { min: 10, max: 100_000 }),
  ], {
    routingBehavior: "none",
    layer: "observability_layer",
    explain: "A system that tracks a single user request as it travels through multiple services, showing you exactly where time is spent and where things go wrong.",
    analogy: "Like a package tracking number — you can follow your order from warehouse to truck to local depot to your door, seeing every step.",
    whenToUse: "When a user request passes through multiple services and you need to find which one is slow or failing.",
    tradeoffs: [
      "Tracing every request generates huge amounts of data, so sampling is usually needed.",
      "Requires instrumentation in every service — incomplete coverage creates blind spots.",
      "Adds a small overhead to each request for trace context propagation.",
    ],
  }),

  comp("alerting", "Alerting System", "observability", "Monitors metrics and fires alerts on threshold breaches.", [
    num("evaluationIntervalMs", "Eval Interval", 60_000, { min: 5000, max: 600_000, unit: "ms" }),
    num("rules", "Alert Rules", 20, { min: 1, max: 10_000 }),
    num("cooldownMs", "Cooldown", 300_000, { min: 60_000, max: 3_600_000, unit: "ms" }),
  ], {
    routingBehavior: "none",
    layer: "observability_layer",
    explain: "A watchdog that monitors your metrics and sends you a notification (Slack, email, PagerDuty) when something goes wrong, like high error rates or a downed server.",
    analogy: "Like a smoke detector — it sits quietly until it detects a problem, then sounds the alarm so you can act fast.",
    whenToUse: "When you need to be notified immediately about system problems instead of discovering them when users start complaining.",
    tradeoffs: [
      "Too many alerts cause 'alert fatigue' and people start ignoring them.",
      "Thresholds set too tight cause false alarms; too loose means you miss real issues.",
      "Needs well-defined cooldown periods to avoid flooding on-call engineers with repeated alerts.",
    ],
  }),

  comp("health_check", "Health Check", "observability", "Probes service liveness and readiness.", [
    num("intervalMs", "Interval", 10_000, { min: 1000, max: 120_000, unit: "ms" }),
    num("timeoutMs", "Timeout", 5000, { min: 500, max: 60_000, unit: "ms" }),
    num("unhealthyThreshold", "Unhealthy After", 3, { min: 1, max: 10, unit: "failures" }),
  ], {
    routingBehavior: "none",
    layer: "observability_layer",
    explain: "A heartbeat test that regularly pokes each service to see if it's alive and ready to handle traffic, removing unhealthy ones from rotation.",
    analogy: "Like a teacher taking attendance — if a student doesn't answer, they're marked absent and someone follows up.",
    whenToUse: "When you need load balancers or orchestrators to automatically stop sending traffic to crashed or unresponsive services.",
    tradeoffs: [
      "Too-frequent checks add load; too-infrequent checks mean slow detection of failures.",
      "A service might pass a basic health check but still be degraded (e.g., slow database connection).",
      "Flapping services (rapidly switching healthy/unhealthy) can cause cascading traffic shifts.",
    ],
  }),

  comp("status_page", "Status Page", "observability", "Public-facing service status dashboard.", [
    num("refreshIntervalMs", "Refresh Interval", 30_000, { min: 5000, max: 300_000, unit: "ms" }),
    bool("publicEnabled", "Public Access", true),
  ], {
    routingBehavior: "none",
    layer: "observability_layer",
    explain: "A public webpage that shows your users whether your system is up, having issues, or undergoing maintenance — so they know it's not just them.",
    analogy: "Like a restaurant putting a sign in the window saying 'Open', 'Closed for renovation', or 'Limited menu today'.",
    whenToUse: "When you want to transparently communicate system health to users and reduce support tickets during outages.",
    tradeoffs: [
      "Must be hosted independently from your main system so it stays up when everything else is down.",
      "Keeping it accurate requires integration with your monitoring — manual updates are often stale.",
      "Over-communicating minor issues can erode user trust; under-communicating major ones erodes it more.",
    ],
  }),
];

// ── exports ────────────────────────────────────────────────────────

export const COMPONENT_REGISTRY: Record<SimComponentType, ComponentDef> =
  Object.fromEntries(COMPONENTS.map((c) => [c.type, c])) as Record<SimComponentType, ComponentDef>;

export const SIM_ICON_MAP: Record<SimComponentType, LucideIcon> = {
  client: Users,
  api_gateway: ShieldCheck,
  load_balancer: Network,
  web_server: Globe,
  app_server: Server,
  reverse_proxy: ArrowLeftRight,
  rate_limiter: Timer,
  sql_database: Database,
  nosql_database: HardDrive,
  object_storage: Archive,
  search_index: Search,
  graph_database: GitBranch,
  time_series_db: TrendingUp,
  data_lake: Container,
  data_warehouse: Warehouse,
  redis_cache: Zap,
  cdn: MapPin,
  local_cache: Cpu,
  distributed_cache: Layers,
  message_queue: Inbox,
  event_bus: Radio,
  pub_sub: Megaphone,
  stream_processor: Activity,
  websocket_server: Wifi,
  notification_service: Bell,
  dns: AtSign,
  service_mesh: Hexagon,
  kubernetes: Box,
  firewall: Shield,
  secrets_manager: KeyRound,
  service_registry: BookOpen,
  metrics_collector: BarChart3,
  log_aggregator: FileText,
  distributed_tracing: Route,
  alerting: AlertTriangle,
  health_check: HeartPulse,
  status_page: Monitor,
};

export const CATEGORIES: CategoryDef[] = [
  {
    id: "core",
    label: "Core",
    types: ["client", "api_gateway", "load_balancer", "web_server", "app_server", "reverse_proxy", "rate_limiter"],
  },
  {
    id: "storage",
    label: "Storage",
    types: ["sql_database", "nosql_database", "object_storage", "search_index", "graph_database", "time_series_db", "data_lake", "data_warehouse"],
  },
  {
    id: "caching",
    label: "Caching",
    types: ["redis_cache", "cdn", "local_cache", "distributed_cache"],
  },
  {
    id: "messaging",
    label: "Messaging",
    types: ["message_queue", "event_bus", "pub_sub", "stream_processor", "websocket_server", "notification_service"],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    types: ["dns", "service_mesh", "kubernetes", "firewall", "secrets_manager", "service_registry"],
  },
  {
    id: "observability",
    label: "Observability",
    types: ["metrics_collector", "log_aggregator", "distributed_tracing", "alerting", "health_check", "status_page"],
  },
];
