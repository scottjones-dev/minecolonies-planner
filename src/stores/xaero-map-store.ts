import { create } from "zustand";
import type { XaeroMapCalibration } from "@/lib/xaero-map";
import {
  deleteStoredXaeroMap,
  readStoredXaeroMap,
  writeStoredXaeroMap,
} from "@/lib/xaero-map-storage";

export type ActiveXaeroMap = {
  blob: Blob;
  imageUrl: string;
  calibration: XaeroMapCalibration;
};

type XaeroMapStore = {
  map: ActiveXaeroMap | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  saveMap: (blob: Blob, calibration: XaeroMapCalibration) => Promise<void>;
  updateCalibration: (calibration: XaeroMapCalibration) => Promise<void>;
  removeMap: () => Promise<void>;
};

function revokeMapUrl(map: ActiveXaeroMap | null) {
  if (map) URL.revokeObjectURL(map.imageUrl);
}

export const useXaeroMapStore = create<XaeroMapStore>((set, get) => ({
  map: null,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const stored = await readStoredXaeroMap();
      if (stored) {
        set({
          map: {
            ...stored,
            imageUrl: URL.createObjectURL(stored.blob),
          },
          hydrated: true,
        });
        return;
      }
    } finally {
      set({ hydrated: true });
    }
  },
  saveMap: async (blob, calibration) => {
    await writeStoredXaeroMap({ blob, calibration });
    const previous = get().map;
    set({
      map: { blob, calibration, imageUrl: URL.createObjectURL(blob) },
      hydrated: true,
    });
    revokeMapUrl(previous);
  },
  updateCalibration: async (calibration) => {
    const current = get().map;
    if (!current) return;
    await writeStoredXaeroMap({ blob: current.blob, calibration });
    set({ map: { ...current, calibration } });
  },
  removeMap: async () => {
    await deleteStoredXaeroMap();
    const previous = get().map;
    set({ map: null, hydrated: true });
    revokeMapUrl(previous);
  },
}));
