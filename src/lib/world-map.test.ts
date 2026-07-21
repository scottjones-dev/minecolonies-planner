import { describe, expect, it } from "vitest";
import {
  getRasterMapWorldRect,
  validateRasterMapSource,
} from "@/lib/world-map";
import type { RasterMapSource } from "@/types/world-map";

const source: RasterMapSource = {
  kind: "raster",
  assetId: "asset-1",
  preset: "journeymap",
  fileName: "world.webp",
  imageWidth: 1024,
  imageHeight: 512,
  originX: -256,
  originZ: 128,
  pixelsPerBlock: 0.5,
  opacity: 0.75,
};

describe("generic raster map sources", () => {
  it("maps pixels to calibrated Minecraft blocks", () => {
    expect(getRasterMapWorldRect(source)).toEqual({
      x: -256,
      z: 128,
      width: 2048,
      depth: 1024,
    });
  });

  it("validates source-independent calibration", () => {
    expect(validateRasterMapSource(source)).toBeNull();
    expect(validateRasterMapSource({ ...source, pixelsPerBlock: 0 })).toContain(
      "Pixels per block",
    );
  });
});
