export const supportedMinecraftVersions = [
  "1.12.2",
  "1.16.5",
  "1.18.2",
  "1.19.4",
  "1.20.6",
  "1.21.1",
  "1.21.3",
] as const;

export type SupportedMinecraftVersion =
  (typeof supportedMinecraftVersions)[number];

export const worldMapSourcePresets = [
  "xaero",
  "journeymap",
  "voxelmap",
  "mapwriter",
  "other",
] as const;

export type WorldMapSourcePreset = (typeof worldMapSourcePresets)[number];
export type WorldDimension = "overworld" | "nether" | "end";
export type WorldGenerator =
  | "default"
  | "large-biomes"
  | "amplified"
  | "modded";

export type RasterMapSource = {
  kind: "raster";
  assetId: string;
  preset: WorldMapSourcePreset;
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  originX: number;
  originZ: number;
  pixelsPerBlock: number;
  opacity: number;
};

export type WebTileMapSource = {
  kind: "web-tiles";
  name: string;
  urlTemplate: string;
  tilePixelSize: number;
  blocksPerTile: number;
  originX: number;
  originZ: number;
  zoom: number;
  zDirection: "down" | "up";
  opacity: number;
};

export type WorldMapSource = RasterMapSource | WebTileMapSource;

export type WorldProfile = {
  seed: string;
  minecraftVersion: SupportedMinecraftVersion;
  dimension: WorldDimension;
  generator: WorldGenerator;
  mapSource: WorldMapSource | null;
};

export const defaultWorldProfile: WorldProfile = {
  seed: "",
  minecraftVersion: "1.21.1",
  dimension: "overworld",
  generator: "default",
  mapSource: null,
};

export const worldMapSourceLabels: Record<WorldMapSourcePreset, string> = {
  xaero: "Xaero's World Map",
  journeymap: "JourneyMap",
  voxelmap: "VoxelMap",
  mapwriter: "MapWriter",
  other: "Other map or screenshot",
};
