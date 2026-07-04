"use client";

import { useState } from "react";
import { Search, HelpCircle, X, ChevronRight, GripVertical } from "lucide-react";
import { CATEGORIES, COMPONENT_REGISTRY, SIM_ICON_MAP } from "@/lib/simulator/component-registry";
import type { SimComponentType, ComponentCategory, ArchLayer } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

const LAYER_ACCENT: Record<ArchLayer, string> = {
  client_layer:        "#3b82f6",
  edge_layer:          "#14b8a6",
  gateway_layer:       "#a78bfa",
  service_layer:       "#818cf8",
  data_layer:          "#f59e0b",
  async_layer:         "#10b981",
  infra_layer:         "#94a3b8",
  observability_layer: "#ec4899",
};

const CATEGORY_COLORS: Record<ComponentCategory, { accent: string; bg: string }> = {
  core:          { accent: "#818cf8", bg: "bg-indigo-500/10" },
  storage:       { accent: "#f59e0b", bg: "bg-amber-500/10" },
  caching:       { accent: "#10b981", bg: "bg-emerald-500/10" },
  messaging:     { accent: "#10b981", bg: "bg-emerald-500/10" },
  infrastructure:{ accent: "#94a3b8", bg: "bg-slate-500/10" },
  observability: { accent: "#ec4899", bg: "bg-pink-500/10" },
};

export function ComponentPalette() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | null>(null);
  const [expandedHelp, setExpandedHelp] = useState<SimComponentType | null>(null);

  const query = search.toLowerCase().trim();

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    types: cat.types.filter((t) => {
      if (!query) return true;
      const def = COMPONENT_REGISTRY[t];
      return (
        def.label.toLowerCase().includes(query) ||
        def.explain.toLowerCase().includes(query) ||
        t.includes(query)
      );
    }),
  })).filter((cat) => cat.types.length > 0);

  const visibleCategories = activeCategory
    ? filteredCategories.filter((c) => c.id === activeCategory)
    : filteredCategories;

  return (
    <div className="flex h-full w-[250px] shrink-0 flex-col border-r border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md lg:w-[270px]">
      {/* Header with search */}
      <div className="border-b border-[var(--clay-border)] p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--clay-text-subtle)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="h-9 w-full rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)] pl-9 pr-3 text-xs text-[var(--clay-text)] placeholder:text-[var(--clay-text-subtle)] focus:border-[var(--clay-primary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--clay-primary)]/20"
          />
        </label>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--clay-border)] px-3 py-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={cn(
            "rounded-lg px-2 py-1 text-[10px] font-semibold transition-all",
            !activeCategory
              ? "bg-[var(--clay-primary)]/15 text-[var(--clay-primary)]"
              : "text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]",
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const cc = CATEGORY_COLORS[cat.id];
          const isActive = activeCategory === cat.id;
          const count = filteredCategories.find((c) => c.id === cat.id)?.types.length ?? 0;
          if (count === 0 && query) return null;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(isActive ? null : cat.id)}
              className={cn(
                "rounded-lg px-2 py-1 text-[10px] font-semibold transition-all",
                isActive
                  ? `${cc.bg} text-[var(--clay-text)]`
                  : "text-[var(--clay-text-subtle)] hover:text-[var(--clay-text)]",
              )}
            >
              {cat.label}
              {query && <span className="ml-1 text-[9px] opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto">
        {visibleCategories.map((cat) => (
          <div key={cat.id}>
            <div className="sticky top-0 z-10 bg-[var(--clay-surface)]/95 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: CATEGORY_COLORS[cat.id].accent }}
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--clay-text-subtle)]">
                  {cat.label}
                </span>
                <span className="ml-auto text-[9px] tabular-nums text-[var(--clay-text-subtle)]">
                  {cat.types.length}
                </span>
              </div>
            </div>
            <div className="px-2 pb-2">
              {cat.types.map((type) => (
                <PaletteTile
                  key={type}
                  type={type}
                  isExpanded={expandedHelp === type}
                  onToggleHelp={() => setExpandedHelp(expandedHelp === type ? null : type)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaletteTile({
  type,
  isExpanded,
  onToggleHelp,
}: {
  type: SimComponentType;
  isExpanded: boolean;
  onToggleHelp: () => void;
}) {
  const def = COMPONENT_REGISTRY[type];
  const Icon = SIM_ICON_MAP[type];
  const accent = LAYER_ACCENT[def.layer];

  return (
    <div className="relative mb-0.5">
      <div
        className={cn(
          "group flex items-center rounded-xl transition-all",
          "hover:bg-[var(--clay-surface-2)]",
          isExpanded && "bg-[var(--clay-surface-2)]",
        )}
      >
        {/* Drag handle area */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/sim-component-type", type);
            e.dataTransfer.effectAllowed = "copy";
          }}
          className="flex flex-1 cursor-grab items-center gap-2.5 px-2 py-2 active:cursor-grabbing"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-[var(--clay-text-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              style={{ background: `${accent}15` }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium leading-tight text-[var(--clay-text)]">
              {def.label}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleHelp(); }}
          className={cn(
            "mr-2 grid h-5 w-5 shrink-0 place-items-center rounded transition-all",
            isExpanded
              ? "bg-[var(--clay-surface-2)] text-[var(--clay-text)]"
              : "text-[var(--clay-text-subtle)] opacity-0 group-hover:opacity-100 hover:text-[var(--clay-text)]",
          )}
        >
          {isExpanded ? <X className="h-2.5 w-2.5" /> : <HelpCircle className="h-3 w-3" />}
        </button>
      </div>

      {/* Expanded help card */}
      {isExpanded && (
        <div className="mx-2 mb-1 rounded-lg border border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-3">
          <p className="text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
            {def.explain}
          </p>
          <div className="mt-2 rounded bg-[var(--clay-surface-2)] p-2">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">Think of it like...</span>
            <p className="mt-0.5 text-[10px] italic text-[var(--clay-text-muted)]">&quot;{def.analogy}&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
}
