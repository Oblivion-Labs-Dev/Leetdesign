import { redirect } from "next/navigation";
import { getTrack } from "@/lib/content/learn/tracks";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  if (!getTrack(trackSlug)) redirect("/brushup");
  redirect("/brushup");
}
