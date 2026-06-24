import { StudioPageShell } from "@/components/studio/studio-page-shell";

export async function LearnLayout({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "roadmap";
}) {
  return (
    <StudioPageShell variant={variant}>{children}</StudioPageShell>
  );
}
