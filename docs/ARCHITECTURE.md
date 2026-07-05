# Architecture — LeetDesign (current)

High-level map of the **current** codebase. Supersedes older references to "Astra" or `lib/simulation/` paths.

---

## Repository layout

```text
leetdesign/
├── docs/                    ← Living design docs (start at docs/README.md)
├── web/                     ← Next.js application (primary product)
│   ├── prisma/              ← Postgres schema (User, Design, CourseProgress)
│   ├── src/
│   │   ├── app/             ← App Router pages + API routes
│   │   ├── components/
│   │   │   └── simulator/   ← Architecture workspace UI
│   │   ├── generated/prisma ← Prisma client output
│   │   └── lib/
│   │       ├── db/          ← Prisma client + persistence adapter
│   │       └── simulator/   ← Simulation domain (engine, courses, registry)
│   └── package.json
└── README.md
```

Legacy content (guided pipeline journeys, old practice workspace) may still exist under `web/src/lib/content/` and older routes — the **active simulator** is under `lib/simulator/` and `/projects/[designId]`.

---

## System diagram

```text
Browser
   │
   ▼
Next.js (web/)
 ├── Pages: /, /dashboard, /projects, /projects/[designId], …
 ├── React Flow canvas + Zustand stores
 ├── Client-side simulation engine (100ms ticks, throttled render 500ms)
 └── API routes (optional, when DB enabled)
        │
        ▼
     Postgres via Prisma
      - Design (JSON blob: nodes, edges, simulation config)
      - CourseProgress
      - User
```

**Default mode:** no database. Designs persist in `localStorage` via `web/src/lib/simulator/persistence.ts`.

**DB mode:** `NEXT_PUBLIC_USE_DB=true` → `persistence-adapter.ts` calls `/api/designs` and `/api/courses/[courseId]/progress`.

---

## Frontend layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Pages | `web/src/app/**` | Routing, load design, embed workspace |
| Simulator UI | `web/src/components/simulator/**` | Canvas, inspectors (Basics/Advanced tabs), course panels, metrics |
| Domain | `web/src/lib/simulator/**` | Engine, types, courses, validation |
| Persistence | `persistence.ts`, `lib/db/*` | localStorage ↔ optional API |
| Generated | `src/generated/prisma` | DB client |

---

## Core data model: `SimDesign`

Defined in `web/src/lib/simulator/types.ts`.

```typescript
SimDesign {
  id, name, description, createdAt, updatedAt
  nodes: SimNode[]      // type, label, position, config
  edges: SimEdge[]      // source, target, protocol, config (bandwidth, weight, …)
  simulation: { tickRateMs, timeScale }
  courseId?, courseMilestoneId?, courseProgress?  // guided course
  scenarioId?, challengeId?, projectKind?          // free/challenge modes
}
```

---

## API routes (Postgres-backed)

| Route | Purpose |
|-------|---------|
| `PUT/GET /api/designs/[id]` | Save/load design JSON |
| `GET/POST /api/designs` | List/create designs |
| `GET/PUT /api/courses/[courseId]/progress` | Course milestone state |

Auth routes under `/api/user/*` exist for profile/progress; **simulator work currently skips auth**.

---

## Workspace UI layout (course mode)

```text
┌─────────────────────────────────────────────────────────────┐
│ WorkspaceTopbar (simulate, speed, save)                      │
│ CourseEvolutionTimeline (course only)                          │
├──────────────────────────────────┬──────────────────────────┤
│                                  │ SelectionInspector        │  ← slides in on click
│  SimulatorCanvas (React Flow)    │ (config for selected      │
│  + ArchitectureAlerts (bottom-L) │  node/edge)               │
│                                  ├──────────────────────────┤
│                                  │ CourseSidePanel           │  ← always visible
└──────────────────────────────────┴──────────────────────────┘
```

Free-form / non-course designs also show `ComponentRail`, `MissionDock`, and `ContextInspector` instead of course panels.

---

## Design principles (agreed direction)

1. **Throughput is an outcome** — capacity derived from specs (Little's Law), not a generic RPS slider on every node.
2. **Architecture vs capacity errors** — wrong wiring fails differently from overload.
3. **Contracts over layers** — validation uses traffic envelopes + roles, not rigid layer adjacency matrices. See [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md).
4. **Courses accept outcomes** — `evaluator.ts` uses metric-based `AcceptanceCriteria`, not hard-coded topology checks.
5. **Explore freely, simulate honestly** — users can draw any edge; simulation and alerts explain what's wrong.
6. **Progressive inspector depth** — Basics tab gives quick fixes and simple scaling; Advanced tab exposes full system-design knobs (sharding, replication, traffic patterns, etc.).

---

## Deployment notes

- Dev: `npm run dev` from `web/`.
- Production target: Next.js on Vercel/similar + Neon Postgres when `DATABASE_URL` is set.
- Prisma client generated to `src/generated/prisma` (committed or regenerated on build — check CI).

---

## Related docs

- [SIMULATOR.md](./SIMULATOR.md) — engine internals
- [COMPONENT-MODEL.md](./COMPONENT-MODEL.md) — registry and config fields
- [AGENT-HANDOFF.md](./AGENT-HANDOFF.md) — quick file index
