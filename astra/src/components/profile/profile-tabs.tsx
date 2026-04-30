"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  GitBranch,
  Globe,
  Save,
  Star,
  Sun,
  Trophy,
  User as UserIcon,
  Sparkles,
  Code2,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Progress } from "@/components/ui/progress";
import { BADGES, nextBadge, progressToNext } from "@/lib/badges";
import { BRAND } from "@/lib/brand";
import { useTheme } from "@/components/theme/theme-provider";
import type { UserProfile } from "@/types";
import type { LearningStats } from "@/lib/learning-stats";

type TabId = "general" | "career" | "account" | "theme" | "connections";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "general", label: "General", icon: UserIcon },
  { id: "career", label: "Career", icon: Trophy },
  { id: "account", label: "Account", icon: Code2 },
  { id: "theme", label: "Theme", icon: Sun },
  { id: "connections", label: "Connections", icon: Globe },
];

export function ProfileTabs({
  profile,
  stats,
  initialTab,
}: {
  profile: UserProfile;
  stats: LearningStats;
  initialTab: TabId;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);

  return (
    <div className="space-y-4">
      <div className="surface flex flex-wrap gap-1 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-[var(--surface-2)] text-[var(--foreground)] ring-1 ring-violet-500/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              aria-pressed={active}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "general" ? <GeneralTab profile={profile} /> : null}
      {tab === "career" ? <CareerTab profile={profile} stats={stats} /> : null}
      {tab === "account" ? <AccountTab profile={profile} /> : null}
      {tab === "theme" ? <ThemeTab /> : null}
      {tab === "connections" ? <ConnectionsTab profile={profile} /> : null}
    </div>
  );
}

// ---------------- General ----------------
function GeneralTab({ profile }: { profile: UserProfile }) {
  const [firstName, setFirstName] = useState(profile.fullName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(
    profile.fullName.split(" ").slice(1).join(" ") ?? "",
  );
  const [status, setStatus] = useState(profile.status ?? "");
  const [mood, setMood] = useState(profile.mood ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const router = useRouter();

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, status, mood, avatarUrl }),
      });
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>General</CardTitle>
      <CardDescription>
        How you show up across Astra. Status and mood appear on your dashboard.
      </CardDescription>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="First name" value={firstName} onChange={setFirstName} />
        <Field label="Last name" value={lastName} onChange={setLastName} />
        <Field
          label="Status"
          placeholder="e.g. Shipping Tiny.link cache"
          value={status}
          onChange={setStatus}
        />
        <Field
          label="Mood"
          placeholder="e.g. Heads-down"
          value={mood}
          onChange={setMood}
        />
        <div className="sm:col-span-2">
          <Field
            label="Avatar URL"
            placeholder="Paste a square image URL (PNG/SVG)"
            value={avatarUrl}
            onChange={setAvatarUrl}
          />
          <p className="mt-1 text-[11px] text-[var(--foreground-subtle)]">
            Image upload is coming soon. For now, paste a public URL — we use it as your avatar everywhere.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={saving} size="sm">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save changes"}
        </Button>
        {savedAt ? (
          <span className="text-xs text-emerald-300">Saved.</span>
        ) : null}
      </div>
    </Card>
  );
}

