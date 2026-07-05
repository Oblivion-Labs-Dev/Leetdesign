"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useDesignStore } from "@/lib/simulator/store";
import { COMPONENT_REGISTRY } from "@/lib/simulator/component-registry";
import {
  isAppServerDependencyEdge,
  parseDependencyConfig,
  type DatabaseDepConfig,
  type CacheDepConfig,
  type QueueDepConfig,
  type ExternalDepConfig,
} from "@/lib/simulator/dependency-edge-config";
import type { SimComponentType } from "@/lib/simulator/types";

export function DependencyEdgeInspector() {
  const design = useDesignStore((s) => s.design);
  const selectedEdgeId = useDesignStore((s) => s.selectedEdgeId);
  const mergeEdgeConfig = useDesignStore((s) => s.mergeEdgeConfig);
  const updateEdgeProtocol = useDesignStore((s) => s.updateEdgeProtocol);

  if (!design || !selectedEdgeId) return null;
  const edge = design.edges.find((e) => e.id === selectedEdgeId);
  if (!edge) return null;

  const source = design.nodes.find((n) => n.id === edge.source);
  const target = design.nodes.find((n) => n.id === edge.target);
  if (!source || !target || !isAppServerDependencyEdge(source.type, target.type)) {
    return null;
  }

  const dep = useMemo(
    () => parseDependencyConfig(edge, target.type),
    [edge, target.type],
  );

  if (!dep) return null;

  const patch = (partial: Record<string, string | number | boolean>) => {
    mergeEdgeConfig(edge.id, partial);
  };

  const targetLabel = COMPONENT_REGISTRY[target.type]?.label ?? target.label;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--clay-text-muted)]">
        <span className="font-medium text-[var(--clay-text)]">{source.label}</span>
        <ArrowRight className="h-3 w-3" />
        <span className="font-medium text-[var(--clay-text)]">{target.label}</span>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--clay-text-muted)]">
        Dependency settings for this connection from Application Server to {targetLabel}.
      </p>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--clay-text-subtle)]">
          Protocol
        </label>
        <select
          value={edge.protocol}
          onChange={(e) => updateEdgeProtocol(edge.id, e.target.value as typeof edge.protocol)}
          className="mt-1 w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
        >
          <option value="http">HTTP</option>
          <option value="https">HTTPS</option>
          <option value="grpc">gRPC</option>
          <option value="tcp">TCP</option>
          <option value="async">Async</option>
        </select>
      </div>

      {dep.kind === "database" && (
        <DatabaseFields dep={dep} onPatch={patch} />
      )}
      {dep.kind === "cache" && (
        <CacheFields dep={dep} onPatch={patch} />
      )}
      {dep.kind === "queue" && (
        <QueueFields dep={dep} onPatch={patch} />
      )}
      {dep.kind === "external" && (
        <ExternalFields dep={dep} onPatch={patch} />
      )}
    </div>
  );
}

function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="mb-1">
      <label className="text-xs text-[var(--clay-text)]">{label}</label>
      {helper && <p className="mt-0.5 text-[10px] text-[var(--clay-text-subtle)]">{helper}</p>}
    </div>
  );
}

function NumInput({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs tabular-nums focus:border-[var(--clay-primary)] focus:outline-none"
    />
  );
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--clay-border)] bg-[var(--clay-surface-2)] px-2.5 py-1.5 text-xs focus:border-[var(--clay-primary)] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function BoolInput({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--clay-text)]">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}

