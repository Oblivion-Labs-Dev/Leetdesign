/**
 * Database cluster model — config, capacity derivation, and tick simulation.
 * Supports SQL, Redis, DynamoDB-style, MongoDB-style, and Search Index profiles.
 */

import type { SimComponentType, SimDesign, SimHealth } from "./types";

// ── Types ───────────────────────────────────────────────────────────

export type DatabaseFamily =
  | "relational"
  | "keyValue"
  | "document"
  | "wideColumn"
  | "search";

export type DatabaseEngine =
  | "postgresql"
  | "mysql"
  | "sqlServer"
  | "genericSql"
  | "redis"
  | "dynamoStyle"
  | "mongoStyle"
  | "cassandraStyle"
  | "bigtableStyle"
  | "elasticStyle";

export type ReplicationMode = "none" | "async" | "semiSync" | "sync";
export type ReadRouting = "primaryOnly" | "preferReplicas" | "replicaOnly";
export type WriteRouting = "primaryOnly" | "multiPrimary";
export type DistributionMode =
  | "single"
  | "tablePartition"
  | "horizontalShard"
  | "geoShard"
  | "tenantShard"
  | "hashShard"
  | "rangeShard";
export type ShardStrategy = "none" | "hash" | "range" | "directory" | "geo";
export type StorageType = "hdd" | "ssd" | "nvme" | "memory";
export type ConsistencyLevel = "eventual" | "strong" | "readCommitted" | "repeatableRead" | "serializable";
export type DurabilityMode = "relaxed" | "standard" | "strict";
export type HotPartitionLevel = "none" | "mild" | "severe";
export type FailoverMode = "manual" | "automatic";
export type EvictionPolicy = "lru" | "lfu" | "random" | "ttl";
export type CapacityMode = "provisioned" | "onDemand";

export interface RequestMix {
  primaryKeyRead: number;
  indexedLookup: number;
  write: number;
  rangeQuery: number;
  joinHeavy: number;
  aggregation: number;
  fullScan: number;
  fullText: number;
}

export interface DatabaseTopology {
  primaryCount: number;
  replicaCount: number;
  shardCount: number;
  replicationMode: ReplicationMode;
  readRouting: ReadRouting;
  writeRouting: WriteRouting;
  replicaReadPercent: number;
  readAfterWriteWindowSec: number;
  distributionMode: DistributionMode;
  shardStrategy: ShardStrategy;
  shardingKey: string;
  hotPartitionLevel: HotPartitionLevel;
}

export interface DatabaseCapacity {
  cpuUnits: number;
  memoryGb: number;
  storageGb: number;
  storageUsedGb: number;
  diskIops: number;
  maxConnections: number;
  networkMbps: number;
  storageType: StorageType;
  bufferCacheGb: number;
}

export interface DatabaseWorkload {
  readPercent: number;
  writePercent: number;
  requestMix: RequestMix;
  transactionSize: "small" | "medium" | "large";
  lockContention: "low" | "medium" | "high";
  avgRowsRead: number;
  avgRowsWritten: number;
  avgPayloadKb: number;
}

export interface DatabaseIndexes {
  primaryKey: boolean;
  secondaryIndexes: number;
  compositeIndexes: number;
  uniqueIndexes: number;
  fullTextIndex: boolean;
}

export interface DatabaseConnections {
  poolingEnabled: boolean;
  poolSizePerAppInstance: number;
  idleTimeoutSec: number;
  acquisitionTimeoutMs: number;
}

export interface DatabaseConsistency {
  isolationLevel: ConsistencyLevel;
  durabilityMode: DurabilityMode;
  distributedConsistency: "eventual" | "strong";
}

export interface DatabaseFailureControls {
  primaryFailed: boolean;
  replicaFailed: boolean;
  shardFailed: boolean;
  diskSaturated: boolean;
  networkPartition: boolean;
  failoverMode: FailoverMode;
  failoverDetectionSec: number;
  recoveryTimeObjectiveSec: number;
}

export interface RedisConfig {
  maxMemoryMb: number;
  evictionPolicy: EvictionPolicy;
  persistenceEnabled: boolean;
  clusterShards: number;
  defaultTtlSec: number;
}

export interface DynamoConfig {
  capacityMode: CapacityMode;
  readCapacityUnits: number;
  writeCapacityUnits: number;
  partitionKey: string;
}

export interface SearchConfig {
  refreshIntervalSec: number;
  indexingRatePerSec: number;
  replicaCount: number;
}

export interface DatabaseConfig {
  family: DatabaseFamily;
  engine: DatabaseEngine;
  topology: DatabaseTopology;
  capacity: DatabaseCapacity;
  workload: DatabaseWorkload;
  indexes: DatabaseIndexes;
  connections: DatabaseConnections;
  consistency: DatabaseConsistency;
  failure: DatabaseFailureControls;
  cacheHitRate: number;
  redis?: RedisConfig;
  dynamo?: DynamoConfig;
  search?: SearchConfig;
}

export interface DatabaseShardRow {
  index: number;
  name: string;
  incomingQps: number;
  storageGb: number;
  cpuPercent: number;
  p95LatencyMs: number;
  status: "healthy" | "hot" | "degraded" | "down";
}

export interface DatabaseTickState {
  activeConnections: number;
  replicationLagMs: number;
  replicationQueue: number;
  bufferHitRate: number;
  storageGrowthGbPerHour: number;
  primaryHealthy: boolean;
  healthyReplicas: number;
  hotShardIndex: number | null;
  shardSkew: number;
  evictionsPerSec: number;
  throttledQps: number;
  lockWaitMs: number;
  slowQueriesPerSec: number;
}

export interface DatabaseTickResult {
  completedQps: number;
  readQps: number;
  writeQps: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  maxCapacityQps: number;
  load: number;
  bottleneck: string;
  nextState: DatabaseTickState;
  cpuUtilization: number;
  memoryUtilization: number;
  diskIopsUtilization: number;
  connectionPoolUsage: number;
  warnings: string[];
}

