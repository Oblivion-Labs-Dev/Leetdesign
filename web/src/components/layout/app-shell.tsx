import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { AppMobileNav } from "./app-mobile-nav";

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
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
      <AppMobileNav />
    </div>
  );
}
