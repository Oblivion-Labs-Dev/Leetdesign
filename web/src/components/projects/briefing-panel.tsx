"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Target,
  Gauge,
  Boxes,
  Code2,
  Network,
  Microscope,
} from "lucide-react";
import type { ProjectBriefing, ApiSpec } from "@/types";
import { Pill } from "@/components/ui/pill";

/**
 * Hello-Interview style problem brief.
 *
 * Renders the project's full requirements document so the user has the
 * complete picture before they start (and can return to it from the
 * transcript page after they finish). Sections collapse independently so
 * the user can focus on whichever part of the brief they care about.
 *
 * Sections (in this exact order):
 *   1. Functional requirements
 *   2. Non-functional requirements
 *   3. Core entities
 *   4. API / interfaces
 *   5. High-level design
 *   6. Deep dives (one per non-functional requirement)
 */
export function ProjectBriefingPanel({
  briefing,
  defaultOpen = ["functional", "nfr", "entities"],
  variant = "default",
}: {
  briefing: ProjectBriefing;
  defaultOpen?: string[];
  /**
   * "compact" hides the one-liner header so the panel can be embedded inside
   * another container that already shows the project title.
   */
  variant?: "default" | "compact";
}) {
  return (
    <div className="space-y-3">
      {variant === "default" ? (
        <div className="surface p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
            Problem statement
          </div>
          <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">
            {briefing.oneLiner}
          </p>
        </div>
      ) : null}

      <Section
        id="functional"
        defaultOpen={defaultOpen.includes("functional")}
        icon={Target}
        eyebrow="1 — Functional requirements"
        title="What the user can do"
      >
        <ul className="grid gap-2 text-sm text-[var(--foreground-muted)] md:grid-cols-2">
          {briefing.functional.map((f, i) => (
            <li
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2"
            >
              {f}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="nfr"
        defaultOpen={defaultOpen.includes("nfr")}
        icon={Gauge}
        eyebrow="2 — Non-functional requirements"
        title="How well it has to work"
      >
        <ul className="grid gap-2 text-sm text-[var(--foreground-muted)]">
          {briefing.nonFunctional.map((n, i) => (
            <li
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2"
            >
              {n}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="entities"
        defaultOpen={defaultOpen.includes("entities")}
        icon={Boxes}
        eyebrow="3 — Core entities"
        title="The domain we are designing around"
      >
        <ul className="grid gap-2 text-sm text-[var(--foreground-muted)] md:grid-cols-3">
          {briefing.coreEntities.map((e) => (
            <li
              key={e.name}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-2"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--tone-accent-text)]">
                {e.name}
              </div>
              <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
                {e.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="api"
        defaultOpen={defaultOpen.includes("api")}
        icon={Code2}
        eyebrow="4 — API / Interfaces"
        title="Public surface area"
      >
        <div className="space-y-2">
          {briefing.api.map((spec) => (
            <ApiCard key={spec.method + spec.path} spec={spec} />
          ))}
        </div>
      </Section>

      <Section
        id="hld"
        defaultOpen={defaultOpen.includes("hld")}
        icon={Network}
        eyebrow="5 — High-level design"
        title="Where every request flows"
      >
        <p className="text-sm text-[var(--foreground-muted)]">
          {briefing.highLevel.paragraph}
        </p>
        <ul className="mt-3 grid gap-1.5 text-xs text-[var(--foreground-muted)]">
          {briefing.highLevel.bullets.map((b, i) => (
            <li
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5"
            >
              {b}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="deep"
        defaultOpen={defaultOpen.includes("deep")}
        icon={Microscope}
        eyebrow="6 — Deep dives"
        title="One deep dive per non-functional requirement"
      >
        <div className="space-y-3">
          {briefing.deepDives.map((d, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)]/60 p-4"
            >
              <div className="text-sm font-semibold">{d.title}</div>
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--foreground-muted)]">
                {d.body}
              </p>
              {d.takeaways && d.takeaways.length > 0 ? (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--tone-accent-text)]">
                    Key takeaways
                  </div>
                  <ul className="mt-1 grid gap-1 text-xs text-[var(--foreground-muted)]">
                    {d.takeaways.map((t, j) => (
                      <li
                        key={j}
                        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  id: _id,
  icon: Icon,
  eyebrow,
  title,
  children,
  defaultOpen = false,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--surface-2)]/40"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--tone-brand-bg)] text-[var(--tone-brand-text)]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
              {eyebrow}
            </div>
            <div className="text-sm font-semibold">{title}</div>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="b"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border)] px-5 py-4">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ApiCard({ spec }: { spec: ApiSpec }) {
  const tone =
    spec.method === "GET"
      ? "success"
      : spec.method === "POST"
        ? "brand"
        : spec.method === "DELETE"
          ? "danger"
          : "accent";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3">
      <div className="flex items-center gap-2">
        <Pill tone={tone}>{spec.method}</Pill>
        <code className="rounded bg-[var(--background-soft)] px-2 py-0.5 font-mono text-xs">
          {spec.path}
        </code>
      </div>
      {spec.body ? (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            Body
          </div>
          <pre className="mt-1 overflow-x-auto rounded-md bg-[var(--background-soft)] p-2 text-[11px] text-[var(--foreground)]">
            {`{\n${Object.entries(spec.body)
              .map(([k, v]) => `  ${k}: ${v}`)
              .join(",\n")}\n}`}
          </pre>
        </div>
      ) : null}
      {spec.query ? (
        <div className="mt-2">
          <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            Query
          </div>
          <pre className="mt-1 overflow-x-auto rounded-md bg-[var(--background-soft)] p-2 text-[11px] text-[var(--foreground)]">
            {`?${Object.entries(spec.query)
              .map(([k, v]) => `${k}=${v}`)
              .join("&")}`}
          </pre>
        </div>
      ) : null}
      <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        Returns
      </div>
      <code className="mt-1 block rounded-md bg-[var(--background-soft)] px-2 py-1 text-[11px]">
        {spec.returns}
      </code>
      {spec.notes ? (
        <p className="mt-2 text-[11px] italic text-[var(--foreground-subtle)]">
          {spec.notes}
        </p>
      ) : null}
    </div>
  );
}
