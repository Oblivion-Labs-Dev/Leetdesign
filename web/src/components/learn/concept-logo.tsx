import type { ComponentType } from "react";

type LogoProps = { className?: string };

function EncapsulationLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.85" />
      <path d="M8 5V3.5M16 5V3.5M8 19v1.5M16 19v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AbstractionLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 17h16M6 13h12M8 9h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 5l4 2.5v5L12 15l-4-2.5v-5L12 5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function InheritanceLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="4" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="5" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 10v2M9 12H7.5M15 12h1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PolymorphismLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="8" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}

function SingleResponsibilityLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v8M9.5 10.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function OpenClosedLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6h8a3 3 0 013 3v6a3 3 0 01-3 3H6V6z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M6 6v12M17 9l3-1.5v9L17 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LiskovSubstitutionLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="9" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <rect x="11" y="6" width="9" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" opacity="0.55" />
      <path d="M7 12h3M14 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InterfaceSegregationLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" strokeDasharray="3 2" opacity="0.45" />
      <rect x="6" y="7" width="5" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="7" width="5" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function DependencyInversionLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 16h14M7 12h10M9 8h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 5v4M9.5 7.5L12 5l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

function DefaultConceptLogo({ className }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const LOGO_BY_SLUG: Record<string, ComponentType<LogoProps>> = {
  encapsulation: EncapsulationLogo,
  abstraction: AbstractionLogo,
  inheritance: InheritanceLogo,
  polymorphism: PolymorphismLogo,
  "single-responsibility": SingleResponsibilityLogo,
  "open-closed": OpenClosedLogo,
  "liskov-substitution": LiskovSubstitutionLogo,
  "interface-segregation": InterfaceSegregationLogo,
  "dependency-inversion": DependencyInversionLogo,
};

export function ConceptLogo({
  slug,
  size = "md",
}: {
  slug: string;
  size?: "sm" | "md" | "lg";
}) {
  const Logo = LOGO_BY_SLUG[slug] ?? DefaultConceptLogo;
  return (
    <span className={`concept-logo concept-logo--${size}`} aria-hidden>
      <Logo className="concept-logo-svg" />
    </span>
  );
}
