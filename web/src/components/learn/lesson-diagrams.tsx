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

function AbstractionInterfaceDiagram() {
  return (
    <svg viewBox="0 0 520 220" className="learn-diagram-svg" aria-hidden>
      <rect
        x="180"
        y="20"
        width="160"
        height="56"
        rx="10"
        fill="color-mix(in srgb, var(--studio-blue) 10%, transparent)"
        stroke="var(--studio-blue)"
        strokeWidth="1.5"
      />
      <text x="260" y="44" textAnchor="middle" className="learn-diagram-label">
        CheckoutService
      </text>
      <text x="260" y="62" textAnchor="middle" className="learn-diagram-mono">
        buy(total, card)
      </text>

      <path d="M260 76 L260 96" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />

      <rect
        x="150"
        y="96"
        width="220"
        height="64"
        rx="10"
        fill="color-mix(in srgb, var(--studio-purple) 12%, transparent)"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="260" y="120" textAnchor="middle" className="learn-diagram-label">
        PaymentProcessor
      </text>
      <text x="260" y="142" textAnchor="middle" className="learn-diagram-mono">
        charge() · refund()
      </text>

      <path d="M210 160 L210 178" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M260 160 L260 178" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M310 160 L310 178" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />

      <rect
        x="40"
        y="178"
        width="130"
        height="36"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x="105" y="200" textAnchor="middle" className="learn-diagram-mono">
        StripePayment
      </text>

      <rect
        x="195"
        y="178"
        width="130"
        height="36"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x="260" y="200" textAnchor="middle" className="learn-diagram-mono">
        AdyenPayment
      </text>

      <rect
        x="350"
        y="178"
        width="130"
        height="36"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x="415" y="200" textAnchor="middle" className="learn-diagram-mono">
        MockPayment
      </text>

      <text x="260" y="14" textAnchor="middle" className="learn-diagram-caption-svg">
        Caller sees the contract — not vendor internals
      </text>
    </svg>
  );
}

function AbstractionSwapDiagram() {
  return (
    <svg viewBox="0 0 520 230" className="learn-diagram-svg" aria-hidden>
      <text x="130" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--bad">
        Tight coupling
      </text>
      <rect x="55" y="40" width="150" height="44" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" />
      <text x="130" y="67" textAnchor="middle" className="learn-diagram-mono">
        CheckoutService
      </text>
      <path d="M130 84 L130 104" stroke="var(--studio-orange)" strokeWidth="1.5" />
      <rect x="55" y="104" width="150" height="44" rx="8" fill="color-mix(in srgb, var(--studio-orange) 10%, transparent)" stroke="var(--studio-orange)" strokeWidth="1.5" />
      <text x="130" y="131" textAnchor="middle" className="learn-diagram-mono">
        Stripe SDK
      </text>
      <text x="130" y="168" textAnchor="middle" className="learn-diagram-caption-svg">
        Vendor change rewrites checkout
      </text>

      <text x="390" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--good">
        Abstracted
      </text>
      <rect x="315" y="40" width="150" height="44" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" />
      <text x="390" y="67" textAnchor="middle" className="learn-diagram-mono">
        CheckoutService
      </text>
      <path d="M390 84 L390 98" stroke="var(--studio-green)" strokeWidth="1.5" />
      <rect x="315" y="98" width="150" height="40" rx="8" fill="color-mix(in srgb, var(--studio-purple) 12%, transparent)" stroke="var(--studio-purple)" strokeWidth="1.5" />
      <text x="390" y="123" textAnchor="middle" className="learn-diagram-mono">
        PaymentProcessor
      </text>
      <path d="M360 138 L360 152" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M420 138 L420 152" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <rect x="315" y="152" width="68" height="32" rx="6" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1" strokeDasharray="3 2" />
      <text x="349" y="172" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "10px" }}>
        Stripe
      </text>
      <rect x="397" y="152" width="68" height="32" rx="6" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1" strokeDasharray="3 2" />
      <text x="431" y="172" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "10px" }}>
        Adyen
      </text>
      <text x="390" y="208" textAnchor="middle" className="learn-diagram-caption-svg">
        Swap provider — checkout stays the same
      </text>

      <path d="M230 115 L280 115" stroke="currentColor" strokeWidth="1.5" opacity="0.25" markerEnd="url(#swap-arrow)" />
      <defs>
        <marker id="swap-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="currentColor" opacity="0.35" />
        </marker>
      </defs>
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

