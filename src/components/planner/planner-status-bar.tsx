"use client";

import { useMemo } from "react";
import { findBuildingCollisions } from "@/lib/validation/collisions";
import { findColonyBoundaryViolations } from "@/lib/validation/colony-boundary";
import { findCommuteResults } from "@/lib/validation/commute";
import { findGuardCoverageResults } from "@/lib/validation/guard-coverage";
import { usePlannerStore } from "@/stores/planner-store";

export function PlannerStatusBar() {
  const buildings = usePlannerStore((state) => state.buildings);
  const zoom = usePlannerStore((state) => state.map.zoom);
  const colonyRadiusChunks = usePlannerStore(
    (state) => state.rules.colonyRadiusChunks,
  );
  const {
    preferredCommuteDistance,
    warningCommuteDistance,
    guardCoverageRadius,
    guardCoverageMode,
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
  const guardCoverageWarningCount = useMemo(
    () =>
      findGuardCoverageResults(
        buildings,
        guardCoverageRadius,
        guardCoverageMode,
      ).filter((result) => !result.ruleValid).length,
    [buildings, guardCoverageRadius, guardCoverageMode],
  );

  return (
    <footer className="flex min-h-9 shrink-0 items-center justify-between gap-4 border-t bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>Buildings: {buildings.length}</span>
        <span className="hidden sm:inline">
          Warnings:{" "}
          {collisionCount +
            boundaryViolationCount +
            commuteWarningCount +
            guardCoverageWarningCount}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline">Position: X 0 · Z 0</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}
