export const MAX_XAERO_MAP_BYTES = 100 * 1024 * 1024;

export type XaeroMapCalibration = {
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  originX: number;
  originZ: number;
  pixelsPerBlock: number;
  opacity: number;
};

export function getXaeroMapWorldRect(calibration: XaeroMapCalibration) {
  return {
    x: calibration.originX,
    z: calibration.originZ,
    width: calibration.imageWidth / calibration.pixelsPerBlock,
    depth: calibration.imageHeight / calibration.pixelsPerBlock,
  };
}

export function validateXaeroMapCalibration(
  calibration: XaeroMapCalibration,
): string | null {
  if (!calibration.fileName.trim()) return "The map needs a file name.";
  if (
    !Number.isInteger(calibration.imageWidth) ||
    !Number.isInteger(calibration.imageHeight) ||
    calibration.imageWidth < 1 ||
    calibration.imageHeight < 1
  ) {
    return "The PNG dimensions are invalid.";
  }
  if (
    !Number.isInteger(calibration.originX) ||
    !Number.isInteger(calibration.originZ)
  ) {
    return "Top-left X and Z must be whole Minecraft block coordinates.";
  }
  if (
    !Number.isFinite(calibration.pixelsPerBlock) ||
    calibration.pixelsPerBlock <= 0 ||
    calibration.pixelsPerBlock > 16
  ) {
    return "Pixels per block must be greater than 0 and no more than 16.";
  }
  if (
    !Number.isFinite(calibration.opacity) ||
    calibration.opacity < 0.05 ||
    calibration.opacity > 1
  ) {
    return "Opacity must be between 5% and 100%.";
  }
  return null;
}

export function isPngFile(file: File): boolean {
  return file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
}
