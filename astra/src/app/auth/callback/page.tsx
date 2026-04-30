import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildAuthCookie } from "@/lib/auth-cookie";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const next = params.next || "/dashboard";
  if (!token) redirect("/login?oauth=failed");

  (await cookies()).set(buildAuthCookie(token));
  redirect(next);
}