export interface DatabaseMetricsSnapshot {
  incomingQps: number;
  completedQps: number;
  readQps: number;
  writeQps: number;
  p95LatencyMs: number;
  errorRate: number;
  activeConnections: number;
  connectionPoolUsage: number;
  cpuUtilization: number;
  memoryUtilization: number;
  diskIopsUtilization: number;
  storageUsedGb: number;
  storageCapacityGb: number;
  replicationLagMs: number;
  replicationQueue: number;
  healthyNodes: number;
  totalNodes: number;
  primaryStatus: "healthy" | "degraded" | "down" | "failover";
  shardCount: number;
  shardBalance: "even" | "mild_skew" | "hot_shard" | "severe_skew";
  hotShardId: string | null;
  shardSkew: number;
  primaryWriteLoad: number;
  replicaReadLoad: number;
  bottleneck: string;
  warnings: string[];
  footerPrimary: string;
  footerSecondary: string;
  /** Redis-specific */
  commandsPerSec?: number;
  evictionsPerSec?: number;
  cacheHitRate?: number;
  memoryUsedMb?: number;
  /** Dynamo-specific */
  readCapacityUsed?: number;
  writeCapacityUsed?: number;
  throttledRequests?: number;
  hotPartitionRisk?: "low" | "medium" | "high";
  /** Search-specific */
  searchQueriesPerSec?: number;
  indexingRate?: number;
  indexingBacklog?: number;
  refreshLatencyMs?: number;
  /** SQL-specific */
  lockWaitMs?: number;
  slowQueriesPerSec?: number;
  bufferHitRate?: number;
  shards: DatabaseShardRow[];
}

export const DATABASE_SIM_TYPES: ReadonlySet<SimComponentType> = new Set([
  "sql_database",
  "redis_cache",
  "nosql_database",
  "search_index",
]);

const REQUEST_MIX_KEYS: (keyof RequestMix)[] = [
  "primaryKeyRead",
  "indexedLookup",
  "write",
  "rangeQuery",
  "joinHeavy",
  "aggregation",
  "fullScan",
  "fullText",
];

const QUERY_COST: Record<keyof RequestMix, { cpu: number; iops: number; memory: number; lock: number; latency: number }> = {
  primaryKeyRead: { cpu: 1, iops: 1, memory: 1, lock: 0.2, latency: 1 },
  indexedLookup: { cpu: 1.5, iops: 2, memory: 1.2, lock: 0.3, latency: 1.2 },
  write: { cpu: 2, iops: 4, memory: 1.5, lock: 1.5, latency: 2 },
  rangeQuery: { cpu: 3, iops: 5, memory: 2, lock: 0.5, latency: 3 },
  joinHeavy: { cpu: 6, iops: 4, memory: 5, lock: 2, latency: 5 },
  aggregation: { cpu: 7, iops: 6, memory: 6, lock: 1, latency: 6 },
  fullScan: { cpu: 10, iops: 12, memory: 8, lock: 0.5, latency: 10 },
  fullText: { cpu: 5, iops: 3, memory: 4, lock: 0.3, latency: 4 },
};

export const ENGINE_OPTIONS: Record<DatabaseFamily, { value: DatabaseEngine; label: string }[]> = {
  relational: [
    { value: "postgresql", label: "PostgreSQL" },
    { value: "mysql", label: "MySQL" },
    { value: "sqlServer", label: "SQL Server" },
    { value: "genericSql", label: "Generic SQL" },
  ],
  keyValue: [
    { value: "redis", label: "Redis" },
    { value: "dynamoStyle", label: "DynamoDB-style Key Value" },
  ],
  document: [
    { value: "mongoStyle", label: "MongoDB-style Document Store" },
  ],
  wideColumn: [
    { value: "cassandraStyle", label: "Cassandra-style Wide Column" },
    { value: "bigtableStyle", label: "Bigtable-style Wide Column" },
  ],
  search: [
    { value: "elasticStyle", label: "Elasticsearch / OpenSearch" },
  ],
};

function num(raw: Record<string, unknown>, key: string, fallback: number): number {
  const v = raw[key];
  return typeof v === "number" ? v : fallback;
}

function str(raw: Record<string, unknown>, key: string, fallback: string): string {
  const v = raw[key];
  return typeof v === "string" ? v : fallback;
}

