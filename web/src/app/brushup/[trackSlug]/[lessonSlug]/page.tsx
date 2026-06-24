import { redirect } from "next/navigation";
import { getLesson } from "@/lib/content/learn/registry";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ trackSlug: string; lessonSlug: string }>;
}) {
  const { trackSlug, lessonSlug } = await params;
  const lesson = getLesson(trackSlug, lessonSlug);
  if (!lesson) redirect("/brushup");

  redirect(`/brushup?concept=${lesson.slug}&read=1`);
}
