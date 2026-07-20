import sourceData from "@/data/generated/minecolonies-1.20.1.json";
import type { BuildingVariant, StylePack } from "@/types/minecolonies";

const variants: BuildingVariant[] = sourceData.stylePack.variants.map(
  (variant) => ({
    id: variant.id,
    name: variant.name,
    buildingType: variant.buildingType,
    category: variant.category as BuildingVariant["category"],
    role: variant.role as BuildingVariant["role"],
    ...(variant.isGuard === true ? { isGuard: true } : {}),
    levels: variant.levels.map((level) => ({
      level: level.level,
      bounds: level.bounds,
      anchor: level.anchor,
      hutBlock: level.hutBlock,
    })),
  }),
);

export const fortressStylePack: StylePack = {
  id: sourceData.stylePack.id,
  name: sourceData.stylePack.name,
  source: "built-in",
  variants,
};
