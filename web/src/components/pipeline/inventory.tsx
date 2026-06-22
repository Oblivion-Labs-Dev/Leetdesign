"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Lock, Sparkles } from "lucide-react";
import { COMPONENT_LIBRARY } from "@/lib/content/components";
import { COMPONENT_ICONS } from "./icon-map";
import { cn } from "@/lib/utils";
import type { ComponentType } from "@/types";

export function ComponentInventory({
  available,
  highlightTypes = [],
  disabled = false,
  disabledHint,
  className,
}: {
  available: string[];
  /**
   * Component types that are the *expected* answer for the current stage —
   * rendered with a glow / sparkle so the user knows which one to grab.
   */
  highlightTypes?: ComponentType[];
  /** When true, drag is disabled and items render with a "locked" affordance. */
  disabled?: boolean;
  disabledHint?: string;
  className?: string;
}) {
  return (
    <div className={cn("surface flex h-full flex-col", className)}>
      <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Inventory</div>
          <div className="text-[11px] text-[var(--foreground-subtle)]">
            {disabled
              ? (disabledHint ?? "Drag is unlocked during incidents.")
              : "Drag a component into the glowing slot."}
          </div>
        </div>
      </div>

      {available.length === 0 ? (
        <div className="grid place-items-center px-4 py-8 text-center text-xs text-[var(--foreground-muted)]">
          You haven&apos;t learned any components yet for this project. Keep
          advancing — every lesson adds tools to your inventory.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 overflow-y-auto p-3">
          {available.map((id) => {
            const c = COMPONENT_LIBRARY[id];
            if (!c) return null;
            const Icon = COMPONENT_ICONS[c.type as ComponentType];
            const recommended = highlightTypes.includes(c.type as ComponentType);
            return (
              <InventoryTile
                key={id}
                id={id}
                label={c.label}
                type={c.type}
                shortDescription={c.shortDescription}
                Icon={Icon}
                recommended={recommended}
                disabled={disabled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function InventoryTile({
  id,
  label,
  type,
  shortDescription,
  Icon,
  recommended,
  disabled,
}: {
  id: string;
  label: string;
  type: string;
  shortDescription: string;
  Icon: React.ComponentType<{ className?: string }>;
  recommended: boolean;
  disabled: boolean;
}) {
  const draggable = !disabled;
  return (
    <motion.div
      animate={
        recommended
          ? {
              boxShadow: [
                "0 0 0 0 rgba(167,139,250,0.0)",
                "0 0 18px 4px rgba(167,139,250,0.55)",
                "0 0 0 0 rgba(167,139,250,0.0)",
              ],
            }
          : undefined
      }
      transition={
        recommended
          ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) {
          e.preventDefault();
          return;
        }
        const dt = (e as unknown as DragEvent).dataTransfer;
        if (!dt) return;
        dt.setData("application/leetdesign-component", type);
        dt.effectAllowed = "copy";
      }}
      title={shortDescription}
      className={cn(
        "group relative rounded-xl border p-3 transition-all",
        draggable
          ? "cursor-grab border-[var(--border)] bg-[var(--surface-2)]/70 hover:-translate-y-0.5 hover:border-[var(--tone-brand-border)] active:cursor-grabbing"
          : "cursor-not-allowed border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 opacity-70",
        recommended ? "border-[var(--tone-brand-border)]" : "",
      )}
    >
      {recommended ? (
        <div className="absolute -right-1 -top-1 inline-flex items-center gap-0.5 rounded-full border border-[var(--tone-brand-border)] bg-[var(--surface)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] shadow">
          <Sparkles className="h-2.5 w-2.5" /> Use this
        </div>
      ) : null}
      {disabled ? (
        <div className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[var(--surface)] text-[var(--foreground-subtle)]">
          <Lock className="h-2.5 w-2.5" />
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--surface)] text-[var(--tone-brand-text)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold leading-tight">
            {label}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            {type.replace("_", " ")}
          </div>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] text-[var(--foreground-muted)]">
        {shortDescription}
      </p>

      {/* Library page deep-link, always visible on hover. */}
      <div className="mt-2 hidden items-center justify-end group-hover:flex">
        <Link
          href={`/library/${id}`}
          target="_blank"
          className="inline-flex items-center gap-1 rounded-md border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--tone-brand-text)] hover:bg-[var(--tone-brand-bg)]/70"
        >
          Open <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </motion.div>
  );
}
