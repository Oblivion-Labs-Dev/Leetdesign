"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Database,
  TrendingUp,
  Settings2,
  Layers,
  Cpu,
  Link2,
  Copy,
  Grid3X3,
  AlertTriangle,
  HardDrive,
  BookOpen,
} from "lucide-react";
import { useDesignStore, useSimulationStore } from "@/lib/simulator/store";
import { formatRps } from "@/lib/simulator/app-server-pool";
import {
  parseDatabaseConfig,
  databaseConfigToStorage,
  ENGINE_OPTIONS,
  engineDisplayLabel,
  computeConnectionDemand,
  deriveShardRows,
  type DatabaseFamily,
  type DatabaseEngine,
  type DatabaseConfig,
  type RequestMix,
} from "@/lib/simulator/database-model";
import { cn } from "@/lib/utils";
import {
  InspectorPanel,
  InspectorHeader,
  InspectorScrollBody,
  InspectorSection,
  InspectorSubCard,
  InspectorCollapsible,
  InspectorMetricsScrollTable,
  InspectorNameField,
  InspectorRemoveFooter,
  METRICS_TABLE_MIN_WIDTH,
} from "./inspector-panel";
import {
  InspectorViewModeTabs,
  InspectorBasicsPanel,
  useInspectorViewModeForNode,
} from "./inspector-basics-advanced";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";

const MIX_LABELS: Record<keyof RequestMix, string> = {
  primaryKeyRead: "Primary key reads",
  indexedLookup: "Indexed lookups",
  write: "Writes",
  rangeQuery: "Range queries",
  joinHeavy: "Join-heavy queries",
  aggregation: "Aggregation-heavy",
  fullScan: "Full table scans",
  fullText: "Full-text search",
};

function Field({
  label,
  helper,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  helper?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-[var(--clay-text-muted)]">{label}</label>
      {helper && <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--clay-text-subtle)]">{helper}</p>}
      <div className="mt-1 flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2 py-1 text-xs font-mono tabular-nums focus:border-[var(--clay-primary)] focus:outline-none"
        />
        {unit && <span className="shrink-0 text-[9px] text-[var(--clay-text-subtle)]">{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({
  label,
  helper,
  value,
  options,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-[var(--clay-text-muted)]">{label}</label>
      {helper && <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--clay-text-subtle)]">{helper}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="text-[10px] font-medium text-[var(--clay-text-muted)]">{label}</span>
        {helper && <p className="text-[9px] leading-relaxed text-[var(--clay-text-subtle)]">{helper}</p>}
      </span>
    </label>
  );
}

function MetricTile({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)]/80 px-2 py-1.5">
      <div className="text-[8px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">{label}</div>
      <div className={cn("mt-0.5 font-mono text-[11px] tabular-nums", warn ? "text-rose-500" : "text-[var(--clay-text)]")}>
        {value}
      </div>
    </div>
  );
}

