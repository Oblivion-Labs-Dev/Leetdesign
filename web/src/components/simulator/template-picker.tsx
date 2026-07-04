"use client";

import { X, Workflow } from "lucide-react";
import { TEMPLATES } from "@/lib/simulator/templates";
import { saveDesign } from "@/lib/simulator/persistence";

interface TemplatePickerProps {
  onSelect: (designId: string) => void;
  onClose: () => void;
}

export function TemplatePicker({ onSelect, onClose }: TemplatePickerProps) {
  const handlePick = (templateId: string) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    const design = tmpl.create();
    saveDesign(design);
    onSelect(design.id);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--clay-border)] bg-[var(--clay-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--clay-text)]">
              Start from a Template
            </h3>
            <p className="mt-0.5 text-xs text-[var(--clay-text-muted)]">
              Pick a pre-built system design to explore and modify.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--clay-text-subtle)] hover:bg-[var(--clay-surface-2)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handlePick(t.id)}
              className="group rounded-xl border border-[var(--clay-border)] bg-gradient-to-b from-[var(--clay-surface)] to-[var(--clay-surface-2)] p-4 text-left shadow-[var(--clay-shadow-in)] transition-all hover:border-[color-mix(in_srgb,var(--clay-primary)_40%,var(--clay-border))] hover:shadow-[var(--clay-shadow-out)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[color-mix(in_srgb,var(--clay-primary)_25%,transparent)] to-[color-mix(in_srgb,var(--clay-sky)_25%,transparent)]">
                <Workflow className="h-5 w-5 text-[var(--clay-primary)]" />
              </div>
              <div className="mt-3 text-sm font-semibold text-[var(--clay-text)]">
                {t.name}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
                {t.description}
              </p>
              {t.id === "ecommerce" && (
                <div className="mt-2 inline-flex rounded-full bg-[var(--clay-lilac)]/15 px-2 py-0.5 text-[9px] font-semibold text-[var(--clay-lilac)]">
                  Guided learning path
                </div>
              )}
              <div className="mt-2 text-[10px] text-[var(--clay-text-subtle)]">
                {t.nodeCount} components
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
