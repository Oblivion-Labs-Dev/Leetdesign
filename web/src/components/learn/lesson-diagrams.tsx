import type { ComponentType } from "react";
import type { LearnDiagramId } from "@/types/learn";
import { EncapsulationVaultAnimation } from "./encapsulation-diagram";

function ObjectAnatomyDiagram() {
  return (
    <svg viewBox="0 0 480 220" className="learn-diagram-svg" aria-hidden>
      <rect
        x="40"
        y="30"
        width="400"
        height="160"
        rx="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <text x="240" y="58" textAnchor="middle" className="learn-diagram-title">
        BankAccount object
      </text>
      <rect
        x="70"
        y="80"
        width="150"
        height="80"
        rx="10"
        fill="color-mix(in srgb, var(--studio-purple) 12%, transparent)"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="145" y="108" textAnchor="middle" className="learn-diagram-label">
        Data (private)
      </text>
      <text x="145" y="132" textAnchor="middle" className="learn-diagram-mono">
        balance: 500
      </text>
      <rect
        x="260"
        y="80"
        width="150"
        height="80"
        rx="10"
        fill="color-mix(in srgb, var(--studio-blue) 10%, transparent)"
        stroke="var(--studio-blue)"
        strokeWidth="1.5"
      />
      <text x="335" y="108" textAnchor="middle" className="learn-diagram-label">
        Methods (public)
      </text>
      <text x="335" y="128" textAnchor="middle" className="learn-diagram-mono">
        withdraw()
      </text>
      <text x="335" y="146" textAnchor="middle" className="learn-diagram-mono">
        getBalance()
      </text>
      <text x="240" y="205" textAnchor="middle" className="learn-diagram-caption-svg">
        Outside code can only call methods — not touch balance directly
      </text>
    </svg>
  );
}

function BadVsGoodDiagram() {
  return (
    <svg viewBox="0 0 520 240" className="learn-diagram-svg" aria-hidden>
      <text x="130" y="28" textAnchor="middle" className="learn-diagram-label learn-diagram-label--bad">
        ❌ Without encapsulation
      </text>
      <rect x="30" y="45" width="200" height="120" rx="12" fill="none" stroke="var(--studio-orange)" strokeWidth="1.5" opacity="0.6" />
      <text x="130" y="75" textAnchor="middle" className="learn-diagram-mono">account.balance = -100</text>
      <text x="130" y="100" textAnchor="middle" className="learn-diagram-mono">account.balance += 9999</text>
      <text x="130" y="140" textAnchor="middle" className="learn-diagram-caption-svg">
        Anyone can break rules
      </text>

      <text x="390" y="28" textAnchor="middle" className="learn-diagram-label learn-diagram-label--good">
        ✅ With encapsulation
      </text>
      <rect x="290" y="45" width="200" height="120" rx="12" fill="none" stroke="var(--studio-green)" strokeWidth="1.5" opacity="0.7" />
      <text x="390" y="75" textAnchor="middle" className="learn-diagram-mono">account.withdraw(50)</text>
      <text x="390" y="100" textAnchor="middle" className="learn-diagram-mono">account.getBalance()</text>
      <text x="390" y="140" textAnchor="middle" className="learn-diagram-caption-svg">
        Rules live inside the object
      </text>

      <path d="M240 105 L270 105" stroke="currentColor" strokeWidth="1.5" opacity="0.3" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="currentColor" opacity="0.4" />
        </marker>
      </defs>
      <text x="260" y="200" textAnchor="middle" className="learn-diagram-caption-svg">
        Same object — safer public surface
      </text>
    </svg>
  );
}

function InterfaceBoundaryDiagram() {
  return (
    <svg viewBox="0 0 480 200" className="learn-diagram-svg" aria-hidden>
      <rect
        x="40"
        y="24"
        width="180"
        height="140"
        rx="12"
        fill="color-mix(in srgb, var(--studio-blue) 8%, transparent)"
        stroke="var(--studio-blue)"
        strokeWidth="1.5"
      />
      <text x="130" y="52" textAnchor="middle" className="learn-diagram-label">
        Public methods
      </text>
      <text x="130" y="78" textAnchor="middle" className="learn-diagram-mono">
        withdraw()
      </text>
      <text x="130" y="100" textAnchor="middle" className="learn-diagram-mono">
        getBalance()
      </text>
      <text x="130" y="145" textAnchor="middle" className="learn-diagram-caption-svg">
        Callable by external modules
      </text>

      <rect
        x="260"
        y="24"
        width="180"
        height="140"
        rx="12"
        fill="color-mix(in srgb, var(--studio-purple) 10%, transparent)"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <text x="350" y="52" textAnchor="middle" className="learn-diagram-label">
        Private state
      </text>
      <text x="350" y="82" textAnchor="middle" className="learn-diagram-mono">
        balance
      </text>
      <text x="350" y="104" textAnchor="middle" className="learn-diagram-mono">
        auditLog
      </text>
      <text x="350" y="145" textAnchor="middle" className="learn-diagram-caption-svg">
        Not directly accessible
      </text>

      <path d="M220 92 L252 92" stroke="currentColor" strokeWidth="1.5" opacity="0.35" markerEnd="url(#boundary-arrow)" />
      <defs>
        <marker id="boundary-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="currentColor" opacity="0.4" />
        </marker>
      </defs>
      <text x="240" y="190" textAnchor="middle" className="learn-diagram-caption-svg">
        External code uses public methods — not internal fields
      </text>
    </svg>
  );
}

const DIAGRAMS: Record<
  Exclude<LearnDiagramId, "encapsulation-vault">,
  ComponentType
> = {
  "encapsulation-object": ObjectAnatomyDiagram,
  "encapsulation-bad-vs-good": BadVsGoodDiagram,
  "encapsulation-atm": InterfaceBoundaryDiagram,
};

export function LessonDiagram({
  id,
  caption,
}: {
  id: LearnDiagramId;
  caption?: string;
}) {
  if (id === "encapsulation-vault") {
    return <EncapsulationVaultAnimation caption={caption} />;
  }

  const Diagram = DIAGRAMS[id];
  if (!Diagram) return null;

  return (
    <figure className="learn-diagram">
      <div className="learn-diagram-stage">
        <Diagram />
      </div>
      {caption ? (
        <figcaption className="learn-diagram-caption">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
