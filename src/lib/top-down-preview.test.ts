import { describe, expect, it } from "vitest";
import {
  getRotatedPreviewDimensions,
  rotatePreviewCell,
} from "@/lib/top-down-preview";

describe("top-down preview rotation", () => {
  it.each([
    [0, { x: 1, z: 2 }],
    [90, { x: 3, z: 1 }],
    [180, { x: 2, z: 3 }],
    [270, { x: 2, z: 2 }],
  ] as const)("rotates a cell %s degrees", (rotation, expected) => {
    expect(rotatePreviewCell(1, 2, 4, 6, rotation)).toEqual(expected);
  });

  it("swaps rectangular dimensions for quarter turns", () => {
    expect(getRotatedPreviewDimensions(12, 7, 0)).toEqual({
      width: 12,
      depth: 7,
    });
    expect(getRotatedPreviewDimensions(12, 7, 90)).toEqual({
      width: 7,
      depth: 12,
    });
  });
});
