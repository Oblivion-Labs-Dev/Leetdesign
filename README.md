# Leetdesign

> Learn system design by working at a company that lives in your browser.

**Leetdesign** is a simulation-first system design platform. Users are "hired" into a
simulated engineering organization, get a role badge, take real-feeling
incidents, fix architecture by drag-and-drop, and ship through a simulated
git/CI/CD pipeline. Practice mode lets users design full systems from scratch
and submit them to an AI-graded VP review meeting.

---

## Repository layout

```
leetdesign/
├── web/                       # Next.js frontend application
├── backend/                   # Dedicated backend auth/identity service
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # UI: layout, badge, bot, pipeline, delivery
│   │   ├── lib/               # brand, badges, content, simulation, scoring, ai
│   │   ├── store/             # Zustand stores
│   │   └── types/             # Shared TS types
│   └── package.json
├── docs/                      # Design docs (master spec, raw idea, IEEE PDF)
└── README.md
```

## Quick start

```bash
cd web
npm install
npm run dev
```

Then open frontend `http://localhost:3333`.

## Run both services

In one terminal:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run dev
```

In another terminal:

```bash
cd web
npm install
npm run dev -- --port 3333
```

Recommended first walkthrough:

1. Visit `/` → click **Get hired**.
2. `/onboarding` → click **Take my first incident**.
3. `/projects/url-shortener` → drag the **Cache** component into the missing
   slot, hit **Submit & run pipeline**, watch the simulated CI/CD play out.
4. `/practice/url-shortener-global` → free-build a system and submit it to the
   VP review meeting.

## Scripts

From inside `web/`:

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — lint with Next/ESLint

## Documentation

- [docs/MASTER_DESIGN_DOC.md](docs/MASTER_DESIGN_DOC.md) — the canonical product +
  architecture spec. Treat this as the single source of truth.
- [docs/MyRawIdea.md](docs/MyRawIdea.md) — the original brain dump.
- [web/ARCHITECTURE.md](web/ARCHITECTURE.md) — code architecture and how to
  extend Leetdesign (add a new component, scenario, project, or judge).

## License

Proprietary.
