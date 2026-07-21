import { unzip } from "fflate";
import type { WorldDimension } from "@/types/world-map";

export const MAX_JOURNEYMAP_ARCHIVE_BYTES = 250 * 1024 * 1024;
const MAX_OUTPUT_EDGE = 4096;
const MAX_TILE_COUNT = 4096;
const MAX_UNCOMPRESSED_TILE_BYTES = 512 * 1024 * 1024;
const TILE_BLOCK_SIZE = 512;
const TILE_NAME_PATTERN = /^(-?\d+),(-?\d+)\.png$/i;

export type JourneyMapTile = {
  path: string;
  x: number;
  z: number;
  bytes: Uint8Array;
};

export type JourneyMapTileSet = {
  directory: string;
  dimension: WorldDimension;
  mapType: string;
  tiles: JourneyMapTile[];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type JourneyMapImportResult = {
  blob: Blob;
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  originX: number;
  originZ: number;
  pixelsPerBlock: number;
  tileCount: number;
  sourceDirectory: string;
};

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "");
}

function inferDimension(directory: string): WorldDimension {
  const segments = directory.toLowerCase().split("/");
  if (
    segments.some((segment) =>
      ["the_nether", "nether", "dim-1", "minecraft~the_nether"].includes(
        segment,
      ),
    )
  ) {
    return "nether";
  }
  if (
    segments.some((segment) =>
      ["the_end", "end", "dim1", "minecraft~the_end"].includes(segment),
    )
  ) {
    return "end";
  }
  return "overworld";
}

export function discoverJourneyMapTileSets(
  entries: Record<string, Uint8Array>,
): JourneyMapTileSet[] {
  const sets = new Map<string, JourneyMapTile[]>();
  for (const [rawPath, bytes] of Object.entries(entries)) {
    const path = normalizePath(rawPath);
    const parts = path.split("/");
    const fileName = parts.at(-1) ?? "";
    const match = TILE_NAME_PATTERN.exec(fileName);
    if (!match) continue;
    const directory = parts.slice(0, -1).join("/");
    const tiles = sets.get(directory) ?? [];
    tiles.push({
      path,
      x: Number(match[1]),
      z: Number(match[2]),
      bytes,
    });
    sets.set(directory, tiles);
  }

  return [...sets.entries()].map(([directory, tiles]) => {
    const coordinatesX = tiles.map((tile) => tile.x);
    const coordinatesZ = tiles.map((tile) => tile.z);
    return {
      directory,
      dimension: inferDimension(directory),
      mapType: directory.split("/").at(-1) ?? "unknown",
      tiles,
      minX: Math.min(...coordinatesX),
      maxX: Math.max(...coordinatesX),
      minZ: Math.min(...coordinatesZ),
      maxZ: Math.max(...coordinatesZ),
    };
  });
}

function mapTypePriority(mapType: string): number {
  switch (mapType.toLowerCase()) {
    case "day":
      return 5;
    case "topo":
      return 4;
    case "biome":
      return 3;
    case "night":
      return 2;
    default:
      return 1;
  }
}

export function selectJourneyMapTileSet(
  sets: JourneyMapTileSet[],
  dimension: WorldDimension,
): JourneyMapTileSet | null {
  return (
    sets
      .filter((set) => set.dimension === dimension)
      .sort(
        (left, right) =>
          mapTypePriority(right.mapType) - mapTypePriority(left.mapType) ||
          right.tiles.length - left.tiles.length,
      )[0] ?? null
  );
}

function unzipArchive(file: File): Promise<Record<string, Uint8Array>> {
  return file.arrayBuffer().then(
    (buffer) =>
      new Promise((resolve, reject) => {
        let selectedTileCount = 0;
        let selectedBytes = 0;
        let limitsExceeded = false;
        unzip(
          new Uint8Array(buffer),
          {
            filter: (entry) => {
              const isTile = TILE_NAME_PATTERN.test(
                normalizePath(entry.name).split("/").at(-1) ?? "",
              );
              if (!isTile) return false;
              selectedTileCount += 1;
              selectedBytes += entry.originalSize;
              limitsExceeded =
                selectedTileCount > MAX_TILE_COUNT ||
                selectedBytes > MAX_UNCOMPRESSED_TILE_BYTES;
              return !limitsExceeded;
            },
          },
          (error, entries) => {
            if (limitsExceeded) {
              reject(
                new Error(
                  "The JourneyMap export is too large to compose safely in a browser.",
                ),
              );
            } else if (error) reject(error);
            else resolve(entries);
          },
        );
      }),
  );
}

async function composeTileSet(
  tileSet: JourneyMapTileSet,
): Promise<Omit<JourneyMapImportResult, "fileName">> {
  const blockWidth = (tileSet.maxX - tileSet.minX + 1) * TILE_BLOCK_SIZE;
  const blockHeight = (tileSet.maxZ - tileSet.minZ + 1) * TILE_BLOCK_SIZE;
  const pixelsPerBlock = Math.min(
    1,
    MAX_OUTPUT_EDGE / blockWidth,
    MAX_OUTPUT_EDGE / blockHeight,
  );
  const imageWidth = Math.max(1, Math.round(blockWidth * pixelsPerBlock));
  const imageHeight = Math.max(1, Math.round(blockHeight * pixelsPerBlock));
  const renderedTileSize = TILE_BLOCK_SIZE * pixelsPerBlock;
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("This browser cannot compose JourneyMap tiles.");
  context.imageSmoothingEnabled = false;

  for (const tile of tileSet.tiles) {
    const tileBytes = new Uint8Array(tile.bytes.length);
    tileBytes.set(tile.bytes);
    const bitmap = await createImageBitmap(
      new Blob([tileBytes.buffer], { type: "image/png" }),
    );
    try {
      context.drawImage(
        bitmap,
        (tile.x - tileSet.minX) * renderedTileSize,
        (tile.z - tileSet.minZ) * renderedTileSize,
        renderedTileSize,
        renderedTileSize,
      );
    } finally {
      bitmap.close();
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) =>
      value
        ? resolve(value)
        : reject(new Error("The JourneyMap mosaic could not be encoded.")),
    );
  });
  return {
    blob,
    imageWidth,
    imageHeight,
    originX: tileSet.minX * TILE_BLOCK_SIZE,
    originZ: tileSet.minZ * TILE_BLOCK_SIZE,
    pixelsPerBlock,
    tileCount: tileSet.tiles.length,
    sourceDirectory: tileSet.directory,
  };
}

export async function importJourneyMapArchive(
  file: File,
  dimension: WorldDimension,
): Promise<JourneyMapImportResult> {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Choose the ZIP created by JourneyMap's world export.");
  }
  if (file.size > MAX_JOURNEYMAP_ARCHIVE_BYTES) {
    throw new Error(
      "That JourneyMap ZIP is over 250 MB. Export a smaller area.",
    );
  }
  let entries: Record<string, Uint8Array>;
  try {
    entries = await unzipArchive(file);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("too large to compose safely")
    ) {
      throw error;
    }
    throw new Error(
      "That JourneyMap ZIP is corrupt or uses an unsupported format.",
    );
  }
  const sets = discoverJourneyMapTileSets(entries);
  const selected = selectJourneyMapTileSet(sets, dimension);
  if (!selected) {
    throw new Error(
      `No ${dimension} JourneyMap PNG tiles were found in this export.`,
    );
  }
  const composed = await composeTileSet(selected);
  return {
    ...composed,
    fileName: `${file.name.replace(/\.zip$/i, "")} · ${selected.mapType}.png`,
  };
}
