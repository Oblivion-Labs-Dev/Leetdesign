"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Route,
} from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { useSimulationStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { findPrimaryTracePath } from "@/lib/simulator/topology";
import { resetEngine } from "@/lib/simulator/engine";
import { ClayThemeToggle } from "@/components/landing/clay-theme-toggle";
import { useCourseStore } from "@/lib/simulator/course-store";
import { getCourseById } from "@/lib/simulator/courses";
import { cn } from "@/lib/utils";

const SPEEDS = [1, 2, 5, 10];

export function WorkspaceTopbar() {
  const router = useRouter();
  const design = useDesignStore((s) => s.design);
  const dirty = useDesignStore((s) => s.dirty);
  const setName = useDesignStore((s) => s.setName);
  const save = useDesignStore((s) => s.save);

  const running = useSimulationStore((s) => s.running);
  const timeScale = useSimulationStore((s) => s.timeScale);
  const toggle = useSimulationStore((s) => s.toggle);
  const setTimeScale = useSimulationStore((s) => s.setTimeScale);

  const setMode = useWorkspaceStore((s) => s.setMode);
  const openBrowseShelf = useWorkspaceStore((s) => s.openBrowseShelf);

  const courseMilestone = useCourseStore((s) => s.getCurrentMilestone());

  const trace = useTeachingStore((s) => s.trace);
  const startTrace = useTeachingStore((s) => s.startTrace);
  const stopTrace = useTeachingStore((s) => s.stopTrace);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => save(), 5000);
    return () => clearTimeout(t);
  }, [dirty, save]);

  const handleExport = () => {
    if (!design) return;
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${design.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTrace = () => {
    if (trace) {
      stopTrace();
      return;
    }
    if (!design) return;
    const { nodeIds, edgeIds } = findPrimaryTracePath(design);
    if (nodeIds.length < 2) return;
    startTrace(nodeIds, edgeIds);
    setMode("run");
  };

  if (!design) return null;

  const course = design.courseId ? getCourseById(design.courseId) : null;

  return (
    <header className="ws-topbar flex shrink-0 items-center justify-between px-3 lg:px-4">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => { save(); router.push("/projects"); }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--clay-text-subtle)] transition-colors hover:bg-[var(--clay-surface-2)] hover:text-[var(--clay-text)]"
          title="Back to designs"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          {course ? (
            <>
              <div className="truncate px-2 text-sm font-semibold text-[var(--clay-text)]">{course.title}</div>
              <div className="truncate px-2 text-[10px] text-[var(--clay-text-subtle)]">
                {courseMilestone
                  ? `Ch.${courseMilestone.chapterNumber} · ${courseMilestone.title}`
                  : "Guided course"}
              </div>
            </>
          ) : (
            <>
              <input
                value={design.name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full max-w-[12rem] truncate rounded-lg bg-transparent px-2 py-0.5 text-sm font-semibold text-[var(--clay-text)] focus:bg-[var(--clay-surface-2)] focus:outline-none lg:max-w-[16rem]"
                spellCheck={false}
              />
              <span className={cn(
                "px-2 text-[10px] font-medium",
                dirty ? "text-amber-500" : "text-[var(--clay-text-subtle)]",
              )}>
                {dirty ? "Unsaved changes" : "Saved"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setMode("run");
            toggle();
          }}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all",
            running
              ? "bg-rose-500/12 text-rose-500 hover:bg-rose-500/20"
              : "bg-gradient-to-b from-[var(--clay-primary)] to-[var(--clay-primary-dark)] text-white shadow-[0_4px_16px_-4px_rgba(107,140,174,0.45)]",
          )}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Pause" : "Run simulation"}
        </button>

        {running && (
          <>
            <button
              type="button"
              onClick={() => { useSimulationStore.getState().stop(); resetEngine(); }}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
              title="Reset simulation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <div className="hidden items-center gap-0.5 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] p-0.5 sm:flex">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTimeScale(s)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
                    timeScale === s
                      ? "bg-[var(--clay-primary)] text-white"
                      : "text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]",
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleTrace}
          disabled={design.nodes.length < 2}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all",
            trace
              ? "border-[var(--clay-primary)] bg-[var(--clay-primary)]/12 text-[var(--clay-primary)]"
              : "border-[var(--clay-border)] text-[var(--clay-text-muted)] hover:border-[var(--clay-primary)]/40",
            design.nodes.length < 2 && "opacity-40",
          )}
        >
          <Route className="h-3.5 w-3.5" />
          {trace ? "Stop trace" : "Trace request"}
        </button>

        {!course && (
          <button
            type="button"
            onClick={() => openBrowseShelf()}
            className="inline-flex h-8 items-center rounded-full bg-[var(--clay-primary)]/12 px-3 text-xs font-semibold text-[var(--clay-primary)] hover:bg-[var(--clay-primary)]/18"
          >
            Add component
          </button>
        )}

        <ClayThemeToggle />

        <button
          type="button"
          onClick={() => save()}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          title="Save"
        >
          <Save className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          title="Export JSON"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