function InheritanceHierarchyDiagram() {
  return (
    <svg viewBox="0 0 480 220" className="learn-diagram-svg" aria-hidden>
      <rect
        x="165"
        y="24"
        width="150"
        height="52"
        rx="10"
        fill="color-mix(in srgb, var(--studio-purple) 12%, transparent)"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="240" y="48" textAnchor="middle" className="learn-diagram-label">
        BankAccount
      </text>
      <text x="240" y="66" textAnchor="middle" className="learn-diagram-mono">
        deposit · withdraw
      </text>

      <path d="M200 76 L200 98" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <path d="M280 76 L280 98" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

      <rect
        x="70"
        y="98"
        width="150"
        height="52"
        rx="10"
        fill="color-mix(in srgb, var(--studio-blue) 10%, transparent)"
        stroke="var(--studio-blue)"
        strokeWidth="1.5"
      />
      <text x="145" y="122" textAnchor="middle" className="learn-diagram-label">
        Savings
      </text>
      <text x="145" y="140" textAnchor="middle" className="learn-diagram-mono">
        + interest rate
      </text>

      <rect
        x="260"
        y="98"
        width="150"
        height="52"
        rx="10"
        fill="color-mix(in srgb, var(--studio-blue) 10%, transparent)"
        stroke="var(--studio-blue)"
        strokeWidth="1.5"
      />
      <text x="335" y="122" textAnchor="middle" className="learn-diagram-label">
        Checking
      </text>
      <text x="335" y="140" textAnchor="middle" className="learn-diagram-mono">
        + overdraft limit
      </text>

      <text x="240" y="178" textAnchor="middle" className="learn-diagram-caption-svg">
        Subclasses share base behavior and add specialized rules
      </text>
      <text x="240" y="198" textAnchor="middle" className="learn-diagram-caption-svg">
        SavingsAccount is-a BankAccount
      </text>
    </svg>
  );
}

function InheritanceVsCompositionDiagram() {
  return (
    <svg viewBox="0 0 520 230" className="learn-diagram-svg" aria-hidden>
      <text x="130" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--bad">
        Forced inheritance
      </text>
      <rect x="55" y="40" width="150" height="44" rx="8" fill="color-mix(in srgb, var(--studio-orange) 10%, transparent)" stroke="var(--studio-orange)" strokeWidth="1.5" />
      <text x="130" y="67" textAnchor="middle" className="learn-diagram-mono">
        ElectricCar extends Car
      </text>
      <text x="130" y="100" textAnchor="middle" className="learn-diagram-caption-svg">
        Overrides startEngine() — not shared logic
      </text>
      <text x="130" y="148" textAnchor="middle" className="learn-diagram-caption-svg">
        Wrong is-a — breaks modeling
      </text>

      <text x="390" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--good">
        Composition
      </text>
      <rect x="315" y="40" width="150" height="44" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" />
      <text x="390" y="67" textAnchor="middle" className="learn-diagram-mono">
        Car + Drivetrain
      </text>
      <path d="M390 84 L390 98" stroke="var(--studio-green)" strokeWidth="1.5" />
      <rect x="345" y="98" width="90" height="36" rx="8" fill="color-mix(in srgb, var(--studio-green) 10%, transparent)" stroke="var(--studio-green)" strokeWidth="1.5" />
      <text x="390" y="121" textAnchor="middle" className="learn-diagram-mono">
        Drivetrain
      </text>
      <text x="390" y="148" textAnchor="middle" className="learn-diagram-caption-svg">
        Car has-a Drivetrain
      </text>
      <text x="390" y="198" textAnchor="middle" className="learn-diagram-caption-svg">
        Swap or test the engine independently
      </text>

      <path d="M230 115 L280 115" stroke="currentColor" strokeWidth="1.5" opacity="0.25" markerEnd="url(#inherit-arrow)" />
      <defs>
        <marker id="inherit-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="currentColor" opacity="0.35" />
        </marker>
      </defs>
    </svg>
  );
}

