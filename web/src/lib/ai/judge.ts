import type {
  ArchitectureSnapshot,
  PracticeExercise,
  ReviewVerdict,
} from "@/types";
import { localFallbackScore } from "@/lib/scoring/score";

/**
 * AIJudge is the contract used by the practice "VP review meeting" flow.
 *
 * In MVP we ship a deterministic local scorer so the product is fully
 * usable offline. Swap this for a real model-backed implementation
 * by replacing `judgeArchitecture` with a network call that returns
 * the same `ReviewVerdict` shape.
 */
export interface AIJudge {
  judgeArchitecture(
    exercise: PracticeExercise,
    snapshot: ArchitectureSnapshot,
  ): Promise<ReviewVerdict>;
}

export const localAIJudge: AIJudge = {
  async judgeArchitecture(exercise, snapshot) {
    await new Promise((r) => setTimeout(r, 600));
    return localFallbackScore(exercise, snapshot);
  },
};
