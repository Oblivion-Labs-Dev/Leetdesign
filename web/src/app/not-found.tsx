import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LeetdesignLogo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="relative z-10 grid min-h-screen place-items-center px-6 text-center">
      <div className="surface max-w-md p-8">
        <LeetdesignLogo className="mx-auto mb-4 justify-center" />
        <h1 className="text-2xl font-semibold">Lost in space</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          That page is not in the constellation. Head back to your dashboard.
        </p>
        <div className="mt-5 flex justify-center">
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
