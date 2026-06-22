"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, GitBranch, Mail } from "lucide-react";
import { LeetdesignLogo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { AuthBadgePanel } from "@/components/auth/auth-badge-panel";

type Mode = "login" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const mode: Mode = search.get("mode") === "signup" ? "signup" : "login";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [alias, setAlias] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aliasState, setAliasState] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | { status: "available" }
    | { status: "taken"; reason?: string; suggestion?: string }
  >({ status: "idle" });
  const [oauthProviders, setOauthProviders] = useState<{ google: boolean; github: boolean }>({
    google: false,
    github: false,
  });

  const preview = useMemo(
    () => ({ firstName, lastName, personalEmail, alias }),
    [firstName, lastName, personalEmail, alias],
  );

  useEffect(() => {
    setError(null);
    setInfo(null);
  }, [mode]);

  useEffect(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
    fetch(`${backend}/api/auth/providers`)
      .then((r) => r.json())
      .then((p) =>
        setOauthProviders({
          google: Boolean(p.google),
          github: Boolean(p.github),
        }),
      )
      .catch(() => setOauthProviders({ google: false, github: false }));
  }, []);

  // Debounced alias availability check.
  useEffect(() => {
    if (mode !== "signup") return;
    const trimmed = alias.trim().toLowerCase();
    if (!trimmed) {
      setAliasState({ status: "idle" });
      return;
    }
    setAliasState({ status: "checking" });
    const t = setTimeout(async () => {
      try {
        const backend =
          process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
        const res = await fetch(
          `${backend}/api/auth/alias-available?alias=${encodeURIComponent(trimmed)}`,
        );
        const json = await res.json();
        if (json.available) {
          setAliasState({ status: "available" });
        } else {
          setAliasState({
            status: "taken",
            reason: json.reason,
            suggestion: json.suggestion,
          });
        }
      } catch {
        setAliasState({ status: "idle" });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [alias, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    try {
      let nextPath = "/dashboard";
      if (mode === "signup") {
        if (alias.trim() && aliasState.status !== "available") {
          setError("Pick an available alias before continuing.");
          return;
        }
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: personalEmail.trim().toLowerCase(),
            alias: alias.trim().toLowerCase(),
            password,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error ?? "Signup failed.");
          return;
        }
        const loginEmail = json?.user?.workEmail ?? "";
        if (!loginEmail) {
          setError("Failed to generate work email.");
          return;
        }
        setInfo(`Your work email is ${loginEmail}`);
        nextPath = json?.user?.firstVisitCompleted ? "/dashboard" : "/onboarding";
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: identifier.trim().toLowerCase(),
            password,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error ?? "Invalid credentials.");
          return;
        }
        nextPath = "/dashboard";
      }

      router.replace(nextPath);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function social(provider: "google" | "github") {
    setError(null);
    if (!oauthProviders[provider]) {
      setError(
        `${provider === "google" ? "Google" : "GitHub"} sign-in is not configured yet. Add provider credentials to backend/.env.`,
      );
      return;
    }
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
    window.location.href = `${backend}/api/auth/${provider}`;
  }

  return (
    <div className="relative z-10 grid min-h-screen place-items-center px-6 py-10">
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_380px]">
        <div className="surface relative p-8">
          <div className="mb-6 flex items-center justify-between">
            <LeetdesignLogo />
            <Link
              href="/"
              className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
            >
              Back to home
            </Link>
          </div>

          <ModeToggle mode={mode} />

          <h2 className="text-xl font-semibold">
            {mode === "login" ? `Sign in to ${BRAND.product}` : "Create your Leetdesign account"}
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {mode === "login"
              ? "Sign in with your work email or your personal recovery email. Onboarding only happens once after signup."
              : "Pick a unique alias — your work email becomes alias@" +
                BRAND.emailDomain +
                ". Use your personal email for account recovery."}
          </p>

          <form className="mt-6 space-y-3" onSubmit={onSubmit} noValidate>
            {mode === "signup" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="First name"
                    value={firstName}
                    onChange={setFirstName}
                    placeholder="First name"
                    required
                  />
                  <Field
                    label="Last name"
                    value={lastName}
                    onChange={setLastName}
                    placeholder="Last name"
                    required
                  />
                </div>
                <AliasField
                  alias={alias}
                  onChange={setAlias}
                  state={aliasState}
                  domain={BRAND.emailDomain}
                />
                <Field
                  type="email"
                  label="Personal email (recovery)"
                  value={personalEmail}
                  onChange={setPersonalEmail}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  required
                />
              </>
            ) : (
              <Field
                type="text"
                label="Work email or personal email"
                value={identifier}
                onChange={setIdentifier}
                placeholder={`alias@${BRAND.emailDomain}`}
                autoComplete="username"
                required
              />
            )}
            <Field
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
            {info ? <p className="text-xs text-emerald-300">{info}</p> : null}
            {error ? <p className="text-xs text-rose-300">{error}</p> : null}
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? mode === "signup"
                  ? "Creating account..."
                  : "Signing in..."
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            or continue with
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => social("google")}
            >
              <Mail className="h-4 w-4" /> Google
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => social("github")}
            >
              <GitBranch className="h-4 w-4" /> GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <Link
                  href="/login?mode=signup"
                  className="font-medium text-violet-300 hover:text-violet-200"
                >
                  Sign up
                </Link>{" "}
                — onboarding runs once after you join.
              </>
            ) : (
              <>
                Already onboarded?{" "}
                <Link
                  href="/login?mode=login"
                  className="font-medium text-violet-300 hover:text-violet-200"
                >
                  Sign in
                </Link>{" "}
                with your work email.
              </>
            )}
          </p>
        </div>
        <AuthBadgePanel mode={mode} preview={preview} />
      </div>
    </div>
  );
}