function bool(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const v = raw[key];
  return typeof v === "boolean" ? v : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function defaultRequestMix(engine: DatabaseEngine): RequestMix {
  switch (engine) {
    case "redis":
      return { primaryKeyRead: 70, indexedLookup: 0, write: 20, rangeQuery: 0, joinHeavy: 0, aggregation: 0, fullScan: 0, fullText: 0 };
    case "dynamoStyle":
      return { primaryKeyRead: 60, indexedLookup: 15, write: 20, rangeQuery: 5, joinHeavy: 0, aggregation: 0, fullScan: 0, fullText: 0 };
    case "mongoStyle":
      return { primaryKeyRead: 40, indexedLookup: 35, write: 20, rangeQuery: 5, joinHeavy: 0, aggregation: 0, fullScan: 0, fullText: 0 };
    case "elasticStyle":
      return { primaryKeyRead: 0, indexedLookup: 0, write: 15, rangeQuery: 0, joinHeavy: 0, aggregation: 10, fullScan: 0, fullText: 75 };
    default:
      return { primaryKeyRead: 55, indexedLookup: 25, write: 15, rangeQuery: 5, joinHeavy: 0, aggregation: 0, fullScan: 0, fullText: 0 };
  }
}

function defaultFamilyEngine(componentType: SimComponentType): { family: DatabaseFamily; engine: DatabaseEngine } {
  switch (componentType) {
    case "redis_cache":
      return { family: "keyValue", engine: "redis" };
    case "nosql_database":
      return { family: "document", engine: "mongoStyle" };
    case "search_index":
      return { family: "search", engine: "elasticStyle" };
    default:
      return { family: "relational", engine: "postgresql" };
  }
}

export function defaultDatabaseConfig(componentType: SimComponentType): DatabaseConfig {
  const { family, engine } = defaultFamilyEngine(componentType);
  const isRedis = engine === "redis";
  const isSearch = engine === "elasticStyle";
  const isDynamo = engine === "dynamoStyle";
  const isSql = family === "relational";

  return {
    family,
    engine,
    topology: {
      primaryCount: 1,
      replicaCount: isSql ? 0 : isSearch ? 1 : 0,
      shardCount: isDynamo ? 4 : isSearch ? 5 : 1,
      replicationMode: isRedis ? "async" : "async",
      readRouting: "primaryOnly",
      writeRouting: "primaryOnly",
      replicaReadPercent: 0,
      readAfterWriteWindowSec: 5,
      distributionMode: isDynamo || engine === "mongoStyle" ? "hashShard" : "single",
      shardStrategy: isDynamo || engine === "mongoStyle" ? "hash" : "none",
      shardingKey: isDynamo ? "userId" : engine === "mongoStyle" ? "tenantId" : "id",
      hotPartitionLevel: "none",
    },
    capacity: {
      cpuUnits: isRedis ? 4 : 8,
      memoryGb: isRedis ? 16 : 32,
      storageGb: isRedis ? 0 : 500,
      storageUsedGb: isRedis ? 0 : 120,
      diskIops: isRedis ? 0 : 10000,
      maxConnections: isRedis ? 10000 : 500,
      networkMbps: 1000,
      storageType: isRedis ? "memory" : "ssd",
      bufferCacheGb: isSql ? 8 : 4,
    },
    workload: {
      readPercent: isSearch ? 85 : 80,
      writePercent: isSearch ? 15 : 20,
      requestMix: defaultRequestMix(engine),
      transactionSize: "medium",
      lockContention: "low",
      avgRowsRead: 10,
      avgRowsWritten: 3,
      avgPayloadKb: 4,
    },
    indexes: {
      primaryKey: true,
      secondaryIndexes: isSql || engine === "mongoStyle" ? 3 : 0,
      compositeIndexes: isSql ? 1 : 0,
      uniqueIndexes: isSql ? 2 : 0,
      fullTextIndex: isSearch,
    },
    connections: {
      poolingEnabled: true,
      poolSizePerAppInstance: 20,
      idleTimeoutSec: 60,
      acquisitionTimeoutMs: 500,
    },
    consistency: {
      isolationLevel: isSql ? "readCommitted" : "eventual",
      durabilityMode: "standard",
      distributedConsistency: isDynamo || isRedis ? "eventual" : "strong",
    },
    failure: {
      primaryFailed: false,
      replicaFailed: false,
      shardFailed: false,
      diskSaturated: false,
      networkPartition: false,
      failoverMode: "automatic",
      failoverDetectionSec: 30,
      recoveryTimeObjectiveSec: 60,
    },
    cacheHitRate: isRedis ? 0.95 : 0.88,
    redis: isRedis
      ? { maxMemoryMb: 8192, evictionPolicy: "lru", persistenceEnabled: false, clusterShards: 3, defaultTtlSec: 3600 }
      : undefined,
    dynamo: isDynamo
      ? { capacityMode: "provisioned", readCapacityUnits: 5000, writeCapacityUnits: 2000, partitionKey: "userId" }
      : undefined,
    search: isSearch
      ? { refreshIntervalSec: 1, indexingRatePerSec: 500, replicaCount: 1 }
      : undefined,
  };
}

export function databaseConfigToStorage(cfg: DatabaseConfig): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    dbFamily: cfg.family,
    dbEngine: cfg.engine,
    primaryCount: cfg.topology.primaryCount,
    replicaCount: cfg.topology.replicaCount,
    shardCount: cfg.topology.shardCount,
    replicationMode: cfg.topology.replicationMode,
    readRouting: cfg.topology.readRouting,
    writeRouting: cfg.topology.writeRouting,
    replicaReadPercent: cfg.topology.replicaReadPercent,
    readAfterWriteWindowSec: cfg.topology.readAfterWriteWindowSec,
    distributionMode: cfg.topology.distributionMode,
    shardStrategy: cfg.topology.shardStrategy,
    shardingKey: cfg.topology.shardingKey,
    hotPartitionLevel: cfg.topology.hotPartitionLevel,
    cpuUnits: cfg.capacity.cpuUnits,
    memoryGb: cfg.capacity.memoryGb,
    storageGb: cfg.capacity.storageGb,
    storageUsedGb: cfg.capacity.storageUsedGb,
    diskIops: cfg.capacity.diskIops,
    maxConnections: cfg.capacity.maxConnections,
    networkMbps: cfg.capacity.networkMbps,
    storageType: cfg.capacity.storageType,
    bufferCacheGb: cfg.capacity.bufferCacheGb,
    readPercent: cfg.workload.readPercent,
    writePercent: cfg.workload.writePercent,
    transactionSize: cfg.workload.transactionSize,
    lockContention: cfg.workload.lockContention,
    avgRowsRead: cfg.workload.avgRowsRead,
    avgRowsWritten: cfg.workload.avgRowsWritten,
    avgPayloadKb: cfg.workload.avgPayloadKb,
    indexPrimaryKey: cfg.indexes.primaryKey,
    indexSecondary: cfg.indexes.secondaryIndexes,
    indexComposite: cfg.indexes.compositeIndexes,
    indexUnique: cfg.indexes.uniqueIndexes,
    indexFullText: cfg.indexes.fullTextIndex,
    poolingEnabled: cfg.connections.poolingEnabled,
    poolSizePerAppInstance: cfg.connections.poolSizePerAppInstance,
    idleTimeoutSec: cfg.connections.idleTimeoutSec,
    acquisitionTimeoutMs: cfg.connections.acquisitionTimeoutMs,
    isolationLevel: cfg.consistency.isolationLevel,
    durabilityMode: cfg.consistency.durabilityMode,
    distributedConsistency: cfg.consistency.distributedConsistency,
    primaryFailed: cfg.failure.primaryFailed,
    replicaFailed: cfg.failure.replicaFailed,
    shardFailed: cfg.failure.shardFailed,
    diskSaturated: cfg.failure.diskSaturated,
    networkPartition: cfg.failure.networkPartition,
    failoverMode: cfg.failure.failoverMode,
    failoverDetectionSec: cfg.failure.failoverDetectionSec,
    recoveryTimeObjectiveSec: cfg.failure.recoveryTimeObjectiveSec,
    cacheHitRate: cfg.cacheHitRate,
  };

  for (const key of REQUEST_MIX_KEYS) {
    out[`mix_${key}`] = cfg.workload.requestMix[key];
  }

  if (cfg.redis) {
    out.redisMaxMemoryMb = cfg.redis.maxMemoryMb;
    out.redisEvictionPolicy = cfg.redis.evictionPolicy;
    out.redisPersistence = cfg.redis.persistenceEnabled;
    out.redisClusterShards = cfg.redis.clusterShards;
    out.redisDefaultTtlSec = cfg.redis.defaultTtlSec;
  }
  if (cfg.dynamo) {
    out.dynamoCapacityMode = cfg.dynamo.capacityMode;
    out.dynamoReadCu = cfg.dynamo.readCapacityUnits;
    out.dynamoWriteCu = cfg.dynamo.writeCapacityUnits;
    out.dynamoPartitionKey = cfg.dynamo.partitionKey;
  }
  if (cfg.search) {
    out.searchRefreshSec = cfg.search.refreshIntervalSec;
    out.searchIndexingRate = cfg.search.indexingRatePerSec;
    out.searchReplicaCount = cfg.search.replicaCount;
  }

  return out;
}

