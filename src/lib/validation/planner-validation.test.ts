import { describe, expect, it } from "vitest";
import {
  boundsOverlap,
  findBuildingCollisions,
} from "@/lib/validation/collisions";
import {
  boundsWithinColonyBoundary,
  findColonyBoundaryViolations,
  getClaimedChunks,
  getColonyBoundary,
} from "@/lib/validation/colony-boundary";
import { getAnchorDistance, getCommuteState } from "@/lib/validation/commute";
import {
  getGuardPatrolRadius,
  isAnchorWithinGuardPatrol,
} from "@/lib/validation/guard-coverage";
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
      placed("b", "fortress-craftsmanship-luxury-baker", 4, 0),
      placed("c", "fortress-craftsmanship-luxury-baker", 100, 100),
    ];

    expect(findBuildingCollisions(buildings)).toEqual([
      { firstBuildingId: "a", secondBuildingId: "b" },
    ]);
  });

  it("uses MineColonies' circular maximum envelope for dynamic claims", () => {
    const boundary = {
      townHallId: "town-hall",
      centerChunkX: 0,
      centerChunkZ: 0,
      maximumRadiusChunks: 20,
    };

    expect(
      boundsWithinColonyBoundary(
        { minX: 14 * 16, maxX: 14 * 16 + 1, minZ: 14 * 16, maxZ: 14 * 16 + 1 },
        boundary,
      ),
    ).toBe(true);
    expect(
      boundsWithinColonyBoundary(
        { minX: 15 * 16, maxX: 15 * 16 + 1, minZ: 15 * 16, maxZ: 15 * 16 + 1 },
        boundary,
      ),
    ).toBe(false);
  });

  it("creates a square initial claim and square level-based building claims", () => {
    const townHall = placed("town", "fortress-town-hall-1", 0, 0);
    const baker = placed(
      "baker",
      "fortress-craftsmanship-luxury-baker",
      10 * 16,
      0,
    );
    const initialClaims = getClaimedChunks([townHall], 4);
    const expandedClaims = getClaimedChunks([townHall, baker], 4);

    expect(initialClaims).toHaveLength(81);
    expect(initialClaims).toContainEqual({ x: -4, z: -4 });
    expect(initialClaims).toContainEqual({ x: 4, z: 4 });
    expect(expandedClaims).toContainEqual({ x: 9, z: -1 });
    expect(expandedClaims).toContainEqual({ x: 11, z: 1 });
  });

  it("flags footprints outside the source maximum claim radius", () => {
    const buildings = [
      placed("town", "fortress-town-hall-1", 0, 0),
      placed("far", "fortress-craftsmanship-luxury-baker", 21 * 16, 0),
    ];

    expect(getColonyBoundary(buildings)?.maximumRadiusChunks).toBe(20);
    expect(findColonyBoundaryViolations(buildings)).toContain("far");
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

  it("uses each Guard Tower level's MineColonies patrol radius", () => {
    const guard = placed("guard", "fortress-guard-tower-1", 0, 0);
    const target = placed("target", "fortress-residence-1", 79, 0);

    expect(getGuardPatrolRadius(guard)).toBe(80);
    expect(isAnchorWithinGuardPatrol(target, [guard])).toBe(true);

    guard.currentLevel = 5;
    target.x = 199;
    expect(getGuardPatrolRadius(guard)).toBe(200);
    expect(isAnchorWithinGuardPatrol(target, [guard])).toBe(true);
  });
});
