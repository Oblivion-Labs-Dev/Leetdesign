# Astra (web app)

The Astra web app — a simulation-first system design platform.

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
npx prisma generate
npx prisma db push
npm run dev
```

App runs on `http://localhost:3000`.

## Auth setup (required for real login/signup)

Copy `.env.example` to `.env` and set:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (usually `http://localhost:3000`)
- optional OAuth providers:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

Credentials signup/login works without OAuth keys. Google/GitHub buttons become
fully active once their keys are configured.

## Routes

| Route                          | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `/`                            | Marketing / landing page                           |
| `/login`                       | Sign-in shell                                      |
| `/onboarding`                  | "You're hired" first-day flow                      |
| `/dashboard`                   | Company-style dashboard with badge & active work   |
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