export function parseDatabaseConfig(
  componentType: SimComponentType,
  raw: Record<string, unknown>,
): DatabaseConfig {
  const merged = { ...raw };
  if (typeof merged.readReplicas === "number" && merged.replicaCount === undefined) {
    merged.replicaCount = merged.readReplicas;
  }
  if (typeof merged.shards === "number" && merged.shardCount === undefined) {
    merged.shardCount = merged.shards;
  }
  if (typeof merged.connectionPoolSize === "number" && merged.maxConnections === undefined) {
    merged.maxConnections = merged.connectionPoolSize;
  }
  if (typeof merged.hitRate === "number" && merged.cacheHitRate === undefined) {
    merged.cacheHitRate = merged.hitRate;
  }
  if (typeof merged.maxMemoryMB === "number" && merged.redisMaxMemoryMb === undefined) {
    merged.redisMaxMemoryMb = merged.maxMemoryMB;
  }
  if (typeof merged.engine === "string" && merged.dbEngine === undefined) {
    const legacyEngine = merged.engine as string;
    const engineMap: Record<string, DatabaseEngine> = {
      postgres: "postgresql",
      mysql: "mysql",
      mongodb: "mongoStyle",
      dynamodb: "dynamoStyle",
      cassandra: "cassandraStyle",
      redis: "redis",
    };
    if (engineMap[legacyEngine]) merged.dbEngine = engineMap[legacyEngine];
  }

  const defaults = defaultDatabaseConfig(componentType);
  const family = str(merged, "dbFamily", defaults.family) as DatabaseFamily;
  const engine = str(merged, "dbEngine", defaults.engine) as DatabaseEngine;

  const mix: RequestMix = { ...defaults.workload.requestMix };
  for (const key of REQUEST_MIX_KEYS) {
    mix[key] = num(merged, `mix_${key}`, mix[key]);
  }

  const cfg: DatabaseConfig = {
    family,
    engine,
    topology: {
      primaryCount: Math.max(1, Math.round(num(merged, "primaryCount", defaults.topology.primaryCount))),
      replicaCount: Math.max(0, Math.round(num(merged, "replicaCount", defaults.topology.replicaCount))),
      shardCount: Math.max(1, Math.round(num(merged, "shardCount", defaults.topology.shardCount))),
      replicationMode: str(merged, "replicationMode", defaults.topology.replicationMode) as ReplicationMode,
      readRouting: str(merged, "readRouting", defaults.topology.readRouting) as ReadRouting,
      writeRouting: str(merged, "writeRouting", defaults.topology.writeRouting) as WriteRouting,
      replicaReadPercent: clamp(num(merged, "replicaReadPercent", defaults.topology.replicaReadPercent), 0, 100),
      readAfterWriteWindowSec: num(merged, "readAfterWriteWindowSec", defaults.topology.readAfterWriteWindowSec),
      distributionMode: str(merged, "distributionMode", defaults.topology.distributionMode) as DistributionMode,
      shardStrategy: str(merged, "shardStrategy", defaults.topology.shardStrategy) as ShardStrategy,
      shardingKey: str(merged, "shardingKey", defaults.topology.shardingKey),
      hotPartitionLevel: str(merged, "hotPartitionLevel", defaults.topology.hotPartitionLevel) as HotPartitionLevel,
    },
    capacity: {
      cpuUnits: Math.max(1, num(merged, "cpuUnits", defaults.capacity.cpuUnits)),
      memoryGb: Math.max(1, num(merged, "memoryGb", defaults.capacity.memoryGb)),
      storageGb: Math.max(1, num(merged, "storageGb", defaults.capacity.storageGb)),
      storageUsedGb: Math.max(0, num(merged, "storageUsedGb", defaults.capacity.storageUsedGb)),
      diskIops: Math.max(0, num(merged, "diskIops", defaults.capacity.diskIops)),
      maxConnections: Math.max(10, num(merged, "maxConnections", defaults.capacity.maxConnections)),
      networkMbps: Math.max(100, num(merged, "networkMbps", defaults.capacity.networkMbps)),
      storageType: str(merged, "storageType", defaults.capacity.storageType) as StorageType,
      bufferCacheGb: Math.max(0, num(merged, "bufferCacheGb", defaults.capacity.bufferCacheGb)),
    },
    workload: {
      readPercent: clamp(num(merged, "readPercent", defaults.workload.readPercent), 0, 100),
      writePercent: clamp(num(merged, "writePercent", defaults.workload.writePercent), 0, 100),
      requestMix: mix,
      transactionSize: str(merged, "transactionSize", defaults.workload.transactionSize) as DatabaseWorkload["transactionSize"],
      lockContention: str(merged, "lockContention", defaults.workload.lockContention) as DatabaseWorkload["lockContention"],
      avgRowsRead: num(merged, "avgRowsRead", defaults.workload.avgRowsRead),
      avgRowsWritten: num(merged, "avgRowsWritten", defaults.workload.avgRowsWritten),
      avgPayloadKb: num(merged, "avgPayloadKb", defaults.workload.avgPayloadKb),
    },
    indexes: {
      primaryKey: bool(merged, "indexPrimaryKey", defaults.indexes.primaryKey),
      secondaryIndexes: Math.max(0, Math.round(num(merged, "indexSecondary", defaults.indexes.secondaryIndexes))),
      compositeIndexes: Math.max(0, Math.round(num(merged, "indexComposite", defaults.indexes.compositeIndexes))),
      uniqueIndexes: Math.max(0, Math.round(num(merged, "indexUnique", defaults.indexes.uniqueIndexes))),
      fullTextIndex: bool(merged, "indexFullText", defaults.indexes.fullTextIndex),
    },
    connections: {
      poolingEnabled: bool(merged, "poolingEnabled", defaults.connections.poolingEnabled),
      poolSizePerAppInstance: Math.max(1, num(merged, "poolSizePerAppInstance", defaults.connections.poolSizePerAppInstance)),
      idleTimeoutSec: num(merged, "idleTimeoutSec", defaults.connections.idleTimeoutSec),
      acquisitionTimeoutMs: num(merged, "acquisitionTimeoutMs", defaults.connections.acquisitionTimeoutMs),
    },
    consistency: {
      isolationLevel: str(merged, "isolationLevel", defaults.consistency.isolationLevel) as ConsistencyLevel,
      durabilityMode: str(merged, "durabilityMode", defaults.consistency.durabilityMode) as DurabilityMode,
      distributedConsistency: str(merged, "distributedConsistency", defaults.consistency.distributedConsistency) as "eventual" | "strong",
    },
    failure: {
      primaryFailed: bool(merged, "primaryFailed", defaults.failure.primaryFailed),
      replicaFailed: bool(merged, "replicaFailed", defaults.failure.replicaFailed),
      shardFailed: bool(merged, "shardFailed", defaults.failure.shardFailed),
      diskSaturated: bool(merged, "diskSaturated", defaults.failure.diskSaturated),
      networkPartition: bool(merged, "networkPartition", defaults.failure.networkPartition),
      failoverMode: str(merged, "failoverMode", defaults.failure.failoverMode) as FailoverMode,
      failoverDetectionSec: num(merged, "failoverDetectionSec", defaults.failure.failoverDetectionSec),
      recoveryTimeObjectiveSec: num(merged, "recoveryTimeObjectiveSec", defaults.failure.recoveryTimeObjectiveSec),
    },
    cacheHitRate: clamp(num(merged, "cacheHitRate", defaults.cacheHitRate), 0, 1),
  };

  if (engine === "redis" || componentType === "redis_cache") {
    cfg.redis = {
      maxMemoryMb: num(merged, "redisMaxMemoryMb", defaults.redis?.maxMemoryMb ?? 8192),
      evictionPolicy: str(merged, "redisEvictionPolicy", defaults.redis?.evictionPolicy ?? "lru") as EvictionPolicy,
      persistenceEnabled: bool(merged, "redisPersistence", defaults.redis?.persistenceEnabled ?? false),
      clusterShards: Math.max(1, Math.round(num(merged, "redisClusterShards", defaults.redis?.clusterShards ?? 3))),
      defaultTtlSec: num(merged, "redisDefaultTtlSec", defaults.redis?.defaultTtlSec ?? 3600),
    };
  }
  if (engine === "dynamoStyle") {
    cfg.dynamo = {
      capacityMode: str(merged, "dynamoCapacityMode", defaults.dynamo?.capacityMode ?? "provisioned") as CapacityMode,
      readCapacityUnits: num(merged, "dynamoReadCu", defaults.dynamo?.readCapacityUnits ?? 5000),
      writeCapacityUnits: num(merged, "dynamoWriteCu", defaults.dynamo?.writeCapacityUnits ?? 2000),
      partitionKey: str(merged, "dynamoPartitionKey", defaults.dynamo?.partitionKey ?? "userId"),
    };
  }
  if (engine === "elasticStyle" || componentType === "search_index") {
    cfg.search = {
      refreshIntervalSec: num(merged, "searchRefreshSec", defaults.search?.refreshIntervalSec ?? 1),
      indexingRatePerSec: num(merged, "searchIndexingRate", defaults.search?.indexingRatePerSec ?? 500),
      replicaCount: Math.max(0, Math.round(num(merged, "searchReplicaCount", defaults.search?.replicaCount ?? 1))),
    };
  }

  return cfg;
}

