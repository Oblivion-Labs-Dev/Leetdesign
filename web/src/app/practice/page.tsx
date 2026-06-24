import Link from "next/link";
import { ArrowRight, Sparkles, Layers } from "lucide-react";
import { StudioPageShell } from "@/components/studio/studio-page-shell";
import { PRACTICE_EXERCISES } from "@/lib/content/practice";
import { PROJECTS } from "@/lib/content/projects";
import { SectionHeader } from "@/components/ui/section";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { BRAND } from "@/lib/brand";

export default async function PracticeIndexPage() {
  const linked = PRACTICE_EXERCISES.filter((p) => p.projectId);
  const standalone = PRACTICE_EXERCISES.filter((p) => !p.projectId);
  const projectMap = new Map(PROJECTS.map((p) => [p.id, p.shortTitle]));

  return (
    <StudioPageShell>
      <SectionHeader
        eyebrow="Free-build mode"
        title="Design from scratch, defend it in review"
        description="Practice exercises hand you a prompt and an inventory. You build the architecture and submit it. The VP review meeting grades correctness, reliability, scalability, cost, and clarity."
      />

      {linked.length > 0 ? (
        <section className="mt-2">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
            <Layers className="h-3.5 w-3.5" /> Reinforce a project you finished
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {linked.map((p) => (
              <PracticeCard
                key={p.id}
                ex={p}
                fromProject={projectMap.get(p.projectId!)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
          <Sparkles className="h-3.5 w-3.5" /> Standalone problems
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {standalone.map((p) => (
            <PracticeCard key={p.id} ex={p} />
          ))}
        </div>
      </section>
    </StudioPageShell>
  );
}

function PracticeCard({
  ex,
  fromProject,
}: {
  ex: (typeof PRACTICE_EXERCISES)[number];
  fromProject?: string;
}) {
  return (
    <Link href={`/practice/${ex.id}`}>
      <Card className="group h-full hover:border-cyan-500/40">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/30 text-cyan-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fromProject ? <Pill tone="brand">{fromProject}</Pill> : null}
            <Pill tone="accent">VP review</Pill>
          </div>
        </div>
        <CardTitle>{ex.title}</CardTitle>
        <CardDescription className="mt-1 line-clamp-3">
          {ex.prompt}
        </CardDescription>
        <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--foreground-subtle)]">
          <span>
            +{ex.rewardXp} XP · +{ex.rewardCurrency} {BRAND.currency}
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
