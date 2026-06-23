# Leetdesign (web app)

The Leetdesign web app — a simulation-first system design platform.

## Stack

- Next.js (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- React Flow (`@xyflow/react`) for the live pipeline canvas
- Framer Motion for transitions
- Zustand for workspace state
- Lucide for icons

## Local development

```bash
npm install
npm run dev -- --port 3333
```

App runs on `http://localhost:3333`.

## Local profile & progress

There is no login or external backend. A default local profile and your progress
are persisted in `~/.leetdesign/user-state.json`.

## Routes

| Route                          | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `/`                            | Marketing / landing page                           |
| `/onboarding`                  | First-day intro flow                               |
| `/dashboard`                   | Dashboard with badge & active work                 |
| `/projects`                    | Catalog of guided projects, gated by badge         |
| `/projects/[projectId]`        | Guided incident workspace (pipeline + bot + CI)    |
| `/practice`                    | Catalog of practice exercises                      |
| `/practice/[exerciseId]`       | Free-build canvas + VP review submission           |
| `/library`                     | Component knowledge base                           |
| `/library/[componentId]`       | Per-component deep-dive page                       |
| `/brushup`                     | OOP / SOLID / patterns warm-ups                    |
| `/tasks`                       | Kanban-style taskboard                             |
| `/profile`                     | Identity badge + career ladder                     |
| `/settings`                    | Account, theme, dev options                        |

## Where to extend

- **Add a component**: edit `src/lib/content/components.ts` and add an icon in
  `src/components/pipeline/icon-map.ts`.
- **Add a guided scenario**: add to `src/lib/content/scenarios.ts` and reference
  the scenario id from a `ProjectDefinition` in
  `src/lib/content/projects.ts`.
- **Add a practice exercise**: add to `src/lib/content/practice.ts`.
- **Tune simulation behavior**: edit `src/lib/simulation/engine.ts` (incident
  evaluation) and `src/lib/simulation/delivery.ts` (CI/CD timeline).
- **Plug in a real AI judge**: implement the `AIJudge` interface in
  `src/lib/ai/judge.ts` and replace `localAIJudge` with your network-backed
  implementation.

## Conventions

- Server components by default; mark interactive components with `"use client"`.
- Visual primitives live in `components/ui`; product surfaces in
  `components/{layout,badge,bot,pipeline,delivery,workspace}`.
- All shared types live in `src/types/index.ts`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system map.
