import { getStylePackById } from "@/data";
import type {
  BuildingRole,
  BuildingVariant,
  PlacedBuilding,
} from "@/types/minecolonies";

export type CommuteRules = {
  preferredDistance: number;
  warningDistance: number;
};

export type CommuteState = "unassigned" | "preferred" | "warning" | "invalid";

export type CommuteResult = {
  workplaceId: string;
  residenceId: string | null;
  distance: number | null;
  state: CommuteState;
};

export function getPlacedBuildingVariant(
  building: PlacedBuilding,
): BuildingVariant | null {
  const stylePack = getStylePackById(building.stylePackId);
  return (
    stylePack?.variants.find(
      (candidate) => candidate.id === building.variantId,
    ) ?? null
  );
}

export function getPlacedBuildingRole(building: PlacedBuilding): BuildingRole {
  return getPlacedBuildingVariant(building)?.role ?? "other";
}

export function getAnchorDistance(
  first: Pick<PlacedBuilding, "x" | "z">,
  second: Pick<PlacedBuilding, "x" | "z">,
): number {
  return Math.hypot(first.x - second.x, first.z - second.z);
}

export function getCommuteState(
  distance: number,
  rules: CommuteRules,
): Exclude<CommuteState, "unassigned"> {
  if (distance <= rules.preferredDistance) {
    return "preferred";
  }

  if (distance <= rules.warningDistance) {
    return "warning";
  }

  return "invalid";
}

export function findCommuteResults(
  buildings: PlacedBuilding[],
  rules: CommuteRules,
): CommuteResult[] {
  const buildingsById = new Map(
    buildings.map((building) => [building.id, building]),
  );

  return buildings
    .filter((building) => getPlacedBuildingRole(building) === "workplace")
    .map((workplace) => {
      const residence = workplace.assignedResidenceId
        ? buildingsById.get(workplace.assignedResidenceId)
        : null;

      if (!residence || getPlacedBuildingRole(residence) !== "residence") {
        return {
          workplaceId: workplace.id,
          residenceId: null,
          distance: null,
          state: "unassigned" as const,
        };
      }

      const distance = getAnchorDistance(workplace, residence);

      return {
        workplaceId: workplace.id,
        residenceId: residence.id,
        distance,
        state: getCommuteState(distance, rules),
      };
    });
}
