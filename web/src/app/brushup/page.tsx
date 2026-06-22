import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/ui/section";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const TRACKS = [
  {
    title: "OOP fundamentals",
    summary: "Encapsulation, inheritance, polymorphism. Quick theory + 3 problems.",
    tag: "intern",
  },
  {
    title: "SOLID principles",
    summary: "Five principles, when each one applies, anti-patterns.",
    tag: "intern",
  },
  {
    title: "Design patterns",
    summary: "Strategy, Factory, Observer, Adapter — applied in service code.",
    tag: "SE I",
  },
  {
    title: "Distributed systems primer",
    summary: "Consistency, availability, partitioning, latency budgets.",
    tag: "SE I",
  },
];

export default async function BrushupPage() {
  return (
    <AppShell title="Brush-up" subtitle="Short, focused warm-ups before the deep work.">
      <SectionHeader
        eyebrow="Foundations"
        title="Theory paired with quick problems"
        description="These are short modules. Mix them between incidents to keep your fundamentals sharp."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {TRACKS.map((t) => (
          <Card key={t.title} className="hover:border-violet-500/40">
            <div className="flex items-start justify-between">
              <CardTitle>{t.title}</CardTitle>
              <Pill tone="brand">{t.tag}</Pill>
            </div>
            <CardDescription className="mt-2">{t.summary}</CardDescription>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
