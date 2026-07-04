import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Clock, Target } from "lucide-react";
import type { LearnLesson } from "@/types/learn";
import { extractLessonToc } from "@/lib/content/learn/heading-utils";
import { getAdjacentLessons } from "@/lib/content/learn/registry";
import { getTrack } from "@/lib/content/learn/tracks";
import { LessonBlocks } from "./lesson-blocks";
import { LessonCompleteButton } from "./lesson-complete-button";
import { LessonOverviewBack } from "./lesson-overview-back";
import { LessonTableOfContents } from "./lesson-toc";

export function LessonTemplate({
  lesson,
  heroImageSrc,
  alreadyCompleted,
  embedded = false,
  inlineNav = false,
  onBackToOverview,
}: {
  lesson: LearnLesson;
  heroImageSrc?: string;
  alreadyCompleted: boolean;
  embedded?: boolean;
  inlineNav?: boolean;
  onBackToOverview?: () => void;
}) {
  const track = getTrack(lesson.trackSlug);
  const { prev, next } = getAdjacentLessons(lesson.trackSlug, lesson.slug);
  const toc =
    lesson.tableOfContents ??
    extractLessonToc(lesson.blocks).map((item) => ({ id: item.id, label: item.text }));

  const lessonHref = (slug: string) =>
    inlineNav
      ? `/brushup?concept=${slug}&read=1`
      : `/brushup/${lesson.trackSlug}/${slug}`;

  return (
    <article className={`learn-lesson ${embedded ? "learn-lesson--embedded" : ""}`}>
      <header className="learn-lesson-header">
        {!embedded ? (
          <Link href={`/brushup?concept=${lesson.slug}`} className="learn-back-link">
            <ArrowLeft className="h-3.5 w-3.5" />
            {track?.title ?? "Brush-up"}
          </Link>
        ) : null}

        <div className="learn-lesson-meta">
          {embedded && onBackToOverview ? (
            <LessonOverviewBack onBack={onBackToOverview} />
          ) : null}
          <span className="learn-pill">{track?.tag}</span>
          <span className="learn-meta-item">
            <Clock className="h-3.5 w-3.5" />
            {lesson.readMinutes} min read
          </span>
          <span className="learn-meta-item capitalize">{lesson.difficulty}</span>
        </div>

        <div
          className={`learn-lesson-hero-row ${lesson.heroImage ? "learn-lesson-hero-row--with-hero" : ""}`}
        >
          <div className="learn-lesson-hero-row-copy">
            <h1 className="learn-lesson-title">{lesson.title}</h1>
            {toc.length > 0 ? <LessonTableOfContents items={toc} /> : null}
            {!lesson.tableOfContents && lesson.subtitle ? (
              <p className="learn-lesson-subtitle">{lesson.subtitle}</p>
            ) : null}
          </div>

          {lesson.heroImage ? (
            <div className="learn-lesson-hero" aria-hidden>
              <Image
                src={heroImageSrc ?? lesson.heroImage}
                alt=""
                width={360}
                height={360}
                className="learn-lesson-hero-image"
                priority
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="learn-lesson-main">
        <section className="learn-objectives studio-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--studio-text)]">
            <Target className="h-4 w-4 text-[var(--studio-purple-light)]" />
            Learning objectives
          </div>
          <ul className="mt-3 space-y-2">
            {lesson.objectives.map((obj) => (
              <li key={obj} className="learn-objective-item">
                {obj}
              </li>
            ))}
          </ul>
        </section>

        <LessonBlocks blocks={lesson.blocks} />

        <section className="learn-takeaways studio-card">
          <h2 className="learn-heading-2 !mt-0">Key takeaways</h2>
          <ul className="learn-list">
            {lesson.keyTakeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-4">
            <LessonCompleteButton
              trackSlug={lesson.trackSlug}
              conceptSlug={lesson.slug}
              alreadyCompleted={alreadyCompleted}
            />
          </div>
        </section>

        <nav className="learn-lesson-nav">
          {prev ? (
            <Link href={lessonHref(prev.slug)} className="learn-nav-link">
              <span className="learn-nav-label">Previous</span>
              <span className="learn-nav-title">
                <ArrowLeft className="h-4 w-4" />
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={lessonHref(next.slug)}
              className="learn-nav-link learn-nav-link--next"
            >
              <span className="learn-nav-label">Next</span>
              <span className="learn-nav-title">
                {next.title}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </article>
  );
}
