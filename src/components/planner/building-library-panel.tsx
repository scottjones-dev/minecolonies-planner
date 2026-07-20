"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stylePacks as builtInStylePacks } from "@/data";
import { getBuildingLibraryGroups } from "@/lib/building-library";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/stores/planner-store";
import { useStylePackStore } from "@/stores/style-pack-store";
import {
  type BuildingCategory,
  type BuildingVariant,
  getBoundsDepth,
  getBoundsWidth,
} from "@/types/minecolonies";

const categoryLabels: Record<BuildingCategory, string> = {
  agriculture: "Agriculture",
  craftsmanship: "Craftsmanship",
  decorations: "Decorations",
  education: "Education",
  fundamentals: "Fundamentals",
  infrastructure: "Infrastructure",
  military: "Military",
  mystic: "Mystic",
  walls: "Walls",
};

function formatBuildingType(buildingType: string) {
  return buildingType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getMaximumLevel(variant: BuildingVariant) {
  return variant.levels.reduce((maximum, level) => {
    const maximumArea =
      getBoundsWidth(maximum.bounds) * getBoundsDepth(maximum.bounds);
    const levelArea =
      getBoundsWidth(level.bounds) * getBoundsDepth(level.bounds);

    return levelArea > maximumArea ? level : maximum;
  });
}

function formatCategoryPath(
  categoryPath: string,
  category: BuildingCategory,
): string | null {
  const subCategories = categoryPath.split("/").slice(1);
  if (subCategories.length === 0 || categoryPath === category) return null;

  return subCategories
    .map((part) =>
      part
        .replaceAll(/[_-]+/g, " ")
        .replaceAll(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" › ");
}

export function BuildingCardContent({
  variant,
  overlay = false,
}: {
  variant: BuildingVariant;
  overlay?: boolean;
}) {
  const maximumLevel = getMaximumLevel(variant);
  const width = getBoundsWidth(maximumLevel.bounds);
  const depth = getBoundsDepth(maximumLevel.bounds);

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left shadow-sm",
        overlay && "w-64 rotate-2 border-primary/40 shadow-xl",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <GripVertical className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {formatBuildingType(variant.buildingType)}
        </p>
        <p className="truncate text-xs text-muted-foreground">{variant.name}</p>
      </div>
      <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
        {width}×{depth}
      </Badge>
    </div>
  );
}

function DraggableBuildingCard({
  variant,
  stylePackId,
}: {
  variant: BuildingVariant;
  stylePackId: string;
}) {
  const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
    id: `library-${stylePackId}-${variant.id}`,
    data: {
      type: "building-library",
      stylePackId,
      variant,
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={cn(
        "block w-full cursor-grab touch-none rounded-xl outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      {...listeners}
      {...attributes}
    >
      <BuildingCardContent variant={variant} />
    </button>
  );
}

export function BuildingLibraryPanel() {
  const [search, setSearch] = useState("");
  const activeStylePackId = usePlannerStore((state) => state.activeStylePackId);
  const setActiveStylePack = usePlannerStore(
    (state) => state.setActiveStylePack,
  );
  const importedStylePacks = useStylePackStore(
    (state) => state.importedStylePacks,
  );
  const stylePacks = [...builtInStylePacks, ...importedStylePacks];
  const activeStylePack =
    stylePacks.find((stylePack) => stylePack.id === activeStylePackId) ??
    stylePacks[0];

  const groups = useMemo(() => {
    return getBuildingLibraryGroups(activeStylePack, search);
  }, [activeStylePack, search]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="space-y-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold">Building library</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag a building onto the colony map.
          </p>
        </div>

        <Select
          value={activeStylePack.id}
          onValueChange={(value) => {
            if (value) {
              setActiveStylePack(value);
            }
          }}
        >
          <SelectTrigger className="w-full" aria-label="Style pack">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stylePacks.map((stylePack) => (
              <SelectItem key={stylePack.id} value={stylePack.id}>
                {stylePack.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search buildings…"
            className="pl-9"
            aria-label="Search buildings"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {groups.length > 0 ? (
          <Accordion
            multiple
            defaultValue={groups.map(({ category }) => category)}
            className="rounded-xl"
          >
            {groups.map(({ category, sections }) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="px-3 py-3">
                  <span>{categoryLabels[category]}</span>
                  <Badge variant="outline" className="ml-auto">
                    {sections.reduce(
                      (count, section) => count + section.variants.length,
                      0,
                    )}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-0">
                  {sections.map(({ categoryPath, variants }) => {
                    const sectionLabel = formatCategoryPath(
                      categoryPath,
                      category,
                    );

                    return (
                      <section key={categoryPath} className="space-y-2">
                        {sectionLabel ? (
                          <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {sectionLabel}
                          </h3>
                        ) : null}
                        {variants.map((variant) => (
                          <DraggableBuildingCard
                            key={variant.id}
                            variant={variant}
                            stylePackId={activeStylePack.id}
                          />
                        ))}
                      </section>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No buildings found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search term.
            </p>
          </div>
        )}
      </div>

      <div className="border-t px-4 py-3 text-xs text-muted-foreground">
        {activeStylePack.variants.length} {activeStylePack.name} blueprints in
        MineColonies build-tool order
      </div>
    </div>
  );
}
