import fs from "fs";
import path from "path";

const HERO_IMAGE_PATH = path.join(
  process.cwd(),
  "public/Concepts/database.png",
);

/** Bust browser + Next image cache when the file on disk changes. */
export function getConceptsHeroImageSrc(): string {
  try {
    const { mtimeMs } = fs.statSync(HERO_IMAGE_PATH);
    return `/Concepts/database.png?v=${Math.floor(mtimeMs)}`;
  } catch {
    return "/Concepts/database.png";
  }
}
