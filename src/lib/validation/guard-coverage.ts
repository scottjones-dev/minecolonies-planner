import {
  getAnchorDistance,
  getPlacedBuildingRole,
  getPlacedBuildingVariant,
} from "@/lib/validation/commute";
import type { BuildingRole, PlacedBuilding } from "@/types/minecolonies";

export type GuardCoverageMode = "either" | "both";

export type GuardCoverageResult = {
  buildingId: string;
  role: Extract<BuildingRole, "residence" | "workplace">;
  covered: boolean;
  ruleValid: boolean;
  assignedResidenceId: string | null;
  assignedResidenceCovered: boolean | null;
};

export function isGuardBuilding(building: PlacedBuilding): boolean {
  return getPlacedBuildingVariant(building)?.isGuard === true;
}

export function isAnchorCoveredByGuard(
  building: PlacedBuilding,
  guards: PlacedBuilding[],
  radius: number,
): boolean {
  return guards.some((guard) => getAnchorDistance(building, guard) <= radius);
}

export function findGuardCoverageResults(
  buildings: PlacedBuilding[],
  radius: number,
  mode: GuardCoverageMode,
): GuardCoverageResult[] {
  const guards = buildings.filter(isGuardBuilding);
  const residencesById = new Map(
    buildings
      .filter((building) => getPlacedBuildingRole(building) === "residence")
      .map((building) => [building.id, building]),
  );

  return buildings.flatMap((building) => {
    const role = getPlacedBuildingRole(building);

    if (role !== "residence" && role !== "workplace") {
      return [];
    }

    const covered = isAnchorCoveredByGuard(building, guards, radius);
    const assignedResidence =
      role === "workplace" && building.assignedResidenceId
        ? residencesById.get(building.assignedResidenceId)
        : null;
    const assignedResidenceCovered = assignedResidence
      ? isAnchorCoveredByGuard(assignedResidence, guards, radius)
      : null;
    const ruleValid =
      role === "workplace" && assignedResidenceCovered !== null
        ? mode === "both"
          ? covered && assignedResidenceCovered
          : covered || assignedResidenceCovered
        : covered;

    return [
      {
        buildingId: building.id,
        role,
        covered,
        ruleValid,
        assignedResidenceId: assignedResidence?.id ?? null,
        assignedResidenceCovered,
      },
    ];
  });
}
