import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

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
    <div className="relative z-10 flex min-h-screen w-full flex-1">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
