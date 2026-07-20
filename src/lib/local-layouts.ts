import type {
  PlannerMapState,
  PlannerRules,
  PlannerSnapshot,
} from "@/stores/planner-store";
import type { BuildingRotation, PlacedBuilding } from "@/types/minecolonies";

export const LAYOUT_SCHEMA_VERSION = 1;
export const LOCAL_LAYOUTS_STORAGE_KEY =
  "minecolonies-planner.local-layouts.v1";

export type LocalLayout = {
  schemaVersion: typeof LAYOUT_SCHEMA_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  planner: PlannerSnapshot;
};

export type LocalLayoutCatalog = {
  schemaVersion: typeof LAYOUT_SCHEMA_VERSION;
  activeLayoutId: string | null;
  layouts: LocalLayout[];
};

const rotations: BuildingRotation[] = [0, 90, 180, 270];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value);
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

function isPlacedBuilding(value: unknown): value is PlacedBuilding {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.stylePackId === "string" &&
    value.stylePackId.length > 0 &&
    typeof value.variantId === "string" &&
    value.variantId.length > 0 &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.z) &&
    rotations.includes(value.rotation as BuildingRotation) &&
    isInteger(value.currentLevel) &&
    value.currentLevel >= 1 &&
    isInteger(value.reserveThroughLevel) &&
    value.reserveThroughLevel >= value.currentLevel &&
    (value.assignedResidenceId === null ||
      typeof value.assignedResidenceId === "string")
  );
}

function isPlannerMap(value: unknown): value is PlannerMapState {
  return (
    isRecord(value) &&
    isFiniteNumber(value.zoom) &&
    value.zoom >= 0.25 &&
    value.zoom <= 4 &&
    isFiniteNumber(value.panX) &&
    isFiniteNumber(value.panY)
  );
}

function isPlannerRules(value: unknown): value is PlannerRules {
  return (
    isRecord(value) &&
    isInteger(value.colonyRadiusChunks) &&
    value.colonyRadiusChunks >= 1 &&
    value.colonyRadiusChunks <= 64 &&
    (value.colonyBoundaryMode === "warning" ||
      value.colonyBoundaryMode === "invalid") &&
    isInteger(value.preferredCommuteDistance) &&
    value.preferredCommuteDistance >= 1 &&
    isInteger(value.warningCommuteDistance) &&
    value.warningCommuteDistance >= value.preferredCommuteDistance &&
    value.warningCommuteDistance <= 512 &&
    typeof value.showCommuteConnections === "boolean" &&
    typeof value.showGuardCoverage === "boolean"
  );
}

export function isPlannerSnapshot(value: unknown): value is PlannerSnapshot {
  if (
    !isRecord(value) ||
    !Array.isArray(value.buildings) ||
    !value.buildings.every(isPlacedBuilding) ||
    typeof value.activeStylePackId !== "string" ||
    value.activeStylePackId.length === 0 ||
    !isPlannerMap(value.map) ||
    !isPlannerRules(value.rules)
  ) {
    return false;
  }

  const ids = new Set(value.buildings.map((building) => building.id));

  return (
    ids.size === value.buildings.length &&
    value.buildings.every(
      (building) =>
        building.assignedResidenceId === null ||
        ids.has(building.assignedResidenceId),
    )
  );
}

function isLocalLayout(value: unknown): value is LocalLayout {
  return (
    isRecord(value) &&
    value.schemaVersion === LAYOUT_SCHEMA_VERSION &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    value.name.length <= 80 &&
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt) &&
    isPlannerSnapshot(value.planner)
  );
}

export function parseLocalLayoutCatalog(value: unknown): LocalLayoutCatalog {
  if (
    !isRecord(value) ||
    value.schemaVersion !== LAYOUT_SCHEMA_VERSION ||
    !Array.isArray(value.layouts) ||
    !value.layouts.every(isLocalLayout) ||
    (value.activeLayoutId !== null && typeof value.activeLayoutId !== "string")
  ) {
    throw new Error("Saved layouts use an invalid or unsupported format.");
  }

  const ids = new Set(value.layouts.map((layout) => layout.id));

  if (
    ids.size !== value.layouts.length ||
    (value.activeLayoutId !== null && !ids.has(value.activeLayoutId))
  ) {
    throw new Error("Saved layout identifiers are inconsistent.");
  }

  return value as LocalLayoutCatalog;
}

export function createEmptyCatalog(): LocalLayoutCatalog {
  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    activeLayoutId: null,
    layouts: [],
  };
}

export function readLocalLayoutCatalog(): {
  catalog: LocalLayoutCatalog;
  error: string | null;
} {
  try {
    const raw = window.localStorage.getItem(LOCAL_LAYOUTS_STORAGE_KEY);

    if (!raw) {
      return { catalog: createEmptyCatalog(), error: null };
    }

    return { catalog: parseLocalLayoutCatalog(JSON.parse(raw)), error: null };
  } catch {
    return {
      catalog: createEmptyCatalog(),
      error:
        "Saved layouts could not be read. The invalid browser data was ignored.",
    };
  }
}

export function writeLocalLayoutCatalog(catalog: LocalLayoutCatalog): boolean {
  try {
    window.localStorage.setItem(
      LOCAL_LAYOUTS_STORAGE_KEY,
      JSON.stringify(catalog),
    );
    return true;
  } catch {
    return false;
  }
}

export function createLocalLayout(
  name: string,
  planner: PlannerSnapshot,
): LocalLayout {
  const now = new Date().toISOString();

  return {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 80),
    createdAt: now,
    updatedAt: now,
    planner,
  };
}
