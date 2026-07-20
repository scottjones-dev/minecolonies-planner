import { useStylePackStore } from "@/stores/style-pack-store";
import {
  builtInStylePackManifest,
  getLoadedBuiltInStylePack,
  isBuiltInStylePackId,
  loadBuiltInStylePack,
  loadBuiltInStylePacks,
} from "./built-in-style-packs";
import { fortressStylePack } from "./fortress-style";

export {
  builtInStylePackManifest,
  fortressStylePack,
  isBuiltInStylePackId,
  loadBuiltInStylePack,
  loadBuiltInStylePacks,
};

/** @deprecated Use builtInStylePackManifest for options and lazy-load by ID. */
export const stylePacks = [fortressStylePack];

export function getStylePackById(stylePackId: string) {
  return (
    getLoadedBuiltInStylePack(stylePackId) ??
    useStylePackStore
      .getState()
      .importedStylePacks.find((stylePack) => stylePack.id === stylePackId)
  );
}
