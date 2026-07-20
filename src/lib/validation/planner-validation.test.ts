import { describe, expect, it } from "vitest";
import {
  boundsOverlap,
  findBuildingCollisions,
} from "@/lib/validation/collisions";
import { boundsWithinColonyBoundary } from "@/lib/validation/colony-boundary";
import { getAnchorDistance, getCommuteState } from "@/lib/validation/commute";
import { findGuardCoverageResults } from "@/lib/validation/guard-coverage";
import type { PlacedBuilding } from "@/types/minecolonies";

function placed(
  id: string,
  variantId: string,
  x: number,
  z: number,
  assignedResidenceId: string | null = null,
): PlacedBuilding {
  return {
    id,
    stylePackId: "fortress",
    variantId,
    x,
    y: 0,
    z,
    rotation: 0,
    currentLevel: 1,
    reserveThroughLevel: 1,
    assignedResidenceId,
  };
}

describe("collision and boundary validation", () => {
  it("treats touching edges as valid but overlapping bounds as a collision", () => {
    const first = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };

    expect(
      boundsOverlap(first, { minX: 10, maxX: 20, minZ: 0, maxZ: 10 }),
    ).toBe(false);
    expect(boundsOverlap(first, { minX: 9, maxX: 20, minZ: 0, maxZ: 10 })).toBe(
      true,
    );
  });

  it("finds collisions from rotated reserved building bounds", () => {
    const buildings = [
      placed("a", "fortress-residence-1", 0, 0),
      placed("b", "fortress-bakery-1", 4, 0),
      placed("c", "fortress-bakery-1", 100, 100),
    ];

    expect(findBuildingCollisions(buildings)).toEqual([
      { firstBuildingId: "a", secondBuildingId: "b" },
    ]);
  });

  it("requires the footprint inside the square colony boundary", () => {
    const boundary = {
      townHallId: "town-hall",
      centerX: 0,
      centerZ: 0,
      radiusChunks: 1,
      radiusBlocks: 16,
    };

    expect(
      boundsWithinColonyBoundary(
        { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
        boundary,
      ),
    ).toBe(true);
    expect(
      boundsWithinColonyBoundary(
        { minX: 14, maxX: 18, minZ: -1, maxZ: 1 },
        boundary,
      ),
    ).toBe(false);
    expect(
      boundsWithinColonyBoundary(
        { minX: 14, maxX: 16, minZ: 14, maxZ: 16 },
        boundary,
      ),
    ).toBe(true);
  });
});

describe("commute and guard distance validation", () => {
  it("calculates Euclidean anchor distance and all commute states", () => {
    expect(getAnchorDistance({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
    expect(
      getCommuteState(64, { preferredDistance: 64, warningDistance: 128 }),
    ).toBe("preferred");
    expect(
      getCommuteState(65, { preferredDistance: 64, warningDistance: 128 }),
    ).toBe("warning");
    expect(
      getCommuteState(129, { preferredDistance: 64, warningDistance: 128 }),
    ).toBe("invalid");
  });

  it("supports either and both guard coverage modes", () => {
    const residence = placed("home", "fortress-residence-1", 0, 0);
    const workplace = placed("work", "fortress-bakery-1", 100, 0, residence.id);
    const guard = placed("guard", "fortress-guard-tower-1", 0, 10);
    const buildings = [residence, workplace, guard];

    const either = findGuardCoverageResults(buildings, 20, "either").find(
      (result) => result.buildingId === workplace.id,
    );
    const both = findGuardCoverageResults(buildings, 20, "both").find(
      (result) => result.buildingId === workplace.id,
    );

    expect(either).toMatchObject({
      covered: false,
      assignedResidenceCovered: true,
      ruleValid: true,
    });
    expect(both?.ruleValid).toBe(false);
  });
});