export function isDatabaseSimNode(type: SimComponentType): boolean {
  return DATABASE_SIM_TYPES.has(type);
}

export function engineDisplayLabel(engine: DatabaseEngine): string {
  for (const opts of Object.values(ENGINE_OPTIONS)) {
    const found = opts.find((o) => o.value === engine);
    if (found) return found.label;
  }
  return engine;
}

function weightedQueryCost(mix: RequestMix): { cpu: number; iops: number; memory: number; lock: number; latency: number } {
  const total = REQUEST_MIX_KEYS.reduce((s, k) => s + mix[k], 0) || 100;
  const acc = { cpu: 0, iops: 0, memory: 0, lock: 0, latency: 0 };
  for (const key of REQUEST_MIX_KEYS) {
    const w = mix[key] / total;
    const c = QUERY_COST[key];
    acc.cpu += c.cpu * w;
    acc.iops += c.iops * w;
    acc.memory += c.memory * w;
    acc.lock += c.lock * w;
    acc.latency += c.latency * w;
  }
  return acc;
}

function indexLatencyFactor(cfg: DatabaseConfig): number {
  const { indexes, workload } = cfg;
  let factor = 1;
  const mixTotal = REQUEST_MIX_KEYS.reduce((s, k) => s + workload.requestMix[k], 0) || 100;
  const indexedShare = (workload.requestMix.indexedLookup + workload.requestMix.rangeQuery) / mixTotal;
  const scanShare = workload.requestMix.fullScan / mixTotal;
  if (indexes.secondaryIndexes > 0 || indexes.compositeIndexes > 0) {
    factor *= 1 - indexedShare * 0.35;
  } else if (indexedShare > 0.1) {
    factor *= 1 + indexedShare * 0.8;
  }
  if (scanShare > 0 && !indexes.fullTextIndex) {
    factor *= 1 + scanShare * 1.5;
  }
  return Math.max(0.3, factor);
}

function replicationWritePenalty(mode: ReplicationMode): number {
  switch (mode) {
    case "sync": return 2.2;
    case "semiSync": return 1.5;
    case "async": return 1.05;
    default: return 1;
  }
}

function baseLatencyMs(cfg: DatabaseConfig): number {
  switch (cfg.engine) {
    case "redis": return 0.5;
    case "dynamoStyle": return 3;
    case "mongoStyle": return 4;
    case "elasticStyle": return 15;
    case "mysql": return 4;
    case "sqlServer": return 5;
    default: return 5;
  }
}

export function deriveDatabaseBaseLatency(cfg: DatabaseConfig): number {
  return baseLatencyMs(cfg);
}

export function deriveDatabaseCapacity(cfg: DatabaseConfig): number {
  const { capacity, topology, engine } = cfg;
  const cost = weightedQueryCost(cfg.workload.requestMix);

  if (engine === "redis" && cfg.redis) {
    const memQps = (cfg.redis.maxMemoryMb / 4) * cfg.redis.clusterShards;
    return memQps * 10;
  }

  if (engine === "dynamoStyle" && cfg.dynamo) {
    if (cfg.dynamo.capacityMode === "onDemand") {
      return 50_000 * topology.shardCount;
    }
    const readQps = cfg.dynamo.readCapacityUnits * 0.5 * topology.shardCount;
    const writeQps = cfg.dynamo.writeCapacityUnits * 0.5 * topology.shardCount;
    const readW = cfg.workload.readPercent / 100;
    return (readQps / Math.max(0.5, readW * cost.latency) + writeQps / Math.max(0.5, (1 - readW) * cost.latency * 2)) / 2;
  }

  const cpuQps = (capacity.cpuUnits * 800) / cost.cpu;
  const iopsQps = capacity.diskIops > 0 ? capacity.diskIops / cost.iops : cpuQps;
  const connQps = capacity.maxConnections / (baseLatencyMs(cfg) / 1000);
  const nodeMultiplier = topology.primaryCount + topology.replicaCount * 0.85;
  const shardMultiplier = topology.shardCount;

  return Math.min(cpuQps, iopsQps, connQps) * nodeMultiplier * shardMultiplier;
}

