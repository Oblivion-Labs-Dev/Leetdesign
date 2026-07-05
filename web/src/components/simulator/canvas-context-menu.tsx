"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  CATEGORIES,
  COMPONENT_REGISTRY,
  SIM_ICON_MAP,
} from "@/lib/simulator/component-registry";
import { useCourseStore } from "@/lib/simulator/course-store";
import type { SimComponentType } from "@/lib/simulator/types";
import { cn } from "@/lib/utils";

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onSelect: (type: SimComponentType) => void;
  onClose: () => void;
}

export function CanvasContextMenu({ x, y, onSelect, onClose }: CanvasContextMenuProps) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const milestone = useCourseStore((s) => s.getCurrentMilestone());
  const progress = useCourseStore((s) => s.progress);
  const suggestedType =
    progress?.phase === "suggested_solution" || progress?.phase === "learner_action"
      ? milestone?.suggestedComponent
      : undefined;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const query = search.toLowerCase().trim();

  const filteredCategories = CATEGORIES.map((cat) => {
    const items = cat.types
      .filter((t) => {
        if (!query) return true;
        const def = COMPONENT_REGISTRY[t];
        return (
          def.label.toLowerCase().includes(query) ||
          def.description.toLowerCase().includes(query) ||
          t.toLowerCase().includes(query)
        );
      });
    return { ...cat, types: items };
  }).filter((cat) => cat.types.length > 0);

  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 320),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 9999,
  };

  return (
    <div ref={ref} style={style} className="w-[300px] rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface)] shadow-xl">
      <div className="border-b border-[var(--clay-border)] px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--clay-surface-2)] px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--clay-text-subtle)]" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="flex-1 bg-transparent text-xs text-[var(--clay-text)] placeholder:text-[var(--clay-text-subtle)] focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-1.5">
        {suggestedType && !query && (
          <div className="mb-1.5">
            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-lilac)]">
              Suggested
            </div>
            <ComponentButton
              type={suggestedType}
              highlighted
              onSelect={onSelect}
            />
          </div>
        )}

        {filteredCategories.map((cat) => (
          <div key={cat.id} className="mb-1">
            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              {cat.label}
            </div>
            {cat.types.map((type) => (
              <ComponentButton
                key={type}
                type={type}
                highlighted={type === suggestedType}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-[var(--clay-text-subtle)]">
            No components match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentButton({
  type,
  highlighted,
  onSelect,
}: {
  type: SimComponentType;
  highlighted?: boolean;
  onSelect: (type: SimComponentType) => void;
}) {
  const def = COMPONENT_REGISTRY[type];
  const Icon = SIM_ICON_MAP[type];

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--clay-surface-2)]",
        highlighted && "ring-1 ring-[var(--clay-lilac)]/40 bg-[var(--clay-lilac)]/5",
      )}
    >
      <div className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
        highlighted ? "bg-[var(--clay-lilac)]/15 text-[var(--clay-lilac)]" : "bg-[var(--clay-surface-2)] text-[var(--clay-text-subtle)]",
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-[var(--clay-text)]">{def.label}</div>
        <div className="truncate text-[10px] text-[var(--clay-text-subtle)]">{def.description}</div>
      </div>
    </button>
  );
}
