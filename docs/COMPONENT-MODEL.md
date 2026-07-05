# Component model

How components are defined, configured, and simulated. Work through **one component at a time** for teaching quality; Client is documented first.

**Source of truth:** `web/src/lib/simulator/component-registry.ts`

---

## ComponentDef structure

Each type in `COMPONENT_REGISTRY` includes:

| Field | Purpose |
|-------|---------|
| `type`, `label`, `category`, `description` | Identity + palette grouping |
| `configFields` / `defaultConfig` | Inspector sliders and defaults |
| `routingBehavior` | Engine forwarding model — see [SIMULATOR.md](./SIMULATOR.md) |
| `layer` | Visual/organizational (`ArchLayer`) — **not** used as primary validation |
| `isTrafficSource` | Only `client` today |
| `explain`, `analogy`, `whenToUse`, `tradeoffs` | Teaching copy in UI |

Categories: `core`, `storage`, `caching`, `messaging`, `infrastructure`, `observability`.

---

## Client (`client`)

**Role:** `origin` · **Routing:** `source` · **Panel:** `client-config-inspector.tsx`

End-user demand source — browsers, mobile apps, integrations.

### Mental model

```
Active Users × Requests per User per Second = Requests Per Second
```

Example: 1,000 × 0.2 = **200 RPS** → injected into simulation.

### Config (stored on `node.config`)

| Field | Purpose |
|-------|---------|
| `activeUsers` | Users actively using the product now |
| `requestsPerUserPerSecond` | Activity rate (presets: 0.2 / 0.5 / 1 / 2) |
| `userActivityPreset` | browsing / normal / highly_active / power / custom |
| `trafficPattern` | constant / ramp / burst / dailyPeak / flashSale |
| `rpsOverrideEnabled` + `manualRpsOverride` | Advanced: bypass formula |
| `requestMixReads/Writes/Searches` | Advanced: must total 100% |
| `retryStrategy` | none / conservative / aggressive — amplifies traffic on failures |

Logic: `web/src/lib/simulator/client-traffic.ts`

### Live panel: "Live Experience" (not server telemetry)

- Outgoing Requests, Avg/P95 Response Time, Failed Requests
- Latency/error derived from **downstream path** via `computeClientExperience()` — Client does not invent its own latency

### Backward compatibility

Legacy `requestsPerSecond` + `concurrentUsers` migrated in `parseClientConfig()`.

### Guided insights

`client-insights.ts` — pressure → symptom → suggestion at 70/90/100% downstream utilization.

---

## Application Server (`app_server`)

**Role:** `compute` · **Routing:** `passthrough` · **Panel:** `application-server-config-inspector.tsx`

Backend service: admission → queue → compute → downstream calls → response.

### Service capacity (node config)

| Field | Default | Purpose |
|-------|---------|---------|
| `instanceCount` | 1 | Deployed copies |
| `maxConcurrentRequestsPerInstance` | 200 | Active processing slots |
| `applicationComputeTimeMs` | 20 | App logic only (excludes I/O waits) |
| `responseDeadlineMs` | 3000 | Timeout deadline |
| `maxWaitingQueue` | 1000 | Queue when slots full |
| `queueFullBehavior` | reject | reject / drop_oldest / drop_newest |

Logic: `web/src/lib/simulator/app-server-model.ts`

### Derived capacity (read-only, not configurable)

```
effectiveRequestTimeMs =
  applicationComputeTimeMs
  + synchronousDependencyLatencyMs
  + retryDelayMs
  + queuePublishBlockingTimeMs

capacityPerInstanceRps = maxConcurrent / (effectiveRequestTimeMs / 1000)
totalCapacityRps = effectiveInstanceCount × capacityPerInstanceRps
```

Capacity **changes dynamically** when downstream latency changes.

Without upstream Load Balancer / Reverse Proxy / API Gateway, `instanceCount > 1` shows a warning and only **one** instance receives traffic.

### Dependency settings (edge config)

Configured per **connection** from Application Server → downstream:

| Target | Key fields |
|--------|------------|
| SQL Database | `queriesPerRequest`, `syncMode`, `requiredForSuccess`, `retryPolicy`, `timeoutMs` |
| Cache | `lookupsPerRequest`, `cacheHitRate`, `syncMode`, `requiredForSuccess` |
| Message Queue | `eventsPerCompletedRequest`, `syncAckRequired`, `retryPolicy`, `deliveryFailureBehavior` |
| External API | `callsPerRequest`, `required`, `execution`, `timeoutMs`, `retryPolicy` |

Logic: `web/src/lib/simulator/dependency-edge-config.ts` · Panel: `dependency-edge-inspector.tsx`

### Live metrics

Incoming RPS, **Completed RPS**, Derived Capacity (expandable breakdown), Utilization, Active Requests, Queue Depth, Avg/P95 Response Time, Error Rate.

### Inspector tabs

