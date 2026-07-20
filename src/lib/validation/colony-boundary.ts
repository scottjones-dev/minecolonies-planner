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

export function boundsWithinColonyBoundary(
  bounds: WorldBounds,
  boundary: ColonyBoundary,
): boolean {
  return (
    bounds.minX >= boundary.centerX - boundary.radiusBlocks &&
    bounds.maxX <= boundary.centerX + boundary.radiusBlocks &&
    bounds.minZ >= boundary.centerZ - boundary.radiusBlocks &&
    bounds.maxZ <= boundary.centerZ + boundary.radiusBlocks
  );
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

    return bounds && !boundsWithinColonyBoundary(bounds, boundary)
      ? [building.id]
      : [];
  });
}
