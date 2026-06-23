import { StudioSidebar } from "./studio-sidebar";

export function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="clay-studio min-h-screen">
      <div className="flex min-h-screen w-full">
        <StudioSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
