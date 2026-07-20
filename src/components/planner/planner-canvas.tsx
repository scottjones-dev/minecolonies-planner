"use client";

import type Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Line, Stage, Text } from "react-konva";
import { usePlannerStore } from "@/stores/planner-store";

const BLOCK_SIZE = 24;
const CHUNK_SIZE = 16;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_FACTOR = 1.08;

type Size = {
  width: number;
  height: number;
};

type GridLine = {
  key: string;
  points: number[];
  chunk: boolean;
};

function getGridLines(
  size: Size,
  zoom: number,
  panX: number,
  panY: number,
): GridLine[] {
  const left = -panX / zoom;
  const top = -panY / zoom;
  const right = (size.width - panX) / zoom;
  const bottom = (size.height - panY) / zoom;
  const firstX = Math.floor(left / BLOCK_SIZE) - 1;
  const lastX = Math.ceil(right / BLOCK_SIZE) + 1;
  const firstZ = Math.floor(top / BLOCK_SIZE) - 1;
  const lastZ = Math.ceil(bottom / BLOCK_SIZE) + 1;
  const lines: GridLine[] = [];

  for (let x = firstX; x <= lastX; x += 1) {
    lines.push({
      key: `x-${x}`,
      points: [
        x * BLOCK_SIZE,
        firstZ * BLOCK_SIZE,
        x * BLOCK_SIZE,
        lastZ * BLOCK_SIZE,
      ],
      chunk: x % CHUNK_SIZE === 0,
    });
  }

  for (let z = firstZ; z <= lastZ; z += 1) {
    lines.push({
      key: `z-${z}`,
      points: [
        firstX * BLOCK_SIZE,
        z * BLOCK_SIZE,
        lastX * BLOCK_SIZE,
        z * BLOCK_SIZE,
      ],
      chunk: z % CHUNK_SIZE === 0,
    });
  }

  return lines;
}

export function PlannerCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const { zoom, panX, panY } = usePlannerStore((state) => state.map);
  const setMapZoom = usePlannerStore((state) => state.setMapZoom);
  const setMapPan = usePlannerStore((state) => state.setMapPan);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const gridLines = useMemo(
    () => getGridLines(size, zoom, panX, panY),
    [size, zoom, panX, panY],
  );

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();

    if (!pointer) {
      return;
    }

    const worldPosition = {
      x: (pointer.x - panX) / zoom,
      y: (pointer.y - panY) / zoom,
    };
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(
        MIN_ZOOM,
        direction > 0 ? zoom * ZOOM_FACTOR : zoom / ZOOM_FACTOR,
      ),
    );

    setMapZoom(nextZoom);
    setMapPan(
      pointer.x - worldPosition.x * nextZoom,
      pointer.y - worldPosition.y * nextZoom,
    );
  };

  const handleDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    setMapPan(event.target.x(), event.target.y());
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full cursor-grab active:cursor-grabbing"
    >
      {size.width > 0 && size.height > 0 ? (
        <Stage
          width={size.width}
          height={size.height}
          x={panX}
          y={panY}
          scaleX={zoom}
          scaleY={zoom}
          draggable
          onDragMove={handleDragMove}
          onWheel={handleWheel}
        >
          <Layer listening={false}>
            {gridLines.map((line) => (
              <Line
                key={line.key}
                points={line.points}
                stroke={line.chunk ? "#64748b" : "#cbd5e1"}
                strokeWidth={(line.chunk ? 1.5 : 0.5) / zoom}
                opacity={line.chunk ? 0.8 : 0.55}
                perfectDrawEnabled={false}
              />
            ))}
            <Line
              points={[0, -10_000, 0, 10_000]}
              stroke="#0f766e"
              strokeWidth={2 / zoom}
              opacity={0.9}
            />
            <Line
              points={[-10_000, 0, 10_000, 0]}
              stroke="#0f766e"
              strokeWidth={2 / zoom}
              opacity={0.9}
            />
            <Text
              x={8}
              y={8}
              text="X 0 · Z 0"
              fill="#0f766e"
              fontSize={12 / zoom}
              listening={false}
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
