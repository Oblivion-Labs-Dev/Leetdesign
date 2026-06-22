import Link from "next/link";
import {
  ArrowRight,
  Lock,
  Sparkles,
  Workflow,
  Bot,
  BookOpen,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PROJECTS } from "@/lib/content/projects";
import { BADGES } from "@/lib/badges";
import { SectionHeader } from "@/components/ui/section";
import { Pill } from "@/components/ui/pill";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { BadgeLevel, Difficulty } from "@/types";
import { getCurrentUserProfile } from "@/lib/auth-guard";
import { getCurrentUserLearningStats } from "@/lib/learning-stats";
import { getJourney } from "@/lib/content/journeys";

const RANK: Record<BadgeLevel, number> = {
  intern: 0,
  sde1: 1,
  sde2: 2,
  senior: 3,
  principal: 4,
};

const DIFFICULTY_TO_BADGE: Record<Difficulty, BadgeLevel> = {
  intern: "intern",
  sde1: "sde1",
  sde2: "sde2",
  senior: "senior",
  principal: "principal",
};

export default async function ProjectsPage() {
  const [profile, stats] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserLearningStats(),
  ]);

  const completedIds = new Set(stats.completedProjects.map((p) => p.projectId));
  const inProgressMap = new Map(
    stats.activeProjects.map((p) => [p.projectId, p]),
  );

  return (
    <AppShell title="Projects" subtitle="Pick a guided project gated by your badge level.">
      <SectionHeader
        eyebrow="Catalog"
        title="Build something real, end to end"
        description="Each project starts as a tiny app and grows toward internet scale. Your badge level decides which projects are open today — but the rest are previewable."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((p) => {
          const requiredBadge = DIFFICULTY_TO_BADGE[p.difficulty];
          const locked = RANK[profile.badge] < RANK[requiredBadge];
          const badgeMeta = BADGES[requiredBadge];

          // Progress.
          const journey = getJourney(p.id);
          const totalStages = journey?.stages.length ?? 0;
          const ongoing = inProgressMap.get(p.id);
          const isCompleted = completedIds.has(p.id);
          const stageIndex = ongoing?.stageIndex ?? 0;
          const pct = isCompleted
            ? 100
            : ongoing && totalStages > 0
              ? Math.round(((stageIndex + 1) / totalStages) * 100)
              : 0;
          const status = isCompleted
            ? "Shipped"
            : ongoing
              ? "In progress"
              : "Not started";

          // For locked projects render a non-link wrapper so we never need an
          // onClick handler in this server component (which would crash with
          // "Event handlers cannot be passed to Client Component props").
          const Wrapper: React.ElementType = locked ? "div" : Link;
          const wrapperProps = locked
            ? {
                "aria-disabled": true,
                title: `Reach ${badgeMeta.shortTitle} to unlock this project`,
                className: "block cursor-not-allowed",
              }
            : { href: `/projects/${p.id}` };
          const hasJourney = Boolean(journey);
          return (
            <div key={p.id} className="relative">
              {locked ? (
                <div
                  className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-300"
                  title={`Reach ${badgeMeta.shortTitle} to unlock`}
                >
                  <Lock className="h-3 w-3" />
                  Locked
                </div>
              ) : hasJourney ? (
                <Link
                  href={`/projects/${p.id}/transcript`}
                  className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-[var(--tone-brand-border)] bg-[var(--surface)]/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] backdrop-blur hover:bg-[var(--tone-brand-bg)]"
                  title="Read the full transcript without restarting the project"
                >
                  <BookOpen className="h-3 w-3" />
                  Transcript
                </Link>
              ) : null}

              <Wrapper {...wrapperProps}>
                <Card
                  className={`group h-full transition-all ${
                    locked ? "opacity-80" : "hover:border-violet-500/40"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 text-violet-100">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.paid ? (
                        <Pill tone="warning">Premium</Pill>
                      ) : (
                        <Pill tone="success">Free</Pill>
                      )}
                      <Pill tone="brand">{badgeMeta.shortTitle}+</Pill>
                    </div>
                  </div>
                  <CardTitle>{p.title}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {p.summary}
                  </CardDescription>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                      <span>{status}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div
                        className={`h-1.5 rounded-full ${
                          isCompleted
                            ? "bg-emerald-400"
                            : "bg-gradient-to-r from-violet-500 to-cyan-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--foreground-subtle)]">
                    <span>
                      ~{p.estimatedMinutes} min · {p.tags.join(", ")}
                    </span>
                    {locked ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" /> {badgeMeta.shortTitle}+ required
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        Replay <ArrowRight className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-violet-300">
                        <Sparkles className="h-3 w-3" />
                        {ongoing ? "Resume" : "Start"}
                      </span>
                    )}
                  </div>
                </Card>
              </Wrapper>
            </div>
          );
        })}
      </div>

      {/* Helper bot card — explains what's gated, where to go next. */}
      <ProjectsHelperBot profileBadgeShort={BADGES[profile.badge].shortTitle} />
    </AppShell>
  );
}

function ProjectsHelperBot({
  profileBadgeShort,
}: {
  profileBadgeShort: string;
}) {
  return (
    <div className="surface mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">Guide · Career bot</div>
          <p className="mt-1 max-w-2xl text-sm text-[var(--foreground-muted)]">
            You are a{" "}
            <span className="text-[var(--foreground)]">{profileBadgeShort}</span>{" "}
            right now. Locked projects are visible so you can preview what you
            are working towards. Finish open projects to gain XP and unlock the
            next badge — that&apos;s how the catalog opens up.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] hover:border-violet-500/40 hover:text-violet-200"
        >
          See your progress <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/practice"
          className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20"
        >
          Try Practice instead <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
