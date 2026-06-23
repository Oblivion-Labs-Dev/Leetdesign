import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function StudioCard({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section className={cn("studio-card", className)} {...props}>
      {children}
    </section>
  );
}
