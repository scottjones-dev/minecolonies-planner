import { getLevelFootprint } from "@/lib/building-geometry";
import type {
  BuildingLevelDefinition,
  BuildingRotation,
} from "@/types/minecolonies";

export const BLOCK_SIZE = 24;

type ScreenPoint = {
  x: number;
  y: number;
};

type MapTransform = {
  zoom: number;
  panX: number;
  panY: number;
};

export function worldBlockToCanvasCoordinate(block: number): number {
  return (block + 0.5) * BLOCK_SIZE;
}

export function canvasCoordinateToWorldBlock(coordinate: number): number {
  return Math.floor(coordinate / BLOCK_SIZE);
}

export function screenPointToWorldBlock(
  point: ScreenPoint,
  mapBounds: Pick<DOMRect, "left" | "top">,
  transform: MapTransform,
) {
  const mapX = point.x - mapBounds.left;
  const mapY = point.y - mapBounds.top;

  return {
    x: canvasCoordinateToWorldBlock((mapX - transform.panX) / transform.zoom),
    z: canvasCoordinateToWorldBlock((mapY - transform.panY) / transform.zoom),
  };
}

export function screenPointToWorldPosition(
  point: ScreenPoint,
  mapBounds: Pick<DOMRect, "left" | "top">,
  transform: MapTransform,
) {
  const mapX = point.x - mapBounds.left;
  const mapY = point.y - mapBounds.top;

  return {
    x: (mapX - transform.panX) / transform.zoom / BLOCK_SIZE - 0.5,
    z: (mapY - transform.panY) / transform.zoom / BLOCK_SIZE - 0.5,
  };
}

export function centerBuildingOnWorldPosition(
  position: { x: number; z: number },
  level: BuildingLevelDefinition,
  rotation: BuildingRotation,
) {
  const footprint = getLevelFootprint(level, rotation);
  const centerOffsetX = (footprint.minX + footprint.maxX) / 2;
  const centerOffsetZ = (footprint.minZ + footprint.maxZ) / 2;

  return {
    x: Math.round(position.x - centerOffsetX),
    z: Math.round(position.z - centerOffsetZ),
  };
}
