"use client";

import { useEffect, useMemo, useRef } from "react";
import { getRotatedDirection } from "@/lib/building-geometry";
import {
  getRotatedPreviewDimensions,
  rotatePreviewCell,
} from "@/lib/top-down-preview";
import { cn } from "@/lib/utils";
import type {
  BuildingLevelDefinition,
  BuildingRotation,
  Direction,
} from "@/types/minecolonies";

const CELL_SCALE = 5;
const materialColors = [
  "#000000",
  "#7a8186",
  "#9a6a3a",
  "#4f7f48",
  "#806247",
  "#c8ad6a",
  "#5795b5",
  "#91c6cb",
  "#a74d43",
  "#b96e35",
  "#c3a447",
  "#4f8a61",
  "#5271a3",
  "#805f93",
  "#d6d2c7",
  "#474d54",
] as const;

const directionVectors: Record<Direction, { x: number; z: number }> = {
  north: { x: 0, z: -1 },
  east: { x: 1, z: 0 },
  south: { x: 0, z: 1 },
  west: { x: -1, z: 0 },
};

function shadedColor(hex: string, height: number) {
  const shade = 0.6 + (height / 15) * 0.4;
  const channels = [1, 3, 5].map((offset) =>
    Math.round(Number.parseInt(hex.slice(offset, offset + 2), 16) * shade),
  );
  return `rgb(${channels.join(" ")})`;
}

function decodePixels(value: string): Uint8Array {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function BuildingTopDownPreview({
  level,
  rotation,
  name,
  compact = false,
  className,
}: {
  level: BuildingLevelDefinition;
  rotation: BuildingRotation;
  name: string;
  compact?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceWidth =
    level.topDown?.width ?? level.bounds.maxX - level.bounds.minX + 1;
  const sourceDepth =
    level.topDown?.depth ?? level.bounds.maxZ - level.bounds.minZ + 1;
  const boundsMinX = level.bounds.minX;
  const boundsMinZ = level.bounds.minZ;
  const dimensions = getRotatedPreviewDimensions(
    sourceWidth,
    sourceDepth,
    rotation,
  );
  const facing = level.entrance
    ? getRotatedDirection(level.entrance.direction, rotation)
    : null;
  const label = `${name}, level ${level.level} top-down view${facing ? `, front faces ${facing}` : ""}`;
  const pixels = useMemo(() => {
    if (!level.topDown || typeof window === "undefined") return null;
    try {
      return decodePixels(level.topDown.pixels);
    } catch {
      return null;
    }
  }, [level.topDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.imageSmoothingEnabled = false;
    context.fillStyle = "#111c1a";
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let z = 0; z < sourceDepth; z++) {
      for (let x = 0; x < sourceWidth; x++) {
        const value = pixels?.[z * sourceWidth + x] ?? (pixels ? 0 : 0x18);
        const material = value >> 4;
        if (material === 0) continue;
        const height = value & 0x0f;
        const rotated = rotatePreviewCell(
          x,
          z,
          sourceWidth,
          sourceDepth,
          rotation,
        );
        context.fillStyle = shadedColor(materialColors[material], height);
        context.fillRect(
          rotated.x * CELL_SCALE + 0.25,
          rotated.z * CELL_SCALE + 0.25,
          CELL_SCALE - 0.5,
          CELL_SCALE - 0.5,
        );
      }
    }

    if (level.entrance) {
      const marker = rotatePreviewCell(
        level.entrance.position.x - boundsMinX,
        level.entrance.position.z - boundsMinZ,
        sourceWidth,
        sourceDepth,
        rotation,
      );
      const vector =
        directionVectors[
          getRotatedDirection(level.entrance.direction, rotation)
        ];
      const startX = (marker.x + 0.5) * CELL_SCALE;
      const startZ = (marker.z + 0.5) * CELL_SCALE;
      const endX = startX + vector.x * CELL_SCALE * 2.4;
      const endZ = startZ + vector.z * CELL_SCALE * 2.4;

      context.strokeStyle = "#fbbf24";
      context.fillStyle = "#fbbf24";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(startX, startZ);
      context.lineTo(endX, endZ);
      context.stroke();
      context.beginPath();
      context.arc(endX, endZ, 2.4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#0f766e";
      context.strokeStyle = "#ffffff";
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(startX, startZ, 3.2, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  }, [
    boundsMinX,
    boundsMinZ,
    level.entrance,
    pixels,
    rotation,
    sourceDepth,
    sourceWidth,
  ]);

  return (
    <figure
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border border-slate-700/50 bg-[#111c1a] shadow-inner",
        className,
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width * CELL_SCALE}
        height={dimensions.depth * CELL_SCALE}
        className="h-full w-full object-contain [image-rendering:pixelated]"
      >
        {label}
      </canvas>
      <span className="absolute left-1.5 top-1 rounded bg-black/65 px-1 py-0.5 font-mono text-[8px] font-bold leading-none text-white/90">
        N ↑
      </span>
      {!compact && facing ? (
        <figcaption className="absolute bottom-1.5 right-1.5 rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950 shadow">
          Front · {facing}
        </figcaption>
      ) : null}
    </figure>
  );
}
