# Leetdesign — Code Architecture

> **Note (2026-07):** This file describes the **original MVP** pipeline/journey loop.
> The **active architecture simulator** (`web/src/lib/simulator/`) is documented in
> [`docs/`](../docs/README.md) — start with [AGENT-HANDOFF.md](../docs/AGENT-HANDOFF.md).

This document explains how the Leetdesign MVP code is organized and how each part
maps to the master design doc (`docs/MASTER_DESIGN_DOC.md`).

## Layered view

```
+-----------------------------------------------------------+
|                       UI Surfaces                         |
|  app/* pages  ─►  components/{layout,badge,bot,pipeline,  |
|                   delivery,workspace,ui}                  |
+-----------------------------------------------------------+
|                     Workspace Stores                      |
|                src/store/workspace.ts (Zustand)           |
+-----------------------------------------------------------+
|                  Domain & Engine Layer                    |
|  lib/simulation/engine.ts   ─ deterministic incident eval |
|  lib/simulation/delivery.ts ─ simulated git/CI/CD events  |
|  lib/scoring/score.ts       ─ rubric-based local scoring  |
|  lib/ai/judge.ts            ─ AIJudge interface           |
+-----------------------------------------------------------+
|                       Content Layer                       |
|  lib/content/components.ts  ─ component library           |
|  lib/content/projects.ts    ─ project catalog             |
|  lib/content/scenarios.ts   ─ guided incident definitions |
|  lib/content/practice.ts    ─ free-build prompts          |
+-----------------------------------------------------------+
|                  Identity & Brand Layer                   |
|  lib/brand.ts   lib/badges.ts   lib/local-store.ts        |
+-----------------------------------------------------------+
```

## Data contracts

All domain types live in `src/types/index.ts`:

- `UserProfile`, `BadgeLevel`, `BadgeMeta`
- `InventoryComponent`, `ComponentType`
- `PipelineGraph`, `PipelineNode`, `PipelineEdge`, `SystemHealth`
- `DeliveryEvent`, `DeliveryStage`
- `ProjectDefinition`, `ScenarioDefinition`, `AcceptableSolution`
- `PracticeExercise`, `ArchitectureSnapshot`
- `ReviewVerdict`, `ScoreBreakdown`
- `TaskboardItem`

These shapes mirror Sections 11, 12, and 18 of the master design doc.

## Two core gameplay loops

### 1) Guided incident loop

```
Scenario  ─►  PipelineCanvas (with missing slots)
                     │
            Inventory drag/drop
                     ▼
         Workspace store places component
                     ▼
        evaluateScenario() → pass/fail
                     ▼
        buildDeliveryTimeline() → CI events stream
                     ▼
       Reward & feedback in workspace UI
```

Code: `src/components/workspace/project-workspace.tsx`,
`src/store/workspace.ts`, `src/lib/simulation/*`.

### 2) Practice review loop

```
PracticeExercise  ─►  PracticeWorkspace
                              │
                  Drop components, name them, write notes
                              ▼
                ArchitectureSnapshot built locally
                              ▼
                AIJudge.judgeArchitecture(snapshot)
                              ▼
                 ReviewVerdict (score + strengths + gaps)
```

Code: `src/components/workspace/practice-workspace.tsx`,
`src/lib/ai/judge.ts`, `src/lib/scoring/score.ts`.

## Why the AI judge is an interface

The MVP ships with `localAIJudge` — a deterministic rubric-based scorer — so
the product is fully usable offline and during development. Production can
swap in a model-backed judge by implementing the same `AIJudge` interface.
This isolates content + UX work from prompt engineering and inference cost.

## Visual system

- **Theme**: dark cosmic palette in `src/app/globals.css`.
  Brand gradient: violet → cyan. Accent surfaces use subtle gradients and
  motion for the "alive" feel called out in the design doc.
- **Components**: pipeline nodes use ring color to encode health
  (emerald/amber/rose). Missing slots use an animated gradient border.
- **Bot**: `LeetdesignBot` reflects mood (`calm`, `thinking`, `alert`,
  `critical`, `happy`) with face changes and subtle motion.
- **Delivery timeline**: shows the simulated branch → CI → merge sequence so
  users *see* their fix flow through "engineering realism".

## Adding new content

### A new component
1. Add an entry to `src/lib/content/components.ts`.
2. Add an icon mapping in `src/components/pipeline/icon-map.ts`.

### A new guided scenario
1. Add a `ScenarioDefinition` to `src/lib/content/scenarios.ts`.
2. Reference the scenario id from a project in
   `src/lib/content/projects.ts`.

### A new practice exercise
1. Add a `PracticeExercise` to `src/lib/content/practice.ts`.

### A new badge level
1. Add to `BADGES` in `src/lib/badges.ts`.
2. Update `nextBadge` ordering and `RANK` table in `src/app/projects/page.tsx`.

## Roadmap (mapped to master doc Section 21)

- **Now (MVP)**: dashboard, badge, one flagship project, one practice
  exercise, deterministic simulation, simulated delivery flow, AI judge
  interface with local fallback. ✅
- **Next**: more scenarios, taskboard interactions, code-snippet tasks
  inside guided projects, progression persistence, optional cloud sync later.
- **Later**: real AI judge integration, marketplace/free vs paid projects,
  multi-user collaboration, replay logs.
