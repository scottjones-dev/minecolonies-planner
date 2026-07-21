import { describe, expect, it } from "vitest";
import { adaptBuiltInStylePack } from "@/data/style-pack-adapter";
import { isStylePack } from "@/lib/planner-transfer";
import sourceData from "./minecolonies-1.20.1.json";
import { builtInStylePackLoaders } from "./style-pack-loaders";
import fortressSource from "./styles/fortress.json";

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

  it("contains every bundled style pack and blueprint", () => {
    expect(sourceData.stylePacks).toHaveLength(23);
    expect(
      sourceData.stylePacks.reduce(
        (count, stylePack) => count + stylePack.variantCount,
        0,
      ),
    ).toBe(3423);
    expect(
      sourceData.stylePacks.reduce(
        (count, stylePack) => count + stylePack.levelCount,
        0,
      ),
    ).toBe(9445);
    expect(Object.keys(builtInStylePackLoaders).sort()).toEqual(
      sourceData.stylePacks.map((stylePack) => stylePack.id).sort(),
    );
  });

  it("matches Structurize's category and filename ordering", async () => {
    const expectedCategories = [
      "agriculture",
      "craftsmanship",
      "decorations",
      "education",
      "fundamentals",
      "infrastructure",
      "military",
      "mystic",
      "walls",
    ];

    for (const metadata of sourceData.stylePacks) {
      expect(metadata.categoryOrder).toEqual(expectedCategories);
      const sourceModule =
        await builtInStylePackLoaders[
          metadata.id as keyof typeof builtInStylePackLoaders
        ]();
      const stylePack = sourceModule.default.stylePack;
      expect(stylePack.variants).toHaveLength(metadata.variantCount);
      expect(
        stylePack.variants.reduce(
          (count, variant) => count + variant.levels.length,
          0,
        ),
      ).toBe(metadata.levelCount);
      expect(stylePack.variants.map((variant) => variant.gameOrder)).toEqual(
        Array.from({ length: metadata.variantCount }, (_, index) => index),
      );
      expect(isStylePack(adaptBuiltInStylePack(stylePack))).toBe(true);
      for (const variant of stylePack.variants) {
        expect(variant.categoryPath.split("/")[0]).toBe(variant.category);
        expect(new Set(variant.levels.map((level) => level.level)).size).toBe(
          variant.levels.length,
        );
        for (const level of variant.levels) {
          expect(level.bounds.maxX - level.bounds.minX + 1).toBe(level.size.x);
          expect(level.bounds.maxY - level.bounds.minY + 1).toBe(level.size.y);
          expect(level.bounds.maxZ - level.bounds.minZ + 1).toBe(level.size.z);
          expect(level.topDown.width).toBe(level.size.x);
          expect(level.topDown.depth).toBe(level.size.z);
          expect(Buffer.from(level.topDown.pixels, "base64")).toHaveLength(
            level.size.x * level.size.z,
          );
        }
      }
    }

    expect(
      fortressSource.stylePack.variants
        .filter((variant) => variant.category === "walls")
        .slice(0, 4)
        .map((variant) => variant.levels[0].sourcePath),
    ).toEqual([
      "walls/step_wall_dual1.blueprint",
      "walls/step_wall_quad1.blueprint",
      "walls/corner/corner1.blueprint",
      "walls/gate/gatelarge.blueprint",
    ]);
  });

  it("derives internally consistent bounds from NBT dimensions and anchors", () => {
    for (const variant of fortressSource.stylePack.variants) {
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

  it("derives hut-facing directions from the blueprint palette", () => {
    const levels = fortressSource.stylePack.variants.flatMap(
      (variant) => variant.levels,
    );
    const directedLevels = levels.filter((level) => level.entrance);

    expect(directedLevels.length).toBeGreaterThan(0);
    for (const level of directedLevels) {
      expect(level.entrance?.position).toEqual(level.anchor);
      expect(["north", "east", "south", "west"]).toContain(
        level.entrance?.direction,
      );
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
      limits: {
        initialColonyRadiusChunks: { min: 1, max: 15 },
        maximumColonyRadiusChunks: { min: 1, max: 250 },
        minimumColonyDistanceChunks: { min: 1, max: 200 },
      },
      buildingClaimRadiusByLevel: [1, 1, 1, 2, 2],
      townHallClaimRadiusByLevel: [1, 1, 2, 3, 5],
      guardTowerClaimRadiusByLevel: [2, 3, 3, 4, 5],
      gateHouseClaimRadiusByLevel: [1, 1, 2],
      barracksClaimRadiusByLevel: [2, 2, 2, 2, 2],
      barracksTowerClaimRadiusByLevel: [0, 0, 0, 0, 0],
      guardPatrolRadiusBlocksByLevel: [80, 110, 140, 170, 200],
    });
    expect(sourceData.rules.claimingBuildingTypes).toContain("residence");
    expect(sourceData.rules.claimingBuildingTypes).toContain("guard_tower");
    expect(sourceData.rules.claimingBuildingTypes).not.toContain("wall");
  });
});
