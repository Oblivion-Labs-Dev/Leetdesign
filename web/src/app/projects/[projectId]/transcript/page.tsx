import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  PlayCircle,
  BookOpen,
  AlertTriangle,
  Code2,
  GitBranch,
  Trophy,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getProject } from "@/lib/content/projects";
import { getJourney } from "@/lib/content/journeys";
import { ProjectBriefingPanel } from "@/components/projects/briefing-panel";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { COMPONENT_LIBRARY } from "@/lib/content/components";
import type { JourneyStage } from "@/types";

/**
 * Project transcript — full read-only walkthrough of every stage in the
 * project, including the bot's trade-offs, napkin math, and code snippets.
 *
 * Linked from the project card and from inside the workspace, so a user can
 * review everything they learned without restarting the project.
 */
export default async function ProjectTranscriptPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  const journey = getJourney(projectId);
  if (!project || !journey) return notFound();

  // Group stages by phase so the transcript reads like a chaptered book.
  const groups: { phase: string; stages: JourneyStage[] }[] = [];
  for (const s of journey.stages) {
    const phase = s.phase ?? "Untitled phase";
    const last = groups[groups.length - 1];
    if (last && last.phase === phase) last.stages.push(s);
    else groups.push({ phase, stages: [s] });
  }

  return (
    <AppShell
      title={`Transcript · ${project.title}`}
      subtitle="Full walkthrough — briefing, every stage, every trade-off, all the code. Read it without restarting the project."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to project
        </Link>
        <Link href={`/projects/${projectId}`}>
          <Button>
            <PlayCircle className="h-4 w-4" /> Open the live project
          </Button>
        </Link>
      </div>

      {/* Project briefing — Hello-Interview format */}
      {project.briefing ? (
        <section className="mb-10">
          <SectionTitle eyebrow="Project briefing" title="Requirements & design" />
          <ProjectBriefingPanel
            briefing={project.briefing}
            defaultOpen={["functional", "nfr", "entities", "api", "hld", "deep"]}
          />
        </section>
      ) : null}

      <section>
        <SectionTitle
          eyebrow="Project journey"
          title={`${journey.stages.length} stages, grouped into ${groups.length} phases`}
        />

        <div className="space-y-10">
          {groups.map((g, gi) => (
            <div key={gi}>
              <div className="mb-3 flex items-center gap-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
                  Phase {gi + 1}
                </div>
                <h3 className="text-base font-semibold">{g.phase}</h3>
              </div>
              <div className="space-y-4">
                {g.stages.map((s) => (
                  <StageCard key={s.id} stage={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--tone-brand-text)]">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function StageCard({ stage }: { stage: JourneyStage }) {
  const meta = STAGE_META[stage.kind];
  const Icon = meta.icon;
  return (
    <div className="surface space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={meta.tone as "brand" | "danger" | "accent" | "success" | "warning"}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </Pill>
        <h4 className="text-sm font-semibold">{stage.title}</h4>
      </div>
      {stage.subtitle ? (
        <p className="text-xs text-[var(--foreground-muted)]">
          {stage.subtitle}
        </p>
      ) : null}

      <StageBody stage={stage} />

      {stage.botMessage ? (
        <div className="rounded-xl border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)]/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-[var(--tone-brand-text)]">
            Guide (bot)
          </div>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            {stage.botMessage}
          </p>
        </div>
      ) : null}

      {stage.tradeoffs?.length ? (
        <ListBlock label="Trade-offs" items={stage.tradeoffs} tone="brand" />
      ) : null}
      {stage.napkinMath?.length ? (
        <NapkinBlock rows={stage.napkinMath} />
      ) : null}
      {stage.alternatives?.length ? (
        <ListBlock
          label="Alternatives we rejected"
          items={stage.alternatives}
          tone="warning"
        />
      ) : null}
    </div>
  );
}

function StageBody({ stage }: { stage: JourneyStage }) {
  if (stage.kind === "intro") {
    return (
      <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
        <p>{stage.what}</p>
        <p className="italic">{stage.doing}</p>
      </div>
    );
  }
  if (stage.kind === "teach_component") {
    const c = COMPONENT_LIBRARY[stage.componentId];
    return (
      <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
        {c ? (
          <div className="text-xs">
            <span className="text-[var(--tone-accent-text)]">
              {c.label}
            </span>{" "}
            · <code>{c.type}</code>
          </div>
        ) : null}
        <p>
          <strong className="text-[var(--foreground)]">Story:</strong>{" "}
          {stage.story}
        </p>
        <p>
          <strong className="text-[var(--foreground)]">What it is:</strong>{" "}
          {stage.whatItIs}
        </p>
        <p>
          <strong className="text-[var(--foreground)]">What it does:</strong>{" "}
          {stage.whatItDoes}
        </p>
      </div>
    );
  }
  if (stage.kind === "incident") {
    const c = COMPONENT_LIBRARY[stage.expectedComponentId];
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs text-[var(--tone-danger-text)]">
          <AlertTriangle className="h-3.5 w-3.5" /> Severity {stage.severity}
        </div>
        <p className="text-sm text-[var(--foreground-muted)]">
          {stage.storyline}
        </p>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            Symptoms
          </div>
          <ul className="mt-1 grid gap-1 text-xs text-[var(--foreground-muted)] md:grid-cols-2">
            {stage.symptoms.map((s) => (
              <li
                key={s}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2 py-1"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-[var(--foreground-subtle)]">
          The expected fix:{" "}
          <span className="text-[var(--tone-brand-text)]">
            {c?.label ?? stage.expectedComponentId}
          </span>
        </div>
      </div>
    );
  }
  if (stage.kind === "code_edit") {
    return (
      <div className="space-y-2">
        <div className="text-xs text-[var(--foreground-muted)]">
          Branch{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono">
            {stage.branchName}
          </code>{" "}
          · file{" "}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono">
            {stage.fileName}
          </code>{" "}
          · {stage.language}
        </div>
        <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background-soft)] p-3 text-[11px] leading-relaxed">
          <code className="font-mono">{stage.placeholderCode}</code>
        </pre>
      </div>
    );
  }
  if (stage.kind === "ship") {
    return (
      <div className="text-xs text-[var(--foreground-muted)]">
        Branch{" "}
        <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono">
          {stage.branchName}
        </code>{" "}
        · {stage.checks.length} checks ran on the release pipeline.
      </div>
    );
  }
  if (stage.kind === "summary") {
    return (
      <div className="space-y-2">
        <div className="text-xs text-[var(--foreground-muted)]">
          +{stage.rewardXp} XP · +{stage.rewardCurrency} stardust
        </div>
        <ul className="grid gap-1.5 text-xs text-[var(--foreground-muted)] md:grid-cols-2">
          {stage.recap.map((r, i) => (
            <li
              key={i}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5"
            >
              {r}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

function ListBlock({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "brand" | "warning" | "accent";
}) {
  const colorVar =
    tone === "brand"
      ? "var(--tone-brand-text)"
      : tone === "warning"
        ? "var(--tone-warning-text)"
        : "var(--tone-accent-text)";
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-wider"
        style={{ color: colorVar }}
      >
        {label}
      </div>
      <ul className="mt-1 grid gap-1 text-xs text-[var(--foreground-muted)] md:grid-cols-2">
        {items.map((s, i) => (
          <li
            key={i}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5"
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NapkinBlock({ rows }: { rows: { label: string; calc: string }[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--tone-accent-text)]">
        Back of the envelope
      </div>
      <ul className="mt-1 grid gap-1 text-xs md:grid-cols-2">
        {rows.map((r, i) => (
          <li
            key={i}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              {r.label}
            </div>
            <code className="block whitespace-pre-wrap font-mono text-[11px] text-[var(--foreground)]">
              {r.calc}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STAGE_META = {
  intro: { label: "Intro", tone: "brand", icon: Sparkles },
  teach_component: { label: "Lesson", tone: "brand", icon: BookOpen },
  incident: { label: "Incident", tone: "danger", icon: AlertTriangle },
  code_edit: { label: "Code & merge", tone: "accent", icon: Code2 },
  ship: { label: "Release", tone: "accent", icon: GitBranch },
  summary: { label: "Recap", tone: "success", icon: Trophy },
} as const;
