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
  rules: {
    colonyRadiusChunks: number;
    colonyBoundaryMode: "warning" | "invalid";
    preferredCommuteDistance: number;
    warningCommuteDistance: number;
    showCommuteConnections: boolean;
    guardCoverageRadius: number;
    guardCoverageMode: "either" | "both";
    showGuardCoverage: boolean;
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
  setColonyRadiusChunks: (radiusChunks: number) => void;
  setColonyBoundaryMode: (mode: "warning" | "invalid") => void;
  setPreferredCommuteDistance: (distance: number) => void;
  setWarningCommuteDistance: (distance: number) => void;
  setShowCommuteConnections: (show: boolean) => void;
  setGuardCoverageRadius: (radius: number) => void;
  setGuardCoverageMode: (mode: "either" | "both") => void;
  setShowGuardCoverage: (show: boolean) => void;
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
  rules: {
    colonyRadiusChunks: 8,
    colonyBoundaryMode: "warning",
    preferredCommuteDistance: 64,
    warningCommuteDistance: 128,
    showCommuteConnections: true,
    guardCoverageRadius: 64,
    guardCoverageMode: "either",
    showGuardCoverage: true,
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
      buildings: state.buildings
        .filter((building) => building.id !== id)
        .map((building) =>
          building.assignedResidenceId === id
            ? { ...building, assignedResidenceId: null }
            : building,
        ),
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
  setColonyRadiusChunks: (radiusChunks) => {
    set((state) => ({
      rules: {
        ...state.rules,
        colonyRadiusChunks: Number.isFinite(radiusChunks)
          ? Math.min(64, Math.max(1, Math.round(radiusChunks)))
          : state.rules.colonyRadiusChunks,
      },
    }));
  },
  setColonyBoundaryMode: (colonyBoundaryMode) => {
    set((state) => ({
      rules: {
        ...state.rules,
        colonyBoundaryMode,
      },
    }));
  },
  setPreferredCommuteDistance: (distance) => {
    set((state) => ({
      rules: {
        ...state.rules,
        preferredCommuteDistance: Number.isFinite(distance)
          ? Math.min(
              state.rules.warningCommuteDistance,
              Math.max(1, Math.round(distance)),
            )
          : state.rules.preferredCommuteDistance,
      },
    }));
  },
  setWarningCommuteDistance: (distance) => {
    set((state) => ({
      rules: {
        ...state.rules,
        warningCommuteDistance: Number.isFinite(distance)
          ? Math.min(
              512,
              Math.max(
                state.rules.preferredCommuteDistance,
                Math.round(distance),
              ),
            )
          : state.rules.warningCommuteDistance,
      },
    }));
  },
  setShowCommuteConnections: (showCommuteConnections) => {
    set((state) => ({
      rules: {
        ...state.rules,
        showCommuteConnections,
      },
    }));
  },
  setGuardCoverageRadius: (radius) => {
    set((state) => ({
      rules: {
        ...state.rules,
        guardCoverageRadius: Number.isFinite(radius)
          ? Math.min(512, Math.max(1, Math.round(radius)))
          : state.rules.guardCoverageRadius,
      },
    }));
  },
  setGuardCoverageMode: (guardCoverageMode) => {
    set((state) => ({
      rules: {
        ...state.rules,
        guardCoverageMode,
      },
    }));
  },
  setShowGuardCoverage: (showGuardCoverage) => {
    set((state) => ({
      rules: {
        ...state.rules,
        showGuardCoverage,
      },
    }));
  },
  resetPlanner: () => {
    set(getInitialState());
  },
}));