| Tab | Controls |
|-----|----------|
| Basics | Live status, quick fixes (add instance, raise slots), instance count + concurrent slots sliders |
| Advanced | Pool overview, per-instance table, compute time, queues, dependency links |

---

## Load Balancer (`load_balancer`)

**Role:** `router` · **Routing:** `split` · **Panel:** `load-balancer-config-inspector.tsx`

Distributes incoming traffic across healthy backend pools.

Logic: `web/src/lib/simulator/load-balancer-model.ts`

### Config

| Field | Purpose |
|-------|---------|
| `algorithm` | round_robin, least_connections, weighted, … |
| `replicas` | LB instances for availability + routing capacity |
| `maxConnections` | Active client connections per LB |
| `maxRoutingThroughputRps` | Routing throughput cap before LB becomes bottleneck |
| `baseRoutingLatencyMs` | Overhead while selecting a backend |

### Inspector tabs

| Tab | Controls |
|-----|----------|
| Basics | Live routing status, quick fixes (raise routing cap), throughput + replica sliders |
| Advanced | Per-target distribution, replica metrics table, full algorithm config |

---

## Database components

Types: `sql_database`, `nosql_database`, `search_index`, `redis_cache`

**Role:** `storage` · **Routing:** `passthrough` · **Panel:** `database-config-inspector.tsx`

Production-grade database simulation with engine families (SQL, Redis, DynamoDB-style, MongoDB, Search).

Logic: `web/src/lib/simulator/database-model.ts` — `simulateDatabaseTick()` in the engine.

### Config areas

| Area | Examples |
|------|----------|
| Workload | Read/write %, request mix, transaction size, lock contention |
| Topology | Primary/replica count, read routing, sharding mode, hot partition simulation |
| Capacity | CPU, memory, storage, disk IOPS, max connections, buffer cache |
| Connections | Pool size per app instance, acquisition timeout |
| Engine-specific | Redis memory/shards; Dynamo provisioned RCU/WCU; search index settings |
| Failure | Primary/replica/shard failure toggles, disk saturation, network partition |

`RuntimeMetrics.databaseMetrics` exposes per-tick QPS, P95, CPU, replication lag, shard balance, warnings.

### Inspector tabs

| Tab | Controls |
|-----|----------|
| Basics | Live status, quick fixes (add read replica, raise connections, route reads to replicas, Redis memory, Dynamo capacity), simple scaling sliders |
| Advanced | Engine selection, workload profile, cluster topology, replication, sharding, indexes, consistency, failure simulation |

Quick fixes in `component-basics.ts` → `getDatabaseBasics()` / `applyDatabaseFix()`.

---

## Inspector pattern (all components)

Shared shell: `inspector-panel.tsx` + `inspector-basics-advanced.tsx`.

| Component | Basics highlights | Advanced highlights |
|-----------|-------------------|---------------------|
| Client | Active users, activity preset, resulting RPS | Traffic patterns, RPS override, request mix, retries |
| App Server | Instance count, concurrent slots | Pool breakdown, instance table, queues, dependencies |
| Load Balancer | Routing throughput, replicas | Distribution view, algorithm, replica table |
| Database | Read replicas, connections, CPU | Full topology, sharding, indexes, failures |
| Generic (registry) | Top 3 config fields + quick fixes | “What is this?”, all config fields, technical summary |

---

## Other components (summary)

Full registry: 40+ types. Capacity formulas in `engine.ts` → `deriveCapacity()`.

| Type | Routing | Primary config drivers |
|------|---------|------------------------|
| Load Balancer | split | algorithm, maxConnections, replicas |
| API Gateway | split | rateLimitRps, maxConnections, auth latency |
| Web Server | filter | staticCacheHitRate, workerProcesses |
| App Server | passthrough | concurrency, compute time, queue; capacity derived from dependencies |
| SQL Database | passthrough | connectionPoolSize, avgQueryTimeMs, shards, readReplicas |
| Redis Cache | filter | hitRate, memoryMB |
| Message Queue | buffer | maxQueueDepth, consumerCount |
| Rate Limiter | throttle | maxRps, algorithm |
| Observability / Infra | none | Not in request path — arch error if wired from Client |

When reviewing the next component, append a section here using the Client template:

- Config fields + engine usage
- Valid inbound/outbound (contract summary)
- Decisions + open questions

---

## ArchLayer (visual only)

Layers group components in legends and teaching — they do **not** define validation:

`client_layer`, `edge_layer`, `gateway_layer`, `service_layer`, `data_layer`, `async_layer`, `infra_layer`, `observability_layer`

Use **traffic role** in `traffic-contracts.ts` for validation logic.

---

## Course snapshot configs

Course architectures (`ArchitectureSnapshot` in `courses/types.ts`) override defaults:

```typescript
{ type: "client", label: "Shoppers", config: { requestsPerSecond: 2 } }
```

Edges without explicit `protocol` get `suggestEdgeProtocol()` — e.g. App → DB becomes `tcp`.

---

## Related

- [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md)
- [SIMULATOR.md](./SIMULATOR.md)
