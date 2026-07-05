# Traffic contracts — architecture validation

How LeetDesign decides whether a connection "makes sense," and how that differs from overload simulation.

**Implementation:** `web/src/lib/simulator/traffic-contracts.ts`

---

## Problem we solved

Users can wire **any** edge on the canvas. We intentionally **do not block** drawing wires (exploration is allowed).

Without validation, invalid designs **appear to work** — e.g. Client → SQL Database would show query latency and load, which teaches the wrong lesson.

### Rejected approach: layer-only rules

Example rule: "client_layer cannot connect to data_layer."

**Why we rejected it:**

| Scenario | Layer rule | Reality |
|----------|------------|---------|
| Client → App Server (no LB) | May fail | Valid monolith / direct API |
| CDN → Object Storage | May fail | Valid origin fetch |
| Client → Database | Block | Correct — but layer rules are coarse and hard to maintain |

---

## Chosen approach: traffic contracts

Each hop is validated as a **contract**:

> Can the **source** send this **envelope** over this **protocol** to the **target**, given the target's **role**?

Validation runs at two times:

1. **Static** — `validateDesign(design)` whenever the design changes (canvas effect + each render cycle).
2. **Runtime** — `validateHop()` inside the engine before crediting `incoming[target]` (Phase 1 + `routeToTargets`).

Invalid hops → **100% architecture error rate** on the target (separate from capacity errors).

---

## Core concepts

### Traffic envelope

What kind of work the bytes represent:

| Envelope | Meaning |
|----------|---------|
| `user_http` | Browser/mobile user request |
| `internal_rpc` | Service-to-service call |
| `db_query` | SQL/NoSQL driver query |
| `cache_op` | Redis/Memcached command |
| `object_io` | Blob storage read/write |
| `search_query` | Search index query |
| `async_event` | Queue/event publish |

Resolved by `resolveOutboundEnvelope(sourceType, targetType)` — e.g. App Server → SQL Database emits `db_query`, not `user_http`.

### Node traffic role

What the node does in a request lifecycle (not the same as visual `ArchLayer`):

| Role | Examples |
|------|----------|
| `origin` | Client |
| `ingress` | Load Balancer, API Gateway, CDN, Firewall, Rate Limiter |
| `compute` | App Server, Web Server, WebSocket Server, Stream Processor |
| `persistence` | SQL/NoSQL DB, Object Storage, Search Index, Data Lake |
| `cache` | Redis, Local/Distributed Cache |
| `async` | Message Queue, Event Bus, Pub/Sub |
| `sidecar` | Metrics, Logs, Tracing, Alerting |
| `infra` | DNS, K8s, Secrets Manager, Service Registry |

### Edge protocol

Existing field on `SimEdge`: `http`, `grpc`, `tcp`, `websocket`, `async`.

Protocol must align with envelope — e.g. DB expects `tcp`, queues expect `async`.

Auto-set on connect: `suggestEdgeProtocol(sourceType, targetType)`.

---

## Severity

| Severity | When | Simulation |
|----------|------|--------------|
| `error` | Contract broken (Client→DB, ingress→DB, wrong protocol) | 0 valid throughput; target health → failing |
| `warning` | Unusual but valid (Client→App direct, no ingress) | Traffic flows; shown in ArchitectureAlerts |

---

## Validation examples

| Connection | Result | Reason |
|------------|--------|--------|
| Client → App Server | ⚠️ warning `direct_to_compute` | Valid monolith; no edge LB |
| Client → Load Balancer → App | ✅ | Standard |
| Client → SQL Database | ❌ error `client_to_data` | User HTTP ≠ DB driver protocol |
| App Server → SQL Database (tcp) | ✅ | Backend query path |
| App Server → SQL Database (http) | ❌ error `protocol_mismatch` | Use TCP for driver |
| Load Balancer → Database | ❌ error `ingress_to_data` | Edge doesn't query DB |
| Client → Message Queue | ❌ error `client_to_async` | Clients don't publish to brokers |
| App → Message Queue → App | ✅ | Async pipeline |
| Client → Metrics Collector | ❌ error `not_in_request_path` | Observability ≠ user path |
| CDN → Object Storage | ✅ | Origin fetch (`object_io`) |

---

## UI surfacing

| Surface | Behavior |
|---------|----------|
| `architecture-alerts.tsx` | Bottom-left panel; lists errors + warnings |
| `sim-edge.tsx` | Red/amber dashed stroke; `ERR` / `!` badge on label |
| Node `diagnosisReason` | `"Architecture violation: …"` when arch errors dominate |
| `useSimulationStore.architectureViolations` | Shared state for edge + panel |

---

## API reference

```typescript
// Single hop — used by engine
validateHop(source: SimNode, target: SimNode, protocol: EdgeProtocol): HopValidation

// Full design scan — used by canvas + engine
validateDesign(design: SimDesign): ArchitectureViolation[]

// New edge default protocol
suggestEdgeProtocol(sourceType, targetType): EdgeProtocol

// Helpers
getTrafficRole(type): NodeTrafficRole
resolveOutboundEnvelope(sourceType, targetType): TrafficEnvelope
violationForEdge(violations, edgeId): ArchitectureViolation | undefined
```

---

## Extending validation

When adding a component or connection pattern:

1. Set `ROLE[type]` in `traffic-contracts.ts`.
2. Update `resolveOutboundEnvelope()` if it emits a special envelope downstream.
3. Add branches in `validateHop()` with **specific messages** — users learn from the text.
4. Add an row to the **Validation examples** table in this doc.
5. Prefer `warning` for debatable real-world patterns; `error` for clearly broken ones.

---

## Error taxonomy (keep separate)

Document and UI should distinguish:

1. **Architecture** — this doc; wiring/protocol/role
2. **Capacity** — overload, pool exhaustion, rate limits
3. **Availability** — upstream down, starved nodes

Courses should tell users which they're fixing ("Fix wiring first" vs "Scale the app").

---

## Related

- [SIMULATOR.md](./SIMULATOR.md) — where validation hooks into the tick loop
- [COMPONENT-MODEL.md](./COMPONENT-MODEL.md) — Client config decisions
