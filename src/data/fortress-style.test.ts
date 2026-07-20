import { describe, expect, it } from "vitest";
import { fortressStylePack } from "@/data/fortress-style";
import { isStylePack } from "@/lib/planner-transfer";

describe("source-backed Fortress style pack", () => {
  it("adapts every generated variant to the planner schema", () => {
    expect(isStylePack(fortressStylePack)).toBe(true);
    expect(fortressStylePack.variants).toHaveLength(167);
    expect(
      fortressStylePack.variants.reduce(
        (count, variant) => count + variant.levels.length,
        0,
      ),
    ).toBe(461);
    expect(fortressStylePack.categoryOrder).toEqual([
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
      fortressStylePack.variants.map((variant) => variant.gameOrder),
    ).toEqual(Array.from({ length: 167 }, (_, index) => index));
  });

  it("keeps stable IDs for existing Town Hall, Residence, and Guard Tower plans", () => {
    expect(
      fortressStylePack.variants.find(
        (variant) => variant.id === "fortress-town-hall-1",
      ),
    ).toMatchObject({ buildingType: "town_hall", levels: { length: 5 } });
    expect(
      fortressStylePack.variants.find(
        (variant) => variant.id === "fortress-residence-1",
      ),
    ).toMatchObject({ buildingType: "residence", levels: { length: 5 } });
    expect(
      fortressStylePack.variants.find(
        (variant) => variant.id === "fortress-guard-tower-1",
      ),
    ).toMatchObject({
      buildingType: "guard_tower",
      isGuard: true,
      levels: { length: 5 },
    });
  });
});
