import { StudioSidebar } from "./studio-sidebar";

export function StudioLayout({
  children,
  fixedViewport = false,
}: {
  children: React.ReactNode;
  fixedViewport?: boolean;
}) {
  return (
    <div
      className={fixedViewport ? "clay-studio clay-studio--fixed" : "clay-studio min-h-screen"}
    >
      <div
        className={
          fixedViewport
            ? "flex h-full min-h-0 w-full"
            : "flex min-h-screen w-full"
        }
      >
        <StudioSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
