import sourceData from "@/data/generated/minecolonies-1.20.1.json";

export const mineColoniesRules = sourceData.rules;

export const {
  chunkSizeBlocks,
  buildingClaimRadiusByLevel,
  townHallClaimRadiusByLevel,
  guardTowerClaimRadiusByLevel,
  guardPatrolRadiusBlocksByLevel,
} = mineColoniesRules;

export const {
  initialColonyRadiusChunks,
  maximumColonyRadiusChunks,
  minimumColonyDistanceChunks,
} = mineColoniesRules.defaults;

export function getRuleValueForLevel(
  values: readonly number[],
  level: number,
): number {
  const index = Math.min(values.length, Math.max(1, Math.round(level))) - 1;
  return values[index] ?? 0;
}
