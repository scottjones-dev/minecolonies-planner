import { describe, expect, it } from "vitest";
import {
  getVisibleWebTiles,
  resolveWebTileUrl,
  validateWebTileMapSource,
} from "@/lib/web-map-tiles";
import type { WebTileMapSource } from "@/types/world-map";

const source: WebTileMapSource = {
  kind: "web-tiles",
  name: "My map",
  urlTemplate:
    "https://maps.example/tiles/{zoom}/{groupX}_{groupZ}/{zoomPrefix}{x}_{z}.png",
  tilePixelSize: 512,
  blocksPerTile: 512,
  originX: 0,
  originZ: 0,
  zoom: 2,
  zDirection: "down",
  opacity: 0.8,
};

describe("web map tiles", () => {
  it("validates safe, world-aligned sources", () => {
    expect(validateWebTileMapSource(source)).toBeNull();
    expect(
      validateWebTileMapSource({
        ...source,
        urlTemplate: "https://maps.example/{x}/{z}?access_token=secret",
      }),
    ).toContain("tokens");
  });

  it("resolves coordinates, grouping, and zoom prefixes", () => {
    expect(resolveWebTileUrl(source, -33, 65)).toBe(
      "https://maps.example/tiles/2/-2_2/zz_-33_65.png",
    );
  });

  it("uses floor division for negative world coordinates", () => {
    expect(
      getVisibleWebTiles(source, {
        left: -513,
        top: -1,
        right: 1,
        bottom: 1,
      }).map(({ x, z }) => ({ x, z })),
    ).toEqual([
      { x: -1024, z: -512 },
      { x: -512, z: -512 },
      { x: 0, z: -512 },
      { x: -1024, z: 0 },
      { x: -512, z: 0 },
      { x: 0, z: 0 },
    ]);
  });

  it("supports providers whose tile rows increase toward negative Z", () => {
    const [tile] = getVisibleWebTiles(
      { ...source, zDirection: "up" },
      { left: 0, top: -512, right: 512, bottom: 0 },
    );
    expect(tile).toMatchObject({ x: 0, z: -512 });
    expect(tile.url).toContain("0_0.png");
  });

  it("does not fetch the neighbouring tile at an exact edge", () => {
    expect(
      getVisibleWebTiles(source, {
        left: 0,
        top: 0,
        right: 512,
        bottom: 512,
      }),
    ).toHaveLength(1);
  });
});
