import {
  getRuleValueForLevel,
  guardPatrolRadiusBlocksByLevel,
} from "@/data/minecolonies-rules";
import {
  getAnchorDistance,
  getPlacedBuildingVariant,
} from "@/lib/validation/commute";
import type { PlacedBuilding } from "@/types/minecolonies";

export function isGuardBuilding(building: PlacedBuilding): boolean {
  return getPlacedBuildingVariant(building)?.isGuard === true;
}

export function getGuardPatrolRadius(building: PlacedBuilding): number {
  if (!isGuardBuilding(building)) return 0;
  return getRuleValueForLevel(
    guardPatrolRadiusBlocksByLevel,
    building.currentLevel,
  );
}

export function isAnchorWithinGuardPatrol(
  building: PlacedBuilding,
  guards: PlacedBuilding[],
): boolean {
  return guards.some(
    (guard) =>
      getAnchorDistance(building, guard) <= getGuardPatrolRadius(guard),
  );
}
