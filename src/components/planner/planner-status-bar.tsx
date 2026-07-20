"use client";

import { usePlannerStore } from "@/stores/planner-store";

export function PlannerStatusBar() {
  const buildingCount = usePlannerStore((state) => state.buildings.length);
  const zoom = usePlannerStore((state) => state.map.zoom);

  return (
    <footer className="flex min-h-9 shrink-0 items-center justify-between gap-4 border-t bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>Buildings: {buildingCount}</span>
        <span className="hidden sm:inline">Warnings: 0</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline">Position: X 0 · Z 0</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}