export function computeConnectionDemand(
  design: SimDesign,
  dbNodeId: string,
): { demandedConnections: number; appInstanceCount: number; exceedsLimit: boolean; maxConnections: number } {
  const dbNode = design.nodes.find((n) => n.id === dbNodeId);
  const cfg = dbNode ? parseDatabaseConfig(dbNode.type, dbNode.config) : defaultDatabaseConfig("sql_database");
  let demanded = 0;
  let instances = 0;

  for (const edge of design.edges) {
    if (edge.target !== dbNodeId) continue;
    const source = design.nodes.find((n) => n.id === edge.source);
    if (!source || source.type !== "app_server") continue;
    const instanceCount = typeof source.config.instanceCount === "number"
      ? source.config.instanceCount
      : 1;
    const poolSize = typeof edge.config.poolSizePerAppInstance === "number"
      ? edge.config.poolSizePerAppInstance
      : cfg.connections.poolSizePerAppInstance;
    instances += instanceCount;
    demanded += instanceCount * poolSize;
  }

  return {
    demandedConnections: demanded,
    appInstanceCount: instances,
    exceedsLimit: demanded > cfg.capacity.maxConnections,
    maxConnections: cfg.capacity.maxConnections,
  };
}

export function simulateDatabaseTick(params: {
  incomingQps: number;
  dtSec: number;
  cfg: DatabaseConfig;
  state: DatabaseTickState;
  demandedConnections: number;
}): DatabaseTickResult {
  const { incomingQps, cfg, state, demandedConnections } = params;
  const warnings: string[] = [];
  const cost = weightedQueryCost(cfg.workload.requestMix);
  const baseLat = baseLatencyMs(cfg);
  const maxCap = deriveDatabaseCapacity(cfg);

  if (incomingQps <= 0) {
    return {
      completedQps: 0,
      readQps: 0,
      writeQps: 0,
      avgLatencyMs: baseLat,
      p95LatencyMs: baseLat * 1.5,
      errorRate: 0,
      maxCapacityQps: maxCap,
      load: 0,
      bottleneck: "none",
      nextState: {
        ...state,
        activeConnections: Math.max(0, state.activeConnections * 0.9),
        replicationLagMs: Math.max(0, state.replicationLagMs * 0.95),
        replicationQueue: Math.max(0, state.replicationQueue * 0.9),
        throttledQps: 0,
      },
      cpuUtilization: Math.max(0, state.activeConnections > 0 ? 5 : 0),
      memoryUtilization: 10,
      diskIopsUtilization: 0,
      connectionPoolUsage: demandedConnections > 0
        ? Math.min(100, (state.activeConnections / Math.max(1, cfg.capacity.maxConnections)) * 100)
        : 0,
      warnings,
    };
  }

  const readPct = cfg.workload.readPercent / 100;
  const writePct = cfg.workload.writePercent / 100;
  const totalPct = readPct + writePct || 1;
  const readQps = incomingQps * (readPct / totalPct);
  const writeQps = incomingQps * (writePct / totalPct);

  let replicaReadShare = 0;
  if (cfg.topology.replicaCount > 0) {
    if (cfg.topology.readRouting === "replicaOnly") replicaReadShare = 1;
    else if (cfg.topology.readRouting === "preferReplicas") {
      replicaReadShare = Math.min(1, cfg.topology.replicaReadPercent / 100 || 0.8);
    } else if (cfg.topology.replicaReadPercent > 0) {
      replicaReadShare = cfg.topology.replicaReadPercent / 100;
    }
  }

  const primaryReadQps = readQps * (1 - replicaReadShare);
  const replicaReadQps = readQps * replicaReadShare;
  const primaryWriteQps = writeQps;

  let hotShardIndex: number | null = null;
  let shardSkew = 0;
  const shardCount = cfg.engine === "redis" && cfg.redis
    ? cfg.redis.clusterShards
    : cfg.topology.shardCount;

  if (cfg.topology.hotPartitionLevel !== "none" && shardCount > 1) {
    hotShardIndex = cfg.topology.hotPartitionLevel === "severe" ? 2 : 1;
    shardSkew = cfg.topology.hotPartitionLevel === "severe" ? 0.85 : 0.55;
    warnings.push(
      `Traffic is concentrated on Shard ${hotShardIndex + 1}. Adding more total shards may not help until the partition key or routing strategy changes.`,
    );
  }

  const connUsage = demandedConnections > 0
    ? demandedConnections
    : incomingQps * (baseLat / 1000);
  const activeConnections = Math.min(
    cfg.capacity.maxConnections,
    connUsage * (baseLat / 1000) * 1.2,
  );
  const connectionPoolUsage = (activeConnections / cfg.capacity.maxConnections) * 100;

  if (demandedConnections > cfg.capacity.maxConnections) {
    warnings.push(
      `Configured application connection pools (${demandedConnections}) exceed database max connections (${cfg.capacity.maxConnections}).`,
    );
  }

  let connErrorRate = 0;
  if (activeConnections >= cfg.capacity.maxConnections * 0.98) {
    connErrorRate = Math.min(0.4, (activeConnections / cfg.capacity.maxConnections - 0.95) * 2);
  }

  const indexFactor = indexLatencyFactor(cfg);
  const cacheFactor = 1 - cfg.cacheHitRate * 0.6;
  const lockMult = cfg.workload.lockContention === "high" ? 2.5 : cfg.workload.lockContention === "medium" ? 1.5 : 1;
  const txMult = cfg.workload.transactionSize === "large" ? 2 : cfg.workload.transactionSize === "medium" ? 1.3 : 1;
  const replPenalty = replicationWritePenalty(cfg.topology.replicationMode);

  const effectiveLoad = incomingQps / Math.max(1, maxCap);
  let hotShardPenalty = 1;
  if (hotShardIndex !== null) {
    hotShardPenalty = 1 + shardSkew * 3;
  }

  const cpuUtil = Math.min(100, effectiveLoad * cost.cpu * 12 * hotShardPenalty);
  const memUtil = Math.min(100, 20 + effectiveLoad * cost.memory * 10);
  const iopsUtil = cfg.capacity.diskIops > 0
    ? Math.min(100, effectiveLoad * cost.iops * 8 * cacheFactor)
    : 0;

  let bottleneck = "cpu";
  const utils = { cpu: cpuUtil, memory: memUtil, iops: iopsUtil, connections: connectionPoolUsage };
  bottleneck = Object.entries(utils).sort((a, b) => b[1] - a[1])[0][0];

  let avgLatency = baseLat * indexFactor * cacheFactor * lockMult * txMult * hotShardPenalty;
  avgLatency *= replPenalty * (writeQps / Math.max(1, incomingQps)) + (1 - writeQps / Math.max(1, incomingQps));

  if (effectiveLoad > 0.7) {
    avgLatency *= 1 + (effectiveLoad - 0.7) * 2;
  }
  if (effectiveLoad > 1) {
    avgLatency *= 1 + Math.pow(effectiveLoad - 1, 1.4) * 4;
  }

  if (cfg.consistency.distributedConsistency === "strong" && cfg.engine === "dynamoStyle") {
    avgLatency *= 1.8;
  }
  if (cfg.consistency.isolationLevel === "serializable") {
    avgLatency *= 1.6;
  }

  const replicationLagMs = Math.max(
    state.replicationLagMs * 0.85,
    writeQps * replPenalty * 0.05 + (effectiveLoad > 1 ? 200 : 0),
  );
  if (replicationLagMs > cfg.topology.readAfterWriteWindowSec * 1000 && replicaReadShare > 0) {
    warnings.push("Replication lag exceeds read-after-write window — stale reads possible on replicas.");
  }

  let throttleError = 0;
  if (cfg.engine === "dynamoStyle" && cfg.dynamo?.capacityMode === "provisioned") {
    const readCap = cfg.dynamo.readCapacityUnits * cfg.topology.shardCount * 0.5;
    const writeCap = cfg.dynamo.writeCapacityUnits * cfg.topology.shardCount * 0.5;
    if (readQps > readCap || writeQps > writeCap) {
      throttleError = Math.min(0.5, Math.max(0, (Math.max(readQps / readCap, writeQps / writeCap) - 1) * 0.3));
    }
  }

  let storageError = 0;
  if (cfg.capacity.storageGb > 0 && cfg.capacity.storageUsedGb / cfg.capacity.storageGb > 0.95) {
    storageError = 0.3;
    warnings.push("Storage nearly full — writes may be rejected or throttled.");
  }

  let failureError = 0;
  let primaryHealthy = !cfg.failure.primaryFailed;
  if (cfg.failure.primaryFailed) {
    failureError = cfg.failure.failoverMode === "automatic" ? 0.15 : 0.6;
    primaryHealthy = cfg.failure.failoverMode === "automatic";
  }
  if (cfg.failure.diskSaturated) {
    failureError = Math.max(failureError, 0.25);
  }
  if (cfg.failure.networkPartition) {
    failureError = Math.max(failureError, 0.2);
  }

  const overloadError = effectiveLoad > 1 ? Math.min(0.35, (effectiveLoad - 1) * 0.25) : 0;
  const errorRate = Math.min(1, connErrorRate + throttleError + storageError + failureError + overloadError);

  const completedQps = incomingQps * (1 - errorRate);
  const lockWaitMs = writeQps * lockMult * 0.3;
  const slowQueries = incomingQps * (cfg.workload.requestMix.fullScan / 100) * (indexFactor > 1 ? 1 : 0.1);

  let evictions = 0;
  if (cfg.engine === "redis" && cfg.redis && memUtil > 85) {
    evictions = (incomingQps * 0.1) * ((memUtil - 85) / 15);
  }

  const healthyReplicas = cfg.failure.replicaFailed
    ? 0
    : cfg.topology.replicaCount;

  return {
    completedQps,
    readQps,
    writeQps,
    avgLatencyMs: avgLatency,
    p95LatencyMs: avgLatency * (1.5 + effectiveLoad * 0.5),
    errorRate,
    maxCapacityQps: maxCap,
    load: effectiveLoad,
    bottleneck,
    cpuUtilization: cpuUtil,
    memoryUtilization: memUtil,
    diskIopsUtilization: iopsUtil,
    connectionPoolUsage,
    warnings,
    nextState: {
      activeConnections,
      replicationLagMs,
      replicationQueue: Math.round(writeQps * replPenalty * 10),
      bufferHitRate: cfg.cacheHitRate,
      storageGrowthGbPerHour: writeQps * 0.001,
      primaryHealthy,
      healthyReplicas,
      hotShardIndex,
      shardSkew,
      evictionsPerSec: evictions,
      throttledQps: incomingQps * throttleError,
      lockWaitMs,
      slowQueriesPerSec: slowQueries,
    },
  };
}