function PolymorphismDispatchDiagram() {
  return (
    <svg viewBox="0 0 520 220" className="learn-diagram-svg" aria-hidden>
      <rect
        x="185"
        y="20"
        width="150"
        height="52"
        rx="10"
        fill="color-mix(in srgb, var(--studio-blue) 10%, transparent)"
        stroke="var(--studio-blue)"
        strokeWidth="1.5"
      />
      <text x="260" y="44" textAnchor="middle" className="learn-diagram-label">
        ParkingLot
      </text>
      <text x="260" y="62" textAnchor="middle" className="learn-diagram-mono">
        parkVehicle(v)
      </text>

      <path d="M260 72 L260 92" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />

      <rect
        x="155"
        y="92"
        width="210"
        height="44"
        rx="10"
        fill="color-mix(in srgb, var(--studio-purple) 12%, transparent)"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="260" y="118" textAnchor="middle" className="learn-diagram-mono">
        v.getRequiredSpotSize()
      </text>

      <path d="M200 136 L200 158" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M260 136 L260 158" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path d="M320 136 L320 158" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />

      <rect x="70" y="158" width="110" height="36" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="125" y="180" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "10px" }}>
        Car
      </text>

      <rect x="205" y="158" width="110" height="36" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="260" y="180" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "10px" }}>
        Motorcycle
      </text>

      <rect x="340" y="158" width="110" height="36" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="395" y="180" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "10px" }}>
        Truck
      </text>

      <text x="260" y="14" textAnchor="middle" className="learn-diagram-caption-svg">
        Same call — runtime picks the right spot size
      </text>
    </svg>
  );
}

function PolymorphismSwitchDiagram() {
  return (
    <svg viewBox="0 0 520 230" className="learn-diagram-svg" aria-hidden>
      <text x="130" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--bad">
        Type branching
      </text>
      <rect x="40" y="40" width="180" height="88" rx="8" fill="color-mix(in srgb, var(--studio-orange) 8%, transparent)" stroke="var(--studio-orange)" strokeWidth="1.5" />
      <text x="130" y="64" textAnchor="middle" className="learn-diagram-mono">
        if (type === "car")
      </text>
      <text x="130" y="84" textAnchor="middle" className="learn-diagram-mono">
        else if (type === "truck")
      </text>
      <text x="130" y="104" textAnchor="middle" className="learn-diagram-mono">
        else if (type === "motorcycle")
      </text>
      <text x="130" y="148" textAnchor="middle" className="learn-diagram-caption-svg">
        New vehicle = edit every branch
      </text>

      <text x="390" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--good">
        Polymorphism
      </text>
      <rect x="300" y="40" width="180" height="44" rx="8" fill="var(--studio-surface-2)" stroke="var(--studio-border)" strokeWidth="1.5" />
      <text x="390" y="67" textAnchor="middle" className="learn-diagram-mono">
        v.getRequiredSpotSize()
      </text>
      <path d="M350 84 L350 98" stroke="var(--studio-green)" strokeWidth="1.5" />
      <path d="M390 84 L390 98" stroke="var(--studio-green)" strokeWidth="1.5" />
      <path d="M430 84 L430 98" stroke="var(--studio-green)" strokeWidth="1.5" />
      <rect x="315" y="98" width="50" height="28" rx="6" fill="color-mix(in srgb, var(--studio-green) 10%, transparent)" stroke="var(--studio-green)" strokeWidth="1" />
      <text x="340" y="116" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "9px" }}>
        Car
      </text>
      <rect x="365" y="98" width="50" height="28" rx="6" fill="color-mix(in srgb, var(--studio-green) 10%, transparent)" stroke="var(--studio-green)" strokeWidth="1" />
      <text x="390" y="116" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "9px" }}>
        Moto
      </text>
      <rect x="415" y="98" width="50" height="28" rx="6" fill="color-mix(in srgb, var(--studio-green) 10%, transparent)" stroke="var(--studio-green)" strokeWidth="1" />
      <text x="440" y="116" textAnchor="middle" className="learn-diagram-mono" style={{ fontSize: "9px" }}>
        Truck
      </text>
      <text x="390" y="148" textAnchor="middle" className="learn-diagram-caption-svg">
        New vehicle = new class, same caller
      </text>

      <path d="M230 115 L280 115" stroke="currentColor" strokeWidth="1.5" opacity="0.25" markerEnd="url(#poly-arrow)" />
      <defs>
        <marker id="poly-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="currentColor" opacity="0.35" />
        </marker>
      </defs>
    </svg>
  );
}

