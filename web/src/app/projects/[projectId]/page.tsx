import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getProject } from "@/lib/content/projects";
import { getJourney } from "@/lib/content/journeys";
import { getScenario } from "@/lib/content/scenarios";
import { getPracticeForProject } from "@/lib/content/practice";
import { ProjectWorkspace } from "@/components/workspace/project-workspace";
import { JourneyWorkspace } from "@/components/workspace/journey-workspace";
import { backendFetch } from "@/lib/backend-fetch";
import { BRAND } from "@/lib/brand";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProject(projectId);
  if (!project) return notFound();

  const journey = getJourney(projectId);
  const relatedPractice = getPracticeForProject(projectId);

  if (journey) {
    const progress = await backendFetch<{
      item?: { stageIndex: number; status: string };
    }>(`/api/users/me/progress/${encodeURIComponent(projectId)}`);
    const initialStageIndex = progress?.item?.stageIndex ?? 0;
    return (
      <AppShell
        title={project.title}
        subtitle={`Guided journey · ${project.estimatedMinutes} min · ${project.tags.join(" · ")}`}
      >
        <JourneyWorkspace
          journey={journey}
          initialStageIndex={initialStageIndex}
          briefing={project.briefing}
          projectId={projectId}
        />
        {relatedPractice.length > 0 ? (
          <RelatedPractice items={relatedPractice} />
        ) : null}
      </AppShell>
    );
  }

  const scenarioId = project.scenarios[0];
  const scenario = scenarioId ? getScenario(scenarioId) : undefined;

  return (
    <AppShell
      title={project.title}
      subtitle={`Guided project · ${project.estimatedMinutes} min · ${project.tags.join(" · ")}`}
    >
      {scenario ? (
        <ProjectWorkspace scenario={scenario} />
      ) : (
        <div className="surface p-10 text-center text-sm text-[var(--foreground-muted)]">
          This project has no scenarios yet. Check back soon — content team is
          authoring it.
        </div>
      )}
      {relatedPractice.length > 0 ? (
        <RelatedPractice items={relatedPractice} />
      ) : null}
    </AppShell>
  );
}

function RelatedPractice({
  items,
}: {
  items: ReturnType<typeof getPracticeForProject>;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
            Related practice
          </div>
          <h3 className="mt-1 text-lg font-semibold">
            Same shape, harder constraints
          </h3>
        </div>
        <Link
          href="/practice"
          className="text-xs text-violet-300 hover:text-violet-200"
        >
          All practice <ArrowRight className="inline h-3 w-3" />
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/practice/${p.id}`}
            className="surface flex flex-col gap-2 p-4 hover:border-cyan-500/40"
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan-300" /> VP review
              </span>
              <span>
                +{p.rewardXp} XP · +{p.rewardCurrency} {BRAND.currency}
              </span>
            </div>
            <div className="text-sm font-semibold">{p.title}</div>
            <p className="line-clamp-2 text-xs text-[var(--foreground-muted)]">
              {p.prompt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