export function deriveShardRows(
  cfg: DatabaseConfig,
  tick: DatabaseTickResult | null,
  incomingQps: number,
): DatabaseShardRow[] {
  const shardCount = cfg.engine === "redis" && cfg.redis
    ? cfg.redis.clusterShards
    : cfg.topology.shardCount;
  const rows: DatabaseShardRow[] = [];

  for (let i = 0; i < shardCount; i++) {
    let share = 1 / shardCount;
    let status: DatabaseShardRow["status"] = "healthy";
    if (tick?.nextState.hotShardIndex === i) {
      share = share + tick.nextState.shardSkew;
      status = tick.nextState.shardSkew > 0.7 ? "hot" : "degraded";
    } else if (tick?.nextState.hotShardIndex !== null && tick) {
      share = share * (1 - tick.nextState.shardSkew / (shardCount - 1));
    }
    if (cfg.failure.shardFailed && i === 0) status = "down";

    const qps = incomingQps * share;
    rows.push({
      index: i + 1,
      name: `Shard ${i + 1}`,
      incomingQps: qps,
      storageGb: cfg.capacity.storageUsedGb / shardCount,
      cpuPercent: tick ? tick.cpuUtilization * share * shardCount : 0,
      p95LatencyMs: tick ? tick.p95LatencyMs * (status === "hot" ? 2.5 : 1) : 0,
      status,
    });
  }
  return rows;
}

