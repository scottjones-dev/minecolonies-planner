import { isPlannerSnapshot } from "@/lib/local-layouts";
import type { PlannerSnapshot } from "@/stores/planner-store";
import type {
  BuildingCategory,
  BuildingEntrance,
  BuildingLevelDefinition,
  BuildingRole,
  Direction,
  RelativeBounds,
  StylePack,
  Vector3,
} from "@/types/minecolonies";

export const TRANSFER_SCHEMA_VERSION = 1;
export const IMPORTED_STYLE_PACKS_STORAGE_KEY =
  "minecolonies-planner.imported-styles.v1";

export type LayoutTransferDocument = {
  kind: "minecolonies-planner-layout";
  schemaVersion: typeof TRANSFER_SCHEMA_VERSION;
  name: string;
  exportedAt: string;
  planner: PlannerSnapshot;
};

export type StylePackTransferDocument = {
  kind: "minecolonies-style-catalog";
  schemaVersion: typeof TRANSFER_SCHEMA_VERSION;
  exportedAt: string;
  stylePack: StylePack;
};

export type PlannerTransferDocument =
  | LayoutTransferDocument
  | StylePackTransferDocument;

const categories: BuildingCategory[] = [
  "housing",
  "food",
  "production",
  "storage",
  "military",
  "education",
  "services",
  "decoration",
];
const roles: BuildingRole[] = ["residence", "workplace", "other"];
const directions: Direction[] = ["north", "east", "south", "west"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value);
}

function isVector3(value: unknown): value is Vector3 {
  return (
    isRecord(value) &&
    isInteger(value.x) &&
    isInteger(value.y) &&
    isInteger(value.z)
  );
}

function isBounds(value: unknown): value is RelativeBounds {
  return (
    isRecord(value) &&
    isInteger(value.minX) &&
    isInteger(value.maxX) &&
    value.minX <= value.maxX &&
    isInteger(value.minY) &&
    isInteger(value.maxY) &&
    value.minY <= value.maxY &&
    isInteger(value.minZ) &&
    isInteger(value.maxZ) &&
    value.minZ <= value.maxZ
  );
}

function isEntrance(value: unknown): value is BuildingEntrance {
  return (
    isRecord(value) &&
    isVector3(value.position) &&
    directions.includes(value.direction as Direction)
  );
}

function isBuildingLevel(value: unknown): value is BuildingLevelDefinition {
  return (
    isRecord(value) &&
    isInteger(value.level) &&
    value.level >= 1 &&
    isBounds(value.bounds) &&
    isVector3(value.anchor) &&
    (value.hutBlock === undefined || isVector3(value.hutBlock)) &&
    (value.entrance === undefined || isEntrance(value.entrance))
  );
}

export function isStylePack(value: unknown): value is StylePack {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.id.trim().length === 0 ||
    typeof value.name !== "string" ||
    value.name.trim().length === 0 ||
    !["built-in", "modpack", "custom", "imported"].includes(
      value.source as string,
    ) ||
    !Array.isArray(value.variants) ||
    value.variants.length === 0
  ) {
    return false;
  }

  const variantIds = new Set<string>();

  return value.variants.every((variant) => {
    if (
      !isRecord(variant) ||
      typeof variant.id !== "string" ||
      variant.id.length === 0 ||
      variantIds.has(variant.id) ||
      typeof variant.name !== "string" ||
      variant.name.trim().length === 0 ||
      typeof variant.buildingType !== "string" ||
      variant.buildingType.length === 0 ||
      !categories.includes(variant.category as BuildingCategory) ||
      !roles.includes(variant.role as BuildingRole) ||
      (variant.isGuard !== undefined && typeof variant.isGuard !== "boolean") ||
      !Array.isArray(variant.levels) ||
      variant.levels.length === 0 ||
      !variant.levels.every(isBuildingLevel)
    ) {
      return false;
    }

    variantIds.add(variant.id);
    const levels = variant.levels.map((level) => level.level);
    return new Set(levels).size === levels.length;
  });
}

function assertSupportedVersion(value: Record<string, unknown>): void {
  if (value.schemaVersion !== TRANSFER_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version: ${String(value.schemaVersion)}. Expected version ${TRANSFER_SCHEMA_VERSION}.`,
    );
  }
}

export function parsePlannerTransferDocument(
  value: unknown,
): PlannerTransferDocument {
  if (!isRecord(value)) {
    throw new Error("The selected file does not contain a JSON object.");
  }

  assertSupportedVersion(value);

  if (value.kind === "minecolonies-planner-layout") {
    if (
      typeof value.name !== "string" ||
      value.name.trim().length === 0 ||
      typeof value.exportedAt !== "string" ||
      !isPlannerSnapshot(value.planner)
    ) {
      throw new Error("The colony layout does not match the expected schema.");
    }

    return value as LayoutTransferDocument;
  }

  if (value.kind === "minecolonies-style-catalog") {
    if (typeof value.exportedAt !== "string" || !isStylePack(value.stylePack)) {
      throw new Error(
        "The style catalogue does not match the expected schema.",
      );
    }

    return value as StylePackTransferDocument;
  }

  throw new Error(
    "Unknown JSON kind. Choose a MineColonies planner layout or style catalogue.",
  );
}

export function createLayoutTransferDocument(
  name: string,
  planner: PlannerSnapshot,
): LayoutTransferDocument {
  return {
    kind: "minecolonies-planner-layout",
    schemaVersion: TRANSFER_SCHEMA_VERSION,
    name,
    exportedAt: new Date().toISOString(),
    planner,
  };
}

export function createStylePackTransferDocument(
  stylePack: StylePack,
): StylePackTransferDocument {
  return {
    kind: "minecolonies-style-catalog",
    schemaVersion: TRANSFER_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    stylePack,
  };
}

export function readImportedStylePacks(): StylePack[] {
  try {
    const raw = window.localStorage.getItem(IMPORTED_STYLE_PACKS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const value: unknown = JSON.parse(raw);

    if (
      !isRecord(value) ||
      value.schemaVersion !== TRANSFER_SCHEMA_VERSION ||
      !Array.isArray(value.stylePacks) ||
      !value.stylePacks.every(isStylePack)
    ) {
      return [];
    }

    return value.stylePacks;
  } catch {
    return [];
  }
}

export function writeImportedStylePacks(stylePacks: StylePack[]): boolean {
  try {
    window.localStorage.setItem(
      IMPORTED_STYLE_PACKS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: TRANSFER_SCHEMA_VERSION,
        stylePacks,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