function DatabaseFields({
  dep,
  onPatch,
}: {
  dep: DatabaseDepConfig;
  onPatch: (p: Record<string, string | number | boolean>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Queries per request" helper="Average SQL queries issued per incoming request." />
        <NumInput value={dep.queriesPerRequest} min={0} max={20} step={0.5} onChange={(v) => onPatch({ queriesPerRequest: v })} />
      </div>
      <div>
        <FieldLabel label="Execution mode" />
        <SelectInput
          value={dep.syncMode}
          options={[{ value: "sync", label: "Synchronous" }, { value: "async", label: "Asynchronous" }]}
          onChange={(v) => onPatch({ syncMode: v })}
        />
      </div>
      <BoolInput value={dep.requiredForSuccess} onChange={(v) => onPatch({ requiredForSuccess: v })} label="Required for request success" />
      <div>
        <FieldLabel label="Retry policy" />
        <SelectInput
          value={dep.retryPolicy}
          options={[
            { value: "none", label: "None" },
            { value: "conservative", label: "Conservative" },
            { value: "aggressive", label: "Aggressive" },
          ]}
          onChange={(v) => onPatch({ retryPolicy: v })}
        />
      </div>
      <div>
        <FieldLabel label="Query timeout" helper="Milliseconds before a query attempt fails." />
        <NumInput value={dep.timeoutMs} min={100} max={60_000} step={100} onChange={(v) => onPatch({ timeoutMs: v })} />
      </div>
      <BoolInput value={dep.readWriteSplit} onChange={(v) => onPatch({ readWriteSplit: v })} label="Read / write split (optional)" />
    </div>
  );
}

function CacheFields({
  dep,
  onPatch,
}: {
  dep: CacheDepConfig;
  onPatch: (p: Record<string, string | number | boolean>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Lookups per request" />
        <NumInput value={dep.lookupsPerRequest} min={0} max={20} step={0.5} onChange={(v) => onPatch({ lookupsPerRequest: v })} />
      </div>
      <div>
        <FieldLabel label="Cache hit rate" helper="Fraction of lookups served from cache (0–1)." />
        <NumInput value={dep.cacheHitRate} min={0} max={1} step={0.05} onChange={(v) => onPatch({ cacheHitRate: v })} />
      </div>
      <div>
        <FieldLabel label="Execution mode" />
        <SelectInput
          value={dep.syncMode}
          options={[{ value: "sync", label: "Synchronous" }, { value: "async", label: "Asynchronous" }]}
          onChange={(v) => onPatch({ syncMode: v })}
        />
      </div>
      <BoolInput value={dep.requiredForSuccess} onChange={(v) => onPatch({ requiredForSuccess: v })} label="Required for request success" />
    </div>
  );
}

function QueueFields({
  dep,
  onPatch,
}: {
  dep: QueueDepConfig;
  onPatch: (p: Record<string, string | number | boolean>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Events per completed request" helper="Published after a request completes successfully." />
        <NumInput value={dep.eventsPerCompletedRequest} min={0} max={20} step={0.1} onChange={(v) => onPatch({ eventsPerCompletedRequest: v })} />
      </div>
      <BoolInput value={dep.syncAckRequired} onChange={(v) => onPatch({ syncAckRequired: v })} label="Synchronous acknowledgement required" />
      <div>
        <FieldLabel label="Retry policy" />
        <SelectInput
          value={dep.retryPolicy}
          options={[
            { value: "none", label: "None" },
            { value: "conservative", label: "Conservative" },
            { value: "aggressive", label: "Aggressive" },
          ]}
          onChange={(v) => onPatch({ retryPolicy: v })}
        />
      </div>
      <div>
        <FieldLabel label="Delivery failure behavior" />
        <SelectInput
          value={dep.deliveryFailureBehavior}
          options={[
            { value: "drop", label: "Drop event" },
            { value: "retry", label: "Retry publish" },
            { value: "fail_request", label: "Fail request" },
          ]}
          onChange={(v) => onPatch({ deliveryFailureBehavior: v })}
        />
      </div>
    </div>
  );
}

function ExternalFields({
  dep,
  onPatch,
}: {
  dep: ExternalDepConfig;
  onPatch: (p: Record<string, string | number | boolean>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel label="Calls per request" />
        <NumInput value={dep.callsPerRequest} min={0} max={20} step={0.5} onChange={(v) => onPatch({ callsPerRequest: v })} />
      </div>
      <div>
        <FieldLabel label="Dependency requirement" />
        <SelectInput
          value={dep.required}
          options={[
            { value: "required", label: "Required" },
            { value: "optional", label: "Optional" },
          ]}
          onChange={(v) => onPatch({ required: v })}
        />
      </div>
      <div>
        <FieldLabel label="Execution" />
        <SelectInput
          value={dep.execution}
          options={[
            { value: "sequential", label: "Sequential" },
            { value: "parallel", label: "Parallel" },
          ]}
          onChange={(v) => onPatch({ execution: v })}
        />
      </div>
      <div>
        <FieldLabel label="Call timeout (ms)" />
        <NumInput value={dep.timeoutMs} min={100} max={60_000} step={100} onChange={(v) => onPatch({ timeoutMs: v })} />
      </div>
      <div>
        <FieldLabel label="Retry policy" />
        <SelectInput
          value={dep.retryPolicy}
          options={[
            { value: "none", label: "None" },
            { value: "conservative", label: "Conservative" },
            { value: "aggressive", label: "Aggressive" },
          ]}
          onChange={(v) => onPatch({ retryPolicy: v })}
        />
      </div>
    </div>
  );
}

/** Generic edge inspector fallback when not an app-server dependency edge */
export function isDependencyEdge(
  sourceType: SimComponentType | undefined,
  targetType: SimComponentType | undefined,
): boolean {
  return !!sourceType && !!targetType && isAppServerDependencyEdge(sourceType, targetType);
}
