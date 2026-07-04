import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { getComponent } from "@/lib/content/components";
import { COMPONENT_ICONS } from "@/components/pipeline/icon-map";
import { Card, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type { ComponentType } from "@/types";
import { getCurrentUserLearningStats } from "@/lib/learning-stats";

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ componentId: string }>;
}) {
  const { componentId } = await params;
  const c = getComponent(componentId);
  if (!c) return notFound();
  const stats = await getCurrentUserLearningStats();
  const seenSet = new Set(stats.componentsSeen.map((x) => x.componentId));
  if (!seenSet.has(componentId)) {
    redirect("/library");
  }
  const Icon = COMPONENT_ICONS[c.type as ComponentType];

  return (
    <AppShell title={c.label} subtitle={c.type.replace("_", " ")}>
      <Link
        href="/library"
        className="mb-4 inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3 w-3" /> Back to library
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="clay-icon-tile grid h-12 w-12 place-items-center rounded-xl">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{c.label}</CardTitle>
                <div className="text-xs text-[var(--foreground-muted)]">
                  {c.shortDescription}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>When to use it</CardTitle>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              {c.whenToUse}
            </p>
          </Card>

          <Card>
            <CardTitle>Trade-offs</CardTitle>
            <ul className="mt-2 space-y-1 text-sm text-[var(--foreground-muted)]">
              {c.tradeoffs.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <CardTitle>Used in scenarios</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="brand">URL Shortener</Pill>
            <Pill tone="accent">Practice: Global URL Shortener</Pill>
          </div>
          <p className="mt-3 text-xs text-[var(--foreground-muted)]">
            Want to see this component in action? Pick a guided project and
            look for it in the live pipeline.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
