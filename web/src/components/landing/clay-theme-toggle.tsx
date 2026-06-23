"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

export function ClayThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="grid h-8 w-8 place-items-center rounded-full border border-[var(--clay-border)] text-[var(--clay-text-muted)] transition-all hover:border-[var(--clay-border-strong)] hover:text-[var(--clay-text)]"
      style={{ boxShadow: "var(--clay-shadow-in)" }}
    >
      {isDark ? (
        <Sun className="h-[15px] w-[15px]" />
      ) : (
        <Moon className="h-[15px] w-[15px]" />
      )}
    </button>
  );
}
