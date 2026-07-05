# LeetDesign documentation

Living docs for the **LeetDesign** system-design simulator. Update these alongside code changes so future contributors (human or agent) can catch up quickly.

## Start here

| Doc | Purpose |
|-----|---------|
| [AGENT-HANDOFF.md](./AGENT-HANDOFF.md) | **Fast onboarding** — current branch focus, key files, do/don't |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Repo layout, stack, persistence, routes |
| [SIMULATOR.md](./SIMULATOR.md) | Simulation engine, stores, UI workspace, courses |
| [TRAFFIC-CONTRACTS.md](./TRAFFIC-CONTRACTS.md) | Architecture validation (why Client→DB fails) |
| [COMPONENT-MODEL.md](./COMPONENT-MODEL.md) | Component registry, config fields, inspector Basics/Advanced |

## Conventions for maintaining docs

1. **Update docs in the same PR/session as behavioral changes** — especially `traffic-contracts.ts`, `engine.ts`, and `component-registry.ts`.
2. **Record decisions, not just APIs** — include *why* (e.g. "layer rules rejected; we use traffic envelopes").
3. **Mark open questions** explicitly under **Open / TODO** sections so agents don't re-debate settled choices.
4. **Keep file paths accurate** — simulator code lives under `web/src/lib/simulator/`, UI under `web/src/components/simulator/`.

## Related (may be stale)

- [web/ARCHITECTURE.md](../web/ARCHITECTURE.md) — older MVP pipeline/journey doc; partially outdated.
- [web/README.md](../web/README.md) — app routes and dev commands.

When in conflict, **prefer this `docs/` folder** for simulator and architecture-validation behavior.
