"use client";

import { useRef } from "react";
import {
  Boxes,
  Database,
  Zap,
  Radio,
  Server,
  Activity,
  Plus,
} from "lucide-react";
import { CATEGORIES } from "@/lib/simulator/component-registry";
import type { ComponentCategory } from "@/lib/simulator/types";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { cn } from "@/lib/utils";

const RAIL_ICONS: Record<ComponentCategory, typeof Boxes> = {
  core: Boxes,
  storage: Database,
  caching: Zap,
  messaging: Radio,
  infrastructure: Server,
  observability: Activity,
};

export function ComponentRail() {
  const activeCategory = useWorkspaceStore((s) => s.activeCategory);
  const shelfOpen = useWorkspaceStore((s) => s.shelfOpen);
  const shelfMode = useWorkspaceStore((s) => s.shelfMode);
  const openFocusedCategory = useWorkspaceStore((s) => s.openFocusedCategory);
  const openBrowseShelf = useWorkspaceStore((s) => s.openBrowseShelf);
  const closeShelf = useWorkspaceStore((s) => s.closeShelf);
  const railRef = useRef<HTMLElement>(null);

  const handleCategoryClick = (catId: ComponentCategory, index: number) => {
    if (shelfOpen && shelfMode === "focused" && activeCategory === catId) {
      closeShelf();
      return;
    }
    const btnTop = 52 + index * 40;
    openFocusedCategory(catId, btnTop);
  };

  return (
    <nav ref={railRef} className="ws-rail flex shrink-0 flex-col items-center gap-1 py-3" aria-label="Component categories">
      <button
        type="button"
        onClick={() => (shelfOpen && shelfMode === "browse" ? closeShelf() : openBrowseShelf())}
        className={cn("ws-rail-btn mb-1", shelfOpen && shelfMode === "browse" && "ring-1 ring-[var(--clay-primary)]/30")}
        title="Browse all components"
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="my-1 h-px w-6 bg-[var(--clay-border)]" />

      {CATEGORIES.map((cat, index) => {
        const Icon = RAIL_ICONS[cat.id];
        const isActive = shelfOpen && shelfMode === "focused" && activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            data-active={isActive}
            onClick={() => handleCategoryClick(cat.id, index)}
            className="ws-rail-btn"
            title={cat.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </nav>
  );
}
