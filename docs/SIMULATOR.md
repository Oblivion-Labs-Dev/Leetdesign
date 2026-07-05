# Simulator — engine, stores, and UI

How the architecture simulator works end-to-end.

---

## Overview

The simulator models **request flow** through a directed graph:

1. **Client** nodes generate traffic (RPS × traffic pattern).
2. Traffic propagates **BFS** from clients through wired edges.
3. Each node applies **routing behavior** (split, filter, throttle, buffer, passthrough).
4. **Capacity** is derived per component type; overload increases latency, errors, and health degradation.
5. **Traffic contracts** reject invalid hops (architecture errors). See [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md).

Entry point: `web/src/lib/simulator/engine.ts` — `startEngine()` registers a 100ms interval calling `tick(design, timeScale)`.

---

## Simulation tick phases

### Phase 1 — Traffic generation

- For each node with `isTrafficSource: true` (only **Client** today):
  - Read `requestsPerSecond` and `requestPattern` from config.
  - Apply pattern multiplier (`constant`, `burst`, `sine_wave`, `ramp`).
  - For each outbound edge, call `validateHop(source, target, protocol)`.
  - **Valid hops:** add to `incoming[target]`, record `edgeFlowRps`.
  - **Invalid hops:** increment `archRejectedRps` on target; edge flow = 0.

### Phase 2 — BFS propagation

- Queue starts at client outbound targets.
- For each visited node (skips `routingBehavior: "none"`):
  - Compute load from derived **capacity** vs incoming RPS.
  - Apply latency, queue depth, throttle errors, overload errors.
  - Forward downstream via `routeToTargets()` — again validates each hop.

### Traffic delivery contract

`web/src/lib/simulator/traffic-delivery.ts` defines how RPS moves through the graph so downstream nodes never “phantom process” when upstream is broken.

| Metric | Meaning |
|--------|---------|
| `incomingRpsLastTick` | RPS that arrived at the node this tick |
| `deliveredRpsLastTick` | RPS actually processed (after admission / errors) |
| `propagateRpsLastTick` | RPS forwarded to downstream targets |

**Rules:**

- Downstream only receives **`propagateRps`**, never raw client injection or backlog drain alone.
- If upstream did not propagate this tick, **`incoming = 0`** for the child.
- Unhealthy routers (`down` / `failing` / latched down) set **`propagateRps = 0`**.
- Client injection is blocked when the first hop is down/failing or downstream error rate > 50%.
- Edge flow labels sync to **accepted** traffic, not attempted client rate.

App Server uses `computeAppServerPropagateRps()` — propagate only when upstream fed traffic **and** `incoming > 0`.

### Phase 2b — Unreachable nodes

- Nodes never visited get zero RPS (starved).

### Phase 3 — Metrics (every 5 ticks ≈ 500ms)

- Build `RuntimeMetrics` per node (RPS, p95 latency, health, utilization %, diagnosis).
- **Architecture violations take priority** in diagnosis over overload messages.
- Batch update Zustand via `batchUpdateMetrics()`.
- Run `validateDesign()` → `architectureViolations` in store (powers static UI).

---

## Routing behaviors

Defined on each component in `component-registry.ts` (`RoutingBehavior` in `types.ts`):

| Behavior | Examples | Effect |
|----------|----------|--------|
| `source` | Client | Generates traffic; no inbound processing |
| `split` | Load Balancer, API Gateway | Distributes among targets (algorithm-aware) |
| `filter` | CDN, Cache, Web Server | Absorbs fraction (hit rate); forwards rest |
| `throttle` | Rate Limiter | Caps RPS; drops excess |
| `buffer` | Message Queue, Event Bus | Queues; drains at consumer rate |
| `passthrough` | App Server, Database | Processes request; forwards only if wired |
| `none` | DNS, K8s, Metrics | Not in traffic path |

