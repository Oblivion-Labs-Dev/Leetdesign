# Leetdesign

> Learn system design by working at a company that lives in your browser.

**Leetdesign** is a simulation-first system design platform. Users take real-feeling
incidents, fix architecture by drag-and-drop, and ship through a simulated
git/CI/CD pipeline. Practice mode lets users design full systems from scratch
and submit them to a graded VP review meeting.

---

## Repository layout

```
leetdesign/
├── web/                       # Next.js frontend application
├── docs/                      # Design docs
└── README.md
```

## Quick start

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

### First-time setup

```bash
cd web
npm install
```

### Start the application (development)

```bash
cd web
npm run dev -- --port 3333
```

Open **http://localhost:3333** in your browser.

The dev server runs on port `3333` by default for this project. To use a different port:

```bash
npm run dev -- --port 3000
```

### Start the application (production)

```bash
cd web
npm run build
npm run start -- --port 3333
```

Then open **http://localhost:3333**.

### Recommended first walkthrough

1. Visit `/` → click **Get started**.
2. `/onboarding` → enter the Studio tour.
3. `/dashboard` → your Studio home (stats, continue card, streaks).
4. `/projects/url-shortener` → work through the guided journey.
5. `/practice/url-shortener-global` → free-build a system and submit it to the
   VP review meeting.

## Scripts

From inside `web/`:

- `npm run dev` — start development server (add `-- --port 3333` to set port)
- `npm run build` — production build
- `npm run start` — serve production build (add `-- --port 3333` to set port)
- `npm run lint` — lint with Next/ESLint

## Local data

Progress, profile edits, and onboarding state are stored in `~/.leetdesign/user-state.json`
on your machine. No account or backend service is required.

## Documentation

Living docs for the simulator and architecture validation (update alongside code changes):

- [docs/README.md](docs/README.md) — index
- [docs/AGENT-HANDOFF.md](docs/AGENT-HANDOFF.md) — quick onboarding for contributors/agents
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — current system layout
- [docs/SIMULATOR.md](docs/SIMULATOR.md) — engine, stores, courses
- [docs/TRAFFIC-CONTRACTS.md](docs/TRAFFIC-CONTRACTS.md) — wiring validation approach
- [docs/COMPONENT-MODEL.md](docs/COMPONENT-MODEL.md) — component config (Client first)

Legacy: [web/ARCHITECTURE.md](web/ARCHITECTURE.md) — older MVP pipeline doc (partially outdated).

## License

Proprietary.