export function buildDatabaseMetricsSnapshot(
  cfg: DatabaseConfig,
  tick: DatabaseTickResult,
  incomingQps: number,
): DatabaseMetricsSnapshot {
  const shardCount = cfg.engine === "redis" && cfg.redis
    ? cfg.redis.clusterShards
    : cfg.topology.shardCount;
  const totalNodes = cfg.topology.primaryCount + cfg.topology.replicaCount;
  const shards = deriveShardRows(cfg, tick, incomingQps);

  let shardBalance: DatabaseMetricsSnapshot["shardBalance"] = "even";
  if (tick.nextState.hotShardIndex !== null) {
    shardBalance = tick.nextState.shardSkew > 0.7 ? "severe_skew" : "hot_shard";
  } else if (tick.nextState.shardSkew > 0.3) {
    shardBalance = "mild_skew";
  }

  let primaryStatus: DatabaseMetricsSnapshot["primaryStatus"] = "healthy";
  if (cfg.failure.primaryFailed) {
    primaryStatus = cfg.failure.failoverMode === "automatic" ? "failover" : "down";
  } else if (tick.load > 1.5) {
    primaryStatus = "degraded";
  }

  const footer = buildDatabaseNodeFooter(cfg, tick, incomingQps);

  const snap: DatabaseMetricsSnapshot = {
    incomingQps,
    completedQps: tick.completedQps,
    readQps: tick.readQps,
    writeQps: tick.writeQps,
    p95LatencyMs: Math.round(tick.p95LatencyMs * 10) / 10,
    errorRate: tick.errorRate,
    activeConnections: Math.round(tick.nextState.activeConnections),
    connectionPoolUsage: Math.round(tick.connectionPoolUsage),
    cpuUtilization: Math.round(tick.cpuUtilization),
    memoryUtilization: Math.round(tick.memoryUtilization),
    diskIopsUtilization: Math.round(tick.diskIopsUtilization),
    storageUsedGb: cfg.capacity.storageUsedGb,
    storageCapacityGb: cfg.capacity.storageGb,
    replicationLagMs: Math.round(tick.nextState.replicationLagMs),
    replicationQueue: tick.nextState.replicationQueue,
    healthyNodes: tick.nextState.primaryHealthy ? totalNodes - (cfg.failure.replicaFailed ? cfg.topology.replicaCount : 0) : totalNodes - 1,
    totalNodes,
    primaryStatus,
    shardCount,
    shardBalance,
    hotShardId: tick.nextState.hotShardIndex !== null ? `Shard ${tick.nextState.hotShardIndex + 1}` : null,
    shardSkew: tick.nextState.shardSkew,
    primaryWriteLoad: Math.round(tick.writeQps),
    replicaReadLoad: Math.round(tick.readQps * (cfg.topology.replicaReadPercent / 100)),
    bottleneck: tick.bottleneck,
    warnings: tick.warnings,
    footerPrimary: footer.primary,
    footerSecondary: footer.secondary,
    shards,
  };

  if (cfg.engine === "redis") {
    snap.commandsPerSec = Math.round(tick.completedQps);
    snap.evictionsPerSec = Math.round(tick.nextState.evictionsPerSec * 10) / 10;
    snap.cacheHitRate = cfg.cacheHitRate;
    snap.memoryUsedMb = cfg.redis ? Math.round(cfg.redis.maxMemoryMb * tick.memoryUtilization / 100) : 0;
  }
  if (cfg.engine === "dynamoStyle" && cfg.dynamo) {
    snap.readCapacityUsed = Math.round((tick.readQps / (cfg.dynamo.readCapacityUnits * shardCount * 0.5)) * 100);
    snap.writeCapacityUsed = Math.round((tick.writeQps / (cfg.dynamo.writeCapacityUnits * shardCount * 0.5)) * 100);
    snap.throttledRequests = Math.round(tick.nextState.throttledQps);
    snap.hotPartitionRisk = tick.nextState.hotShardIndex !== null ? "high" : tick.load > 0.8 ? "medium" : "low";
  }
  if (cfg.engine === "elasticStyle") {
    snap.searchQueriesPerSec = Math.round(tick.readQps);
    snap.indexingRate = Math.round(tick.writeQps);
    snap.indexingBacklog = Math.max(0, Math.round(tick.writeQps * (cfg.search?.refreshIntervalSec ?? 1) * 10));
    snap.refreshLatencyMs = (cfg.search?.refreshIntervalSec ?? 1) * 1000;
  }
  if (cfg.family === "relational") {
    snap.lockWaitMs = Math.round(tick.nextState.lockWaitMs * 10) / 10;
    snap.slowQueriesPerSec = Math.round(tick.nextState.slowQueriesPerSec * 10) / 10;
    snap.bufferHitRate = tick.nextState.bufferHitRate;
  }

  return snap;
}

export function buildDatabaseNodeFooter(
  cfg: DatabaseConfig,
  tick: DatabaseTickResult | null,
  incomingQps: number,
): { primary: string; secondary: string; idle: boolean } {
  if (!tick || incomingQps <= 0) {
    return { primary: "Idle", secondary: "No active queries", idle: true };
  }

  const qpsLabel = cfg.engine === "redis"
    ? `${Math.round(tick.completedQps).toLocaleString()} commands/sec`
    : `${Math.round(tick.completedQps).toLocaleString()} queries/sec`;

  const shardCount = cfg.engine === "redis" && cfg.redis
    ? cfg.redis.clusterShards
    : cfg.topology.shardCount;

  if (shardCount > 1) {
    return {
      primary: qpsLabel,
      secondary: `${shardCount} shards · P95 ${Math.round(tick.p95LatencyMs)} ms`,
      idle: false,
    };
  }

  const replicaLabel = cfg.topology.replicaCount > 0
    ? `Primary + ${cfg.topology.replicaCount} replica${cfg.topology.replicaCount === 1 ? "" : "s"}`
    : cfg.engine === "redis" ? "In-memory cluster" : "Single primary";

  return {
    primary: qpsLabel,
    secondary: `P95 ${Math.round(tick.p95LatencyMs)} ms · ${replicaLabel}`,
    idle: false,
  };
}

export function getDatabaseHealthFromTick(tick: DatabaseTickResult): SimHealth {
  if (tick.errorRate > 0.45 || tick.load > 2.5) return "down";
  if (tick.errorRate > 0.15 || tick.load > 1.8) return "failing";
  if (tick.errorRate > 0.04 || tick.load > 0.85) return "degraded";
  return "healthy";
}
