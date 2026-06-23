"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { HeroInventoryItem } from "./hero-scenario";

export function HeroInventory({
  items,
  isDragging,
}: {
  items: HeroInventoryItem[];
  isDragging: boolean;
}) {
  return (
    <div className="border-r border-[var(--clay-border)] bg-[var(--clay-bg-soft)] p-2">
      <p className="mb-2 px-0.5 text-[8px] font-bold uppercase tracking-wider text-[var(--clay-text-subtle)]">
        Inventory
      </p>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <InventoryTile
            key={item.id}
            item={item}
            dimmed={isDragging && item.recommended}
          />
        ))}
      </div>
    </div>
  );
}

function InventoryTile({
  item,
  dimmed,
}: {
  item: HeroInventoryItem;
  dimmed: boolean;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      className="relative rounded-lg border bg-[var(--clay-surface)] px-2 py-1.5 transition-opacity"
      style={{
        borderColor: item.recommended ? "#9B8DC4" : "var(--clay-border)",
        opacity: dimmed ? 0.3 : 1,
      }}
      animate={
        item.recommended && !dimmed
          ? {
              boxShadow: [
                "0 0 0 0 rgba(155,141,196,0)",
                "0 0 10px 2px rgba(155,141,196,0.3)",
                "0 0 0 0 rgba(155,141,196,0)",
              ],
            }
          : undefined
      }
      transition={
        item.recommended
          ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      {item.recommended && !dimmed && (
        <div className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full border border-[#C4B8DC] bg-[var(--clay-surface)] px-1 py-px text-[5px] font-bold uppercase text-[#9B8DC4] shadow-sm">
          <Sparkles className="h-[7px] w-[7px]" /> Use this
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <div className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded bg-[var(--clay-surface-2)]">
          <Icon
            className="h-[10px] w-[10px] text-[var(--clay-primary)]"
            strokeWidth={2.2}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[8px] font-semibold leading-tight text-[var(--clay-text)]">
            {item.label}
          </p>
          <p className="text-[6px] uppercase tracking-wider text-[var(--clay-text-subtle)]">
            {item.type.replace(/_/g, " ")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
