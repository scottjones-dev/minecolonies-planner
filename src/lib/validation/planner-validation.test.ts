import { describe, expect, it } from "vitest";
import {
  boundsOverlap,
  findBuildingCollisions,
} from "@/lib/validation/collisions";
import {
  boundsWithinColonyBoundary,
  findColonyBoundaryViolations,
  findColonyPlacementViolations,
  getBuildingClaimRadius,
  getClaimedChunks,
  getColonyBoundary,
  getNewBuildingPlacementError,
  isClaimingBuilding,
} from "@/lib/validation/colony-boundary";
import { getAnchorDistance, getCommuteState } from "@/lib/validation/commute";
import {
  getGuardMapRange,
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

  it("only expands square claims after a blueprint fits in existing land", () => {
    const townHall = placed("town", "fortress-town-hall-1", 0, 0);
    const edgeBaker = placed(
      "edge-baker",
      "fortress-craftsmanship-luxury-baker",
      4 * 16,
      0,
    );
    const jumpedBaker = placed(
      "jumped-baker",
      "fortress-craftsmanship-luxury-baker",
      10 * 16,
      0,
    );
    const initialClaims = getClaimedChunks([townHall], 4);
    const expandedClaims = getClaimedChunks([townHall, edgeBaker], 4);
    const jumpedClaims = getClaimedChunks([townHall, jumpedBaker], 4);

    expect(initialClaims).toHaveLength(81);
    expect(initialClaims).toContainEqual({ x: -4, z: -4 });
    expect(initialClaims).toContainEqual({ x: 4, z: 4 });
    expect(expandedClaims).toContainEqual({ x: 5, z: 1 });
    expect(jumpedClaims).toEqual(initialClaims);
    expect(
      findColonyPlacementViolations([townHall, jumpedBaker], 4),
    ).toContainEqual({
      buildingId: "jumped-baker",
      reason: "outside-claim",
    });
  });

  it("requires the Town Hall first and rejects a second Town Hall", () => {
    const baker = placed("baker", "fortress-craftsmanship-luxury-baker", 0, 0);
    const town = placed("town", "fortress-town-hall-1", 0, 0);
    const duplicate = placed("town-2", "fortress-town-hall-1", 16, 0);

    expect(findColonyPlacementViolations([baker, town, duplicate], 4)).toEqual([
      { buildingId: "baker", reason: "town-hall-required" },
      { buildingId: "town-2", reason: "duplicate-town-hall" },
    ]);
    expect(getNewBuildingPlacementError([], baker, 4)).toBe(
      "town-hall-required",
    );
  });

  it("uses source building types and special claim-radius overrides", () => {
    const generic = placed("home", "fortress-residence-1", 0, 0);
    const town = placed("town", "fortress-town-hall-1", 0, 0);
    const guard = placed("guard", "fortress-guard-tower-1", 0, 0);
    const gate = placed("gate", "fortress-military-gatehouse", 0, 0);
    const barracks = placed("barracks", "fortress-military-barracks", 0, 0);
    const tower = placed("tower", "fortress-military-barrackstower", 0, 0);
    const wall = placed("wall", "fortress-walls-step-wall-dual", 0, 0);

    town.currentLevel = 5;
    guard.currentLevel = 5;
    gate.currentLevel = 3;
    expect(getBuildingClaimRadius(generic)).toBe(1);
    expect(getBuildingClaimRadius(town)).toBe(5);
    expect(getBuildingClaimRadius(guard)).toBe(5);
    expect(getBuildingClaimRadius(gate)).toBe(2);
    expect(getBuildingClaimRadius(barracks)).toBe(2);
    expect(getBuildingClaimRadius(tower)).toBe(0);
    expect(isClaimingBuilding(wall)).toBe(false);
  });

  it("does not let decorative wall blueprints expand colony claims", () => {
    const town = placed("town", "fortress-town-hall-1", 0, 0);
    const wall = placed("wall", "fortress-walls-step-wall-dual", 4 * 16, 0);

    expect(getClaimedChunks([town, wall], 4)).toEqual(
      getClaimedChunks([town], 4),
    );
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

  it("separates the game-map guard square from the larger patrol limit", () => {
    const guard = placed("guard", "fortress-guard-tower-1", 0, 0);
    const target = placed("target", "fortress-residence-1", 79, 0);

    expect(getGuardPatrolRadius(guard)).toBe(80);
    expect(getGuardMapRange(guard)).toBe(32);
    expect(isAnchorWithinGuardPatrol(target, [guard])).toBe(true);

    guard.currentLevel = 5;
    target.x = 199;
    expect(getGuardPatrolRadius(guard)).toBe(200);
    expect(getGuardMapRange(guard)).toBe(80);
    expect(isAnchorWithinGuardPatrol(target, [guard])).toBe(true);
  });
});
