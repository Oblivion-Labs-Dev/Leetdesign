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

```bash
cd web
npm install
npm run dev -- --port 3333
```

Then open `http://localhost:3333`.

Recommended first walkthrough:

1. Visit `/` → click **Get started**.
2. `/onboarding` → enter the dashboard tour.
3. `/projects/url-shortener` → work through the guided journey.
4. `/practice/url-shortener-global` → free-build a system and submit it to the
   VP review meeting.

## Scripts

From inside `web/`:

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — lint with Next/ESLint

## Local data

Progress, profile edits, and onboarding state are stored in `web/.data/user-state.json`
on your machine. No account or backend service is required.

## Documentation

- [web/ARCHITECTURE.md](web/ARCHITECTURE.md) — code architecture and how to
  extend Leetdesign (add a new component, scenario, project, or judge).

## License

Proprietary.
