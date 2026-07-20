import { fortressStylePack } from "@/data/fortress-style";
import manifest from "@/data/generated/minecolonies-1.20.1.json";
import {
  type BuiltInStylePackId,
  builtInStylePackLoaders,
} from "@/data/generated/style-pack-loaders";
import { adaptBuiltInStylePack } from "@/data/style-pack-adapter";
import type { BuildingCategory, StylePack } from "@/types/minecolonies";

export type BuiltInStylePackMetadata = {
  id: BuiltInStylePackId;
  name: string;
  description: string;
  authors: string[];
  version: string;
  categoryOrder: BuildingCategory[];
  variantCount: number;
  levelCount: number;
};

export const builtInStylePackManifest =
  manifest.stylePacks as BuiltInStylePackMetadata[];

const loadedStylePacks = new Map<string, StylePack>([
  [fortressStylePack.id, fortressStylePack],
]);

export function isBuiltInStylePackId(
  stylePackId: string,
): stylePackId is BuiltInStylePackId {
  return stylePackId in builtInStylePackLoaders;
}

export function getLoadedBuiltInStylePack(
  stylePackId: string,
): StylePack | undefined {
  return loadedStylePacks.get(stylePackId);
}

export async function loadBuiltInStylePack(
  stylePackId: string,
): Promise<StylePack | null> {
  const loaded = loadedStylePacks.get(stylePackId);
  if (loaded) return loaded;
  if (!isBuiltInStylePackId(stylePackId)) return null;

  const sourceModule = await builtInStylePackLoaders[stylePackId]();
  const stylePack = adaptBuiltInStylePack(sourceModule.default.stylePack);
  loadedStylePacks.set(stylePackId, stylePack);
  return stylePack;
}

export async function loadBuiltInStylePacks(
  stylePackIds: Iterable<string>,
): Promise<void> {
  await Promise.all(
    [...new Set(stylePackIds)].map((stylePackId) =>
      loadBuiltInStylePack(stylePackId),
    ),
  );
}
