"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { BuildingCardContent } from "@/components/planner/building-library-panel";
import { screenPointToWorldBlock } from "@/lib/planner-coordinates";
import {
  getNewBuildingPlacementError,
  getPlacementErrorMessage,
} from "@/lib/validation/colony-boundary";
import { usePlannerStore } from "@/stores/planner-store";
import type { BuildingVariant } from "@/types/minecolonies";

type LibraryDragData = {
  type: "building-library";
  stylePackId: string;
  variant: BuildingVariant;
};

function getLibraryDragData(
  event: DragStartEvent | DragEndEvent,
): LibraryDragData | null {
  const data = event.active.data.current;

  if (
    data?.type !== "building-library" ||
    typeof data.stylePackId !== "string" ||
    !data.variant
  ) {
    return null;
  }

  return data as LibraryDragData;
}

function getDropPoint(event: DragEndEvent) {
  const activatorCoordinates = getEventCoordinates(event.activatorEvent);

  if (activatorCoordinates) {
    return {
      x: activatorCoordinates.x + event.delta.x,
      y: activatorCoordinates.y + event.delta.y,
    };
  }

  const translatedRect = event.active.rect.current.translated;

  if (!translatedRect) {
    return null;
  }

  return {
    x: translatedRect.left + translatedRect.width / 2,
    y: translatedRect.top + translatedRect.height / 2,
  };
}

export function PlannerDndContext({ children }: { children: ReactNode }) {
  const [activeVariant, setActiveVariant] = useState<BuildingVariant | null>(
    null,
  );
  const addBuilding = usePlannerStore((state) => state.addBuilding);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveVariant(null);
    const dragData = getLibraryDragData(event);
    const dropPoint = getDropPoint(event);

    if (
      !dragData ||
      !dropPoint ||
      event.over?.data.current?.type !== "planner-map"
    ) {
      return;
    }

    const map = usePlannerStore.getState().map;
    const position = screenPointToWorldBlock(dropPoint, event.over.rect, map);
    const levels = dragData.variant.levels.map((level) => level.level);

    const building = {
      stylePackId: dragData.stylePackId,
      variantId: dragData.variant.id,
      x: position.x,
      y: 0,
      z: position.z,
      rotation: 0,
      currentLevel: Math.min(...levels),
      reserveThroughLevel: Math.max(...levels),
      assignedResidenceId: null,
    } as const;
    const state = usePlannerStore.getState();
    const placementError = getNewBuildingPlacementError(
      state.buildings,
      { ...building, id: "placement-preview" },
      state.rules.colonyRadiusChunks,
    );

    if (placementError) {
      toast.error(getPlacementErrorMessage(placementError));
      return;
    }

    addBuilding(building);
  };

  return (
    <DndContext
      onDragStart={(event) =>
        setActiveVariant(getLibraryDragData(event)?.variant ?? null)
      }
      onDragCancel={() => setActiveVariant(null)}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeVariant ? (
          <BuildingCardContent variant={activeVariant} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
