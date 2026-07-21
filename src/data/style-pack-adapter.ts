import type {
  BuildingVariant,
  Direction,
  StylePack,
} from "@/types/minecolonies";

type GeneratedStylePack = {
  id: string;
  name: string;
  description?: string;
  authors?: string[];
  version?: string;
  categoryOrder: string[];
  variants: Array<{
    id: string;
    name: string;
    buildingType: string;
    category: string;
    categoryPath?: string;
    gameOrder?: number;
    role: string;
    isGuard?: boolean;
    levels: Array<{
      level: number;
      bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        minZ: number;
        maxZ: number;
      };
      anchor: { x: number; y: number; z: number };
      hutBlock?: { x: number; y: number; z: number };
      entrance?: {
        position: { x: number; y: number; z: number };
        direction: string;
      };
      topDown?: { width: number; depth: number; pixels: string };
    }>;
  }>;
};

function isDirection(value: string): value is Direction {
  return ["north", "east", "south", "west"].includes(value);
}

export function adaptBuiltInStylePack(
  sourceStylePack: GeneratedStylePack,
): StylePack {
  const variants: BuildingVariant[] = sourceStylePack.variants.map(
    (variant) => ({
      id: variant.id,
      name: variant.name,
      buildingType: variant.buildingType,
      category: variant.category as BuildingVariant["category"],
      categoryPath: variant.categoryPath,
      gameOrder: variant.gameOrder,
      role: variant.role as BuildingVariant["role"],
      ...(variant.isGuard === true ? { isGuard: true } : {}),
      levels: variant.levels.map((level) => {
        const entrance =
          level.entrance && isDirection(level.entrance.direction)
            ? {
                position: level.entrance.position,
                direction: level.entrance.direction,
              }
            : undefined;

        return {
          level: level.level,
          bounds: level.bounds,
          anchor: level.anchor,
          hutBlock: level.hutBlock,
          entrance,
          topDown: level.topDown,
        };
      }),
    }),
  );

  return {
    id: sourceStylePack.id,
    name: sourceStylePack.name,
    description: sourceStylePack.description,
    authors: sourceStylePack.authors,
    version: sourceStylePack.version,
    source: "built-in",
    categoryOrder: sourceStylePack.categoryOrder as StylePack["categoryOrder"],
    variants,
  };
}