function SrpGodClassDiagram() {
  return (
    <svg viewBox="0 0 480 210" className="learn-diagram-svg" aria-hidden>
      <defs>
        <marker
          id="srp-god-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path
            d="M0,0 L7,3.5 L0,7 Z"
            fill="var(--studio-orange)"
            opacity="0.75"
          />
        </marker>
      </defs>

      {/* concern pills */}
      <rect
        x="18"
        y="82"
        width="76"
        height="34"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
      />
      <text x="56" y="103" textAnchor="middle" className="learn-diagram-label">
        Content
      </text>

      <rect
        x="386"
        y="46"
        width="76"
        height="34"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
      />
      <text x="424" y="67" textAnchor="middle" className="learn-diagram-label">
        PDF
      </text>

      <rect
        x="386"
        y="118"
        width="76"
        height="34"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
      />
      <text x="424" y="139" textAnchor="middle" className="learn-diagram-label">
        Storage
      </text>
      <path
        d="M94 99 H148"
        fill="none"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
        strokeOpacity="0.7"
        markerEnd="url(#srp-god-arrow)"
      />
      <path
        d="M386 63 H356 V74 H332"
        fill="none"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
        strokeOpacity="0.7"
        markerEnd="url(#srp-god-arrow)"
      />
      <path
        d="M386 135 H356 V122 H332"
        fill="none"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
        strokeOpacity="0.7"
        markerEnd="url(#srp-god-arrow)"
      />

      {/* god class */}
      <rect
        x="148"
        y="54"
        width="184"
        height="92"
        rx="12"
        fill="color-mix(in srgb, var(--studio-orange) 9%, var(--studio-surface-2))"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
      />
      <text x="240" y="80" textAnchor="middle" className="learn-diagram-title">
        Report
      </text>
      <line
        x1="168"
        y1="90"
        x2="312"
        y2="90"
        stroke="var(--studio-border)"
        strokeWidth="1"
      />
      <text x="240" y="108" textAnchor="middle" className="learn-diagram-mono">
        generateContent
      </text>
      <text x="240" y="128" textAnchor="middle" className="learn-diagram-mono">
        printToPdf · saveToFile
      </text>

      <text x="240" y="172" textAnchor="middle" className="learn-diagram-caption-svg">
        Three reasons to change — one class
      </text>
      <text x="240" y="192" textAnchor="middle" className="learn-diagram-caption-svg">
        Content, PDF, and storage teams all touch the same file
      </text>
    </svg>
  );
}

