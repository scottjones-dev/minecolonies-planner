import type {
  BuildingCategory,
  BuildingVariant,
  StylePack,
} from "@/types/minecolonies";
import { mineColoniesBuildingCategories } from "@/types/minecolonies";

export type BuildingLibrarySection = {
  categoryPath: string;
  variants: BuildingVariant[];
};

export type BuildingLibraryGroup = {
  category: BuildingCategory;
  sections: BuildingLibrarySection[];
};

export function getBuildingLibraryGroups(
  stylePack: StylePack,
  search: string,
): BuildingLibraryGroup[] {
  const query = search.trim().toLocaleLowerCase();
  const variants = stylePack.variants
    .filter(
      (variant) =>
        !query ||
        [
          variant.name,
          variant.buildingType,
          variant.category,
          variant.categoryPath ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(query)),
    )
    .sort(
      (left, right) =>
        (left.gameOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.gameOrder ?? Number.MAX_SAFE_INTEGER) ||
        left.name.localeCompare(right.name),
    );
  const sectionsByCategory = new Map<
    BuildingCategory,
    Map<string, BuildingVariant[]>
  >();

  for (const variant of variants) {
    const sections =
      sectionsByCategory.get(variant.category) ??
      new Map<string, BuildingVariant[]>();
    const categoryPath = variant.categoryPath ?? variant.category;
    sections.set(categoryPath, [
      ...(sections.get(categoryPath) ?? []),
      variant,
    ]);
    sectionsByCategory.set(variant.category, sections);
  }

  const categoryOrder = [
    ...new Set([
      ...(stylePack.categoryOrder ?? []),
      ...mineColoniesBuildingCategories,
    ]),
  ];

  return categoryOrder.flatMap((category) => {
    const sections = sectionsByCategory.get(category);
    return sections
      ? [
          {
            category,
            sections: [...sections.entries()].map(
              ([categoryPath, sectionVariants]) => ({
                categoryPath,
                variants: sectionVariants,
              }),
            ),
          },
        ]
      : [];
  });
}
