import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/ui/section";
import { TaskboardClient, type TaskboardTask } from "@/components/taskboard/taskboard-client";
import { requireAuth } from "@/lib/auth-guard";

const TASKS: TaskboardTask[] = [
  {
    id: "t1",
    title: "Triage Tiny.link redirect incident",
    projectId: "url-shortener",
    status: "in_progress",
    priority: "high",
  },
  {
    id: "t2",
    title: "Author runbook for cache eviction",
    projectId: "url-shortener",
    status: "todo",
    priority: "med",
  },
  {
    id: "t3",
    title: "Update on-call rotation",
    status: "committed",
    priority: "low",
  },
  {
    id: "t4",
    title: "VP review · global URL shortener",
    projectId: "url-shortener",
    status: "under_review",
    priority: "high",
  },
  {
    id: "t5",
    title: "Refactor analytics emitter",
    projectId: "url-shortener",
    status: "done",
    priority: "med",
  },
  {
    id: "t6",
    title: "Onboarding: read brush-up",
    status: "done",
    priority: "low",
  },
  {
    id: "t7",
    title: "Add gateway rate-limit middleware",
    projectId: "url-shortener",
    status: "in_progress",
    priority: "high",
  },
  {
    id: "t8",
    title: "Bench Redis hit-rate after deploy",
    projectId: "url-shortener",
    status: "todo",
    priority: "med",
  },
  {
    id: "t9",
    title: "Practice: Design a feature flag service",
    status: "todo",
    priority: "low",
  },
];

export default async function TasksPage() {
  await requireAuth();
  return (
    <AppShell
      title="Taskboard"
      subtitle="Your work for the week, kanban style."
    >
      <SectionHeader
        eyebrow="Sprint"
        title="What you're shipping"
        description="Tasks reflect both incident work and practice exercises. Cards move from To do all the way to Done as you ship."
      />
      <TaskboardClient tasks={TASKS} />
    </AppShell>
  );
}