Load balancers use **connection-based load** (Little's Law) for routing (`least_connections`, etc.).

---

## Capacity derivation

`deriveCapacity(node)` in `engine.ts` — **no user-facing maxRps** on App Server / DB.

Examples:

| Component | Formula (simplified) |
|-----------|----------------------|
| App Server | `(maxConcurrentReqs / avgProcessingTimeMs) × 1000 × replicas` |
| SQL Database | `(connectionPoolSize / avgQueryTimeMs) × 1000 × shards × (1 + readReplicas)` |
| Web Server | `(workerProcesses × 1000 / avgStaticLatencyMs) × replicas` |
| API Gateway | `min(rateLimitRps, maxConnections) × replicas` |

Utilization % on canvas = `smoothedLoad × 100` (capped at 100 for display).

---

## Zustand stores

| Store | File | Holds |
|-------|------|-------|
| `useDesignStore` | `store.ts` | `SimDesign`, selection, mutations (addNode, addEdge, …) |
| `useSimulationStore` | `store.ts` | `running`, `metrics`, `edgeFlowRps`, `architectureViolations`, system health |
| `useCourseStore` | `course-store.ts` | Milestone phase, progress |
| `useWorkspaceStore` | `workspace-store.ts` | Shelf, mode, mission dock |
| `useTeachingStore` | `teaching-store.ts` | Highlights, trace path |

---

## Edge protocols

`SimEdge.protocol`: `http` | `grpc` | `tcp` | `websocket` | `async`

- Auto-selected on connect via `suggestEdgeProtocol()` in `traffic-contracts.ts`.
- Course snapshots use the same helper when `protocol` omitted (`courses/types.ts` → `snapshotToDesign`).

---

## UI components

| Component | Role |
|-----------|------|
| `simulator-canvas.tsx` | React Flow; runs `validateDesign` on design change |
| `sim-node.tsx` | Node card, utilization bar, health ring, DB-specific footer |
| `sim-edge.tsx` | Protocol label, RPS flow, arch violation styling (red/amber dash) |
| `architecture-alerts.tsx` | Bottom-left list of violations |
| `config-inspector.tsx` | Routes to type-specific inspectors; generic fallback |
| `inspector-panel.tsx` | Shared layout primitives (sections, metrics tables, collapsibles) |
| `inspector-basics-advanced.tsx` | **Basics / Advanced** tab shell + quick-fix panel |
| `*-config-inspector.tsx` | Per-type panels (client, app server, load balancer, database) |
| `context-inspector.tsx` | `SelectionInspector` + `ContextInspector` |
| `incident-coach.tsx` | Runtime overload incident overlay |
| `metrics-dashboard.tsx` | System metrics charts |

### Inspector: Basics vs Advanced

Every component inspector has two tabs (default **Basics**; resets when selecting a different node):

| Tab | Audience | Contents |
|-----|----------|----------|
| **Basics** | Beginners fixing overload | Plain-language health summary, one-click quick fixes, 2–3 simple scaling sliders |
| **Advanced** | Detailed system design | Full config: workload mix, sharding, replication, queue behavior, traffic patterns, etc. |

Quick-fix logic lives in `web/src/lib/simulator/component-basics.ts`. Fixes that need deeper tuning (e.g. “check database bottleneck”) switch to Advanced automatically.

Database types (`sql_database`, `nosql_database`, `search_index`, `redis_cache`) use `database-config-inspector.tsx` backed by `database-model.ts` for rich simulation (replicas, sharding, connection pools, engine-specific knobs).

---

## Courses

- Definitions: `web/src/lib/simulator/courses/` (e.g. `store-growth.ts`).
- Snapshot → design: `snapshotToDesign()` in `courses/types.ts`.
- Milestone pass/fail: `evaluator.ts` — `AcceptanceCriteria` (p95, error rate, min handled RPS, sustain duration).
- **Topology is not scored directly** — but invalid topology prevents meeting criteria via arch errors.

### Store Growth course (active)

| Chapter | Scenario |
|---------|----------|
| ch1 | Monolith: Client → Web App → DB @ 2 rps |
| ch2 | Viral spike @ 50 rps, app bottleneck |
| ch3–8 | Stubs |

---

## Performance choices

- Engine ticks every **100ms**; Zustand render updates every **5 ticks** (500ms).
- `batchUpdateMetrics` — single store write per render cycle.
- `React.memo` on `SimNode` (selective metric subscriptions).

---

## Adding a new component type

1. Add to `SimComponentType` in `types.ts`.
2. Add full definition in `component-registry.ts` (config fields, `routingBehavior`, `layer`, teaching copy).
3. Add capacity branch in `engine.ts` → `deriveCapacity()` and optionally `deriveBaseLatency()`.
4. Add traffic role + validation rules in `traffic-contracts.ts` (`ROLE`, accept/emits logic in `validateHop`).
5. Add icon in `SIM_ICON_MAP` in `component-registry.ts`.
6. Update [COMPONENT-MODEL.md](./COMPONENT-MODEL.md).

---

## Adding validation rules

Edit `validateHop()` in `traffic-contracts.ts`. Prefer:

- **Role + envelope + protocol** checks
- Specific error messages + suggestions
- `warning` vs `error` severity (monolith paths = warning)

Do **not** rely solely on `ArchLayer` adjacency.

---

## Related

- [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md)
- [COMPONENT-MODEL.md](./COMPONENT-MODEL.md)
