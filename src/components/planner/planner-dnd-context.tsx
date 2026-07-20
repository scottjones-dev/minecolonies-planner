"use client";

import { DndContext, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { type ReactNode, useState } from "react";
import { BuildingCardContent } from "@/components/planner/building-library-panel";
import type { BuildingVariant } from "@/types/minecolonies";

function getDraggedVariant(event: DragStartEvent): BuildingVariant | null {
  const data = event.active.data.current;

  if (data?.type !== "building-library") {
    return null;
  }

  return data.variant as BuildingVariant;
}

export function PlannerDndContext({ children }: { children: ReactNode }) {
  const [activeVariant, setActiveVariant] = useState<BuildingVariant | null>(
    null,
  );

  return (
    <DndContext
      onDragStart={(event) => setActiveVariant(getDraggedVariant(event))}
      onDragCancel={() => setActiveVariant(null)}
      onDragEnd={() => setActiveVariant(null)}
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