function SrpSplitDiagram() {
  return (
    <svg viewBox="0 0 520 220" className="learn-diagram-svg" aria-hidden>
      <defs>
        <marker
          id="srp-split-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path
            d="M0,0 L7,3.5 L0,7 Z"
            fill="var(--studio-text-subtle)"
            opacity="0.6"
          />
        </marker>
      </defs>

      <text x="112" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--bad">
        One class
      </text>
      <rect
        x="36"
        y="44"
        width="152"
        height="76"
        rx="10"
        fill="color-mix(in srgb, var(--studio-orange) 9%, var(--studio-surface-2))"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
      />
      <text x="112" y="72" textAnchor="middle" className="learn-diagram-mono">
        Report
      </text>
      <text x="112" y="96" textAnchor="middle" className="learn-diagram-caption-svg">
        content · pdf · save
      </text>

      <line
        x1="268"
        y1="36"
        x2="268"
        y2="176"
        stroke="var(--studio-border)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <path
        d="M196 82 H248"
        fill="none"
        stroke="var(--studio-text-subtle)"
        strokeWidth="1.5"
        strokeOpacity="0.45"
        markerEnd="url(#srp-split-arrow)"
      />

      <text x="390" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--good">
        Split by job
      </text>
      <rect
        x="300"
        y="44"
        width="180"
        height="36"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="390" y="67" textAnchor="middle" className="learn-diagram-mono">
        Report
      </text>
      <rect
        x="300"
        y="88"
        width="180"
        height="36"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="390" y="111" textAnchor="middle" className="learn-diagram-mono">
        PdfRenderer
      </text>
      <rect
        x="300"
        y="132"
        width="180"
        height="36"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="390" y="155" textAnchor="middle" className="learn-diagram-mono">
        FileArchiver
      </text>

      <text x="260" y="200" textAnchor="middle" className="learn-diagram-caption-svg">
        Each class has one reason to change
      </text>
    </svg>
  );
}

function OcpCoreExtendsDiagram() {
  return (
    <svg viewBox="0 0 480 220" className="learn-diagram-svg" aria-hidden>
      <rect
        x="140"
        y="28"
        width="200"
        height="56"
        rx="12"
        fill="color-mix(in srgb, var(--studio-purple) 10%, var(--studio-surface-2))"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="240" y="52" textAnchor="middle" className="learn-diagram-title">
        CheckoutService
      </text>
      <text x="240" y="70" textAnchor="middle" className="learn-diagram-caption-svg">
        closed — stable orchestration
      </text>

      <line x1="168" y1="84" x2="168" y2="104" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="240" y1="84" x2="240" y2="104" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="312" y1="84" x2="312" y2="104" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="168" y1="104" x2="312" y2="104" stroke="var(--studio-border)" strokeWidth="1.5" />

      <line x1="168" y1="104" x2="168" y2="118" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="240" y1="104" x2="240" y2="118" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="312" y1="104" x2="312" y2="118" stroke="var(--studio-border)" strokeWidth="1.5" />

      <rect
        x="88"
        y="118"
        width="96"
        height="40"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="136" y="143" textAnchor="middle" className="learn-diagram-mono">
        StripePay
      </text>

      <rect
        x="192"
        y="118"
        width="96"
        height="40"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="240" y="143" textAnchor="middle" className="learn-diagram-mono">
        AdyenPay
      </text>

      <rect
        x="296"
        y="118"
        width="96"
        height="40"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />
      <text x="344" y="143" textAnchor="middle" className="learn-diagram-mono">
        NewProvider
      </text>

      <text x="240" y="182" textAnchor="middle" className="learn-diagram-caption-svg">
        open — add a new payment class without editing checkout
      </text>
      <text x="240" y="202" textAnchor="middle" className="learn-diagram-caption-svg">
        dashed box = extension point
      </text>
    </svg>
  );
}

