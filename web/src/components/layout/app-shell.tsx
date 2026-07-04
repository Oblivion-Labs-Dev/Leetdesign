import * as React from "react";
import { StudioLayout } from "@/components/studio/studio-layout";
import { AppPageHeader } from "./app-page-header";

export async function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <StudioLayout>
      <AppPageHeader title={title} subtitle={subtitle} />
      <main className="flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-6">{children}</main>
    </StudioLayout>
  );
}
