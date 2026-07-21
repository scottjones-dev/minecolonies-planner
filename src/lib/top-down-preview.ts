import type { BuildingRotation } from "@/types/minecolonies";

export function getRotatedPreviewDimensions(
  width: number,
  depth: number,
  rotation: BuildingRotation,
) {
  return rotation === 90 || rotation === 270
    ? { width: depth, depth: width }
    : { width, depth };
}

export function rotatePreviewCell(
  x: number,
  z: number,
  width: number,
  depth: number,
  rotation: BuildingRotation,
) {
  switch (rotation) {
    case 0:
      return { x, z };
    case 90:
      return { x: depth - 1 - z, z: x };
    case 180:
      return { x: width - 1 - x, z: depth - 1 - z };
    case 270:
      return { x: z, z: width - 1 - x };
  }
}
