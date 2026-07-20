import { getStylePackById } from "@/data";
import {
  barracksClaimRadiusByLevel,
  barracksTowerClaimRadiusByLevel,
  buildingClaimRadiusByLevel,
  chunkSizeBlocks,
  claimingBuildingTypes,
  gateHouseClaimRadiusByLevel,
  getRuleValueForLevel,
  guardTowerClaimRadiusByLevel,
  initialColonyRadiusChunks,
  maximumColonyRadiusChunks,
  townHallClaimRadiusByLevel,
} from "@/data/minecolonies-rules";
import { getLevelFootprint } from "@/lib/building-geometry";
import type { WorldBounds } from "@/lib/validation/collisions";
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

export type PlacementViolationReason =
  | "town-hall-required"
  | "duplicate-town-hall"
  | "outside-claim";

export type PlacementViolation = {
  buildingId: string;
  reason: PlacementViolationReason;
};

const claimingTypes = new Set<string>(claimingBuildingTypes);

export function getPlacedBuildingVariant(
  building: PlacedBuilding,
): BuildingVariant | null {
  return (
    getStylePackById(building.stylePackId)?.variants.find(
      (candidate) => candidate.id === building.variantId,
    ) ?? null
  );
}

export function isTownHall(building: PlacedBuilding): boolean {
  return getPlacedBuildingVariant(building)?.buildingType === "town_hall";
}

export function isClaimingBuilding(building: PlacedBuilding): boolean {
  const type = getPlacedBuildingVariant(building)?.buildingType;
  return type !== undefined && claimingTypes.has(type);
}

export function blockToChunk(block: number): number {
  return Math.floor(block / BLOCKS_PER_CHUNK);
}

function chunkKey(x: number, z: number): string {
  return `${x}:${z}`;
}

export function getBuildingClaimRadius(building: PlacedBuilding): number {
  const type = getPlacedBuildingVariant(building)?.buildingType;
  let radii: readonly number[] = buildingClaimRadiusByLevel;

  if (type === "town_hall") radii = townHallClaimRadiusByLevel;
  else if (type === "guard_tower") radii = guardTowerClaimRadiusByLevel;
  else if (type === "gatehouse") radii = gateHouseClaimRadiusByLevel;
  else if (type === "barracks") radii = barracksClaimRadiusByLevel;
  else if (type === "barrackstower") radii = barracksTowerClaimRadiusByLevel;

  return isClaimingBuilding(building)
    ? getRuleValueForLevel(radii, building.currentLevel)
    : 0;
}

export function getPlacedBuildingCurrentBounds(
  building: PlacedBuilding,
): WorldBounds | null {
  const variant = getPlacedBuildingVariant(building);
  const level =
    variant?.levels.find(
      (candidate) => candidate.level === building.currentLevel,
    ) ?? variant?.levels[0];
  if (!level) return null;

  const footprint = getLevelFootprint(level, building.rotation);
  return {
    minX: building.x + footprint.minX,
    maxX: building.x + footprint.maxX,
    minZ: building.z + footprint.minZ,
    maxZ: building.z + footprint.maxZ,
  };
}

export function getChunksForBounds(bounds: WorldBounds): ClaimedChunk[] {
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

function getFootprintChunks(building: PlacedBuilding): ClaimedChunk[] {
  const bounds = getPlacedBuildingCurrentBounds(building);
  return bounds ? getChunksForBounds(bounds) : [];
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
  return getChunksForBounds(bounds).every((chunk) =>
    chunkWithinColonyBoundary(chunk, boundary),
  );
}

function calculateClaims(
  buildings: PlacedBuilding[],
  initialRadiusChunks: number,
): { chunks: Map<string, ClaimedChunk>; violations: PlacementViolation[] } {
  const boundary = getColonyBoundary(buildings);
  const chunks = new Map<string, ClaimedChunk>();
  const violations: PlacementViolation[] = [];
  let establishedTownHallId: string | null = null;

  if (!boundary) {
    return {
      chunks,
      violations: buildings.map((building) => ({
        buildingId: building.id,
        reason: "town-hall-required",
      })),
    };
  }

  const add = (chunk: ClaimedChunk, enforceMaximum = true) => {
    if (!enforceMaximum || chunkWithinColonyBoundary(chunk, boundary)) {
      chunks.set(chunkKey(chunk.x, chunk.z), chunk);
    }
  };

  const addBuildingClaims = (building: PlacedBuilding) => {
    if (!isClaimingBuilding(building)) return;
    const centerChunkX = blockToChunk(building.x);
    const centerChunkZ = blockToChunk(building.z);
    const radius = getBuildingClaimRadius(building);

    for (let x = centerChunkX - radius; x <= centerChunkX + radius; x += 1) {
      for (let z = centerChunkZ - radius; z <= centerChunkZ + radius; z += 1) {
        add({ x, z });
      }
    }

    for (const chunk of getFootprintChunks(building)) add(chunk);
  };

  for (const building of buildings) {
    if (isTownHall(building)) {
      if (establishedTownHallId !== null) {
        violations.push({
          buildingId: building.id,
          reason: "duplicate-town-hall",
        });
        continue;
      }

      establishedTownHallId = building.id;
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
      addBuildingClaims(building);
      continue;
    }

    if (establishedTownHallId === null) {
      violations.push({
        buildingId: building.id,
        reason: "town-hall-required",
      });
      continue;
    }

    const footprintChunks = getFootprintChunks(building);
    const insideClaim =
      footprintChunks.length > 0 &&
      footprintChunks.every((chunk) => chunks.has(chunkKey(chunk.x, chunk.z)));
    if (!insideClaim) {
      violations.push({ buildingId: building.id, reason: "outside-claim" });
      continue;
    }

    addBuildingClaims(building);
  }

  return { chunks, violations };
}

export function getClaimedChunks(
  buildings: PlacedBuilding[],
  initialRadiusChunks: number,
): ClaimedChunk[] {
  return [
    ...calculateClaims(buildings, initialRadiusChunks).chunks.values(),
  ].sort((left, right) => left.x - right.x || left.z - right.z);
}

export function findColonyPlacementViolations(
  buildings: PlacedBuilding[],
  initialRadiusChunks = initialColonyRadiusChunks,
): PlacementViolation[] {
  return calculateClaims(buildings, initialRadiusChunks).violations;
}

export function findColonyBoundaryViolations(
  buildings: PlacedBuilding[],
  initialRadiusChunks = initialColonyRadiusChunks,
): string[] {
  return findColonyPlacementViolations(buildings, initialRadiusChunks).map(
    (violation) => violation.buildingId,
  );
}

export function getNewBuildingPlacementError(
  buildings: PlacedBuilding[],
  building: PlacedBuilding,
  initialRadiusChunks: number,
): PlacementViolationReason | null {
  return (
    findColonyPlacementViolations(
      [...buildings, building],
      initialRadiusChunks,
    ).find((violation) => violation.buildingId === building.id)?.reason ?? null
  );
}

export function getPlacementErrorMessage(
  reason: PlacementViolationReason,
): string {
  if (reason === "town-hall-required") {
    return "Place the Town Hall first. MineColonies only allows other blueprints inside an established colony.";
  }
  if (reason === "duplicate-town-hall") {
    return "This colony already has a Town Hall.";
  }
  return "The complete current-level blueprint must fit inside already claimed chunks.";
}