function OcpSwitchVsExtendDiagram() {
  return (
    <svg viewBox="0 0 520 220" className="learn-diagram-svg" aria-hidden>
      <text x="120" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--bad">
        Modify existing code
      </text>
      <rect
        x="32"
        y="44"
        width="176"
        height="108"
        rx="10"
        fill="color-mix(in srgb, var(--studio-orange) 9%, var(--studio-surface-2))"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
      />
      <text x="120" y="68" textAnchor="middle" className="learn-diagram-mono">
        applyDiscount()
      </text>
      <text x="120" y="88" textAnchor="middle" className="learn-diagram-caption-svg">
        if (type === &quot;percent&quot;)
      </text>
      <text x="120" y="106" textAnchor="middle" className="learn-diagram-caption-svg">
        else if (type === &quot;flat&quot;)
      </text>
      <text x="120" y="124" textAnchor="middle" className="learn-diagram-caption-svg">
        else if (type === &quot;bogo&quot;) …
      </text>
      <text x="120" y="168" textAnchor="middle" className="learn-diagram-caption-svg">
        new promo = edit this function
      </text>

      <line
        x1="268"
        y1="36"
        x2="268"
        y2="176"
        stroke="var(--studio-border)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      <text x="390" y="24" textAnchor="middle" className="learn-diagram-label learn-diagram-label--good">
        Extend with types
      </text>
      <rect
        x="300"
        y="44"
        width="180"
        height="40"
        rx="8"
        fill="color-mix(in srgb, var(--studio-purple) 10%, var(--studio-surface-2))"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="390" y="67" textAnchor="middle" className="learn-diagram-mono">
        DiscountRule
      </text>
      <rect
        x="300"
        y="92"
        width="180"
        height="32"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="390" y="112" textAnchor="middle" className="learn-diagram-mono">
        PercentDiscount
      </text>
      <rect
        x="300"
        y="130"
        width="180"
        height="32"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="390" y="150" textAnchor="middle" className="learn-diagram-mono">
        BuyOneGetOne
      </text>
      <text x="390" y="188" textAnchor="middle" className="learn-diagram-caption-svg">
        new promo = new class, same caller
      </text>
    </svg>
  );
}

