import { describe, expect, it } from "vitest";
import { fortressStylePack } from "@/data/fortress-style";
import {
  isStylePack,
  parsePlannerTransferDocument,
} from "@/lib/planner-transfer";
import { defaultWorldProfile } from "@/types/world-map";

describe("style catalogue category compatibility", () => {
  it("accepts the source-backed MineColonies category schema", () => {
    expect(isStylePack(fortressStylePack)).toBe(true);
  });

  it("migrates legacy planner categories into their in-game equivalents", () => {
    const variant = fortressStylePack.variants.find(
      (candidate) => candidate.id === "fortress-residence-1",
    );
    expect(variant).toBeDefined();

    const document = parsePlannerTransferDocument({
      kind: "minecolonies-style-catalog",
      schemaVersion: 1,
      exportedAt: "2026-07-20T00:00:00.000Z",
      stylePack: {
        id: "legacy",
        name: "Legacy catalogue",
        source: "imported",
        variants: [
          {
            ...variant,
            category: "housing",
            categoryPath: undefined,
            gameOrder: undefined,
          },
        ],
      },
    });

    expect(document.kind).toBe("minecolonies-style-catalog");
    if (document.kind !== "minecolonies-style-catalog") return;
    expect(document.stylePack.categoryOrder).toEqual(["fundamentals"]);
    expect(document.stylePack.variants[0]).toMatchObject({
      category: "fundamentals",
      categoryPath: "fundamentals",
      gameOrder: 0,
    });
  });
});

describe("layout world-profile compatibility", () => {
  it("upgrades version-1 layouts with a default world profile", () => {
    const document = parsePlannerTransferDocument({
      kind: "minecolonies-planner-layout",
      schemaVersion: 1,
      name: "Legacy colony",
      exportedAt: "2026-07-20T00:00:00.000Z",
      planner: {
        buildings: [],
        activeStylePackId: "fortress",
        map: { zoom: 1, panX: 0, panY: 0 },
        rules: {
          colonyRadiusChunks: 20,
          colonyBoundaryMode: "invalid",
          preferredCommuteDistance: 64,
          warningCommuteDistance: 128,
          showCommuteConnections: true,
          showGuardCoverage: true,
        },
      },
    });

    expect(document.kind).toBe("minecolonies-planner-layout");
    if (document.kind !== "minecolonies-planner-layout") return;
    expect(document.schemaVersion).toBe(2);
    expect(document.planner.world).toEqual(defaultWorldProfile);
  });
});
