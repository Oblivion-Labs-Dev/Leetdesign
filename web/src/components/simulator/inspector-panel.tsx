"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const INSPECTOR_PANEL_CLASS =
  "w-[300px] shrink-0 border-l border-[var(--clay-border)] bg-[var(--clay-surface)]/95 backdrop-blur-md lg:w-[320px]";

export const METRICS_TABLE_MIN_WIDTH = 420;

export function InspectorPanel({
  embedded,
  children,
  footer,
}: {
  embedded?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={cn("flex h-full flex-col", !embedded && INSPECTOR_PANEL_CLASS)}>
      {children}
      {footer}
    </div>
  );
}

export function InspectorHeader({
  icon: Icon,
  iconClassName,
  title,
  badge,
  badgeClassName,
  onClose,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  badge: string;
  badgeClassName?: string;
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-[var(--clay-border)] bg-[var(--clay-surface)] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("grid h-9 w-9 place-items-center rounded-xl", iconClassName)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--clay-text)]">{title}</div>
            <span className={cn(
              "rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
              badgeClassName,
            )}>
              {badge}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function InspectorScrollBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function InspectorSection({
  icon: Icon,
  title,
  subtitle,
  children,
  trailing,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)]/40 p-3">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--clay-text-muted)]" />}
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">{subtitle}</p>
          )}
        </div>
        {trailing}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export function InspectorSubCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)]/80 px-2.5 py-2",
      className,
    )}>
      {title && (
        <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function InspectorEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--clay-border)] bg-[var(--clay-surface)]/60 px-3 py-4 text-center text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
      {children}
    </div>
  );
}

export function InspectorCollapsible({
  title,
  meta,
  open,
  onToggle,
  hint,
  children,
}: {
  title: string;
  meta?: string;
  open: boolean;
  onToggle: () => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--clay-border)] bg-[var(--clay-surface-2)]/40">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {title}
        </span>
        {meta && (
          <span className="shrink-0 text-[9px] font-mono tabular-nums text-[var(--clay-text-subtle)]">
            {meta}
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-[var(--clay-border)] px-3 pb-3 pt-2">
          {hint && (
            <p className="mb-2 text-[10px] leading-relaxed text-[var(--clay-text-muted)]">{hint}</p>
          )}
          {children}
        </div>
      )}
    </section>
  );
}

export function InspectorMetricsScrollTable({
  minWidth = METRICS_TABLE_MIN_WIDTH,
  columns,
  rows,
}: {
  minWidth?: number;
  columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
  rows: Array<{ key: string; cells: Record<string, React.ReactNode> }>;
}) {
  return (
    <div className="relative rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)]/80">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full text-[10px]" style={{ minWidth }}>
          <thead className="bg-[var(--clay-surface-2)] text-[var(--clay-text-subtle)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-2 py-1.5 font-medium",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-[var(--clay-border)]">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-2 py-1 font-mono tabular-nums text-[var(--clay-text-muted)]",
                      col.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {row.cells[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[var(--clay-surface)]/90 to-transparent" />
    </div>
  );
}

export function InspectorNameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <InspectorSection title="Component Name">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface)] px-3 py-1.5 text-sm focus:border-[var(--clay-primary)] focus:outline-none"
      />
    </InspectorSection>
  );
}

export function InspectorRemoveFooter({ onRemove }: { onRemove: () => void }) {
  return (
    <div className="shrink-0 border-t border-[var(--clay-border)] bg-[var(--clay-surface)] px-4 py-3">
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-500/8 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/15"
      >
        <Trash2 className="h-3.5 w-3.5" /> Remove Component
      </button>
    </div>
  );
}
