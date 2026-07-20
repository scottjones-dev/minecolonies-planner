import { create } from "zustand";
import type { PlacedBuilding } from "@/types/minecolonies";

type PlannerState = {
  buildings: PlacedBuilding[];
  selectedBuildingId: string | null;
  activeStylePackId: string;
  map: {
    zoom: number;
    panX: number;
    panY: number;
  };
};

type PlannerActions = {
  addBuilding: (building: Omit<PlacedBuilding, "id">) => string;
  updateBuilding: (
    id: string,
    changes: Partial<Omit<PlacedBuilding, "id">>,
  ) => void;
  removeBuilding: (id: string) => void;
  selectBuilding: (id: string | null) => void;
  setActiveStylePack: (stylePackId: string) => void;
  setMapZoom: (zoom: number) => void;
  setMapPan: (panX: number, panY: number) => void;
  resetPlanner: () => void;
};

type PlannerStore = PlannerState & PlannerActions;

const getInitialState = (): PlannerState => ({
  buildings: [],
  selectedBuildingId: null,
  activeStylePackId: "fortress",
  map: {
    zoom: 1,
    panX: 0,
    panY: 0,
  },
});

export const usePlannerStore = create<PlannerStore>((set) => ({
  ...getInitialState(),
  addBuilding: (building) => {
    const id = crypto.randomUUID();

    set((state) => ({
      buildings: [...state.buildings, { ...building, id }],
      selectedBuildingId: id,
    }));

    return id;
  },
  updateBuilding: (id, changes) => {
    set((state) => {
      if (!state.buildings.some((building) => building.id === id)) {
        return state;
      }

      return {
        buildings: state.buildings.map((building) =>
          building.id === id
            ? { ...building, ...changes, id: building.id }
            : building,
        ),
      };
    });
  },
  removeBuilding: (id) => {
    set((state) => ({
      buildings: state.buildings.filter((building) => building.id !== id),
      selectedBuildingId:
        state.selectedBuildingId === id ? null : state.selectedBuildingId,
    }));
  },
  selectBuilding: (id) => {
    set({ selectedBuildingId: id });
  },
  setActiveStylePack: (stylePackId) => {
    set({ activeStylePackId: stylePackId });
  },
  setMapZoom: (zoom) => {
    set((state) => ({
      map: {
        ...state.map,
        zoom: Math.min(4, Math.max(0.25, zoom)),
      },
    }));
  },
  setMapPan: (panX, panY) => {
    set((state) => ({
      map: {
        ...state.map,
        panX,
        panY,
      },
    }));
  },
  resetPlanner: () => {
    set(getInitialState());
  },
}));
