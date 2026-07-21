"use client";

import { useEffect, useRef } from "react";
import { getRotatedDirection } from "@/lib/building-geometry";
import { getRotatedPreviewDimensions } from "@/lib/top-down-preview";
import { drawBuildingTopDownPreview } from "@/lib/top-down-preview-renderer";
import { cn } from "@/lib/utils";
import type {
  BuildingLevelDefinition,
  BuildingRotation,
} from "@/types/minecolonies";

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
  const cellScale = compact ? 4 : 8;
  const sourceWidth =
    level.topDown?.width ?? level.bounds.maxX - level.bounds.minX + 1;
  const sourceDepth =
    level.topDown?.depth ?? level.bounds.maxZ - level.bounds.minZ + 1;
  const dimensions = getRotatedPreviewDimensions(
    sourceWidth,
    sourceDepth,
    rotation,
  );
  const facing = level.entrance
    ? getRotatedDirection(level.entrance.direction, rotation)
    : null;
  const label = `${name}, level ${level.level} top-down view${facing ? `, front faces ${facing}` : ""}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawBuildingTopDownPreview(canvas, level, rotation, cellScale, true);
    }
  }, [cellScale, level, rotation]);

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
        width={dimensions.width * cellScale}
        height={dimensions.depth * cellScale}
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
