"use client";

import Image from "next/image";
import { ShieldCheck, ScanSearch } from "lucide-react";
import { makeAvatarUrl, makeWorkEmail, normalizeAlias } from "@/lib/identity-shared";

interface SignupPreview {
  firstName: string;
  lastName: string;
  personalEmail: string;
  alias?: string;
}

export function AuthBadgePanel({
  mode,
  preview,
}: {
  mode: "login" | "signup";
  preview: SignupPreview;
}) {
  return (
    <div className="surface relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--foreground-subtle)]">
        {mode === "signup" ? "Preview your badge" : "Sign-in"}
      </div>
      {mode === "signup" ? <SignupBadge preview={preview} /> : <LoginScan />}
    </div>
  );
}

function SignupBadge({ preview }: { preview: SignupPreview }) {
  const alias = normalizeAlias(
    preview.alias ||
      `${preview.firstName}${preview.lastName}` ||
      preview.personalEmail.split("@")[0] ||
      "engineer",
  );
  const workEmail = makeWorkEmail(alias);
  const avatarUrl = makeAvatarUrl(alias);
  return (
    <div className="relative rounded-t-3xl rounded-b-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/12 via-[var(--surface-2)] to-cyan-500/12 p-4 pt-6 shadow-[0_12px_30px_-12px_rgba(14,165,233,0.55)]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-8 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25 bg-gradient-to-r from-cyan-400/20 via-violet-400/30 to-cyan-400/20" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-[var(--surface)]" />
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={avatarUrl}
            alt="badge avatar"
            width={44}
            height={44}
            className="rounded-lg border border-white/10 bg-[var(--surface)]"
            unoptimized
          />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              Astra ID
            </div>
            <div className="text-sm font-semibold">{alias}</div>
            <div className="text-xs text-[var(--foreground-muted)]">{workEmail}</div>
          </div>
        </div>
        <div className="rounded-lg bg-violet-500/15 p-2">
          <ShieldCheck className="h-5 w-5 text-violet-300" />
        </div>
      </div>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--background-soft)] px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
          Assigned role
        </div>
        <div className="text-sm font-semibold text-violet-200">Intern at Astra</div>
      </div>
      <div className="mt-3 text-xs text-[var(--foreground-muted)]">
        Work email is auto-generated and unique. Personal email stays private.
      </div>
    </div>
  );
}

function LoginScan() {
  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-2)] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <ScanSearch className="h-4 w-4 text-cyan-300" />
        Sign in
      </div>
      <div className="space-y-2 text-xs text-[var(--foreground-muted)]">
        <p>
          Use either your <strong className="text-[var(--foreground)]">work email</strong> (alias@astra.oblivionlabs.com)
          or the <strong className="text-[var(--foreground)]">personal email</strong> you signed up with.
        </p>
        <p>
          We never re-run onboarding for returning engineers — this screen is
          just access back to your workspace.
        </p>
      </div>
    </div>
  );
}