function ModeToggle({ mode }: { mode: Mode }) {
  return (
    <div className="mb-6 inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1">
      <Link
        href="/login?mode=login"
        prefetch={false}
        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
          mode === "login"
            ? "bg-[var(--background-soft)] text-[var(--foreground)]"
            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        }`}
      >
        Login
      </Link>
      <Link
        href="/login?mode=signup"
        prefetch={false}
        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
          mode === "signup"
            ? "bg-[var(--background-soft)] text-[var(--foreground)]"
            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        }`}
      >
        Sign up
      </Link>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
  minLength,
}: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none placeholder:text-[var(--foreground-subtle)] focus:border-violet-500/50"
      />
    </label>
  );
}

type AliasState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "taken"; reason?: string; suggestion?: string };

function AliasField({
  alias,
  onChange,
  state,
  domain,
}: {
  alias: string;
  onChange: (v: string) => void;
  state: AliasState;
  domain: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
        <span>Pick your alias</span>
        <span className="font-normal normal-case tracking-normal text-[var(--foreground-subtle)]">
          {alias.trim()
            ? `${alias.trim().toLowerCase()}@${domain}`
            : `alias@${domain}`}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-within:border-violet-500/50">
        <input
          type="text"
          value={alias}
          onChange={(e) => onChange(e.target.value.replace(/\s+/g, ""))}
          placeholder="akborse"
          minLength={3}
          maxLength={20}
          required
          className="w-full bg-transparent outline-none placeholder:text-[var(--foreground-subtle)]"
        />
        <AliasStatusBadge state={state} />
      </div>
      <p className="mt-1 text-[11px] text-[var(--foreground-subtle)]">
        Lowercase letters and digits only. Min 3 characters. This becomes part of your work email and cannot be changed.
        {state.status === "taken" && state.suggestion ? (
          <>
            {" "}
            Try{" "}
            <button
              type="button"
              onClick={() => onChange(state.suggestion!)}
              className="text-violet-300 underline-offset-2 hover:underline"
            >
              {state.suggestion}
            </button>
            ?
          </>
        ) : null}
      </p>
    </label>
  );
}

function AliasStatusBadge({ state }: { state: AliasState }) {
  if (state.status === "checking") {
    return (
      <span className="text-[10px] uppercase tracking-wider text-[var(--foreground-subtle)]">
        Checking...
      </span>
    );
  }
  if (state.status === "available") {
    return (
      <span className="text-[10px] uppercase tracking-wider text-emerald-300">
        Available
      </span>
    );
  }
  if (state.status === "taken") {
    return (
      <span
        className="text-[10px] uppercase tracking-wider text-rose-300"
        title={state.reason}
      >
        Taken
      </span>
    );
  }
  return null;
}
