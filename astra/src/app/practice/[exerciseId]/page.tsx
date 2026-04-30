import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getPractice } from "@/lib/content/practice";
import { PracticeWorkspace } from "@/components/workspace/practice-workspace";
import { requireAuth } from "@/lib/auth-guard";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  await requireAuth();
  const { exerciseId } = await params;
  const exercise = getPractice(exerciseId);
  if (!exercise) return notFound();

  return (
    <AppShell
      title={exercise.title}
      subtitle="Build the system. Defend it in the review meeting."
    >
      <PracticeWorkspace exercise={exercise} />
    </AppShell>
  );
}
