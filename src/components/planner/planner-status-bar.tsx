"use client";

import { useMemo } from "react";
import { findBuildingCollisions } from "@/lib/validation/collisions";
import { findColonyBoundaryViolations } from "@/lib/validation/colony-boundary";
import { findCommuteResults } from "@/lib/validation/commute";
import { usePlannerStore } from "@/stores/planner-store";
import { worldMapSourceLabels } from "@/types/world-map";

export function PlannerStatusBar() {
  const buildings = usePlannerStore((state) => state.buildings);
  const zoom = usePlannerStore((state) => state.map.zoom);
  const world = usePlannerStore((state) => state.world);
  const {
    colonyRadiusChunks,
    preferredCommuteDistance,
    warningCommuteDistance,
  } = usePlannerStore((state) => state.rules);
  const collisionCount = useMemo(
    () => findBuildingCollisions(buildings).length,
    [buildings],
  );
  const boundaryViolationCount = useMemo(
    () => findColonyBoundaryViolations(buildings, colonyRadiusChunks).length,
    [buildings, colonyRadiusChunks],
  );
  const commuteWarningCount = useMemo(
    () =>
      findCommuteResults(buildings, {
        preferredDistance: preferredCommuteDistance,
        warningDistance: warningCommuteDistance,
      }).filter((result) => result.state !== "preferred").length,
    [buildings, preferredCommuteDistance, warningCommuteDistance],
  );
  return (
    <footer className="flex min-h-9 shrink-0 items-center justify-between gap-4 border-t bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>Buildings: {buildings.length}</span>
        <span className="hidden sm:inline">
          Warnings:{" "}
          {collisionCount + boundaryViolationCount + commuteWarningCount}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {world.mapSource ? (
          <span className="hidden md:inline">
            Map: {worldMapSourceLabels[world.mapSource.preset]}
          </span>
        ) : world.seed ? (
          <span className="hidden md:inline">Map: seed biomes</span>
        ) : null}
        <span className="hidden sm:inline">Position: X 0 · Z 0</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}
