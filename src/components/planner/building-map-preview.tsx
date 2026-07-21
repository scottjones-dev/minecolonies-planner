"use client";

import { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import { drawBuildingTopDownPreview } from "@/lib/top-down-preview-renderer";
import type {
  BuildingLevelDefinition,
  BuildingRotation,
} from "@/types/minecolonies";

export function BuildingMapPreview({
  level,
  rotation,
  x,
  z,
  width,
  depth,
  blockSize,
}: {
  level: BuildingLevelDefinition;
  rotation: BuildingRotation;
  x: number;
  z: number;
  width: number;
  depth: number;
  blockSize: number;
}) {
  const [image, setImage] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    drawBuildingTopDownPreview(canvas, level, rotation, 4, false);
    setImage(canvas);
  }, [level, rotation]);

  return image ? (
    <KonvaImage
      image={image}
      x={x * blockSize}
      y={z * blockSize}
      width={width * blockSize}
      height={depth * blockSize}
      imageSmoothingEnabled={false}
      listening={false}
      opacity={0.94}
    />
  ) : null;
}
