"use client";

import { useEffect, useRef } from "react";
import { useDesignStore } from "@/lib/simulator/store";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { useCourseStore } from "@/lib/simulator/course-store";
import { startEngine, stopEngine } from "@/lib/simulator/engine";
import { WorkspaceTopbar } from "./workspace-topbar";
import { ComponentRail } from "./component-rail";
import { ComponentShelf } from "./component-shelf";
import { SimulatorCanvas } from "./simulator-canvas";
import { CourseGuidePanel } from "./course-guide-panel";
import { CourseEvolutionTimeline } from "./course-evolution-timeline";
import { ContextInspector, SelectionInspector } from "./context-inspector";
import { MissionDock } from "./mission-dock";
import { applyMilestoneSnapshot } from "@/lib/simulator/course-store";
import { getCourseById, getMilestoneById } from "@/lib/simulator/courses";

export function ArchitectureWorkspace() {
  const shelfOpen = useWorkspaceStore((s) => s.shelfOpen);
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const setInspectorOpen = useWorkspaceStore((s) => s.setInspectorOpen);
  const design = useDesignStore((s) => s.design);
  const selectedNodeId = useDesignStore((s) => s.selectedNodeId);
  const selectedEdgeId = useDesignStore((s) => s.selectedEdgeId);
  const loadDesign = useDesignStore((s) => s.loadDesign);
  const engineStarted = useRef(false);
  const isCourse = Boolean(design?.courseId);

  useEffect(() => {
    if (design?.challengeId) setInspectorOpen(true);
  }, [design?.challengeId, setInspectorOpen]);

  useEffect(() => {
    if (!engineStarted.current) {
      startEngine();
      engineStarted.current = true;
    }
    return () => {
      stopEngine();
      resetWorkspace();
      engineStarted.current = false;
    };
  }, [resetWorkspace]);

  const handleRestoreEvolution = (milestoneId: string) => {
    if (!design?.courseId || !design) return;
    const course = getCourseById(design.courseId);
    const milestone = course ? getMilestoneById(course, milestoneId) : null;
    if (!milestone) return;
    loadDesign(applyMilestoneSnapshot({ ...design, courseMilestoneId: milestoneId }, milestone));
    useCourseStore.getState().goToMilestone(milestoneId);
  };

  return (
    <div className="clay-workspace clay-studio flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <WorkspaceTopbar />
      {isCourse && design?.courseId && (
        <CourseEvolutionTimeline courseId={design.courseId} onRestore={handleRestoreEvolution} />
      )}
      <div className="relative flex min-h-0 flex-1">
        {/* Component rail + shelf only for non-course designs */}
        {!isCourse && <ComponentRail />}
        {!isCourse && shelfOpen && <ComponentShelf />}

        <div className="relative flex min-w-0 flex-1 flex-col p-0">
          <div className="ws-canvas-frame relative mx-3 mb-3 mt-0 flex min-h-0 flex-1 flex-col">
            <SimulatorCanvas />
            {!isCourse && <MissionDock />}
          </div>
        </div>

        <div className="flex min-h-0 shrink-0">
          {isCourse && (selectedNodeId || selectedEdgeId) && <SelectionInspector />}
          {isCourse ? <CourseGuidePanel /> : <ContextInspector />}
        </div>
      </div>
    </div>
  );
}
