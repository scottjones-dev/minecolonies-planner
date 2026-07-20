import {
  getRuleValueForLevel,
  guardPatrolRadiusBlocksByLevel,
} from "@/data/minecolonies-rules";
import { getBuildingClaimRadius } from "@/lib/validation/colony-boundary";
import {
  getAnchorDistance,
  getPlacedBuildingVariant,
} from "@/lib/validation/commute";
import type { PlacedBuilding } from "@/types/minecolonies";

export function isGuardBuilding(building: PlacedBuilding): boolean {
  const variant = getPlacedBuildingVariant(building);
  return variant?.isGuard === true || variant?.buildingType === "barracks";
}

export function getGuardPatrolRadius(building: PlacedBuilding): number {
  if (getPlacedBuildingVariant(building)?.isGuard !== true) return 0;
  return getRuleValueForLevel(
    guardPatrolRadiusBlocksByLevel,
    building.currentLevel,
  );
}

/** The square half-width rendered by MineColonies' colony map. */
export function getGuardMapRange(building: PlacedBuilding): number {
  return isGuardBuilding(building) ? getBuildingClaimRadius(building) * 16 : 0;
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
