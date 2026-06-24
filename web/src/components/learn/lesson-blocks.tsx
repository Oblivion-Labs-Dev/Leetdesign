import Image from "next/image";
import type { LearnBlock } from "@/types/learn";
import { slugifyHeading } from "@/lib/content/learn/heading-utils";
import { LessonDiagram } from "./lesson-diagrams";
import { LessonQuiz } from "./lesson-quiz";

const CALLOUT_STYLES = {
  insight: {
    border: "var(--studio-purple)",
    bg: "color-mix(in srgb, var(--studio-purple) 10%, transparent)",
    label: "Key insight",
  },
  tip: {
    border: "var(--studio-blue)",
    bg: "color-mix(in srgb, var(--studio-blue) 10%, transparent)",
    label: "Tip",
  },
  warning: {
    border: "var(--studio-orange)",
    bg: "color-mix(in srgb, var(--studio-orange) 10%, transparent)",
    label: "Caution",
  },
  definition: {
    border: "var(--studio-green)",
    bg: "color-mix(in srgb, var(--studio-green) 10%, transparent)",
    label: "Definition",
  },
} as const;

function LessonBlock({ block }: { block: LearnBlock }) {
  switch (block.type) {
    case "heading": {
      const headingId = block.id ?? slugifyHeading(block.text);
      if (block.level === 2) {
        return (
          <h2 id={headingId} className="learn-heading-2 learn-scroll-target">
            {block.text}
          </h2>
        );
      }
      return (
        <h3 id={headingId} className="learn-heading-3 learn-scroll-target">
          {block.text}
        </h3>
      );
    }

    case "paragraph":
      return <p className="learn-paragraph">{block.text}</p>;

    case "highlight":
      return (
        <p className="learn-highlight">
          <span className="learn-highlight-bar" aria-hidden />
          {block.text}
        </p>
      );

    case "callout": {
      const style = CALLOUT_STYLES[block.variant];
      return (
        <aside
          className="learn-callout"
          style={{
            borderColor: style.border,
            background: style.bg,
          }}
        >
          <div className="learn-callout-label" style={{ color: style.border }}>
            {block.title ?? style.label}
          </div>
          <p>{block.text}</p>
        </aside>
      );
    }

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`learn-list ${block.ordered ? "learn-list--ordered" : ""}`}
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Tag>
      );
    }

    case "image":
      return (
        <figure className="learn-figure">
          <div className="learn-figure-frame">
            <Image
              src={block.src}
              alt={block.alt}
              width={960}
              height={540}
              className="h-auto w-full rounded-xl"
            />
          </div>
          {block.caption ? (
            <figcaption className="learn-figure-caption">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );

    case "code":
      return (
        <figure className="learn-code-figure">
          <pre className="learn-code">
            <code>{block.code}</code>
          </pre>
          {block.caption ? (
            <figcaption className="learn-figure-caption">
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      );

    case "animation":
      return (
        <LessonDiagram id={block.id} caption={block.caption} />
      );

    case "diagram":
      return <LessonDiagram id={block.id} caption={block.caption} />;

    case "quiz":
      return (
        <LessonQuiz
          title={block.title}
          anchorId={block.anchorId}
          questions={block.questions}
        />
      );

    case "divider":
      return <hr className="learn-divider" />;

    default:
      return null;
  }
}

export function LessonBlocks({ blocks }: { blocks: LearnBlock[] }) {
  return (
    <div className="learn-blocks">
      {blocks.map((block, i) => (
        <LessonBlock key={i} block={block} />
      ))}
    </div>
  );
}
