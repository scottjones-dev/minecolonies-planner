import { describe, expect, it } from "vitest";
import { BLOCK_SIZE, screenPointToWorldBlock } from "@/lib/planner-coordinates";

describe("zoom-aware drag-and-drop coordinates", () => {
  const mapBounds = { left: 100, top: 50 };

  it.each([0.25, 0.5, 1, 2, 4])("places the same block at %sx zoom", (zoom) => {
    const panX = 30;
    const panY = -20;
    const expected = { x: 7, z: -3 };

    expect(
      screenPointToWorldBlock(
        {
          x: mapBounds.left + panX + expected.x * BLOCK_SIZE * zoom,
          y: mapBounds.top + panY + expected.z * BLOCK_SIZE * zoom,
        },
        mapBounds,
        { zoom, panX, panY },
      ),
    ).toEqual(expected);
  });

  it("rounds a drop to the nearest block", () => {
    expect(
      screenPointToWorldBlock(
        { x: 100 + BLOCK_SIZE * 2.6, y: 50 + BLOCK_SIZE * 1.4 },
        mapBounds,
        { zoom: 1, panX: 0, panY: 0 },
      ),
    ).toEqual({ x: 3, z: 1 });
  });
});
