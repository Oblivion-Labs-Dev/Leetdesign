import type { LearnBlock } from "@/types/learn";

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type LessonTocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function extractLessonToc(blocks: LearnBlock[]): LessonTocItem[] {
  return blocks
    .filter((block): block is Extract<LearnBlock, { type: "heading" }> => block.type === "heading")
    .map((block) => ({
      id: block.id ?? slugifyHeading(block.text),
      text: block.text,
      level: block.level,
    }));
}
