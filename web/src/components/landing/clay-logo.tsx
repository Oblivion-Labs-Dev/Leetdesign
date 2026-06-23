import Link from "next/link";

export function ClayLogo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div
        className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--clay-border-strong)]"
        style={{
          background:
            "linear-gradient(165deg, var(--clay-surface) 0%, var(--clay-surface-2) 100%)",
          boxShadow: "var(--clay-shadow-block)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <rect x="4" y="10" width="7" height="7" rx="2.5" fill="#7BA892" />
          <rect x="13" y="5" width="7" height="7" rx="2.5" fill="#6B8CAE" />
          <rect x="13" y="14" width="7" height="7" rx="2.5" fill="#9B8DC4" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="clay-display text-base font-semibold tracking-tight text-[var(--clay-text)]">
          Leetdesign
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--clay-text-muted)]">
          system design
        </div>
      </div>
    </Link>
  );
}
