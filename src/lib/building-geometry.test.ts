import { describe, expect, it } from "vitest";
import {
  getEntranceMarker,
  getLevelFootprint,
  getReservedFootprint,
  getRotatedDirection,
  rotatePoint,
} from "@/lib/building-geometry";
import type { BuildingLevelDefinition } from "@/types/minecolonies";

const nonSquareLevel: BuildingLevelDefinition = {
  level: 1,
  bounds: {
    minX: 0,
    maxX: 3,
    minY: 0,
    maxY: 4,
    minZ: 0,
    maxZ: 1,
  },
  anchor: { x: 0, y: 0, z: 0 },
  entrance: {
    position: { x: 3, y: 0, z: 1 },
    direction: "south",
  },
};

describe("building rotations", () => {
  it("rotates cardinal blueprint directions with the building", () => {
    expect(getRotatedDirection("north", 0)).toBe("north");
    expect(getRotatedDirection("north", 90)).toBe("east");
    expect(getRotatedDirection("west", 180)).toBe("east");
    expect(getRotatedDirection("south", 270)).toBe("east");
  });

  it("rotates points clockwise through all four orientations", () => {
    expect(rotatePoint({ x: 2, z: 1 }, 0)).toEqual({ x: 2, z: 1 });
    expect(rotatePoint({ x: 2, z: 1 }, 90)).toEqual({ x: -1, z: 2 });
    expect(rotatePoint({ x: 2, z: 1 }, 180)).toEqual({ x: -2, z: -1 });
    expect(rotatePoint({ x: 2, z: 1 }, 270)).toEqual({ x: 1, z: -2 });
  });

  it.each([
    [0, 4, 2],
    [90, 2, 4],
    [180, 4, 2],
    [270, 2, 4],
  ] as const)(
    "preserves a non-square footprint at %i degrees",
    (rotation, width, depth) => {
      expect(getLevelFootprint(nonSquareLevel, rotation)).toMatchObject({
        width,
        depth,
      });
    },
  );

  it("rotates entrance positions and directions with the footprint", () => {
    expect(getEntranceMarker(nonSquareLevel, 90)).toEqual({
      position: { x: -1, z: 3 },
      direction: { x: -1, z: 0 },
    });
  });
});

describe("reserved bounds", () => {
  it("unions every level through the reserved upgrade", () => {
    const expandedLevel: BuildingLevelDefinition = {
      ...nonSquareLevel,
      level: 5,
      bounds: {
        ...nonSquareLevel.bounds,
        minX: -2,
        maxX: 5,
        minZ: -1,
        maxZ: 3,
      },
    };

    expect(
      getReservedFootprint([nonSquareLevel, expandedLevel], 5, 0),
    ).toMatchObject({
      minX: -2.5,
      maxX: 5.5,
      minZ: -1.5,
      maxZ: 3.5,
      width: 8,
      depth: 5,
    });
    expect(
      getReservedFootprint([nonSquareLevel, expandedLevel], 1, 0),
    ).toMatchObject({ width: 4, depth: 2 });
  });
});
