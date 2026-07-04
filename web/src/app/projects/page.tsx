import { StudioPageShell } from "@/components/studio/studio-page-shell";
import { DesignList } from "@/components/simulator/design-list";

export default async function ProjectsPage() {
  return (
    <StudioPageShell>
      <DesignList />
    </StudioPageShell>
  );
}
