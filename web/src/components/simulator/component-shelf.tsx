"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, GripVertical, ArrowRight } from "lucide-react";
import {
  CATEGORIES,
  COMPONENT_REGISTRY,
  SIM_ICON_MAP,
} from "@/lib/simulator/component-registry";
import { useDesignStore } from "@/lib/simulator/store";
import { useWorkspaceStore } from "@/lib/simulator/workspace-store";
import { useCourseStore } from "@/lib/simulator/course-store";
import type { SimComponentType, ComponentCategory } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

/** Human-friendly sub-groups within a category */
const STORAGE_GROUPS: { label: string; types: SimComponentType[] }[] = [
  { label: "Relational & document", types: ["sql_database", "nosql_database", "graph_database"] },
  { label: "Search & analytics", types: ["search_index", "time_series_db", "data_warehouse", "data_lake"] },
  { label: "Object & blob", types: ["object_storage"] },
];

const CORE_GROUPS: { label: string; types: SimComponentType[] }[] = [
  { label: "Entry & routing", types: ["client", "load_balancer", "api_gateway", "reverse_proxy"] },
  { label: "Compute", types: ["app_server", "web_server"] },
  { label: "Protection", types: ["rate_limiter"] },
];

const CATEGORY_GROUPS: Partial<Record<ComponentCategory, { label: string; types: SimComponentType[] }[]>> = {
  storage: STORAGE_GROUPS,
  core: CORE_GROUPS,
};

