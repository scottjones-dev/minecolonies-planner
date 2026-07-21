import { validateWebTileMapSource } from "@/lib/web-map-tiles";
import {
  type RasterMapSource,
  supportedMinecraftVersions,
  type WebTileMapSource,
  type WorldProfile,
  worldMapSourcePresets,
} from "@/types/world-map";

export const MAX_WORLD_MAP_BYTES = 100 * 1024 * 1024;
export const WORLD_MAP_ACCEPT =
  ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

export function getRasterMapWorldRect(source: RasterMapSource) {
  return {
    x: source.originX,
    z: source.originZ,
    width: source.imageWidth / source.pixelsPerBlock,
    depth: source.imageHeight / source.pixelsPerBlock,
  };
}

export function validateRasterMapSource(
  source: RasterMapSource,
): string | null {
  if (!source.assetId.trim()) return "The map needs a local asset identifier.";
  if (!worldMapSourcePresets.includes(source.preset)) {
    return "Choose a supported map source.";
  }
  if (!source.fileName.trim()) return "The map needs a file name.";
  if (
    !Number.isInteger(source.imageWidth) ||
    !Number.isInteger(source.imageHeight) ||
    source.imageWidth < 1 ||
    source.imageHeight < 1
  ) {
    return "The image dimensions are invalid.";
  }
  if (!Number.isInteger(source.originX) || !Number.isInteger(source.originZ)) {
    return "Top-left X and Z must be whole Minecraft block coordinates.";
  }
  if (
    !Number.isFinite(source.pixelsPerBlock) ||
    source.pixelsPerBlock <= 0 ||
    source.pixelsPerBlock > 16
  ) {
    return "Pixels per block must be greater than 0 and no more than 16.";
  }
  if (
    !Number.isFinite(source.opacity) ||
    source.opacity < 0.05 ||
    source.opacity > 1
  ) {
    return "Opacity must be between 5% and 100%.";
  }
  return null;
}

export function isSupportedRasterFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "image/webp" ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  );
}

export function isWorldProfile(value: unknown): value is WorldProfile {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const profile = value as Record<string, unknown>;
  const mapSource = profile.mapSource;
  return (
    typeof profile.seed === "string" &&
    profile.seed.length <= 128 &&
    supportedMinecraftVersions.includes(
      profile.minecraftVersion as WorldProfile["minecraftVersion"],
    ) &&
    ["overworld", "nether", "end"].includes(profile.dimension as string) &&
    ["default", "large-biomes", "amplified", "modded"].includes(
      profile.generator as string,
    ) &&
    (mapSource === null || isValidWorldMapSource(mapSource))
  );
}

function isValidWorldMapSource(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const kind = (value as { kind?: unknown }).kind;
  if (kind === "raster") {
    return validateRasterMapSource(value as RasterMapSource) === null;
  }
  if (kind === "web-tiles") {
    return validateWebTileMapSource(value as WebTileMapSource) === null;
  }
  return false;
}
