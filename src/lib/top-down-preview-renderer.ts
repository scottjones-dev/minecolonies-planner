import { getRotatedDirection } from "@/lib/building-geometry";
import {
  getRotatedPreviewDimensions,
  rotatePreviewCell,
} from "@/lib/top-down-preview";
import type {
  BuildingLevelDefinition,
  BuildingRotation,
  Direction,
} from "@/types/minecolonies";

const materialColors = [
  "#000000",
  "#7a8186",
  "#9a6a3a",
  "#4f7f48",
  "#806247",
  "#c8ad6a",
  "#5795b5",
  "#91c6cb",
  "#a74d43",
  "#b96e35",
  "#c3a447",
  "#4f8a61",
  "#5271a3",
  "#805f93",
  "#d6d2c7",
  "#474d54",
] as const;

const directionVectors: Record<Direction, { x: number; z: number }> = {
  north: { x: 0, z: -1 },
  east: { x: 1, z: 0 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
};

function colorChannels(hex: string) {
  return [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
}

function textureNoise(seed: number) {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

function getTextureFactor(
  material: number,
  x: number,
  z: number,
  pixelX: number,
  pixelZ: number,
) {
  const noise = textureNoise(
    (x * 73856093) ^
      (z * 19349663) ^
      (pixelX * 83492791) ^
      (pixelZ * 2971215073) ^
      (material * 1013),
  );
  const grain = (noise - 0.5) * 0.2;

  switch (material) {
    case 2:
      return grain + (pixelZ % 3 === 0 ? -0.12 : 0.05);
    case 3:
    case 11:
      return grain * 1.8 + (noise > 0.75 ? -0.18 : 0.05);
    case 6:
      return grain * 0.45 + (pixelZ % 3 === 0 ? 0.13 : -0.04);
    case 7:
      return (pixelX === pixelZ ? 0.2 : -0.06) + grain * 0.35;
    case 8:
      return (
        grain * 0.4 +
        (pixelZ % 4 === 0 || (pixelX + (pixelZ > 3 ? 2 : 0)) % 5 === 0
          ? -0.2
          : 0.06)
      );
    case 5:
    case 10:
    case 14:
      return grain * 0.55;
    default:
      return grain;
  }
}

function drawTexturedCell(
  context: CanvasRenderingContext2D,
  x: number,
  z: number,
  scale: number,
  value: number,
) {
  const material = value >> 4;
  if (material === 0) return;
  const height = value & 0x0f;
  const base = colorChannels(materialColors[material]);
  const heightShade = 0.58 + (height / 15) * 0.42;

  for (let pixelZ = 0; pixelZ < scale; pixelZ++) {
    for (let pixelX = 0; pixelX < scale; pixelX++) {
      const factor = Math.max(
        0.35,
        Math.min(
          1.25,
          heightShade + getTextureFactor(material, x, z, pixelX, pixelZ),
        ),
      );
      const channels = base.map((channel) =>
        Math.min(255, Math.round(channel * factor)),
      );
      context.fillStyle = `rgb(${channels.join(" ")})`;
      context.fillRect(x * scale + pixelX, z * scale + pixelZ, 1, 1);
    }
  }
}

function decodePixels(value: string): Uint8Array {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function drawBuildingTopDownPreview(
  canvas: HTMLCanvasElement,
  level: BuildingLevelDefinition,
  rotation: BuildingRotation,
  cellScale: number,
  showFrontMarker: boolean,
) {
  const sourceWidth =
    level.topDown?.width ?? level.bounds.maxX - level.bounds.minX + 1;
  const sourceDepth =
    level.topDown?.depth ?? level.bounds.maxZ - level.bounds.minZ + 1;
  const dimensions = getRotatedPreviewDimensions(
    sourceWidth,
    sourceDepth,
    rotation,
  );
  canvas.width = dimensions.width * cellScale;
  canvas.height = dimensions.depth * cellScale;
  const context = canvas.getContext("2d");
  if (!context) return dimensions;

  let pixels: Uint8Array | null = null;
  if (level.topDown) {
    try {
      pixels = decodePixels(level.topDown.pixels);
    } catch {
      pixels = null;
    }
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const rotatedPixels = new Uint8Array(dimensions.width * dimensions.depth);
  for (let z = 0; z < sourceDepth; z++) {
    for (let x = 0; x < sourceWidth; x++) {
      const value = pixels?.[z * sourceWidth + x] ?? (pixels ? 0 : 0x18);
      const rotated = rotatePreviewCell(
        x,
        z,
        sourceWidth,
        sourceDepth,
        rotation,
      );
      rotatedPixels[rotated.z * dimensions.width + rotated.x] = value;
    }
  }

  for (let z = 0; z < dimensions.depth; z++) {
    for (let x = 0; x < dimensions.width; x++) {
      const value = rotatedPixels[z * dimensions.width + x];
      drawTexturedCell(context, x, z, cellScale, value);
      const material = value >> 4;
      if (material === 0) continue;
      const height = value & 0x0f;
      const east =
        x + 1 < dimensions.width
          ? rotatedPixels[z * dimensions.width + x + 1]
          : 0;
      const south =
        z + 1 < dimensions.depth
          ? rotatedPixels[(z + 1) * dimensions.width + x]
          : 0;
      if (east >> 4 === 0 || (east & 0x0f) + 1 < height) {
        context.fillStyle = "rgba(0, 0, 0, 0.28)";
        context.fillRect((x + 1) * cellScale - 1, z * cellScale, 1, cellScale);
      }
      if (south >> 4 === 0 || (south & 0x0f) + 1 < height) {
        context.fillStyle = "rgba(0, 0, 0, 0.34)";
        context.fillRect(x * cellScale, (z + 1) * cellScale - 1, cellScale, 1);
      }
    }
  }

  if (showFrontMarker && level.entrance) {
    const marker = rotatePreviewCell(
      level.entrance.position.x - level.bounds.minX,
      level.entrance.position.z - level.bounds.minZ,
      sourceWidth,
      sourceDepth,
      rotation,
    );
    const vector =
      directionVectors[getRotatedDirection(level.entrance.direction, rotation)];
    const startX = (marker.x + 0.5) * cellScale;
    const startZ = (marker.z + 0.5) * cellScale;
    const endX = startX + vector.x * cellScale * 2.4;
    const endZ = startZ + vector.z * cellScale * 2.4;

    context.strokeStyle = "#fbbf24";
    context.fillStyle = "#fbbf24";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(startX, startZ);
    context.lineTo(endX, endZ);
    context.stroke();
    context.beginPath();
    context.arc(endX, endZ, 2.4, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#0f766e";
    context.strokeStyle = "#ffffff";
    context.lineWidth = 1.2;
    context.beginPath();
    context.arc(startX, startZ, 3.2, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  return dimensions;
}
