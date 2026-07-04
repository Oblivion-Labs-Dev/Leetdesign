import type { LearnLesson } from "@/types/learn";
import { encapsulationLesson } from "./lessons/encapsulation";
import { abstractionLesson } from "./lessons/abstraction";
import { inheritanceLesson } from "./lessons/inheritance";
import { polymorphismLesson } from "./lessons/polymorphism";
import { srpLesson } from "./lessons/single-responsibility";
import { ocpLesson } from "./lessons/open-closed";
import { lspLesson } from "./lessons/liskov-substitution";
import { ispLesson } from "./lessons/interface-segregation";
import { dipLesson } from "./lessons/dependency-inversion";
import { getTrack, LEARN_TRACKS } from "./tracks";

const LESSON_LIST: LearnLesson[] = [
  encapsulationLesson,
  abstractionLesson,
  inheritanceLesson,
  polymorphismLesson,
  srpLesson,
  ocpLesson,
  lspLesson,
  ispLesson,
  dipLesson,
];

const LESSONS: Record<string, LearnLesson> = Object.fromEntries(
  LESSON_LIST.map((lesson) => [`${lesson.trackSlug}/${lesson.slug}`, lesson]),
);

export function getAllTracks() {
  return LEARN_TRACKS;
}

export function getAllLessons(): LearnLesson[] {
  return LESSON_LIST;
}

export function getLesson(
  trackSlug: string,
  lessonSlug: string,
): LearnLesson | undefined {
  return LESSONS[`${trackSlug}/${lessonSlug}`];
}

export function getLessonsForTrack(trackSlug: string): LearnLesson[] {
  const track = getTrack(trackSlug);
  if (!track) return [];
  return track.lessonSlugs
    .map((slug) => getLesson(trackSlug, slug))
    .filter((l): l is LearnLesson => Boolean(l));
}

export function getAdjacentLessons(trackSlug: string, lessonSlug: string) {
  const track = getTrack(trackSlug);
  if (!track) return { prev: null, next: null };
  const idx = track.lessonSlugs.indexOf(lessonSlug);
  if (idx === -1) return { prev: null, next: null };
  const prevSlug = idx > 0 ? track.lessonSlugs[idx - 1] : null;
  const nextSlug =
    idx < track.lessonSlugs.length - 1 ? track.lessonSlugs[idx + 1] : null;
  return {
    prev: prevSlug ? getLesson(trackSlug, prevSlug) ?? null : null,
    next: nextSlug ? getLesson(trackSlug, nextSlug) ?? null : null,
  };
}
