"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export interface UserMenuUser {
  alias: string;
  fullName: string;
  workEmail: string;
  avatarUrl?: string | null;
  badgeShortTitle: string;
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-2 text-left transition-colors hover:border-[var(--border-strong)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={`${user.alias} avatar`}
            width={28}
            height={28}
            unoptimized
            className="rounded-full border border-white/10 bg-[var(--surface)]"
          />
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[color-mix(in_srgb,var(--clay-primary)_45%,transparent)] to-[color-mix(in_srgb,var(--clay-sky)_45%,transparent)] text-[11px] font-semibold uppercase">
            {user.alias.slice(0, 2)}
          </div>
        )}
        <div className="hidden text-right leading-tight md:block">
          <div className="text-xs font-medium text-[var(--foreground)]">
            {user.alias}
          </div>
          <div className="text-[10px] text-[var(--foreground-subtle)]">
            {user.workEmail}
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--foreground-subtle)]" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] shadow-xl"
        >
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="rounded-full border border-[var(--border)]"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[color-mix(in_srgb,var(--clay-primary)_50%,transparent)] to-[color-mix(in_srgb,var(--clay-sky)_50%,transparent)] text-xs font-semibold uppercase">
                {user.alias.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-[var(--foreground)]">
                {user.fullName || user.alias}
              </div>
              <div className="truncate text-[11px] text-[var(--foreground-subtle)]">
                {user.workEmail}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[var(--tone-brand-border)] bg-[var(--tone-brand-bg)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--tone-brand-text)]">
                <Shield className="h-3 w-3" /> {user.badgeShortTitle}
              </div>
            </div>
          </div>

          <nav className="p-1.5 text-sm">
            <MenuLink href="/profile" icon={UserIcon} label="Profile" onClick={() => setOpen(false)} />
            <MenuLink
              href="/profile?tab=account"
              icon={Settings}
              label="Account & settings"
              onClick={() => setOpen(false)}
            />
          </nav>

          <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
            <span>Theme</span>
            <ThemeToggle size="sm" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
