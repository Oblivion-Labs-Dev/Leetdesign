"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { PROJECTS } from "@/lib/content/projects";

export interface TaskboardTask {
  id: string;
  title: string;
  projectId?: string;
  status: "todo" | "in_progress" | "committed" | "under_review" | "done";
  priority: "low" | "med" | "high";
}

const COLUMNS: {
  id: TaskboardTask["status"];
  title: string;
  tone: "neutral" | "brand" | "warning" | "accent" | "success";
}[] = [
  { id: "todo", title: "To do", tone: "neutral" },
  { id: "in_progress", title: "In progress", tone: "brand" },
  { id: "committed", title: "Committed", tone: "warning" },
  { id: "under_review", title: "Under review", tone: "accent" },
  { id: "done", title: "Done", tone: "success" },
];

const PRIORITY_TONE: Record<TaskboardTask["priority"], "neutral" | "warning" | "danger"> = {
  low: "neutral",
  med: "warning",
  high: "danger",
};

type ViewMode = "kanban" | "list";

export function TaskboardClient({ tasks }: { tasks: TaskboardTask[] }) {
  const [project, setProject] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("kanban");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (project !== "all" && (t.projectId ?? "general") !== project) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (status !== "all" && t.status !== status) return false;
      return true;
    });
  }, [tasks, project, priority, status]);

  const projectOptions = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => ids.add(t.projectId ?? "general"));
    const items: { id: string; label: string }[] = [];
    items.push({ id: "all", label: "All projects" });
    Array.from(ids).forEach((id) => {
      const proj = PROJECTS.find((p) => p.id === id);
      items.push({ id, label: proj?.shortTitle ?? id });
    });
    return items;
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="surface flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[var(--foreground-subtle)]">
            <Filter className="h-3.5 w-3.5" /> Filters
          </span>
          <Select
            value={project}
            onChange={setProject}
            options={projectOptions}
            ariaLabel="Filter by project"
          />
          <Select
            value={priority}
            onChange={setPriority}
            options={[
              { id: "all", label: "All priorities" },
              { id: "high", label: "High" },
              { id: "med", label: "Medium" },
              { id: "low", label: "Low" },
            ]}
            ariaLabel="Filter by priority"
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { id: "all", label: "All statuses" },
              ...COLUMNS.map((c) => ({ id: c.id, label: c.title })),
            ]}
            ariaLabel="Filter by status"
          />
        </div>
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
          <ViewBtn
            active={view === "kanban"}
            onClick={() => setView("kanban")}
            icon={LayoutGrid}
            label="Kanban"
          />
          <ViewBtn
            active={view === "list"}
            onClick={() => setView("list")}
            icon={List}
            label="List"
          />
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = filtered.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="surface-2 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                    {col.title}
                  </div>
                  <Pill tone={col.tone}>{items.length}</Pill>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <Card key={t.id} className="p-3">
                      <div className="text-sm font-medium leading-tight">
                        {t.title}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                        <span className="truncate">
                          {t.projectId
                            ? (PROJECTS.find((p) => p.id === t.projectId)
                                ?.shortTitle ?? t.projectId)
                            : "General"}
                        </span>
                        <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                      </div>
                    </Card>
                  ))}
                  {items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[var(--border)] px-2 py-3 text-center text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                      Nothing here
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="surface hidden overflow-hidden md:block">
            <div className="grid grid-cols-[1fr_140px_120px_100px] gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              <div>Title</div>
              <div>Project</div>
              <div>Status</div>
              <div className="text-right">Priority</div>
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--foreground-muted)]">
                No tasks match the current filters.
              </div>
            ) : (
              filtered.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_140px_120px_100px] gap-2 border-b border-[var(--border)] px-4 py-2.5 text-sm last:border-b-0 hover:bg-[var(--surface-2)]/50"
                >
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-[var(--foreground-muted)]">
                    {t.projectId
                      ? (PROJECTS.find((p) => p.id === t.projectId)?.shortTitle ??
                        t.projectId)
                      : "General"}
                  </div>
                  <div className="text-[var(--foreground-muted)]">
                    {COLUMNS.find((c) => c.id === t.status)?.title}
                  </div>
                  <div className="text-right">
                    <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 md:hidden">
            {filtered.length === 0 ? (
              <div className="surface px-4 py-6 text-center text-sm text-[var(--foreground-muted)]">
                No tasks match the current filters.
              </div>
            ) : (
              filtered.map((t) => (
                <Card key={t.id} className="p-3">
                  <div className="text-sm font-medium leading-tight">{t.title}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                        Project
                      </div>
                      <div className="mt-0.5 text-[var(--foreground-muted)]">
                        {t.projectId
                          ? (PROJECTS.find((p) => p.id === t.projectId)?.shortTitle ??
                            t.projectId)
                          : "General"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
                        Status
                      </div>
                      <div className="mt-0.5 text-[var(--foreground-muted)]">
                        {COLUMNS.find((c) => c.id === t.status)?.title}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--foreground)] outline-none hover:border-[var(--border-strong)] focus:border-violet-500/40"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id} className="bg-[var(--background-elevated)]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ViewBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] uppercase tracking-wider ${
        active
          ? "bg-[var(--surface-2)] text-[var(--foreground)]"
          : "text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
      }`}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
