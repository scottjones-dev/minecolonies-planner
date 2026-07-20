import { describe, expect, it } from "vitest";
import sourceData from "./minecolonies-1.20.1.json";

describe("generated MineColonies source data", () => {
  it("is pinned to the bundled upstream revision", () => {
    expect(sourceData.schemaVersion).toBe(1);
    expect(sourceData.provenance).toMatchObject({
      project: "ldtteam/minecolonies",
      commit: "b2fa2b6232ca33944d1489827e95ea5b40328325",
      minecraftVersion: "1.20.1",
      license: "GPL-3.0",
      structurize: {
        version: "1.20.1-1.0.806-snapshot",
        tag: "v1.20.1-1.0.806-snapshot",
        commit: "8f6cad27f311eec2d8aee8b7c7bd58aa52edcd84",
      },
    });
  });

  it("contains every Fortress blueprint", () => {
    expect(sourceData.stylePack.variants).toHaveLength(167);
    expect(
      sourceData.stylePack.variants.reduce(
        (count, variant) => count + variant.levels.length,
        0,
      ),
    ).toBe(461);
  });

  it("matches Structurize's category and filename ordering", () => {
    expect(sourceData.stylePack.categoryOrder).toEqual([
      "agriculture",
      "craftsmanship",
      "decorations",
      "education",
      "fundamentals",
      "infrastructure",
      "military",
      "mystic",
      "walls",
    ]);
    expect(
      sourceData.stylePack.variants.map((variant) => variant.gameOrder),
    ).toEqual(Array.from({ length: 167 }, (_, index) => index));
    expect(
      sourceData.stylePack.variants
        .filter((variant) => variant.category === "walls")
        .slice(0, 4)
        .map((variant) => variant.levels[0].sourcePath),
    ).toEqual([
      "walls/step_wall_dual1.blueprint",
      "walls/step_wall_quad1.blueprint",
      "walls/corner/corner1.blueprint",
      "walls/gate/gatelarge.blueprint",
    ]);

    for (const variant of sourceData.stylePack.variants) {
      expect(variant.categoryPath.split("/")[0]).toBe(variant.category);
    }
  });

  it("derives internally consistent bounds from NBT dimensions and anchors", () => {
    for (const variant of sourceData.stylePack.variants) {
      expect(variant.levels.length).toBeGreaterThan(0);
      expect(new Set(variant.levels.map((level) => level.level)).size).toBe(
        variant.levels.length,
      );

      for (const level of variant.levels) {
        expect(level.bounds.maxX - level.bounds.minX + 1).toBe(level.size.x);
        expect(level.bounds.maxY - level.bounds.minY + 1).toBe(level.size.y);
        expect(level.bounds.maxZ - level.bounds.minZ + 1).toBe(level.size.z);
        expect(level.bounds.minX).toBe(0);
        expect(level.bounds.minY).toBe(0);
        expect(level.bounds.minZ).toBe(0);
      }
    }
  });

  it("captures source-backed claim and patrol defaults", () => {
    expect(sourceData.rules).toMatchObject({
      chunkSizeBlocks: 16,
      defaults: {
        initialColonyRadiusChunks: 4,
        maximumColonyRadiusChunks: 20,
        minimumColonyDistanceChunks: 8,
      },
      buildingClaimRadiusByLevel: [1, 1, 1, 2, 2],
      townHallClaimRadiusByLevel: [1, 1, 2, 3, 5],
      guardTowerClaimRadiusByLevel: [2, 3, 3, 4, 5],
      guardPatrolRadiusBlocksByLevel: [80, 110, 140, 170, 200],
    });
  });
});
