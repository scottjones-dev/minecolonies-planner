import { getStylePackById } from "@/data";
import {
  buildingClaimRadiusByLevel,
  chunkSizeBlocks,
  getRuleValueForLevel,
  guardTowerClaimRadiusByLevel,
  maximumColonyRadiusChunks,
  townHallClaimRadiusByLevel,
} from "@/data/minecolonies-rules";
import {
  getPlacedBuildingReservedBounds,
  type WorldBounds,
} from "@/lib/validation/collisions";
import type { BuildingVariant, PlacedBuilding } from "@/types/minecolonies";

export const BLOCKS_PER_CHUNK = chunkSizeBlocks;

export type ClaimedChunk = {
  x: number;
  z: number;
};

export type ColonyBoundary = {
  townHallId: string;
  centerChunkX: number;
  centerChunkZ: number;
  maximumRadiusChunks: number;
};

function getVariant(building: PlacedBuilding): BuildingVariant | null {
  return (
    getStylePackById(building.stylePackId)?.variants.find(
      (candidate) => candidate.id === building.variantId,
    ) ?? null
  );
}

function isTownHall(building: PlacedBuilding): boolean {
  return getVariant(building)?.buildingType === "town_hall";
}

function blockToChunk(block: number): number {
  return Math.floor(block / BLOCKS_PER_CHUNK);
}

function chunkKey(x: number, z: number): string {
  return `${x}:${z}`;
}

function getClaimRadius(
  building: PlacedBuilding,
  variant: BuildingVariant,
): number {
  const radii =
    variant.buildingType === "town_hall"
      ? townHallClaimRadiusByLevel
      : variant.isGuard
        ? guardTowerClaimRadiusByLevel
        : buildingClaimRadiusByLevel;

  return getRuleValueForLevel(radii, building.reserveThroughLevel);
}

function getFootprintChunks(building: PlacedBuilding): ClaimedChunk[] {
  const bounds = getPlacedBuildingReservedBounds(building);
  if (!bounds) return [];

  const minChunkX = blockToChunk(bounds.minX + 0.5);
  const maxChunkX = blockToChunk(bounds.maxX - 0.5);
  const minChunkZ = blockToChunk(bounds.minZ + 0.5);
  const maxChunkZ = blockToChunk(bounds.maxZ - 0.5);
  const chunks: ClaimedChunk[] = [];

  for (let x = minChunkX; x <= maxChunkX; x += 1) {
    for (let z = minChunkZ; z <= maxChunkZ; z += 1) {
      chunks.push({ x, z });
    }
  }

  return chunks;
}

export function getColonyBoundary(
  buildings: PlacedBuilding[],
): ColonyBoundary | null {
  const townHall = buildings.find(isTownHall);
  if (!townHall) return null;

  return {
    townHallId: townHall.id,
    centerChunkX: blockToChunk(townHall.x),
    centerChunkZ: blockToChunk(townHall.z),
    maximumRadiusChunks: maximumColonyRadiusChunks,
  };
}

export function chunkWithinColonyBoundary(
  chunk: ClaimedChunk,
  boundary: ColonyBoundary,
): boolean {
  const deltaX = chunk.x - boundary.centerChunkX;
  const deltaZ = chunk.z - boundary.centerChunkZ;
  return (
    deltaX * deltaX + deltaZ * deltaZ <=
    boundary.maximumRadiusChunks * boundary.maximumRadiusChunks
  );
}

export function boundsWithinColonyBoundary(
  bounds: WorldBounds,
  boundary: ColonyBoundary,
): boolean {
  const minChunkX = blockToChunk(bounds.minX + 0.5);
  const maxChunkX = blockToChunk(bounds.maxX - 0.5);
  const minChunkZ = blockToChunk(bounds.minZ + 0.5);
  const maxChunkZ = blockToChunk(bounds.maxZ - 0.5);

  for (let x = minChunkX; x <= maxChunkX; x += 1) {
    for (let z = minChunkZ; z <= maxChunkZ; z += 1) {
      if (!chunkWithinColonyBoundary({ x, z }, boundary)) return false;
    }
  }

  return true;
}

export function getClaimedChunks(
  buildings: PlacedBuilding[],
  initialRadiusChunks: number,
): ClaimedChunk[] {
  const boundary = getColonyBoundary(buildings);
  if (!boundary) return [];

  const chunks = new Map<string, ClaimedChunk>();
  const add = (chunk: ClaimedChunk, enforceMaximum: boolean) => {
    if (!enforceMaximum || chunkWithinColonyBoundary(chunk, boundary)) {
      chunks.set(chunkKey(chunk.x, chunk.z), chunk);
    }
  };

  for (
    let x = boundary.centerChunkX - initialRadiusChunks;
    x <= boundary.centerChunkX + initialRadiusChunks;
    x += 1
  ) {
    for (
      let z = boundary.centerChunkZ - initialRadiusChunks;
      z <= boundary.centerChunkZ + initialRadiusChunks;
      z += 1
    ) {
      add({ x, z }, false);
    }
  }

  for (const building of buildings) {
    const variant = getVariant(building);
    if (!variant) continue;
    const centerChunkX = blockToChunk(building.x);
    const centerChunkZ = blockToChunk(building.z);
    const radius = getClaimRadius(building, variant);

    for (let x = centerChunkX - radius; x <= centerChunkX + radius; x += 1) {
      for (let z = centerChunkZ - radius; z <= centerChunkZ + radius; z += 1) {
        add({ x, z }, true);
      }
    }

    for (const chunk of getFootprintChunks(building)) add(chunk, true);
  }

  return [...chunks.values()].sort(
    (left, right) => left.x - right.x || left.z - right.z,
  );
}

export function findColonyBoundaryViolations(
  buildings: PlacedBuilding[],
): string[] {
  const boundary = getColonyBoundary(buildings);
  if (!boundary) return [];

  return buildings.flatMap((building) => {
    const bounds = getPlacedBuildingReservedBounds(building);
    return bounds && !boundsWithinColonyBoundary(bounds, boundary)
      ? [building.id]
      : [];
  });
}
