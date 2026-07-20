import { getStylePackById } from "@/data";
import {
  getPlacedBuildingReservedBounds,
  type WorldBounds,
} from "@/lib/validation/collisions";
import type { PlacedBuilding } from "@/types/minecolonies";

export const BLOCKS_PER_CHUNK = 16;

export type ColonyBoundary = {
  townHallId: string;
  centerX: number;
  centerZ: number;
  radiusChunks: number;
  radiusBlocks: number;
};

function isTownHall(building: PlacedBuilding): boolean {
  const stylePack = getStylePackById(building.stylePackId);
  const variant = stylePack?.variants.find(
    (candidate) => candidate.id === building.variantId,
  );

  return variant?.buildingType === "town_hall";
}

export function getColonyBoundary(
  buildings: PlacedBuilding[],
  radiusChunks: number,
): ColonyBoundary | null {
  const townHall = buildings.find(isTownHall);

  if (!townHall) {
    return null;
  }

  return {
    townHallId: townHall.id,
    centerX: townHall.x,
    centerZ: townHall.z,
    radiusChunks,
    radiusBlocks: radiusChunks * BLOCKS_PER_CHUNK,
  };
}

export function boundsWithinCircularBoundary(
  bounds: WorldBounds,
  boundary: ColonyBoundary,
): boolean {
  const radiusSquared = boundary.radiusBlocks ** 2;
  const corners = [
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    { x: bounds.minX, z: bounds.maxZ },
  ];

  return corners.every((corner) => {
    const deltaX = corner.x - boundary.centerX;
    const deltaZ = corner.z - boundary.centerZ;
    return deltaX ** 2 + deltaZ ** 2 <= radiusSquared;
  });
}

export function findColonyBoundaryViolations(
  buildings: PlacedBuilding[],
  radiusChunks: number,
): string[] {
  const boundary = getColonyBoundary(buildings, radiusChunks);

  if (!boundary) {
    return [];
  }

  return buildings.flatMap((building) => {
    const bounds = getPlacedBuildingReservedBounds(building);

    return bounds && !boundsWithinCircularBoundary(bounds, boundary)
      ? [building.id]
      : [];
  });
}
