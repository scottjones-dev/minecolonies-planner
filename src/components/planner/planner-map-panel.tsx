"use client";

import { useDroppable } from "@dnd-kit/core";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

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
  const { isOver, setNodeRef } = useDroppable({
    id: "planner-map",
    data: {
      type: "planner-map",
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "relative h-full min-h-[24rem] min-w-0 overflow-hidden bg-muted/30 outline-none lg:min-h-0",
        isOver && "ring-2 ring-inset ring-primary",
      )}
      aria-label="Planner map"
    >
      <PlannerCanvas />
      {isOver ? (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
          Drop to place building
        </div>
      ) : null}
    </section>
  );
}
