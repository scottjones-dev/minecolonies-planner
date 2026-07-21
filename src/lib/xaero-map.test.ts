import { describe, expect, it } from "vitest";
import {
  getXaeroMapWorldRect,
  validateXaeroMapCalibration,
  type XaeroMapCalibration,
} from "@/lib/xaero-map";

const calibration: XaeroMapCalibration = {
  fileName: "overworld.png",
  imageWidth: 2048,
  imageHeight: 1024,
  originX: -512,
  originZ: 256,
  pixelsPerBlock: 2,
  opacity: 0.75,
};

describe("Xaero map calibration", () => {
  it("maps PNG pixels onto north-up Minecraft X/Z blocks", () => {
    expect(getXaeroMapWorldRect(calibration)).toEqual({
      x: -512,
      z: 256,
      width: 1024,
      depth: 512,
    });
  });

  it("accepts a complete calibration", () => {
    expect(validateXaeroMapCalibration(calibration)).toBeNull();
  });

  it.each([
    [{ originX: 0.5 }, "whole Minecraft block"],
    [{ pixelsPerBlock: 0 }, "Pixels per block"],
    [{ opacity: 0 }, "Opacity"],
    [{ imageWidth: 0 }, "dimensions"],
  ])("rejects invalid calibration values", (changes, message) => {
    expect(
      validateXaeroMapCalibration({ ...calibration, ...changes }),
    ).toContain(message);
  });
});
