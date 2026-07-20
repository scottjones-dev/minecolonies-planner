"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  // Next.js 16.2 uses unstable_retry to re-fetch a failed route segment.
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c1715] px-5 text-center text-white">
      <div className="max-w-md">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300">
          <AlertTriangle aria-hidden="true" />
        </span>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">
          The plan hit an unexpected block.
        </h1>
        <p className="mt-4 leading-7 text-white/55">
          Your browser-local layouts are still yours. Try rendering the page
          again, or return home.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" onClick={() => unstable_retry()}>
            Try again
          </Button>
          <Link
            className={buttonVariants({ variant: "outline", size: "lg" })}
            href="/"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
