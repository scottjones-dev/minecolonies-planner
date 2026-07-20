import { Castle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c1715] px-5 text-center text-white">
      <div className="max-w-md">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
          <Castle aria-hidden="true" />
        </span>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">
          404 · Unclaimed land
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          There is no blueprint here.
        </h1>
        <p className="mt-4 leading-7 text-white/55">
          The page may have moved, or this route was never part of the colony
          plan.
        </p>
        <Link
          className={`${buttonVariants({ size: "lg" })} mt-8 bg-emerald-400 text-[#0c1715] hover:bg-emerald-300`}
          href="/"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
