"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadDesign, saveDesign } from "@/lib/simulator/persistence";
import { useDesignStore } from "@/lib/simulator/store";
import { useTeachingStore } from "@/lib/simulator/teaching-store";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { useCourseStore, ensureMilestoneArchitecture } from "@/lib/simulator/course-store";
import { StudioLayout } from "@/components/studio/studio-layout";
import { ArchitectureWorkspace } from "@/components/simulator/architecture-workspace";

export default function DesignPage() {
  const { designId } = useParams<{ designId: string }>();
  const router = useRouter();
  const loadDesignState = useDesignStore((s) => s.loadDesign);
  const resetTeaching = useTeachingStore((s) => s.resetTeaching);
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const resetCourse = useCourseStore((s) => s.resetCourse);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    resetTeaching();
    resetWorkspace();
    resetCourse();
    let design = loadDesign(designId);
    if (!design) {
      router.replace("/projects");
      return;
    }
    const synced = ensureMilestoneArchitecture(design);
    if (synced !== design) {
      saveDesign(synced);
      design = synced;
    }
    loadDesignState(design);
    setReady(true);
    return () => {
      resetTeaching();
      resetWorkspace();
      resetCourse();
    };
  }, [designId, loadDesignState, router, resetTeaching, resetWorkspace, resetCourse]);

  if (!ready) {
    return (
      <StudioLayout fixedViewport sidebarCollapsed>
        <div className="grid min-h-0 flex-1 place-items-center">
          <div className="text-sm text-[var(--clay-text-subtle)]">Loading design...</div>
        </div>
      </StudioLayout>
    );
  }

  return (
    <StudioLayout fixedViewport sidebarCollapsed>
      <ArchitectureWorkspace />
    </StudioLayout>
  );
}