function LspBrokenSubstituteDiagram() {
  return (
    <svg viewBox="0 0 520 248" className="learn-diagram-svg" aria-hidden>
      <rect
        x="36"
        y="44"
        width="120"
        height="44"
        rx="8"
        fill="var(--studio-surface-2)"
        stroke="var(--studio-border)"
        strokeWidth="1.5"
      />
      <text x="96" y="71" textAnchor="middle" className="learn-diagram-mono">
        refuelFleet()
      </text>

      <path
        d="M156 66 H188"
        fill="none"
        stroke="var(--studio-text-subtle)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        markerEnd="url(#lsp-broken-arrow)"
      />

      <rect
        x="188"
        y="36"
        width="120"
        height="60"
        rx="8"
        fill="color-mix(in srgb, var(--studio-orange) 9%, var(--studio-surface-2))"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
      />
      <text x="248" y="60" textAnchor="middle" className="learn-diagram-label">
        MotorVehicle
      </text>
      <text x="248" y="80" textAnchor="middle" className="learn-diagram-caption-svg">
        expects fuel
      </text>

      <path
        d="M308 66 H340"
        fill="none"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
        strokeOpacity="0.7"
        markerEnd="url(#lsp-broken-arrow)"
      />

      <rect
        x="340"
        y="44"
        width="120"
        height="44"
        rx="8"
        fill="color-mix(in srgb, var(--studio-orange) 12%, var(--studio-surface-2))"
        stroke="var(--studio-orange)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <text x="400" y="71" textAnchor="middle" className="learn-diagram-mono">
        ElectricCar
      </text>

      <text x="260" y="118" textAnchor="middle" className="learn-diagram-caption-svg">
        <tspan x="260" dy="0">
          refuel() throws
        </tspan>
        <tspan x="260" dy="14">
          caller expected a full tank
        </tspan>
      </text>

      <rect
        x="24"
        y="140"
        width="472"
        height="64"
        rx="10"
        fill="color-mix(in srgb, var(--studio-orange) 8%, transparent)"
        stroke="var(--studio-orange)"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <text x="260" y="168" textAnchor="middle" className="learn-diagram-caption-svg">
        <tspan x="260" dy="0">
          ElectricCar is-a MotorVehicle on paper,
        </tspan>
        <tspan x="260" dy="14">
          not in behavior
        </tspan>
      </text>

      <defs>
        <marker
          id="lsp-broken-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--studio-orange)" opacity="0.75" />
        </marker>
      </defs>
    </svg>
  );
}

function LspHonestTypesDiagram() {
  return (
    <svg viewBox="0 0 520 248" className="learn-diagram-svg" aria-hidden>
      <rect
        x="185"
        y="28"
        width="150"
        height="48"
        rx="10"
        fill="color-mix(in srgb, var(--studio-purple) 10%, var(--studio-surface-2))"
        stroke="var(--studio-purple)"
        strokeWidth="1.5"
      />
      <text x="260" y="50" textAnchor="middle" className="learn-diagram-label">
        Vehicle
      </text>
      <text x="260" y="66" textAnchor="middle" className="learn-diagram-mono">
        move()
      </text>

      <line x1="220" y1="76" x2="220" y2="96" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="300" y1="76" x2="300" y2="96" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="220" y1="96" x2="300" y2="96" stroke="var(--studio-border)" strokeWidth="1.5" />

      <line x1="220" y1="96" x2="220" y2="110" stroke="var(--studio-border)" strokeWidth="1.5" />
      <line x1="300" y1="96" x2="300" y2="110" stroke="var(--studio-border)" strokeWidth="1.5" />

      <rect
        x="88"
        y="110"
        width="132"
        height="48"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="154" y="132" textAnchor="middle" className="learn-diagram-mono">
        Car
      </text>
      <text x="154" y="148" textAnchor="middle" className="learn-diagram-caption-svg">
        drives on road
      </text>

      <rect
        x="300"
        y="110"
        width="132"
        height="48"
        rx="8"
        fill="color-mix(in srgb, var(--studio-green) 8%, var(--studio-surface-2))"
        stroke="var(--studio-green)"
        strokeWidth="1.5"
      />
      <text x="366" y="132" textAnchor="middle" className="learn-diagram-mono">
        Bicycle
      </text>
      <text x="366" y="148" textAnchor="middle" className="learn-diagram-caption-svg">
        pedals, no engine
      </text>

      <rect
        x="24"
        y="178"
        width="472"
        height="52"
        rx="10"
        fill="color-mix(in srgb, var(--studio-green) 6%, transparent)"
        stroke="var(--studio-green)"
        strokeWidth="1"
        strokeOpacity="0.45"
      />
      <text x="260" y="200" textAnchor="middle" className="learn-diagram-caption-svg">
        <tspan x="260" dy="0">
          Same interface — each type keeps its own rules
        </tspan>
        <tspan x="260" dy="14">
          Callers use move(), not assumptions about engines or fuel
        </tspan>
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
  "abstraction-interface": AbstractionInterfaceDiagram,
  "abstraction-swap": AbstractionSwapDiagram,
  "inheritance-hierarchy": InheritanceHierarchyDiagram,
  "inheritance-vs-composition": InheritanceVsCompositionDiagram,
  "polymorphism-dispatch": PolymorphismDispatchDiagram,
  "polymorphism-switch": PolymorphismSwitchDiagram,
  "srp-god-class": SrpGodClassDiagram,
  "srp-split": SrpSplitDiagram,
  "ocp-core-extends": OcpCoreExtendsDiagram,
  "ocp-switch-vs-extend": OcpSwitchVsExtendDiagram,
  "lsp-broken-substitute": LspBrokenSubstituteDiagram,
  "lsp-honest-types": LspHonestTypesDiagram,
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
