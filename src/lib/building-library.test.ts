import { describe, expect, it } from "vitest";
import { fortressStylePack } from "@/data/fortress-style";
import { getBuildingLibraryGroups } from "@/lib/building-library";

describe("MineColonies building-library order", () => {
  it("renders the in-game categories and nested paths in build-tool order", () => {
    const groups = getBuildingLibraryGroups(fortressStylePack, "");

    expect(groups.map((group) => group.category)).toEqual(
      fortressStylePack.categoryOrder,
    );
    expect(
      groups
        .find((group) => group.category === "agriculture")
        ?.sections.map((section) => section.categoryPath),
    ).toEqual([
      "agriculture/fields",
      "agriculture/horticulture",
      "agriculture/husbandry",
    ]);
    expect(
      groups
        .find((group) => group.category === "walls")
        ?.sections.map((section) => section.categoryPath),
    ).toEqual([
      "walls",
      "walls/corner",
      "walls/gate",
      "walls/moat",
      "walls/wall",
    ]);

    const variants = groups.flatMap((group) =>
      group.sections.flatMap((section) => section.variants),
    );
    expect(variants.map((variant) => variant.gameOrder)).toEqual(
      Array.from({ length: 167 }, (_, index) => index),
    );
  });

  it("keeps game order when search filters the catalogue", () => {
    const groups = getBuildingLibraryGroups(fortressStylePack, "guard");
    const variants = groups.flatMap((group) =>
      group.sections.flatMap((section) => section.variants),
    );
    const orders = variants.map((variant) => variant.gameOrder as number);

    expect(orders).toEqual([...orders].sort((left, right) => left - right));
    expect(variants.length).toBeGreaterThan(0);
  });
});
