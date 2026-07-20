"use client";

import type Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Arrow,
  Circle,
  Group,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from "react-konva";
import { toast } from "sonner";
import { getStylePackById } from "@/data";
import {
  getEntranceMarker,
  getLevelFootprint,
  getReservedFootprint,
} from "@/lib/building-geometry";
import {
  BLOCK_SIZE,
  canvasCoordinateToWorldBlock,
  worldBlockToCanvasCoordinate,
} from "@/lib/planner-coordinates";
import {
  findBuildingCollisions,
  getCollidingBuildingIds,
} from "@/lib/validation/collisions";
import {
  findColonyBoundaryViolations,
  findColonyPlacementViolations,
  getClaimedChunks,
  getPlacementErrorMessage,
} from "@/lib/validation/colony-boundary";
import { findCommuteResults } from "@/lib/validation/commute";
import {
  getGuardMapRange,
  isGuardBuilding,
} from "@/lib/validation/guard-coverage";
import { usePlannerStore } from "@/stores/planner-store";

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
  const moveOriginRef = useRef<{ x: number; z: number } | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [movingBuildingId, setMovingBuildingId] = useState<string | null>(null);
  const { zoom, panX, panY } = usePlannerStore((state) => state.map);
  const {
    colonyRadiusChunks,
    colonyBoundaryMode,
    preferredCommuteDistance,
    warningCommuteDistance,
    showCommuteConnections,
    showGuardCoverage,
  } = usePlannerStore((state) => state.rules);
  const buildings = usePlannerStore((state) => state.buildings);
  const selectedBuildingId = usePlannerStore(
    (state) => state.selectedBuildingId,
  );
  const setMapZoom = usePlannerStore((state) => state.setMapZoom);
  const setMapPan = usePlannerStore((state) => state.setMapPan);
  const selectBuilding = usePlannerStore((state) => state.selectBuilding);
  const updateBuilding = usePlannerStore((state) => state.updateBuilding);

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
  const collidingBuildingIds = useMemo(
    () => getCollidingBuildingIds(findBuildingCollisions(buildings)),
    [buildings],
  );
  const claimedChunks = useMemo(
    () => getClaimedChunks(buildings, colonyRadiusChunks),
    [buildings, colonyRadiusChunks],
  );
  const boundaryViolationIds = useMemo(
    () => new Set(findColonyBoundaryViolations(buildings, colonyRadiusChunks)),
    [buildings, colonyRadiusChunks],
  );
  const commuteResults = useMemo(
    () =>
      findCommuteResults(buildings, {
        preferredDistance: preferredCommuteDistance,
        warningDistance: warningCommuteDistance,
      }),
    [buildings, preferredCommuteDistance, warningCommuteDistance],
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

  const handleEmptyMapPointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (event.target === event.target.getStage()) {
      selectBuilding(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab active:cursor-grabbing"
      role="application"
      aria-label="Colony map. Drag to pan, scroll to zoom, and select buildings to edit them."
    >
      {buildings.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
          <div className="rounded-xl border border-dashed bg-background/90 px-5 py-4 shadow-sm">
            <p className="text-sm font-medium">Start your colony plan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag a building from the library onto this block grid.
            </p>
          </div>
        </div>
      ) : null}
      {size.width > 0 && size.height > 0 ? (
        <Stage
          width={size.width}
          height={size.height}
          x={panX}
          y={panY}
          scaleX={zoom}
          scaleY={zoom}
          draggable={movingBuildingId === null}
          onDragMove={handleDragMove}
          onMouseDown={handleEmptyMapPointerDown}
          onTouchStart={handleEmptyMapPointerDown}
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
            {claimedChunks.map((chunk) => (
              <Rect
                key={`claim-${chunk.x}-${chunk.z}`}
                x={chunk.x * CHUNK_SIZE * BLOCK_SIZE}
                y={chunk.z * CHUNK_SIZE * BLOCK_SIZE}
                width={CHUNK_SIZE * BLOCK_SIZE}
                height={CHUNK_SIZE * BLOCK_SIZE}
                fill={
                  colonyBoundaryMode === "invalid" ? "#dc26260a" : "#d977060a"
                }
                stroke={
                  colonyBoundaryMode === "invalid" ? "#dc2626" : "#d97706"
                }
                strokeWidth={1 / zoom}
                listening={false}
              />
            ))}
            {showGuardCoverage
              ? buildings.filter(isGuardBuilding).map((guard) => {
                  const range = getGuardMapRange(guard);
                  return range > 0 ? (
                    <Rect
                      key={`guard-coverage-${guard.id}`}
                      x={
                        worldBlockToCanvasCoordinate(guard.x) -
                        range * BLOCK_SIZE
                      }
                      y={
                        worldBlockToCanvasCoordinate(guard.z) -
                        range * BLOCK_SIZE
                      }
                      width={range * 2 * BLOCK_SIZE}
                      height={range * 2 * BLOCK_SIZE}
                      fill="#2563eb0d"
                      stroke="#2563eb"
                      strokeWidth={2 / zoom}
                      dash={[10 / zoom, 6 / zoom]}
                    />
                  ) : null;
                })
              : null}
            {showCommuteConnections
              ? commuteResults.map((result) => {
                  const workplace = buildings.find(
                    (building) => building.id === result.workplaceId,
                  );
                  const residence = result.residenceId
                    ? buildings.find(
                        (building) => building.id === result.residenceId,
                      )
                    : null;

                  if (!workplace || !residence) {
                    return null;
                  }

                  const color =
                    result.state === "preferred"
                      ? "#059669"
                      : result.state === "warning"
                        ? "#d97706"
                        : "#dc2626";

                  return (
                    <Line
                      key={`commute-${workplace.id}`}
                      points={[
                        worldBlockToCanvasCoordinate(workplace.x),
                        worldBlockToCanvasCoordinate(workplace.z),
                        worldBlockToCanvasCoordinate(residence.x),
                        worldBlockToCanvasCoordinate(residence.z),
                      ]}
                      stroke={color}
                      strokeWidth={3 / zoom}
                      dash={
                        result.state === "preferred"
                          ? undefined
                          : [8 / zoom, 6 / zoom]
                      }
                      opacity={0.8}
                    />
                  );
                })
              : null}
          </Layer>
          <Layer>
            {buildings.map((building) => {
              const stylePack = getStylePackById(building.stylePackId);
              const variant = stylePack?.variants.find(
                (candidate) => candidate.id === building.variantId,
              );
              const level =
                variant?.levels.find(
                  (candidate) => candidate.level === building.currentLevel,
                ) ?? variant?.levels[0];
              const currentFootprint = level
                ? getLevelFootprint(level, building.rotation)
                : null;
              const reservedFootprint = variant
                ? getReservedFootprint(
                    variant.levels,
                    building.reserveThroughLevel,
                    building.rotation,
                  )
                : null;
              const entranceMarker = level
                ? getEntranceMarker(level, building.rotation)
                : null;
              const selected = building.id === selectedBuildingId;
              const colliding = collidingBuildingIds.has(building.id);
              const outsideBoundary = boundaryViolationIds.has(building.id);
              const invalid =
                colliding ||
                (outsideBoundary && colonyBoundaryMode === "invalid");
              const warning =
                outsideBoundary && colonyBoundaryMode === "warning";
              const accentColor = invalid
                ? "#dc2626"
                : warning
                  ? "#d97706"
                  : selected
                    ? "#0f766e"
                    : "#475569";

              return (
                <Group
                  key={building.id}
                  x={worldBlockToCanvasCoordinate(building.x)}
                  y={worldBlockToCanvasCoordinate(building.z)}
                  draggable
                  onClick={(event) => {
                    event.cancelBubble = true;
                    selectBuilding(building.id);
                  }}
                  onTap={(event) => {
                    event.cancelBubble = true;
                    selectBuilding(building.id);
                  }}
                  onDragStart={(event) => {
                    event.cancelBubble = true;
                    moveOriginRef.current = {
                      x: building.x,
                      z: building.z,
                    };
                    setMovingBuildingId(building.id);
                    selectBuilding(building.id);
                  }}
                  onDragMove={(event) => {
                    event.cancelBubble = true;
                    const x = canvasCoordinateToWorldBlock(event.target.x());
                    const z = canvasCoordinateToWorldBlock(event.target.y());
                    event.target.position({
                      x: worldBlockToCanvasCoordinate(x),
                      y: worldBlockToCanvasCoordinate(z),
                    });
                  }}
                  onDragEnd={(event) => {
                    event.cancelBubble = true;
                    const x = canvasCoordinateToWorldBlock(event.target.x());
                    const z = canvasCoordinateToWorldBlock(event.target.y());
                    const currentViolations = new Set(
                      findColonyPlacementViolations(
                        buildings,
                        colonyRadiusChunks,
                      ).map((violation) => violation.buildingId),
                    );
                    const candidateBuildings = buildings.map((candidate) =>
                      candidate.id === building.id
                        ? { ...candidate, x, z }
                        : candidate,
                    );
                    const newViolation = findColonyPlacementViolations(
                      candidateBuildings,
                      colonyRadiusChunks,
                    ).find(
                      (violation) =>
                        violation.buildingId === building.id ||
                        !currentViolations.has(violation.buildingId),
                    );

                    if (newViolation) {
                      const origin = moveOriginRef.current;
                      if (origin) {
                        event.target.position({
                          x: worldBlockToCanvasCoordinate(origin.x),
                          y: worldBlockToCanvasCoordinate(origin.z),
                        });
                      }
                      toast.error(
                        getPlacementErrorMessage(newViolation.reason),
                      );
                    } else {
                      updateBuilding(building.id, { x, z });
                    }
                    moveOriginRef.current = null;
                    setMovingBuildingId(null);
                  }}
                >
                  {reservedFootprint ? (
                    <Rect
                      x={reservedFootprint.minX * BLOCK_SIZE}
                      y={reservedFootprint.minZ * BLOCK_SIZE}
                      width={reservedFootprint.width * BLOCK_SIZE}
                      height={reservedFootprint.depth * BLOCK_SIZE}
                      fill="transparent"
                      stroke={accentColor}
                      strokeWidth={
                        (selected || invalid || warning ? 3 : 2) / zoom
                      }
                      dash={[8 / zoom, 6 / zoom]}
                    />
                  ) : null}
                  {currentFootprint ? (
                    <Rect
                      x={currentFootprint.minX * BLOCK_SIZE}
                      y={currentFootprint.minZ * BLOCK_SIZE}
                      width={currentFootprint.width * BLOCK_SIZE}
                      height={currentFootprint.depth * BLOCK_SIZE}
                      fill={
                        invalid
                          ? "#dc262644"
                          : warning
                            ? "#d9770644"
                            : selected
                              ? "#0f766e55"
                              : "#33415533"
                      }
                      stroke={accentColor}
                      strokeWidth={
                        (selected || invalid || warning ? 3 : 1.5) / zoom
                      }
                      shadowColor={
                        selected || invalid || warning ? accentColor : undefined
                      }
                      shadowBlur={selected || invalid || warning ? 8 / zoom : 0}
                    />
                  ) : null}
                  <Circle
                    radius={3 / zoom}
                    fill={accentColor}
                    stroke="#ffffff"
                    strokeWidth={1 / zoom}
                  />
                  {entranceMarker ? (
                    <Arrow
                      points={[
                        (entranceMarker.position.x -
                          entranceMarker.direction.x * 0.75) *
                          BLOCK_SIZE,
                        (entranceMarker.position.z -
                          entranceMarker.direction.z * 0.75) *
                          BLOCK_SIZE,
                        (entranceMarker.position.x +
                          entranceMarker.direction.x * 0.75) *
                          BLOCK_SIZE,
                        (entranceMarker.position.z +
                          entranceMarker.direction.z * 0.75) *
                          BLOCK_SIZE,
                      ]}
                      fill={accentColor}
                      stroke={accentColor}
                      strokeWidth={2 / zoom}
                      pointerLength={7 / zoom}
                      pointerWidth={7 / zoom}
                    />
                  ) : null}
                  <Text
                    x={(reservedFootprint?.minX ?? -0.5) * BLOCK_SIZE}
                    y={
                      (reservedFootprint?.minZ ?? -0.5) * BLOCK_SIZE - 20 / zoom
                    }
                    text={variant?.name ?? building.variantId}
                    fill={invalid ? "#b91c1c" : warning ? "#b45309" : "#0f172a"}
                    fontSize={12 / zoom}
                    padding={2 / zoom}
                    listening={false}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