export function ComponentShelf() {
  const closeShelf = useWorkspaceStore((s) => s.closeShelf);
  const shelfMode = useWorkspaceStore((s) => s.shelfMode);
  const activeCategory = useWorkspaceStore((s) => s.activeCategory);
  const categoryAnchorTop = useWorkspaceStore((s) => s.categoryAnchorTop);
  const openBrowseShelf = useWorkspaceStore((s) => s.openBrowseShelf);
  const setActiveCategory = useWorkspaceStore((s) => s.setActiveCategory);

  const design = useDesignStore((s) => s.design);
  const getCurrentMilestone = useCourseStore((s) => s.getCurrentMilestone);
  const progress = useCourseStore((s) => s.progress);
  const milestone = getCurrentMilestone();
  const suggestedType =
    progress?.phase === "suggested_solution" || progress?.phase === "learner_action"
      ? milestone?.suggestedComponent
      : undefined;
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShelf();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeShelf]);

  const query = search.toLowerCase().trim();
  const onCanvas = useMemo(
    () => new Set(design?.nodes.map((n) => n.type) ?? []),
    [design?.nodes],
  );

  const categoryDef = activeCategory ? CATEGORIES.find((c) => c.id === activeCategory) : null;

  const categoryTypes = useMemo(() => {
    if (!categoryDef) return [];
    return categoryDef.types.filter((t) => {
      if (!query) return true;
      const def = COMPONENT_REGISTRY[t];
      return def.label.toLowerCase().includes(query) || def.explain.toLowerCase().includes(query);
    });
  }, [categoryDef, query]);

  if (shelfMode === "focused" && activeCategory && categoryDef) {
    const groups = CATEGORY_GROUPS[activeCategory];
    const ungrouped = groups
      ? categoryTypes.filter((t) => !groups.some((g) => g.types.includes(t)))
      : categoryTypes;

    return (
      <>
        <button
          type="button"
          aria-label="Close picker"
          className="absolute inset-0 z-20 bg-transparent"
          onClick={closeShelf}
        />
        <aside
          className="ws-shelf-focused z-30 flex flex-col"
          style={{ top: categoryAnchorTop }}
        >
          <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-3 py-2.5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                Add
              </div>
              <div className="text-sm font-semibold text-[var(--clay-text)]">{categoryDef.label}</div>
            </div>
            <button
              type="button"
              onClick={closeShelf}
              className="grid h-6 w-6 place-items-center rounded-md text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-[min(420px,55vh)] overflow-y-auto p-2">
            {suggestedType && categoryTypes.includes(suggestedType) && (
              <div className="mb-2 border-b border-[var(--clay-primary)]/20 pb-2">
                <div className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-primary)]">
                  Suggested for this step
                </div>
                <CompactTile type={suggestedType} onCanvas={onCanvas.has(suggestedType)} highlighted />
              </div>
            )}
            {groups ? (
              <>
                {groups.map((group) => {
                  const types = group.types.filter((t) => categoryTypes.includes(t));
                  if (types.length === 0) return null;
                  return (
                    <div key={group.label} className="mb-3">
                      <div className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
                        {group.label}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {types.map((type) => (
                          <CompactTile
                            key={type}
                            type={type}
                            onCanvas={onCanvas.has(type)}
                            highlighted={type === suggestedType}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {ungrouped.length > 0 && (
                  <div className="grid grid-cols-2 gap-1">
                    {ungrouped.map((type) => (
                      <CompactTile key={type} type={type} onCanvas={onCanvas.has(type)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {categoryTypes.map((type) => (
                  <CompactTile key={type} type={type} onCanvas={onCanvas.has(type)} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[var(--clay-border)] p-2">
            <button
              type="button"
              onClick={openBrowseShelf}
              className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold text-[var(--clay-primary)] hover:bg-[var(--clay-primary)]/8"
            >
              Search all components <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Browse mode — full shelf with search only
  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    types: cat.types.filter((t) => {
      if (!query) return true;
      const def = COMPONENT_REGISTRY[t];
      return def.label.toLowerCase().includes(query) || def.explain.toLowerCase().includes(query);
    }),
  })).filter((c) => c.types.length > 0);

  const visibleCategories = activeCategory
    ? filteredCategories.filter((c) => c.id === activeCategory)
    : filteredCategories;

  return (
    <>
      <button
        type="button"
        aria-label="Close component shelf"
        className="absolute inset-0 z-20 bg-[var(--clay-bg)]/20 backdrop-blur-[1px]"
        onClick={closeShelf}
      />
      <aside className="ws-shelf z-30 flex flex-col animate-in slide-in-from-left-2 duration-200">
        <div className="flex items-center justify-between border-b border-[var(--clay-border)] px-4 py-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              Browse
            </div>
            <div className="text-sm font-semibold text-[var(--clay-text)]">All components</div>
          </div>
          <button
            type="button"
            onClick={closeShelf}
            className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-[var(--clay-border)] px-3 py-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--clay-text-subtle)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or role..."
              className="h-9 w-full rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)] pl-9 pr-3 text-xs text-[var(--clay-text)] placeholder:text-[var(--clay-text-subtle)] focus:border-[var(--clay-primary)]/50 focus:outline-none"
              autoFocus
            />
          </label>
        </div>

        {!query && (
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--clay-border)] px-3 py-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={cn(
                "shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold",
                !activeCategory ? "bg-[var(--clay-primary)]/14 text-[var(--clay-primary)]" : "text-[var(--clay-text-subtle)]",
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold",
                  activeCategory === cat.id ? "bg-[var(--clay-primary)]/14 text-[var(--clay-primary)]" : "text-[var(--clay-text-subtle)]",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {visibleCategories.map((cat) => (
            <div key={cat.id} className="mb-3">
              {!activeCategory && !query && (
                <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--clay-text-subtle)]">
                  {cat.label}
                </div>
              )}
              {cat.types.map((type) => (
                <BrowseTile key={type} type={type} onCanvas={onCanvas.has(type)} />
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

function CompactTile({ type, onCanvas, highlighted }: { type: SimComponentType; onCanvas?: boolean; highlighted?: boolean }) {
  const def = COMPONENT_REGISTRY[type];
  const Icon = SIM_ICON_MAP[type];
  const pushRecent = useWorkspaceStore((s) => s.pushRecent);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/sim-component-type", type);
        e.dataTransfer.effectAllowed = "copy";
        pushRecent(type);
      }}
      title={def.explain}
      className={cn(
        "group flex cursor-grab flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all",
        highlighted
          ? "border-[var(--clay-primary)]/50 bg-[var(--clay-primary)]/10 ring-2 ring-[var(--clay-primary)]/20"
          : "border-transparent hover:border-[var(--clay-border)] hover:bg-[var(--clay-surface-2)]",
        "active:cursor-grabbing",
        onCanvas && "opacity-60",
      )}
    >
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--clay-primary)]/10">
        <Icon className="h-4 w-4 text-[var(--clay-primary)]" />
      </div>
      <span className="line-clamp-2 text-[10px] font-medium leading-tight text-[var(--clay-text)]">
        {def.label}
      </span>
    </div>
  );
}

function BrowseTile({ type, onCanvas }: { type: SimComponentType; onCanvas?: boolean }) {
  const def = COMPONENT_REGISTRY[type];
  const Icon = SIM_ICON_MAP[type];
  const pushRecent = useWorkspaceStore((s) => s.pushRecent);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/sim-component-type", type);
        e.dataTransfer.effectAllowed = "copy";
        pushRecent(type);
      }}
      className="group mb-0.5 flex cursor-grab items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-[var(--clay-surface-2)] active:cursor-grabbing"
    >
      <GripVertical className="h-3 w-3 shrink-0 text-[var(--clay-text-subtle)] opacity-0 group-hover:opacity-100" />
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--clay-primary)]/10">
        <Icon className="h-3.5 w-3.5 text-[var(--clay-primary)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-[var(--clay-text)]">{def.label}</div>
      </div>
      {onCanvas && (
        <span className="shrink-0 text-[8px] font-semibold text-[var(--clay-text-subtle)]">added</span>
      )}
    </div>
  );
}
