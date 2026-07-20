export type BuildingRotation = 0 | 90 | 180 | 270;

export type BuildingCategory =
  | "housing"
  | "food"
  | "production"
  | "storage"
  | "military"
  | "education"
  | "services"
  | "decoration";

export type Direction = "north" | "east" | "south" | "west";
export type BuildingRole = "residence" | "workplace" | "other";

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type RelativeBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

export type BuildingEntrance = {
  position: Vector3;
  direction: Direction;
};

export type BuildingLevelDefinition = {
  level: number;
  bounds: RelativeBounds;
  anchor: Vector3;
  hutBlock?: Vector3;
  entrance?: BuildingEntrance;
};

export type BuildingVariant = {
  id: string;
  name: string;
  buildingType: string;
  category: BuildingCategory;
  role: BuildingRole;
  isGuard?: boolean;
  levels: BuildingLevelDefinition[];
};

export type StylePack = {
  id: string;
  name: string;
  source: "built-in" | "modpack" | "custom" | "imported";
  variants: BuildingVariant[];
};

export type PlacedBuilding = {
  id: string;
  stylePackId: string;
  variantId: string;
  x: number;
  y: number;
  z: number;
  rotation: BuildingRotation;
  currentLevel: number;
  reserveThroughLevel: number;
  assignedResidenceId: string | null;
};

export function getBoundsWidth(bounds: RelativeBounds): number {
  return bounds.maxX - bounds.minX + 1;
}

export function getBoundsHeight(bounds: RelativeBounds): number {
  return bounds.maxY - bounds.minY + 1;
}

export function getBoundsDepth(bounds: RelativeBounds): number {
  return bounds.maxZ - bounds.minZ + 1;
}
