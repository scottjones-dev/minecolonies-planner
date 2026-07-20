"use client";

import { useMemo } from "react";
import { findBuildingCollisions } from "@/lib/validation/collisions";
import { usePlannerStore } from "@/stores/planner-store";

export function PlannerStatusBar() {
  const buildings = usePlannerStore((state) => state.buildings);
  const zoom = usePlannerStore((state) => state.map.zoom);
  const warningCount = useMemo(
    () => findBuildingCollisions(buildings).length,
    [buildings],
  );

  return (
    <footer className="flex min-h-9 shrink-0 items-center justify-between gap-4 border-t bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>Buildings: {buildings.length}</span>
        <span className="hidden sm:inline">Warnings: {warningCount}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline">Position: X 0 · Z 0</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}
