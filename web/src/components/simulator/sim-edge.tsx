"use client";

import { memo, useMemo } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { useSimulationStore } from "@/lib/simulator/store";
import { violationForEdge } from "@/lib/simulator/traffic-contracts";
import type { EdgeProtocol } from "@/lib/simulator/types";

const PROTOCOL_STYLES: Record<EdgeProtocol, { label: string; color: string }> = {
  http:      { label: "HTTP", color: "#6366f1" },
  grpc:      { label: "gRPC", color: "#10b981" },
  tcp:       { label: "TCP", color: "#64748b" },
  websocket: { label: "WS", color: "#8b5cf6" },
  async:     { label: "ASYNC", color: "#f59e0b" },
};

/** Invisible stroke width for edge selection hit area (visible line stays thin) */
const EDGE_HIT_WIDTH = 32;

function SimEdgeInner(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
  } = props;

  const running = useSimulationStore((s) => s.running);
  const edgeFlowRps = useSimulationStore((s) => s.edgeFlowRps[id]);
  const architectureViolations = useSimulationStore((s) => s.architectureViolations);
  const violation = violationForEdge(architectureViolations, id);
  const isArchError = violation?.severity === "error";
  const isArchWarning = violation?.severity === "warning";
  const sourceMetrics = useSimulationStore((s) => s.metrics[source]);
  const targetMetrics = useSimulationStore((s) => s.metrics[target]);
  const protocol = ((props.data as Record<string, unknown>)?.protocol as EdgeProtocol) ?? "http";
  const highlighted = Boolean((props.data as Record<string, unknown>)?.highlighted);
  const dimmed = Boolean((props.data as Record<string, unknown>)?.dimmed);
  const traceActive = Boolean((props.data as Record<string, unknown>)?.traceActive);
  const ps = PROTOCOL_STYLES[protocol];
  const isAsync = protocol === "async";

  const rps = edgeFlowRps ?? targetMetrics?.currentRps ?? 0;
  const sourceHealth = sourceMetrics?.health ?? "healthy";
  const targetHealth = targetMetrics?.health ?? "healthy";

  const isSourceDown = sourceHealth === "down";
  const sourceRps = sourceMetrics?.currentRps ?? 0;
  const isSourceStarved = sourceRps === 0 && sourceHealth !== "healthy";

  const flowIntensity = useMemo(() => {
    if (!running || rps === 0 || isSourceDown || isSourceStarved) return 0;
    if (rps < 50) return 1;
    if (rps < 200) return 2;
    if (rps < 1000) return 3;
    return 4;
  }, [running, rps, isSourceDown, isSourceStarved]);

  const strokeWidth = useMemo(() => {
    if (!running || flowIntensity === 0) return 1.2;
    return Math.min(1.2 + flowIntensity * 0.5, 3.5);
  }, [running, flowIntensity]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  const edgeId = `edge-${id}`;

  const dotColor = isSourceDown ? "#4a5568" :
                   targetHealth === "down" ? "#dc2626" :
                   targetHealth === "failing" ? "#f43f5e" :
                   targetHealth === "degraded" ? "#f59e0b" :
                   ps.color;

  const animDuration = running && flowIntensity > 0
    ? Math.max(0.5, 2.5 - flowIntensity * 0.4)
    : 0;

  const isPathDead = isSourceDown || isSourceStarved;

  const lineColor = selected
    ? ps.color
    : isArchError
      ? "#dc2626"
      : isArchWarning
        ? "#f59e0b"
        : isPathDead
          ? "var(--clay-border)"
          : targetHealth === "down"
            ? "#dc262640"
            : "var(--clay-border-strong)";

  const lineOpacity = isPathDead ? 0.3 : dimmed ? 0.25 : 1;
  const archDash = isArchError || isArchWarning ? "5 4" : isAsync ? "6 3" : undefined;

  return (
    <>
      <defs>
        <circle id={`${edgeId}-dot`} r={flowIntensity > 0 ? 2.5 : traceActive ? 3 : 0} fill={traceActive ? "var(--clay-primary)" : dotColor} opacity={0.9}>
          {flowIntensity > 0 && (
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.6s" repeatCount="indefinite" />
          )}
        </circle>
      </defs>

      {/* Main path — visual only; clicks handled by interaction layer below */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={traceActive ? "var(--clay-primary)" : highlighted ? "var(--clay-primary)" : lineColor}
        strokeWidth={
          traceActive ? strokeWidth + 1.2 :
          highlighted ? strokeWidth + 0.6 :
          selected ? strokeWidth + 0.8 : strokeWidth
        }
        strokeDasharray={archDash}
        strokeLinecap="round"
        opacity={lineOpacity}
        className="react-flow__edge-path"
        style={{
          filter: traceActive || highlighted ? "drop-shadow(0 0 4px rgba(107,140,174,0.4))" : selected ? `drop-shadow(0 0 6px ${ps.color}60)` : undefined,
          transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s",
          pointerEvents: "none",
        }}
      />

      {/* Small endpoint dot instead of big arrow */}
      <circle
        cx={targetX}
        cy={targetY}
        r={selected ? 3.5 : 2.5}
        fill={selected ? ps.color : lineColor}
        opacity={lineOpacity}
        style={{ transition: "fill 0.3s, r 0.3s", pointerEvents: "none" }}
      />

      {/* Animated flowing dots */}
      {running && flowIntensity > 0 && !isPathDead && (
        <>
          {Array.from({ length: Math.min(flowIntensity, 4) }).map((_, i) => (
            <use key={i} href={`#${edgeId}-dot`} style={{ pointerEvents: "none" }}>
              <animateMotion
                dur={`${animDuration}s`}
                repeatCount="indefinite"
                begin={`${(i * animDuration) / Math.min(flowIntensity, 4)}s`}
                path={edgePath}
              />
            </use>
          ))}
        </>
      )}

      {traceActive && (
        <use href={`#${edgeId}-dot`} style={{ pointerEvents: "none" }}>
          <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
        </use>
      )}

      {/* Wide invisible stroke on top — must use opaque color + 0 opacity for SVG hit testing */}
      <path
        d={edgePath}
        fill="none"
        stroke="#000"
        strokeOpacity={0}
        strokeWidth={EDGE_HIT_WIDTH}
        strokeLinecap="round"
        className="react-flow__edge-interaction"
        style={{ cursor: "pointer", pointerEvents: "stroke" }}
      />

      {/* Protocol label */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          <div
            className="flex items-center gap-1 rounded px-1.5 py-[2px] backdrop-blur-sm transition-all"
            style={{
              background: isArchError
                ? "#dc262615"
                : isArchWarning
                  ? "#f59e0b15"
                  : selected
                    ? `${ps.color}20`
                    : "var(--clay-surface)",
              border: `1px solid ${
                isArchError
                  ? "#dc262640"
                  : isArchWarning
                    ? "#f59e0b40"
                    : selected
                      ? `${ps.color}40`
                      : "var(--clay-border)"
              }`,
              opacity: isPathDead ? 0.3 : 1,
            }}
          >
            {violation && (
              <span
                className="text-[7px] font-bold uppercase tracking-[0.1em]"
                style={{ color: isArchError ? "#dc2626" : "#f59e0b" }}
                title={violation.message}
              >
                {isArchError ? "ERR" : "!"}
              </span>
            )}
            <span
              className="text-[7px] font-bold uppercase tracking-[0.15em]"
              style={{ color: selected ? ps.color : "var(--clay-text-subtle)" }}
            >
              {ps.label}
            </span>
            {running && rps > 0 && !isPathDead && (
              <span className="text-[7px] font-mono tabular-nums text-[var(--clay-text-subtle)]">
                {rps > 999 ? `${(rps / 1000).toFixed(1)}k` : Math.round(rps).toLocaleString("en-US")}
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const SimEdge = memo(SimEdgeInner);
