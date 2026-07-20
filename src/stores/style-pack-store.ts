import { create } from "zustand";
import type { StylePack } from "@/types/minecolonies";

type StylePackStore = {
  importedStylePacks: StylePack[];
  importStylePack: (stylePack: StylePack) => void;
  setImportedStylePacks: (stylePacks: StylePack[]) => void;
};

export const useStylePackStore = create<StylePackStore>((set) => ({
  importedStylePacks: [],
  importStylePack: (stylePack) => {
    const importedStylePack: StylePack = {
      ...stylePack,
      source: "imported",
    };

    set((state) => ({
      importedStylePacks: [
        ...state.importedStylePacks.filter(
          (candidate) => candidate.id !== importedStylePack.id,
        ),
        importedStylePack,
      ],
    }));
  },
  setImportedStylePacks: (importedStylePacks) => {
    set({
      importedStylePacks: importedStylePacks.map((stylePack) => ({
        ...stylePack,
        source: "imported",
      })),
    });
  },
}));
