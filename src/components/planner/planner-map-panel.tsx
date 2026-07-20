"use client";

import dynamic from "next/dynamic";

const PlannerCanvas = dynamic(
  () =>
    import("@/components/planner/planner-canvas").then(
      (module) => module.PlannerCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading colony map…
      </div>
    ),
  },
);

export function PlannerMapPanel() {
  return (
    <section
      className="relative h-full min-h-[24rem] min-w-0 overflow-hidden bg-muted/30 lg:min-h-0"
      aria-label="Planner map"
    >
      <PlannerCanvas />
    </section>
  );
}