// ---------------- Career ----------------
function CareerTab({
  profile,
  stats,
}: {
  profile: UserProfile;
  stats: LearningStats;
}) {
  const next = nextBadge(profile.badge);
  const pct = progressToNext(profile.xp, profile.badge);
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Wallet & rewards</CardTitle>
            <CardDescription>
              {BRAND.currency} is the in-product currency. Earn it by shipping
              code & passing reviews. Soon redeemable for swag and content.
            </CardDescription>
          </div>
          <Pill tone="warning">
            <Star className="h-3 w-3" /> {profile.stardust} {BRAND.currency}
          </Pill>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Total XP" value={profile.xp.toLocaleString()} />
          <Stat label={BRAND.currency} value={profile.stardust.toLocaleString()} />
          <Stat
            label="Streak"
            value={`${stats.currentStreak} day${stats.currentStreak === 1 ? "" : "s"}`}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Career ladder</CardTitle>
        <CardDescription>
          You climb by completing projects, learning new components, and passing
          reviews.
        </CardDescription>
        <div className="mt-5 space-y-3">
          {Object.values(BADGES).map((b) => {
            const active = b.id === profile.badge;
            return (
              <div
                key={b.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                  active
                    ? "border-violet-500/40 bg-violet-500/5"
                    : "border-[var(--border)] bg-[var(--surface-2)]/40"
                }`}
              >
                <div
                  className="mt-1 grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-black"
                  style={{
                    background: `linear-gradient(135deg, ${b.color}, #fff5)`,
                  }}
                >
                  {b.shortTitle.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{b.title}</div>
                    {active ? <Pill tone="brand">You</Pill> : null}
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {b.description}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--foreground-subtle)]">
                    Unlocks at {b.unlockXp.toLocaleString()} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {next ? (
          <div className="mt-6">
            <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
              <span>Progress to {next.shortTitle}</span>
              <span>{Math.round(pct * 100)}%</span>
            </div>
            <Progress value={pct} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

// ---------------- Account ----------------
function AccountTab({ profile }: { profile: UserProfile }) {
  return (
    <Card>
      <CardTitle>Account</CardTitle>
      <CardDescription>
        These are immutable on this build — alias and work email are issued at
        signup and cannot change.
      </CardDescription>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ReadOnlyField label="Alias" value={profile.alias} />
        <ReadOnlyField label="Work email" value={profile.workEmail} />
        <ReadOnlyField label="Member since" value={profile.joinedAt} />
        <ReadOnlyField
          label="Current rank"
          value={BADGES[profile.badge].title}
        />
      </div>
      <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-200">
        <div className="font-semibold">Danger zone</div>
        <p className="mt-1 text-rose-200/80">
          Account deletion is not yet exposed. Reach out to people-ops for now.
        </p>
      </div>
    </Card>
  );
}

// ---------------- Theme ----------------
function ThemeTab() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardTitle>Appearance</CardTitle>
      <CardDescription>
        Pick a theme. Your choice is remembered locally and applies everywhere.
      </CardDescription>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ThemeCard
          id="dark"
          label="Cosmic dark"
          description="The default Astra. Better for late-night incident response."
          active={theme === "dark"}
          onSelect={() => setTheme("dark")}
        />
        <ThemeCard
          id="light"
          label="Daylight"
          description="Calm light theme. Easier on screen-share & demos."
          active={theme === "light"}
          onSelect={() => setTheme("light")}
        />
      </div>
    </Card>
  );
}

function ThemeCard({
  id,
  label,
  description,
  active,
  onSelect,
}: {
  id: "dark" | "light";
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`text-left rounded-xl border p-4 transition-all ${
        active
          ? "border-violet-500/40 bg-violet-500/5 ring-1 ring-violet-500/30"
          : "border-[var(--border)] bg-[var(--surface-2)]/50 hover:border-[var(--border-strong)]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        {active ? <Pill tone="brand">Active</Pill> : null}
      </div>
      <ThemePreview variant={id} />
      <p className="mt-2 text-xs text-[var(--foreground-muted)]">{description}</p>
    </button>
  );
}

function ThemePreview({ variant }: { variant: "dark" | "light" }) {
  const dark = variant === "dark";
  return (
    <div
      className="grid h-16 grid-cols-3 gap-1 rounded-md p-1"
      style={{
        background: dark ? "#0c0e16" : "#ffffff",
        border: `1px solid ${dark ? "#232a3e" : "#e2e4ee"}`,
      }}
    >
      <div
        className="rounded"
        style={{ background: dark ? "#1a1f30" : "#f4f4f9" }}
      />
      <div className="col-span-2 rounded" style={{ background: dark ? "#141826" : "#f7f7fb" }}>
        <div
          className="m-1.5 h-2 w-1/2 rounded"
          style={{ background: dark ? "#8b5cf6" : "#7c3aed" }}
        />
        <div
          className="m-1.5 h-2 w-1/3 rounded"
          style={{ background: dark ? "#22d3ee" : "#0ea5e9" }}
        />
      </div>
    </div>
  );
}

// ---------------- Connections ----------------
function ConnectionsTab({ profile }: { profile: UserProfile }) {
  const [github, setGithub] = useState(profile.githubUrl ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedinUrl ?? "");
  const [leetcode, setLeetcode] = useState(profile.leetcodeUrl ?? "");
  const [website, setWebsite] = useState(profile.websiteUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const router = useRouter();

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl: github,
          linkedinUrl: linkedin,
          leetcodeUrl: leetcode,
          websiteUrl: website,
        }),
      });
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>Connected accounts</CardTitle>
      <CardDescription>
        Link external profiles. They show on your public Astra card and help us
        recommend practice problems based on what you have already solved.
      </CardDescription>
      <div className="mt-4 grid gap-3">
        <LinkField icon={GitBranch} label="GitHub" value={github} onChange={setGithub} placeholder="https://github.com/..." />
        <LinkField icon={Briefcase} label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="https://www.linkedin.com/in/..." />
        <LinkField icon={Sparkles} label="LeetCode" value={leetcode} onChange={setLeetcode} placeholder="https://leetcode.com/u/..." />
        <LinkField icon={Globe} label="Personal site" value={website} onChange={setWebsite} placeholder="https://yourdomain.com" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={saving} size="sm">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save links"}
        </Button>
        {savedAt ? <span className="text-xs text-emerald-300">Saved.</span> : null}
      </div>
    </Card>
  );
}

// ---------- Field primitives ----------
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none placeholder:text-[var(--foreground-subtle)] focus:border-violet-500/50"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
      <div className="text-sm text-[var(--foreground)]">{value}</div>
    </div>
  );
}

function LinkField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none placeholder:text-[var(--foreground-subtle)] focus:border-violet-500/50"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-3 text-center">
      <div className="text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
    </div>
  );
}
