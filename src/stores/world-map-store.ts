import { create } from "zustand";
import { readMapAsset, writeMapAsset } from "@/lib/world-map-storage";
import type { RasterMapSource } from "@/types/world-map";

export type ActiveRasterMap = {
  imageUrl: string;
  source: RasterMapSource;
};

type WorldMapStore = {
  map: ActiveRasterMap | null;
  missingAssetId: string | null;
  hydrate: (source: RasterMapSource | null) => Promise<void>;
  saveMap: (blob: Blob, source: RasterMapSource) => Promise<void>;
  clear: () => void;
};

function revokeMapUrl(map: ActiveRasterMap | null) {
  if (map) URL.revokeObjectURL(map.imageUrl);
}

export const useWorldMapStore = create<WorldMapStore>((set, get) => ({
  map: null,
  missingAssetId: null,
  hydrate: async (source) => {
    const current = get().map;
    if (!source) {
      revokeMapUrl(current);
      set({ map: null, missingAssetId: null });
      return;
    }
    if (current?.source.assetId === source.assetId) {
      set({ map: { ...current, source }, missingAssetId: null });
      return;
    }
    const blob = await readMapAsset(source.assetId);
    revokeMapUrl(current);
    set({
      map: blob ? { source, imageUrl: URL.createObjectURL(blob) } : null,
      missingAssetId: blob ? null : source.assetId,
    });
  },
  saveMap: async (blob, source) => {
    await writeMapAsset(source.assetId, blob);
    const current = get().map;
    revokeMapUrl(current);
    set({
      map: { source, imageUrl: URL.createObjectURL(blob) },
      missingAssetId: null,
    });
  },
  clear: () => {
    revokeMapUrl(get().map);
    set({ map: null, missingAssetId: null });
  },
}));