export function DatabaseConfigInspector({ embedded = false }: { embedded?: boolean }) {
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const design = useDesignStore((s) => s.design);
  const clearSelection = useDesignStore((s) => s.clearSelection);
  const mergeNodeConfig = useDesignStore((s) => s.mergeNodeConfig);
  const updateNodeConfig = useDesignStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useDesignStore((s) => s.updateNodeLabel);
  const removeNode = useDesignStore((s) => s.removeNode);
  const running = useSimulationStore((s) => s.running);
  const metrics = useSimulationStore((s) =>
    selectedNodeId ? s.metrics[selectedNodeId] : undefined,
  );

  const [showShards, setShowShards] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [showWorkload, setShowWorkload] = useState(true);
  const [showTopology, setShowTopology] = useState(true);
  const [showReplication, setShowReplication] = useState(false);
  const [showSharding, setShowSharding] = useState(false);
  const [showIndexes, setShowIndexes] = useState(false);
  const [showConsistency, setShowConsistency] = useState(false);
  const [showRedis, setShowRedis] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [showStorage, setShowStorage] = useState(false);

  const { mode, setMode } = useInspectorViewModeForNode(selectedNodeId);

  useEffect(() => {
    setShowShards(false);
  }, [selectedNodeId]);

  const node = design?.nodes.find(
    (n) => n.id === selectedNodeId && (
      n.type === "sql_database" || n.type === "nosql_database"
      || n.type === "search_index" || n.type === "redis_cache"
    ),
  );

  const cfg = useMemo(
    () => parseDatabaseConfig(node?.type ?? "sql_database", node?.config ?? {}),
    [node?.type, node?.config],
  );

  const dbMetrics = metrics?.databaseMetrics;
  const showLive = running && !!metrics;
  const connDemand = useMemo(
    () => (design && node ? computeConnectionDemand(design, node.id) : null),
    [design, node],
  );

  const patch = (partial: Partial<DatabaseConfig> & {
    family?: DatabaseFamily;
    engine?: DatabaseEngine;
    topology?: Partial<DatabaseConfig["topology"]>;
    capacity?: Partial<DatabaseConfig["capacity"]>;
    workload?: Partial<DatabaseConfig["workload"]>;
    indexes?: Partial<DatabaseConfig["indexes"]>;
    connections?: Partial<DatabaseConfig["connections"]>;
    consistency?: Partial<DatabaseConfig["consistency"]>;
    failure?: Partial<DatabaseConfig["failure"]>;
    redis?: Partial<NonNullable<DatabaseConfig["redis"]>>;
    dynamo?: Partial<NonNullable<DatabaseConfig["dynamo"]>>;
    search?: Partial<NonNullable<DatabaseConfig["search"]>>;
  }) => {
    if (!node) return;
    const next: DatabaseConfig = {
      ...cfg,
      ...partial,
      topology: { ...cfg.topology, ...partial.topology },
      capacity: { ...cfg.capacity, ...partial.capacity },
      workload: { ...cfg.workload, ...partial.workload },
      indexes: { ...cfg.indexes, ...partial.indexes },
      connections: { ...cfg.connections, ...partial.connections },
      consistency: { ...cfg.consistency, ...partial.consistency },
      failure: { ...cfg.failure, ...partial.failure },
      redis: cfg.redis ? { ...cfg.redis, ...partial.redis } : cfg.redis,
      dynamo: cfg.dynamo ? { ...cfg.dynamo, ...partial.dynamo } : cfg.dynamo,
      search: cfg.search ? { ...cfg.search, ...partial.search } : cfg.search,
    };
    mergeNodeConfig(node.id, databaseConfigToStorage(next));
  };

  const patchMix = (key: keyof RequestMix, value: number) => {
    patch({ workload: { ...cfg.workload, requestMix: { ...cfg.workload.requestMix, [key]: value } } });
  };

  if (!node) return null;

  const def = COMPONENT_REGISTRY[node.type];
  const isSql = cfg.family === "relational";
  const isRedis = cfg.engine === "redis";
  const isDynamo = cfg.engine === "dynamoStyle";
  const isSearch = cfg.engine === "elasticStyle";
  const isDocument = cfg.engine === "mongoStyle";
  const shardRows = deriveShardRows(cfg, null, dbMetrics?.incomingQps ?? 0);
  const mixTotal = Object.values(cfg.workload.requestMix).reduce((a, b) => a + b, 0);

  return (
    <InspectorPanel
      embedded={embedded}
      footer={<InspectorRemoveFooter onRemove={() => { removeNode(node.id); clearSelection(); }} />}
    >
      <InspectorHeader
        icon={Database}
        iconClassName="bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600"
        title={node.label || def.label}
        badge="Data Layer"
        badgeClassName="bg-amber-500/20 text-amber-700 border-transparent"
        onClose={clearSelection}
      />

      <InspectorScrollBody>
        <InspectorNameField value={node.label} onChange={(v) => updateNodeLabel(node.id, v)} />
        <InspectorViewModeTabs mode={mode} onChange={setMode} />

        {mode === "basics" ? (
          <>
            <InspectorSection
              icon={TrendingUp}
              title="Live status"
              subtitle={showLive ? "Key metrics at a glance." : "Start simulation to see metrics."}
              trailing={
                metrics && (
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                    metrics.health === "healthy" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-700",
                    metrics.health === "degraded" && "border-amber-400/30 bg-amber-500/10 text-amber-700",
                    metrics.health === "failing" && "border-rose-400/30 bg-rose-500/10 text-rose-600",
                    metrics.health === "down" && "border-rose-500/30 bg-rose-600/10 text-rose-700",
                  )}>
                    {metrics.health}
                  </span>
                )
              }
            >
              {showLive && dbMetrics ? (
                <div className="grid grid-cols-2 gap-2">
                  <MetricTile label="Queries/sec" value={formatRps(dbMetrics.completedQps ?? 0, 1)} />
                  <MetricTile label="P95 Latency" value={`${dbMetrics.p95LatencyMs ?? metrics?.p95LatencyMs ?? 0} ms`} />
                  <MetricTile label="Load" value={`${dbMetrics.cpuUtilization ?? 0}% CPU`} warn={(dbMetrics.cpuUtilization ?? 0) > 80} />
                  <MetricTile label="Errors" value={`${((dbMetrics.errorRate ?? 0) * 100).toFixed(1)}%`} warn={(dbMetrics.errorRate ?? 0) > 0.05} />
                </div>
              ) : (
                <p className="text-[11px] text-[var(--clay-text-muted)]">Idle — no active queries.</p>
              )}
            </InspectorSection>

            <InspectorBasicsPanel
              node={node}
              design={design!}
              metrics={metrics}
              mergeNodeConfig={mergeNodeConfig}
              updateNodeConfig={updateNodeConfig}
              onSwitchAdvanced={() => setMode("advanced")}
            >
              <InspectorSection title="Simple scaling" subtitle="The most common fixes for too many requests.">
                {!isRedis && (
                  <>
                    <Field
                      label="Read replicas"
                      helper="Copy of the database that handles read traffic."
                      value={cfg.topology.replicaCount}
                      min={0}
                      max={10}
                      onChange={(v) => patch({ topology: { ...cfg.topology, replicaCount: v } })}
                    />
                    <Field
                      label="Max connections"
                      helper="How many app connections this database accepts."
                      value={cfg.capacity.maxConnections}
                      min={50}
                      max={10000}
                      onChange={(v) => patch({ capacity: { ...cfg.capacity, maxConnections: v } })}
                    />
                  </>
                )}
                <Field
                  label="CPU power"
                  helper="More CPU helps when queries are slow under load."
                  value={cfg.capacity.cpuUnits}
                  min={1}
                  max={64}
                  onChange={(v) => patch({ capacity: { ...cfg.capacity, cpuUnits: v } })}
                />
                {isRedis && cfg.redis && (
                  <Field
                    label="Memory (MB)"
                    value={cfg.redis.maxMemoryMb}
                    min={256}
                    max={65536}
                    onChange={(v) => patch({ redis: { ...cfg.redis!, maxMemoryMb: v } })}
                  />
                )}
              </InspectorSection>
            </InspectorBasicsPanel>
          </>
        ) : (
          <>
        <InspectorSection icon={Database} title="Database Type" subtitle="Engine determines scaling, consistency, and indexing behavior.">
          <SelectField
            label="Database Family"
            value={cfg.family}
            options={Object.keys(ENGINE_OPTIONS).map((f) => ({
              value: f,
              label: f === "keyValue" ? "Key Value" : f === "wideColumn" ? "Wide Column" : f.charAt(0).toUpperCase() + f.slice(1),
            }))}
            onChange={(v) => {
              const family = v as DatabaseFamily;
              const engine = ENGINE_OPTIONS[family][0]?.value ?? cfg.engine;
              patch({ family, engine });
            }}
          />
          <SelectField
            label="Database Engine"
            value={cfg.engine}
            options={ENGINE_OPTIONS[cfg.family] ?? ENGINE_OPTIONS.relational}
            onChange={(v) => patch({ engine: v as DatabaseEngine })}
          />
          <p className="text-[10px] text-[var(--clay-text-muted)]">
            Active engine: <span className="font-medium">{engineDisplayLabel(cfg.engine)}</span>
          </p>
        </InspectorSection>

        <InspectorSection
          icon={TrendingUp}
          title="Live Database Health"
          subtitle={showLive ? "Real-time cluster metrics." : "Start simulation for live metrics."}
          trailing={
            metrics && (
              <span className={cn(
                "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
                metrics.health === "healthy" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-700",
                metrics.health === "degraded" && "border-amber-400/30 bg-amber-500/10 text-amber-700",
                metrics.health === "failing" && "border-rose-400/30 bg-rose-500/10 text-rose-600",
                metrics.health === "down" && "border-rose-500/30 bg-rose-600/10 text-rose-700",
              )}>
                {metrics.health}
              </span>
            )
          }
        >
          {!showLive ? (
            <p className="text-[11px] text-[var(--clay-text-muted)]">Idle — no active queries.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <MetricTile label="Incoming QPS" value={formatRps(dbMetrics?.incomingQps ?? metrics.currentRps, 1)} />
                <MetricTile label="Completed QPS" value={formatRps(dbMetrics?.completedQps ?? 0, 1)} />
                <MetricTile label="Read QPS" value={formatRps(dbMetrics?.readQps ?? 0, 1)} />
                <MetricTile label="Write QPS" value={formatRps(dbMetrics?.writeQps ?? 0, 1)} />
                <MetricTile label="P95 Latency" value={`${dbMetrics?.p95LatencyMs ?? metrics.p95LatencyMs} ms`} />
                <MetricTile label="Error Rate" value={`${((dbMetrics?.errorRate ?? metrics.errorRate) * 100).toFixed(1)}%`} warn={(dbMetrics?.errorRate ?? 0) > 0.05} />
                <MetricTile label="Active Connections" value={String(dbMetrics?.activeConnections ?? metrics.activeConnections)} />
                <MetricTile label="Pool Usage" value={`${dbMetrics?.connectionPoolUsage ?? 0}%`} warn={(dbMetrics?.connectionPoolUsage ?? 0) > 85} />
                <MetricTile label="CPU" value={`${dbMetrics?.cpuUtilization ?? metrics.cpuPercent}%`} />
                <MetricTile label="Memory" value={`${dbMetrics?.memoryUtilization ?? metrics.memoryPercent}%`} />
                {!isRedis && (
                  <MetricTile label="Disk IOPS" value={`${dbMetrics?.diskIopsUtilization ?? 0}%`} />
                )}
                <MetricTile label="Replication Lag" value={`${dbMetrics?.replicationLagMs ?? 0} ms`} />
              </div>

              {isRedis && dbMetrics && (
                <InspectorSubCard title="Redis Metrics">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricTile label="Commands/sec" value={formatRps(dbMetrics.commandsPerSec ?? 0, 1)} />
                    <MetricTile label="Hit Rate" value={`${((dbMetrics.cacheHitRate ?? 0) * 100).toFixed(0)}%`} />
                    <MetricTile label="Evictions/sec" value={String(dbMetrics.evictionsPerSec ?? 0)} />
                    <MetricTile label="Memory Used" value={`${dbMetrics.memoryUsedMb ?? 0} MB`} />
                  </div>
                </InspectorSubCard>
              )}

              {isDynamo && dbMetrics && (
                <InspectorSubCard title="Capacity Metrics">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricTile label="Read Capacity" value={`${dbMetrics.readCapacityUsed ?? 0}%`} warn={(dbMetrics.readCapacityUsed ?? 0) > 80} />
                    <MetricTile label="Write Capacity" value={`${dbMetrics.writeCapacityUsed ?? 0}%`} warn={(dbMetrics.writeCapacityUsed ?? 0) > 80} />
                    <MetricTile label="Throttled" value={formatRps(dbMetrics.throttledRequests ?? 0, 1)} />
                    <MetricTile label="Hot Partition" value={dbMetrics.hotPartitionRisk ?? "low"} warn={dbMetrics.hotPartitionRisk === "high"} />
                  </div>
                </InspectorSubCard>
              )}

              {isSearch && dbMetrics && (
                <InspectorSubCard title="Search Metrics">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricTile label="Search QPS" value={formatRps(dbMetrics.searchQueriesPerSec ?? 0, 1)} />
                    <MetricTile label="Indexing Rate" value={formatRps(dbMetrics.indexingRate ?? 0, 1)} />
                    <MetricTile label="Index Backlog" value={String(dbMetrics.indexingBacklog ?? 0)} />
                    <MetricTile label="Refresh Latency" value={`${dbMetrics.refreshLatencyMs ?? 0} ms`} />
                  </div>
                </InspectorSubCard>
              )}

              {isSql && dbMetrics && (
                <InspectorSubCard title="SQL Metrics">
                  <div className="grid grid-cols-2 gap-2">
                    <MetricTile label="Lock Wait" value={`${dbMetrics.lockWaitMs ?? 0} ms`} />
                    <MetricTile label="Slow Queries/sec" value={String(dbMetrics.slowQueriesPerSec ?? 0)} />
                    <MetricTile label="Buffer Hit Rate" value={`${((dbMetrics.bufferHitRate ?? 0) * 100).toFixed(0)}%`} />
                    <MetricTile label="Primary Status" value={dbMetrics.primaryStatus} />
                  </div>
                </InspectorSubCard>
              )}

              {dbMetrics && dbMetrics.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-500/8 px-2.5 py-2">
                  <div className="flex items-center gap-1 text-[9px] font-semibold uppercase text-amber-700">
                    <AlertTriangle className="h-3 w-3" /> Warnings
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {dbMetrics.warnings.map((w, i) => (
                      <li key={i} className="text-[10px] leading-relaxed text-amber-800">{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </InspectorSection>

        <InspectorCollapsible title="Workload Profile" open={showWorkload} onToggle={() => setShowWorkload(!showWorkload)} hint="Read/write mix and query complexity drive resource costs.">
          <Field label="Read %" value={cfg.workload.readPercent} min={0} max={100} unit="%" onChange={(v) => patch({ workload: { ...cfg.workload, readPercent: v, writePercent: 100 - v } })} />
          <Field label="Write %" value={cfg.workload.writePercent} min={0} max={100} unit="%" onChange={(v) => patch({ workload: { ...cfg.workload, writePercent: v, readPercent: 100 - v } })} />
          <InspectorSubCard title="Request Mix">
            {(Object.keys(MIX_LABELS) as (keyof RequestMix)[]).map((key) => (
              <Field
                key={key}
                label={MIX_LABELS[key]}
                value={cfg.workload.requestMix[key]}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => patchMix(key, v)}
              />
            ))}
            <p className={cn("mt-1 text-[9px] font-mono", mixTotal === 100 ? "text-emerald-600" : "text-amber-600")}>
              Total: {mixTotal}% {mixTotal !== 100 && "(should equal 100%)"}
            </p>
          </InspectorSubCard>
          {isSql && (
            <>
              <SelectField label="Transaction Size" value={cfg.workload.transactionSize} options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} onChange={(v) => patch({ workload: { ...cfg.workload, transactionSize: v as DatabaseConfig["workload"]["transactionSize"] } })} />
              <SelectField label="Lock Contention Risk" value={cfg.workload.lockContention} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} onChange={(v) => patch({ workload: { ...cfg.workload, lockContention: v as DatabaseConfig["workload"]["lockContention"] } })} />
            </>
          )}
        </InspectorCollapsible>

        <InspectorCollapsible title="Cluster Topology" open={showTopology} onToggle={() => setShowTopology(!showTopology)}>
          {!isRedis && (
            <>
              <Field label="Primary Count" value={cfg.topology.primaryCount} min={1} max={3} onChange={(v) => patch({ topology: { ...cfg.topology, primaryCount: v } })} />
              <Field label="Read Replica Count" value={cfg.topology.replicaCount} min={0} max={20} onChange={(v) => patch({ topology: { ...cfg.topology, replicaCount: v } })} />
              {cfg.topology.replicaCount > 0 && (
                <>
                  <SelectField label="Read Routing" value={cfg.topology.readRouting} options={[{ value: "primaryOnly", label: "Primary only" }, { value: "preferReplicas", label: "Prefer replicas" }, { value: "replicaOnly", label: "Replica only" }]} onChange={(v) => patch({ topology: { ...cfg.topology, readRouting: v as DatabaseConfig["topology"]["readRouting"] } })} />
                  <Field label="Replica Read %" value={cfg.topology.replicaReadPercent} min={0} max={100} unit="%" onChange={(v) => patch({ topology: { ...cfg.topology, replicaReadPercent: v } })} />
                  <Field label="Read-After-Write Window" helper="Recent writes may require reads on primary until replicas catch up." value={cfg.topology.readAfterWriteWindowSec} min={0} max={60} unit="sec" onChange={(v) => patch({ topology: { ...cfg.topology, readAfterWriteWindowSec: v } })} />
                </>
              )}
            </>
          )}
          {isRedis && cfg.redis && (
            <Field label="Cluster Shards" value={cfg.redis.clusterShards} min={1} max={64} onChange={(v) => patch({ redis: { ...cfg.redis!, clusterShards: v } })} />
          )}
        </InspectorCollapsible>

        <InspectorSection icon={Cpu} title="Capacity & Performance" subtitle="Throughput is derived from CPU, memory, disk, and connections — not a direct knob.">
          <div className="grid grid-cols-2 gap-2">
            <Field label="CPU Units" value={cfg.capacity.cpuUnits} min={1} max={128} onChange={(v) => patch({ capacity: { ...cfg.capacity, cpuUnits: v } })} />
            <Field label="Memory" value={cfg.capacity.memoryGb} min={1} max={1024} unit="GB" onChange={(v) => patch({ capacity: { ...cfg.capacity, memoryGb: v } })} />
            {!isRedis && (
              <>
                <Field label="Storage" value={cfg.capacity.storageGb} min={10} max={100_000} unit="GB" onChange={(v) => patch({ capacity: { ...cfg.capacity, storageGb: v } })} />
                <Field label="Storage Used" value={cfg.capacity.storageUsedGb} min={0} max={cfg.capacity.storageGb} unit="GB" onChange={(v) => patch({ capacity: { ...cfg.capacity, storageUsedGb: v } })} />
                <Field label="Disk IOPS" value={cfg.capacity.diskIops} min={100} max={500_000} onChange={(v) => patch({ capacity: { ...cfg.capacity, diskIops: v } })} />
              </>
            )}
            <Field label="Max Connections" value={cfg.capacity.maxConnections} min={10} max={50_000} onChange={(v) => patch({ capacity: { ...cfg.capacity, maxConnections: v } })} />
            <Field label="Buffer Cache" value={cfg.capacity.bufferCacheGb} min={0} max={cfg.capacity.memoryGb} unit="GB" onChange={(v) => patch({ capacity: { ...cfg.capacity, bufferCacheGb: v } })} />
          </div>
          {showLive && dbMetrics && (
            <p className="text-[10px] text-[var(--clay-text-muted)]">
              Current bottleneck: <span className="font-medium uppercase">{dbMetrics.bottleneck}</span>
            </p>
          )}
          {isRedis && cfg.redis && (
            <Field label="Max Memory" value={cfg.redis.maxMemoryMb} min={64} max={524_288} unit="MB" onChange={(v) => patch({ redis: { ...cfg.redis!, maxMemoryMb: v } })} />
          )}
          {isDynamo && cfg.dynamo && (
            <>
              <SelectField label="Capacity Mode" value={cfg.dynamo.capacityMode} options={[{ value: "provisioned", label: "Provisioned" }, { value: "onDemand", label: "On-Demand" }]} onChange={(v) => patch({ dynamo: { ...cfg.dynamo!, capacityMode: v as "provisioned" | "onDemand" } })} />
              <Field label="Read Capacity Units" value={cfg.dynamo.readCapacityUnits} min={1} max={100_000} onChange={(v) => patch({ dynamo: { ...cfg.dynamo!, readCapacityUnits: v } })} />
              <Field label="Write Capacity Units" value={cfg.dynamo.writeCapacityUnits} min={1} max={100_000} onChange={(v) => patch({ dynamo: { ...cfg.dynamo!, writeCapacityUnits: v } })} />
            </>
          )}
        </InspectorSection>

        <InspectorSection icon={Link2} title="Connection Management" subtitle="App-server pools compete for database connection slots.">
          <ToggleField label="Connection Pooling Enabled" checked={cfg.connections.poolingEnabled} onChange={(v) => patch({ connections: { ...cfg.connections, poolingEnabled: v } })} />
          <Field label="Pool Size Per App Instance" value={cfg.connections.poolSizePerAppInstance} min={1} max={200} onChange={(v) => patch({ connections: { ...cfg.connections, poolSizePerAppInstance: v } })} />
          <Field label="Acquisition Timeout" value={cfg.connections.acquisitionTimeoutMs} min={50} max={10_000} unit="ms" onChange={(v) => patch({ connections: { ...cfg.connections, acquisitionTimeoutMs: v } })} />
          {connDemand && connDemand.appInstanceCount > 0 && (
            <InspectorSubCard title="Connection Demand">
              <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
                {connDemand.appInstanceCount} app instances × pools ≈{" "}
                <span className={cn("font-mono font-semibold", connDemand.exceedsLimit ? "text-rose-500" : "text-[var(--clay-text)]")}>
                  {connDemand.demandedConnections}
                </span>
                {" "}connections demanded (limit: {connDemand.maxConnections})
              </p>
              {connDemand.exceedsLimit && (
                <p className="mt-1 text-[10px] text-rose-600">
                  Configured pools exceed database connection capacity — expect queueing and timeouts upstream.
                </p>
              )}
            </InspectorSubCard>
          )}
        </InspectorSection>

        {!isRedis && (
          <InspectorCollapsible title="Replication" open={showReplication} onToggle={() => setShowReplication(!showReplication)}>
            <SelectField label="Replication Mode" value={cfg.topology.replicationMode} options={[{ value: "none", label: "None" }, { value: "async", label: "Asynchronous" }, { value: "semiSync", label: "Semi-synchronous" }, { value: "sync", label: "Synchronous" }]} onChange={(v) => patch({ topology: { ...cfg.topology, replicationMode: v as DatabaseConfig["topology"]["replicationMode"] } })} />
            <p className="text-[10px] leading-relaxed text-[var(--clay-text-muted)]">
              Async: lower write latency, replicas may lag. Sync: higher write latency, stronger durability.
            </p>
            {showLive && dbMetrics && (
              <div className="grid grid-cols-2 gap-2">
                <MetricTile label="Replication Lag" value={`${dbMetrics.replicationLagMs} ms`} />
                <MetricTile label="Replication Queue" value={String(dbMetrics.replicationQueue)} />
                <MetricTile label="Replica Health" value={`${dbMetrics.healthyNodes - 1} / ${cfg.topology.replicaCount}`} />
              </div>
            )}
          </InspectorCollapsible>
        )}

        {(isSql || isDocument || isDynamo || isSearch) && (
          <InspectorCollapsible title="Partitioning / Sharding" open={showSharding} onToggle={() => setShowSharding(!showSharding)}>
            <SelectField label="Distribution Mode" value={cfg.topology.distributionMode} options={[{ value: "single", label: "Single database" }, { value: "hashShard", label: "Hash sharding" }, { value: "rangeShard", label: "Range sharding" }, { value: "tenantShard", label: "Tenant sharding" }, { value: "geoShard", label: "Geographic sharding" }]} onChange={(v) => patch({ topology: { ...cfg.topology, distributionMode: v as DatabaseConfig["topology"]["distributionMode"] } })} />
            <Field label="Shard Count" value={cfg.topology.shardCount} min={1} max={256} onChange={(v) => patch({ topology: { ...cfg.topology, shardCount: v } })} />
            <div>
              <label className="text-[10px] font-medium text-[var(--clay-text-muted)]">Sharding Key</label>
              <input
                value={cfg.topology.shardingKey}
                onChange={(e) => patch({ topology: { ...cfg.topology, shardingKey: e.target.value } })}
                className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-2 py-1 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
                placeholder="e.g. userId, tenantId"
              />
            </div>
            <SelectField label="Hot Partition Simulation" value={cfg.topology.hotPartitionLevel} options={[{ value: "none", label: "Even distribution" }, { value: "mild", label: "Mildly skewed" }, { value: "severe", label: "Hot shard (90% on one key)" }]} onChange={(v) => patch({ topology: { ...cfg.topology, hotPartitionLevel: v as DatabaseConfig["topology"]["hotPartitionLevel"] } })} />
            {showLive && dbMetrics && dbMetrics.shardCount > 1 && (
              <>
                <p className="text-[10px] text-[var(--clay-text-muted)]">
                  Shard balance: <span className="font-medium">{dbMetrics.shardBalance.replace(/_/g, " ")}</span>
                  {dbMetrics.hotShardId && ` · ${dbMetrics.hotShardId} overloaded`}
                </p>
                <button type="button" onClick={() => setShowShards(!showShards)} className="text-[10px] font-medium text-[var(--clay-primary)]">
                  {showShards ? "Hide shards" : "Inspect shards"}
                </button>
                {showShards && (
                  <InspectorMetricsScrollTable
                    minWidth={METRICS_TABLE_MIN_WIDTH}
                    columns={[
                      { key: "shard", label: "Shard", align: "left" },
                      { key: "qps", label: "Incoming QPS", align: "right" },
                      { key: "cpu", label: "CPU", align: "right" },
                      { key: "p95", label: "P95", align: "right" },
                      { key: "status", label: "Status", align: "right" },
                    ]}
                    rows={(dbMetrics.shards.length > 0 ? dbMetrics.shards : shardRows).map((s) => ({
                      key: String(s.index),
                      cells: {
                        shard: s.name,
                        qps: showLive ? formatRps(s.incomingQps, 1) : "—",
                        cpu: showLive ? `${Math.round(s.cpuPercent)}%` : "—",
                        p95: showLive ? `${Math.round(s.p95LatencyMs)} ms` : "—",
                        status: s.status,
                      },
                    }))}
                  />
                )}
              </>
            )}
          </InspectorCollapsible>
        )}

        {(isSql || isDocument) && (
          <InspectorCollapsible title="Indexes" open={showIndexes} onToggle={() => setShowIndexes(!showIndexes)}>
            <ToggleField label="Primary Key Index" checked={cfg.indexes.primaryKey} onChange={(v) => patch({ indexes: { ...cfg.indexes, primaryKey: v } })} />
            <Field label="Secondary Indexes" value={cfg.indexes.secondaryIndexes} min={0} max={50} onChange={(v) => patch({ indexes: { ...cfg.indexes, secondaryIndexes: v } })} />
            <Field label="Composite Indexes" value={cfg.indexes.compositeIndexes} min={0} max={20} onChange={(v) => patch({ indexes: { ...cfg.indexes, compositeIndexes: v } })} />
            <p className="text-[10px] text-[var(--clay-text-muted)]">
              Indexes speed reads but increase write cost and storage. Missing indexes cause full scans.
            </p>
          </InspectorCollapsible>
        )}

        <InspectorCollapsible title="Consistency & Durability" open={showConsistency} onToggle={() => setShowConsistency(!showConsistency)}>
          {isSql && (
            <SelectField label="Isolation Level" value={cfg.consistency.isolationLevel} options={[{ value: "readCommitted", label: "Read Committed" }, { value: "repeatableRead", label: "Repeatable Read" }, { value: "serializable", label: "Serializable" }, { value: "eventual", label: "Read Uncommitted" }]} onChange={(v) => patch({ consistency: { ...cfg.consistency, isolationLevel: v as DatabaseConfig["consistency"]["isolationLevel"] } })} />
          )}
          <SelectField label="Durability Mode" value={cfg.consistency.durabilityMode} options={[{ value: "relaxed", label: "Relaxed" }, { value: "standard", label: "Standard" }, { value: "strict", label: "Strict" }]} onChange={(v) => patch({ consistency: { ...cfg.consistency, durabilityMode: v as DatabaseConfig["consistency"]["durabilityMode"] } })} />
          {(isDynamo || isRedis) && (
            <SelectField label="Read Consistency" value={cfg.consistency.distributedConsistency} options={[{ value: "eventual", label: "Eventual" }, { value: "strong", label: "Strong" }]} onChange={(v) => patch({ consistency: { ...cfg.consistency, distributedConsistency: v as "eventual" | "strong" } })} />
          )}
          <Field label="Cache / Buffer Hit Rate" value={Math.round(cfg.cacheHitRate * 100)} min={0} max={99} unit="%" onChange={(v) => patch({ cacheHitRate: v / 100 })} />
        </InspectorCollapsible>

        {isRedis && cfg.redis && (
          <InspectorCollapsible title="Redis Settings" open={showRedis} onToggle={() => setShowRedis(!showRedis)}>
            <SelectField label="Eviction Policy" value={cfg.redis.evictionPolicy} options={[{ value: "lru", label: "LRU" }, { value: "lfu", label: "LFU" }, { value: "random", label: "Random" }, { value: "ttl", label: "TTL-based" }]} onChange={(v) => patch({ redis: { ...cfg.redis!, evictionPolicy: v as "lru" | "lfu" | "random" | "ttl" } })} />
            <ToggleField label="Persistence Enabled" checked={cfg.redis.persistenceEnabled} onChange={(v) => patch({ redis: { ...cfg.redis!, persistenceEnabled: v } })} />
            <Field label="Default TTL" value={cfg.redis.defaultTtlSec} min={1} max={86_400} unit="sec" onChange={(v) => patch({ redis: { ...cfg.redis!, defaultTtlSec: v } })} />
          </InspectorCollapsible>
        )}

        <InspectorCollapsible title="Failure Simulation" open={showFailure} onToggle={() => setShowFailure(!showFailure)}>
          <ToggleField label="Primary Failure" checked={cfg.failure.primaryFailed} onChange={(v) => patch({ failure: { ...cfg.failure, primaryFailed: v } })} />
          <ToggleField label="Replica Failure" checked={cfg.failure.replicaFailed} onChange={(v) => patch({ failure: { ...cfg.failure, replicaFailed: v } })} />
          <ToggleField label="Shard Failure" checked={cfg.failure.shardFailed} onChange={(v) => patch({ failure: { ...cfg.failure, shardFailed: v } })} />
          <ToggleField label="Disk Saturation" checked={cfg.failure.diskSaturated} onChange={(v) => patch({ failure: { ...cfg.failure, diskSaturated: v } })} />
          <ToggleField label="Network Partition" checked={cfg.failure.networkPartition} onChange={(v) => patch({ failure: { ...cfg.failure, networkPartition: v } })} />
          <SelectField label="Failover Mode" value={cfg.failure.failoverMode} options={[{ value: "manual", label: "Manual" }, { value: "automatic", label: "Automatic" }]} onChange={(v) => patch({ failure: { ...cfg.failure, failoverMode: v as DatabaseConfig["failure"]["failoverMode"] } })} />
        </InspectorCollapsible>

        <InspectorCollapsible title="Storage" open={showStorage} onToggle={() => setShowStorage(!showStorage)}>
          {!isRedis && (
            <>
              <Field label="Storage Capacity" value={cfg.capacity.storageGb} min={10} max={100_000} unit="GB" onChange={(v) => patch({ capacity: { ...cfg.capacity, storageGb: v } })} />
              <Field label="Storage Used" value={cfg.capacity.storageUsedGb} min={0} max={cfg.capacity.storageGb} unit="GB" onChange={(v) => patch({ capacity: { ...cfg.capacity, storageUsedGb: v } })} />
              <p className="text-[10px] text-[var(--clay-text-muted)]">
                Storage full behavior: writes rejected or throttled. Auto-scaling storage does not fix hot partitions.
              </p>
            </>
          )}
        </InspectorCollapsible>

        <InspectorCollapsible title="What This Represents" open={showLearn} onToggle={() => setShowLearn(!showLearn)}>
          <p className="text-xs leading-relaxed text-[var(--clay-text-muted)]">{def.explain}</p>
          <InspectorSubCard title="Think of it like...">
            <p className="text-[11px] italic leading-relaxed text-[var(--clay-text-muted)]">&quot;{def.analogy}&quot;</p>
          </InspectorSubCard>
          <p className="text-[11px] text-[var(--clay-text-muted)]">{def.description}</p>
        </InspectorCollapsible>
          </>
        )}
      </InspectorScrollBody>
    </InspectorPanel>
  );
}
