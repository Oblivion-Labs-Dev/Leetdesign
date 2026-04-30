import type { DeliveryEvent } from "@/types";

/**
 * Build a deterministic timeline that mimics a real engineering delivery flow:
 * branch -> checks -> (occasional conflict) -> merge result -> deploy.
 *
 * In MVP we do not call any real git/CI providers. We simulate the timeline
 * locally so users can SEE their fix go through CI/CD.
 */
export function buildDeliveryTimeline(
  willPass: boolean,
  withConflict = false,
): DeliveryEvent[] {
  const now = Date.now();
  const events: DeliveryEvent[] = [
    {
      id: "branch",
      stage: "branch_created",
      label: "feature/incident-fix branch created",
      detail: "Forked from main at commit 8a3f12c",
      at: now,
      status: "success",
    },
    {
      id: "build",
      stage: "checks_running",
      label: "CI: build",
      detail: "Compiling project · 1 of 3 checks",
      at: now + 1500,
      status: "running",
    },
    {
      id: "tests",
      stage: "checks_running",
      label: "CI: tests",
      detail: "Running unit and contract tests · 2 of 3 checks",
      at: now + 3000,
      status: "pending",
    },
    {
      id: "deploy",
      stage: "checks_running",
      label: "CI: canary deploy",
      detail: "Deploying to canary stage · 3 of 3 checks",
      at: now + 4500,
      status: "pending",
    },
  ];

  if (withConflict) {
    events.push({
      id: "conflict",
      stage: "conflict_detected",
      label: "Merge conflict detected",
      detail: "config/limits.yaml conflicts with main",
      at: now + 5500,
      status: "fail",
    });
  }

  events.push(
    willPass
      ? {
          id: "merge",
          stage: "merged",
          label: "Merged to main",
          detail: "Auto-merged after 3 passing checks",
          at: now + 6500,
          status: "success",
        }
      : {
          id: "rejected",
          stage: "rejected",
          label: "Merge rejected",
          detail: "CI failed on canary deploy — system did not stabilize",
          at: now + 6500,
          status: "fail",
        },
  );

  return events;
}
