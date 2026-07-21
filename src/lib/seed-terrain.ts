import type { WorldProfile } from "@/types/world-map";

const versionIds: Record<WorldProfile["minecraftVersion"], number> = {
  "1.12.2": 15,
  "1.16.5": 20,
  "1.18.2": 22,
  "1.19.4": 24,
  "1.20.6": 25,
  "1.21.1": 26,
  "1.21.3": 27,
};

type WorkerRequest = {
  version: number;
  seedLow: number;
  seedHigh: number;
  dimension: number;
  flags: number;
  x: number;
  z: number;
  width: number;
  height: number;
};

let worker: Worker | null = null;
let nextRequestId = 1;
const workerRequests = new Map<
  number,
  { resolve: (ids: Int32Array) => void; reject: (error: Error) => void }
>();

function generateBiomeIds(request: WorkerRequest): Promise<Int32Array> {
  if (!worker) {
    worker = new Worker("/cubiomes/seed-terrain-worker.js");
    worker.onmessage = (
      event: MessageEvent<{ id: number; ids?: ArrayBuffer; error?: string }>,
    ) => {
      const pending = workerRequests.get(event.data.id);
      if (!pending) return;
      workerRequests.delete(event.data.id);
      if (event.data.error || !event.data.ids) {
        pending.reject(
          new Error(event.data.error ?? "Biome generation failed."),
        );
      } else {
        pending.resolve(new Int32Array(event.data.ids));
      }
    };
    worker.onerror = () => {
      for (const pending of workerRequests.values()) {
        pending.reject(new Error("The seed renderer worker stopped."));
      }
      workerRequests.clear();
      worker?.terminate();
      worker = null;
    };
  }
  const id = nextRequestId;
  nextRequestId += 1;
  return new Promise((resolve, reject) => {
    workerRequests.set(id, { resolve, reject });
    worker?.postMessage({ id, ...request });
  });
}

export function minecraftSeedToBigInt(seed: string): bigint {
  const normalized = seed.trim();
  if (/^[+-]?\d+$/.test(normalized)) {
    return BigInt.asUintN(64, BigInt(normalized));
  }
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = Math.imul(31, hash) + normalized.charCodeAt(index);
    hash |= 0;
  }
  return BigInt.asUintN(64, BigInt(hash));
}

export function canRenderSeedTerrain(profile: WorldProfile): boolean {
  return (
    profile.seed.trim().length > 0 &&
    profile.generator !== "modded" &&
    !(profile.dimension === "nether" && profile.minecraftVersion === "1.12.2")
  );
}

function getBiomeColor(id: number): [number, number, number] {
  if ([0, 10, 24, 44, 45, 46, 47, 48, 49, 50].includes(id)) {
    return [42, 104, id === 24 || id >= 47 ? 137 : 166];
  }
  if ([7, 11].includes(id)) return [48, 118, 184];
  if ([2, 17, 130].includes(id)) return [210, 190, 96];
  if ([12, 13, 26, 30, 31, 140, 158, 178, 179, 180, 181].includes(id)) {
    return [193, 218, 211];
  }
  if ([21, 22, 23, 149, 151].includes(id)) return [52, 121, 49];
  if ([6, 134, 184].includes(id)) return [72, 116, 73];
  if ([14, 15].includes(id)) return [139, 91, 145];
  if ([35, 36, 163, 164].includes(id)) return [167, 174, 92];
  if ([37, 38, 39, 165, 166, 167].includes(id)) return [176, 106, 65];
  if ([3, 20, 25, 34, 131, 162, 182].includes(id)) return [121, 132, 120];
  if ([8, 170, 171, 172, 173].includes(id)) return [121, 55, 48];
  if ([9, 40, 41, 42, 43].includes(id)) return [117, 111, 78];
  if ([174, 175, 183].includes(id)) return [75, 99, 72];
  if ([177, 185].includes(id)) return [105, 157, 96];
  if ([4, 18, 27, 28, 29, 132, 155, 156, 157].includes(id)) {
    return [73, 135, 68];
  }
  if ([5, 19, 32, 33, 133, 160, 161].includes(id)) return [87, 125, 82];
  return [102, 151, 82];
}

export type SeedTerrainImage = {
  imageUrl: string;
  originX: number;
  originZ: number;
  blocksPerPixel: number;
  pixelWidth: number;
  pixelHeight: number;
};

export async function generateSeedTerrainImage(
  profile: WorldProfile,
  originX: number,
  originZ: number,
  pixelWidth = 256,
  pixelHeight = 256,
): Promise<SeedTerrainImage> {
  if (!canRenderSeedTerrain(profile)) {
    throw new Error(
      "This world profile cannot generate a vanilla seed preview.",
    );
  }
  const seed = minecraftSeedToBigInt(profile.seed);
  const wordMask = BigInt("4294967295");
  const seedLow = Number(seed & wordMask);
  const seedHigh = Number((seed >> BigInt(32)) & wordMask);
  const biomeIds = await generateBiomeIds({
    version: versionIds[profile.minecraftVersion],
    seedLow,
    seedHigh,
    dimension:
      profile.dimension === "nether" ? -1 : profile.dimension === "end" ? 1 : 0,
    flags: profile.generator === "large-biomes" ? 1 : 0,
    x: Math.floor(originX / 4),
    z: Math.floor(originZ / 4),
    width: pixelWidth,
    height: pixelHeight,
  });
  const pixels = new Uint8ClampedArray(pixelWidth * pixelHeight * 4);
  for (let index = 0; index < biomeIds.length; index += 1) {
    const [red, green, blue] = getBiomeColor(biomeIds[index]);
    const pixel = index * 4;
    pixels[pixel] = red;
    pixels[pixel + 1] = green;
    pixels[pixel + 2] = blue;
    pixels[pixel + 3] = 255;
  }
  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The browser cannot draw the seed preview.");
  context.putImageData(new ImageData(pixels, pixelWidth, pixelHeight), 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) =>
      value
        ? resolve(value)
        : reject(new Error("Seed preview encoding failed.")),
    );
  });
  return {
    imageUrl: URL.createObjectURL(blob),
    originX: Math.floor(originX / 4) * 4,
    originZ: Math.floor(originZ / 4) * 4,
    blocksPerPixel: 4,
    pixelWidth,
    pixelHeight,
  };
}
