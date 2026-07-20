"use client";

import { Building2, RotateCw, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { fortressStylePack } from "@/data";
import { usePlannerStore } from "@/stores/planner-store";
import {
  type BuildingRotation,
  type Direction,
  getBoundsDepth,
  getBoundsWidth,
} from "@/types/minecolonies";

const directions: Direction[] = ["north", "east", "south", "west"];

function getNextRotation(rotation: BuildingRotation): BuildingRotation {
  return ((rotation + 90) % 360) as BuildingRotation;
}

function getRotatedDirection(direction: Direction, rotation: BuildingRotation) {
  const directionIndex = directions.indexOf(direction);
  const rotationSteps = rotation / 90;
  return directions[(directionIndex + rotationSteps) % directions.length];
}

export function BuildingInspectorPanel() {
  const selectedBuilding = usePlannerStore((state) =>
    state.buildings.find(
      (building) => building.id === state.selectedBuildingId,
    ),
  );
  const updateBuilding = usePlannerStore((state) => state.updateBuilding);
  const removeBuilding = usePlannerStore((state) => state.removeBuilding);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (
        !isEditing &&
        selectedBuilding &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        event.preventDefault();
        removeBuilding(selectedBuilding.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeBuilding, selectedBuilding]);

  if (!selectedBuilding) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Building inspector</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            View and edit the selected building.
          </p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center">
          <div>
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
              <Building2
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm font-medium">Nothing selected</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Select a placed building to move, rotate, or delete it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const variant = fortressStylePack.variants.find(
    (candidate) => candidate.id === selectedBuilding.variantId,
  );
  const level =
    variant?.levels.find(
      (candidate) => candidate.level === selectedBuilding.currentLevel,
    ) ?? variant?.levels[0];
  const unrotatedWidth = level ? getBoundsWidth(level.bounds) : 1;
  const unrotatedDepth = level ? getBoundsDepth(level.bounds) : 1;
  const swapsDimensions =
    selectedBuilding.rotation === 90 || selectedBuilding.rotation === 270;
  const width = swapsDimensions ? unrotatedDepth : unrotatedWidth;
  const depth = swapsDimensions ? unrotatedWidth : unrotatedDepth;
  const entranceDirection = level?.entrance
    ? getRotatedDirection(level.entrance.direction, selectedBuilding.rotation)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="truncate text-sm font-semibold">
          {variant?.name ?? "Placed building"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          X {selectedBuilding.x} · Z {selectedBuilding.z}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Footprint</dt>
            <dd className="mt-1 font-mono font-medium">
              {width}×{depth}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Rotation</dt>
            <dd className="mt-1 font-mono font-medium">
              {selectedBuilding.rotation}°
            </dd>
          </div>
        </dl>
        {entranceDirection ? (
          <p className="text-xs text-muted-foreground">
            Entrance faces{" "}
            <span className="font-medium capitalize text-foreground">
              {entranceDirection}
            </span>
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t p-4">
        <Button
          variant="outline"
          onClick={() =>
            updateBuilding(selectedBuilding.id, {
              rotation: getNextRotation(selectedBuilding.rotation),
            })
          }
        >
          <RotateCw data-icon="inline-start" aria-hidden="true" />
          Rotate
        </Button>
        <Button
          variant="destructive"
          onClick={() => removeBuilding(selectedBuilding.id)}
        >
          <Trash2 data-icon="inline-start" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </div>
  );
}
