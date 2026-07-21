import { describe, expect, it } from "vitest";
import {
  BLOCK_SIZE,
  canvasCoordinateToWorldBlock,
  centerBuildingOnWorldPosition,
  screenPointToWorldBlock,
  screenPointToWorldPosition,
  worldBlockToCanvasCoordinate,
} from "@/lib/planner-coordinates";

describe("zoom-aware drag-and-drop coordinates", () => {
  const mapBounds = { left: 100, top: 50 };

  it.each([0.25, 0.5, 1, 2, 4])("places the same block at %sx zoom", (zoom) => {
    const panX = 30;
    const panY = -20;
    const expected = { x: 7, z: -3 };

    expect(
      screenPointToWorldBlock(
        {
          x:
            mapBounds.left +
            panX +
            worldBlockToCanvasCoordinate(expected.x) * zoom,
          y:
            mapBounds.top +
            panY +
            worldBlockToCanvasCoordinate(expected.z) * zoom,
        },
        mapBounds,
        { zoom, panX, panY },
      ),
    ).toEqual(expected);
  });

  it("places a drop in the grid square containing the pointer", () => {
    expect(
      screenPointToWorldBlock(
        { x: 100 + BLOCK_SIZE * 2.6, y: 50 + BLOCK_SIZE * 1.4 },
        mapBounds,
        { zoom: 1, panX: 0, panY: 0 },
      ),
    ).toEqual({ x: 2, z: 1 });
  });

  it("keeps the exact fractional world position of the drop pointer", () => {
    expect(
      screenPointToWorldPosition(
        { x: 100 + BLOCK_SIZE * 2.75, y: 50 + BLOCK_SIZE * 1.25 },
        mapBounds,
        { zoom: 1, panX: 0, panY: 0 },
      ),
    ).toEqual({ x: 2.25, z: 0.75 });
  });

  it("centers an asymmetric blueprint footprint on the drop point", () => {
    const level = {
      level: 1,
      bounds: { minX: 0, maxX: 10, minY: 0, maxY: 5, minZ: 0, maxZ: 6 },
      anchor: { x: 1, y: 0, z: 5 },
    };

    const anchor = centerBuildingOnWorldPosition({ x: 20, z: 12 }, level, 0);

    expect(anchor).toEqual({ x: 16, z: 14 });
  });

  it("centers the rotated footprint at the same drop point", () => {
    const level = {
      level: 1,
      bounds: { minX: 0, maxX: 10, minY: 0, maxY: 5, minZ: 0, maxZ: 6 },
      anchor: { x: 1, y: 0, z: 5 },
    };

    expect(centerBuildingOnWorldPosition({ x: 20, z: 12 }, level, 90)).toEqual({
      x: 18,
      z: 8,
    });
  });

  it("centers integer block coordinates inside cells on both sides of zero", () => {
    expect(worldBlockToCanvasCoordinate(0)).toBe(BLOCK_SIZE / 2);
    expect(worldBlockToCanvasCoordinate(-1)).toBe(-BLOCK_SIZE / 2);
    expect(canvasCoordinateToWorldBlock(worldBlockToCanvasCoordinate(12))).toBe(
      12,
    );
    expect(
      canvasCoordinateToWorldBlock(worldBlockToCanvasCoordinate(-12)),
    ).toBe(-12);
  });

  it("keeps chunk boundaries on grid lines instead of block centers", () => {
    expect(canvasCoordinateToWorldBlock(0)).toBe(0);
    expect(canvasCoordinateToWorldBlock(-0.001)).toBe(-1);
    expect(canvasCoordinateToWorldBlock(16 * BLOCK_SIZE)).toBe(16);
  });

  it("aligns footprint edges to grid lines around a centered anchor block", () => {
    const anchorCenter = worldBlockToCanvasCoordinate(5);

    expect(anchorCenter - BLOCK_SIZE / 2).toBe(5 * BLOCK_SIZE);
    expect(anchorCenter + BLOCK_SIZE / 2).toBe(6 * BLOCK_SIZE);
  });
});
