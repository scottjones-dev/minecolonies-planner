import { describe, expect, it } from "vitest";
import { fortressStylePack } from "@/data/fortress-style";
import {
  isStylePack,
  parsePlannerTransferDocument,
} from "@/lib/planner-transfer";

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
