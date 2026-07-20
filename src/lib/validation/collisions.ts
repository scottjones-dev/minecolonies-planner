import { getStylePackById } from "@/data";
import { getReservedFootprint } from "@/lib/building-geometry";
import type { PlacedBuilding } from "@/types/minecolonies";

export type WorldBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type BuildingCollision = {
  firstBuildingId: string;
  secondBuildingId: string;
};

export function getPlacedBuildingReservedBounds(
  building: PlacedBuilding,
): WorldBounds | null {
  const stylePack = getStylePackById(building.stylePackId);
  const variant = stylePack?.variants.find(
    (candidate) => candidate.id === building.variantId,
  );
  const footprint = variant
    ? getReservedFootprint(
        variant.levels,
        building.reserveThroughLevel,
        building.rotation,
      )
    : null;

  if (!footprint) {
    return null;
  }

  return {
    minX: building.x + footprint.minX,
    maxX: building.x + footprint.maxX,
    minZ: building.z + footprint.minZ,
    maxZ: building.z + footprint.maxZ,
  };
}

export function boundsOverlap(
  first: WorldBounds,
  second: WorldBounds,
): boolean {
  return (
    first.minX < second.maxX &&
    first.maxX > second.minX &&
    first.minZ < second.maxZ &&
    first.maxZ > second.minZ
  );
}

export function findBuildingCollisions(
  buildings: PlacedBuilding[],
): BuildingCollision[] {
  const boundsByBuilding = new Map(
    buildings.map((building) => [
      building.id,
      getPlacedBuildingReservedBounds(building),
    ]),
  );
  const collisions: BuildingCollision[] = [];

  for (let firstIndex = 0; firstIndex < buildings.length; firstIndex += 1) {
    const firstBuilding = buildings[firstIndex];
    const firstBounds = boundsByBuilding.get(firstBuilding.id);

    if (!firstBounds) {
      continue;
    }

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < buildings.length;
      secondIndex += 1
    ) {
      const secondBuilding = buildings[secondIndex];
      const secondBounds = boundsByBuilding.get(secondBuilding.id);

      if (secondBounds && boundsOverlap(firstBounds, secondBounds)) {
        collisions.push({
          firstBuildingId: firstBuilding.id,
          secondBuildingId: secondBuilding.id,
        });
      }
    }
  }

  return collisions;
}

export function getCollidingBuildingIds(
  collisions: BuildingCollision[],
): Set<string> {
  return new Set(
    collisions.flatMap((collision) => [
      collision.firstBuildingId,
      collision.secondBuildingId,
    ]),
  );
}

export function getCollisionPartners(
  buildingId: string,
  collisions: BuildingCollision[],
): string[] {
  return collisions.flatMap((collision) => {
    if (collision.firstBuildingId === buildingId) {
      return [collision.secondBuildingId];
    }

    if (collision.secondBuildingId === buildingId) {
      return [collision.firstBuildingId];
    }

    return [];
  });
}
