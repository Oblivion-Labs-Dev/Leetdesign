# Agent handoff — LeetDesign simulator

Quick context for picking up work on the architecture simulator without re-reading the full codebase.

**Last updated:** 2026-07-04 (database simulation, traffic delivery, Basics/Advanced inspectors)

---

## What this product is

LeetDesign is a **browser-based system design simulator**. Users draw architecture diagrams (React Flow canvas), configure components, run traffic simulation, and learn via guided **courses** (e.g. store-growth sneaker shop).

Primary app: `web/` (Next.js App Router, React 19, Zustand, Tailwind v4).

---

## Current focus area

**Simulator realism + beginner-friendly inspectors**

- Physics-based capacity (Little's Law), not arbitrary `maxRps` knobs on every component.
- **Traffic contract validation** — invalid wiring (Client→Database) is flagged, not silently "simulated."
- **Traffic delivery contract** — downstream nodes only receive propagated RPS; broken upstream stops phantom DB/app load (`traffic-delivery.ts`).
- **Database simulation** — rich config + tick path via `database-model.ts` (replicas, sharding, pools, engine types).
- **Basics / Advanced inspector tabs** on every component — quick fixes for beginners, full knobs for detailed design (`component-basics.ts`, `inspector-basics-advanced.tsx`).
- **Store Growth course** (`store-growth`) — chapters 1–2 implemented; 3–8 stubs.
- Course UI: slim `CourseSidePanel` on the right; **SelectionInspector slides in** when a node/edge is clicked (do not make these mutually exclusive).

---

## Key files (touch these first)

| Area | Path |
|------|------|
| Component definitions | `web/src/lib/simulator/component-registry.ts` |
| Types | `web/src/lib/simulator/types.ts` |
| Simulation engine | `web/src/lib/simulator/engine.ts` |
| Traffic delivery (upstream gating) | `web/src/lib/simulator/traffic-delivery.ts` |
| Database simulation | `web/src/lib/simulator/database-model.ts` |
| Load balancer model | `web/src/lib/simulator/load-balancer-model.ts` |
| Inspector quick fixes | `web/src/lib/simulator/component-basics.ts` |
| Architecture validation | `web/src/lib/simulator/traffic-contracts.ts` |
| Course acceptance checks | `web/src/lib/simulator/evaluator.ts` |
| Store Growth course | `web/src/lib/simulator/courses/store-growth.ts` |
| Design + sim Zustand | `web/src/lib/simulator/store.ts` |
| Workspace layout | `web/src/components/simulator/architecture-workspace.tsx` |
| Canvas + arch alerts | `web/src/components/simulator/simulator-canvas.tsx`, `architecture-alerts.tsx` |
| Inspector shell + tabs | `web/src/components/simulator/inspector-panel.tsx`, `inspector-basics-advanced.tsx` |
| Type-specific inspectors | `web/src/components/simulator/*-config-inspector.tsx` |
| Edge rendering | `web/src/components/simulator/sim-edge.tsx` |
| Persistence | `web/src/lib/simulator/persistence.ts`, `web/src/lib/db/persistence-adapter.ts` |

---

## Do / Don't

### Do

- Validate architecture via **traffic contracts** (`validateHop`, `validateDesign`) — see [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md).
- Allow **any wire to be drawn**; show errors in UI + simulation (don't block `onConnect` unless explicitly requested).
- Keep **course panel + selection inspector** side-by-side for course mode.
- Derive throughput capacity from component specs (cores, pool size, processing time).
- Run `npx tsc --noEmit` from `web/` after simulator changes.

### Don't

- Don't use **layer-only** connection rules as the primary validator (too brittle; misses valid monoliths, allows invalid cross-layer hops).
- Don't reintroduce **`maxRps` as a user knob** on App Server / DB — capacity is derived.
- Don't change unrelated UI when fixing a specific regression (user has called this out explicitly).
- Don't commit with AI attribution in git messages (repo rule).

---

## Running locally

```bash
cd web
npm install
npm run dev -- --port 3001   # or 3333
```

- Persistence default: **localStorage** (`leetdesign:designs`).
- Postgres API: set `NEXT_PUBLIC_USE_DB=true` + `DATABASE_URL` (Prisma schema in `web/prisma/schema.prisma`).

---

## Error taxonomy (simulation)

Three distinct failure modes — keep them separate in UI and courses:

1. **Architecture violations** — wrong protocol/role/envelope (Client→DB). 100% error rate on target; red dashed edge; `ArchitectureAlerts` panel.
2. **Capacity violations** — correct wiring, too much load (overload, latency, drops).
3. **Availability** — upstream down / unreachable nodes.

---

## Open / TODO (known gaps)

| Item | Status |
|------|--------|
| `concurrentUsers` on Client | Defined in registry, **not used by engine** — remove or derive RPS via think-time |
| Chapters 3–8 store-growth | Stub content |
| Auth / user accounts | Skipped for now; Prisma schema exists |
| `CourseGuidePanel` | Replaced by `CourseSidePanel`; file still exists, unused |
| Full component-by-component config review | Client, App Server, Load Balancer, Database documented in COMPONENT-MODEL.md |
| Basics/Advanced inspector tabs | Done for all component types |

---

## Where to read more

- [SIMULATOR.md](./SIMULATOR.md) — engine phases, routing behaviors, metrics.
- [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md) — validation design and examples.
- [COMPONENT-MODEL.md](./COMPONENT-MODEL.md) — Client field decisions.
