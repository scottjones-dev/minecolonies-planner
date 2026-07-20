import type {
  BuildingLevelDefinition,
  BuildingRotation,
  Direction,
} from "@/types/minecolonies";

export type Footprint = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
};

type Point2 = {
  x: number;
  z: number;
};

const directionVectors: Record<Direction, Point2> = {
  north: { x: 0, z: -1 },
  east: { x: 1, z: 0 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
};

export function rotatePoint(point: Point2, rotation: BuildingRotation): Point2 {
  switch (rotation) {
    case 0:
      return point;
    case 90:
      return { x: -point.z, z: point.x };
    case 180:
      return { x: -point.x, z: -point.z };
    case 270:
      return { x: point.z, z: -point.x };
  }
}

export function getLevelFootprint(
  level: BuildingLevelDefinition,
  rotation: BuildingRotation,
): Footprint {
  const left = level.bounds.minX - level.anchor.x - 0.5;
  const right = level.bounds.maxX - level.anchor.x + 0.5;
  const top = level.bounds.minZ - level.anchor.z - 0.5;
  const bottom = level.bounds.maxZ - level.anchor.z + 0.5;
  const corners = [
    rotatePoint({ x: left, z: top }, rotation),
    rotatePoint({ x: right, z: top }, rotation),
    rotatePoint({ x: right, z: bottom }, rotation),
    rotatePoint({ x: left, z: bottom }, rotation),
  ];
  const xValues = corners.map((corner) => corner.x);
  const zValues = corners.map((corner) => corner.z);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

export function getReservedFootprint(
  levels: BuildingLevelDefinition[],
  reserveThroughLevel: number,
  rotation: BuildingRotation,
): Footprint | null {
  const footprints = levels
    .filter((level) => level.level <= reserveThroughLevel)
    .map((level) => getLevelFootprint(level, rotation));

  if (footprints.length === 0) {
    return null;
  }

  const minX = Math.min(...footprints.map((footprint) => footprint.minX));
  const maxX = Math.max(...footprints.map((footprint) => footprint.maxX));
  const minZ = Math.min(...footprints.map((footprint) => footprint.minZ));
  const maxZ = Math.max(...footprints.map((footprint) => footprint.maxZ));

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

export function getEntranceMarker(
  level: BuildingLevelDefinition,
  rotation: BuildingRotation,
) {
  if (!level.entrance) {
    return null;
  }

  const position = rotatePoint(
    {
      x: level.entrance.position.x - level.anchor.x,
      z: level.entrance.position.z - level.anchor.z,
    },
    rotation,
  );
  const direction = rotatePoint(
    directionVectors[level.entrance.direction],
    rotation,
  );

  return { position, direction };
}
