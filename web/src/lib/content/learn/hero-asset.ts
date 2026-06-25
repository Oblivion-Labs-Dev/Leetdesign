import fs from "fs";
import path from "path";

/** Bust browser + Next image cache when the file on disk changes. */
export function getPublicImageSrc(publicPath: string): string {
  try {
    const normalized = publicPath.startsWith("/")
      ? publicPath.slice(1)
      : publicPath;
    const filePath = path.join(process.cwd(), "public", normalized);
    const { mtimeMs } = fs.statSync(filePath);
    const base = publicPath.split("?")[0];
    return `${base}?v=${Math.floor(mtimeMs)}`;
  } catch {
    return publicPath;
  }
}

export function getConceptsHeroImageSrc(): string {
  return getPublicImageSrc("/Concepts/database.png");
}

/** Bust browser + Next image cache when the file on disk changes. */
export function getLessonHeroImageSrcMap(
  lessons: { slug: string; heroImage?: string }[],
): Record<string, string> {
  return Object.fromEntries(
    lessons
      .filter((lesson) => lesson.heroImage)
      .map((lesson) => [lesson.slug, getPublicImageSrc(lesson.heroImage!)]),
  );
}
