"use client";

import { AlertTriangle, Building2, RotateCw, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { BuildingTopDownPreview } from "@/components/planner/building-top-down-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getStylePackById } from "@/data";
import { maximumColonyRadiusChunks } from "@/data/minecolonies-rules";
import {
  getLevelFootprint,
  getReservedFootprint,
  getRotatedDirection,
} from "@/lib/building-geometry";
import {
  findBuildingCollisions,
  getCollisionPartners,
} from "@/lib/validation/collisions";
import {
  findColonyBoundaryViolations,
  getBuildingClaimRadius,
  isClaimingBuilding,
} from "@/lib/validation/colony-boundary";
import {
  findCommuteResults,
  getPlacedBuildingRole,
  getPlacedBuildingVariant,
} from "@/lib/validation/commute";
import {
  getGuardMapRange,
  getGuardPatrolRadius,
} from "@/lib/validation/guard-coverage";
import { usePlannerStore } from "@/stores/planner-store";
import type { BuildingRotation } from "@/types/minecolonies";

function getNextRotation(rotation: BuildingRotation): BuildingRotation {
  return ((rotation + 90) % 360) as BuildingRotation;
}

function formatBuildingType(buildingType: string) {
  return buildingType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function BuildingInspectorPanel() {
  const buildings = usePlannerStore((state) => state.buildings);
  const selectedBuildingId = usePlannerStore(
    (state) => state.selectedBuildingId,
  );
  const {
    colonyRadiusChunks,
    colonyBoundaryMode,
    preferredCommuteDistance,
    warningCommuteDistance,
  } = usePlannerStore((state) => state.rules);
  const selectedBuilding = buildings.find(
    (building) => building.id === selectedBuildingId,
  );
  const updateBuilding = usePlannerStore((state) => state.updateBuilding);
  const removeBuilding = usePlannerStore((state) => state.removeBuilding);
  const collisions = useMemo(
    () => findBuildingCollisions(buildings),
    [buildings],
  );
  const collisionPartners = selectedBuilding
    ? getCollisionPartners(selectedBuilding.id, collisions)
    : [];
  const boundaryViolationIds = useMemo(
    () => findColonyBoundaryViolations(buildings, colonyRadiusChunks),
    [buildings, colonyRadiusChunks],
  );
  const outsideBoundary = selectedBuilding
    ? boundaryViolationIds.includes(selectedBuilding.id)
    : false;
  const commuteResults = useMemo(
    () =>
      findCommuteResults(buildings, {
        preferredDistance: preferredCommuteDistance,
        warningDistance: warningCommuteDistance,
      }),
    [buildings, preferredCommuteDistance, warningCommuteDistance],
  );
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

      if (
        !isEditing &&
        selectedBuilding &&
        event.key.toLocaleLowerCase() === "r"
      ) {
        event.preventDefault();
        updateBuilding(selectedBuilding.id, {
          rotation: getNextRotation(selectedBuilding.rotation),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeBuilding, selectedBuilding, updateBuilding]);

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

  const stylePack = getStylePackById(selectedBuilding.stylePackId);
  const variant = stylePack?.variants.find(
    (candidate) => candidate.id === selectedBuilding.variantId,
  );
  const level =
    variant?.levels.find(
      (candidate) => candidate.level === selectedBuilding.currentLevel,
    ) ?? variant?.levels[0];
  const availableLevels = [...(variant?.levels ?? [])].sort(
    (first, second) => first.level - second.level,
  );
  const currentFootprint = level
    ? getLevelFootprint(level, selectedBuilding.rotation)
    : null;
  const reservedFootprint = variant
    ? getReservedFootprint(
        variant.levels,
        selectedBuilding.reserveThroughLevel,
        selectedBuilding.rotation,
      )
    : null;
  const entranceDirection = level?.entrance
    ? getRotatedDirection(level.entrance.direction, selectedBuilding.rotation)
    : null;
  const claimRadius = getBuildingClaimRadius(selectedBuilding);
  const guardMapRange = getGuardMapRange(selectedBuilding);
  const guardPatrolRadius = getGuardPatrolRadius(selectedBuilding);
  const residences = buildings.filter(
    (building) => getPlacedBuildingRole(building) === "residence",
  );
  const commuteResult = commuteResults.find(
    (result) => result.workplaceId === selectedBuilding.id,
  );
  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="truncate text-sm font-semibold">
          {variant?.name ?? "Placed building"}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            {stylePack?.name ?? selectedBuilding.stylePackId}
          </Badge>
          <Badge variant="outline">
            {variant
              ? formatBuildingType(variant.buildingType)
              : selectedBuilding.variantId}
          </Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {level ? (
          <section className="space-y-2" aria-labelledby="top-down-preview">
            <div className="flex items-center justify-between gap-3">
              <h3
                id="top-down-preview"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Top-down · Level {level.level}
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                {selectedBuilding.rotation}°
              </Badge>
            </div>
            <BuildingTopDownPreview
              level={level}
              rotation={selectedBuilding.rotation}
              name={variant?.name ?? selectedBuilding.variantId}
              className="h-52 w-full"
            />
            <p className="text-[11px] leading-4 text-muted-foreground">
              Generated from the blueprint&apos;s highest visible blocks. North
              stays at the top; the amber marker shows the hut block and front.
            </p>
          </section>
        ) : null}

        <Separator />

        {variant?.role === "workplace" ? (
          <section className="space-y-3" aria-labelledby="residence-assignment">
            <h3
              id="residence-assignment"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Residence assignment
            </h3>
            <div className="space-y-2">
              <Label htmlFor="assigned-residence">Assigned residence</Label>
              <Select
                value={selectedBuilding.assignedResidenceId ?? "unassigned"}
                onValueChange={(value) =>
                  updateBuilding(selectedBuilding.id, {
                    assignedResidenceId: value === "unassigned" ? null : value,
                  })
                }
              >
                <SelectTrigger id="assigned-residence" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {residences.map((residence) => (
                    <SelectItem key={residence.id} value={residence.id}>
                      {getPlacedBuildingVariant(residence)?.name ??
                        residence.variantId}{" "}
                      · X {residence.x}, Z {residence.z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {commuteResult?.state === "preferred" ? (
              <Alert className="border-emerald-600 text-emerald-700">
                <AlertTitle>Preferred commute</AlertTitle>
                <AlertDescription>
                  {commuteResult.distance?.toFixed(1)} blocks between anchors.
                </AlertDescription>
              </Alert>
            ) : null}
            {commuteResult?.state === "warning" ? (
              <Alert className="border-amber-600 text-amber-700">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>Long commute</AlertTitle>
                <AlertDescription>
                  {commuteResult.distance?.toFixed(1)} blocks exceeds the
                  preferred {preferredCommuteDistance}-block distance.
                </AlertDescription>
              </Alert>
            ) : null}
            {commuteResult?.state === "invalid" ? (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>Commute too far</AlertTitle>
                <AlertDescription>
                  {commuteResult.distance?.toFixed(1)} blocks exceeds the
                  configured {warningCommuteDistance}-block maximum.
                </AlertDescription>
              </Alert>
            ) : null}
            {commuteResult?.state === "unassigned" ? (
              <Alert className="border-amber-600 text-amber-700">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>Workplace is unassigned</AlertTitle>
                <AlertDescription>
                  Select a placed residence to validate the commute.
                </AlertDescription>
              </Alert>
            ) : null}
          </section>
        ) : null}

        {outsideBoundary ? (
          <Alert
            variant={
              colonyBoundaryMode === "invalid" ? "destructive" : "default"
            }
            className={
              colonyBoundaryMode === "warning"
                ? "border-amber-600 text-amber-700"
                : undefined
            }
          >
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>
              {colonyBoundaryMode === "invalid" ? "Invalid" : "Warning"}:
              outside colony boundary
            </AlertTitle>
            <AlertDescription>
              The current-level blueprint is not fully inside chunks claimed
              earlier in placement order. The initial claim is a{" "}
              {colonyRadiusChunks * 2 + 1}×{colonyRadiusChunks * 2 + 1} chunk
              square, and dynamic claims cannot exceed{" "}
              {maximumColonyRadiusChunks} chunks from Town Hall.
            </AlertDescription>
          </Alert>
        ) : null}

        {collisionPartners.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Reserved footprint collision</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {collisionPartners.map((partnerId) => {
                  const partner = buildings.find(
                    (building) => building.id === partnerId,
                  );
                  const partnerStyle = partner
                    ? getStylePackById(partner.stylePackId)
                    : null;
                  const partnerVariant = partnerStyle?.variants.find(
                    (candidate) => candidate.id === partner?.variantId,
                  );

                  return (
                    <li key={partnerId}>
                      Overlaps{" "}
                      {partnerVariant?.name ?? partner?.variantId ?? partnerId}
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3" aria-labelledby="building-details">
          <h3
            id="building-details"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Building
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Style</dt>
              <dd className="text-right font-medium">
                {stylePack?.name ?? selectedBuilding.stylePackId}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Type</dt>
              <dd className="text-right font-medium">
                {variant ? formatBuildingType(variant.buildingType) : "Unknown"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Variant</dt>
              <dd className="max-w-40 text-right font-medium">
                {variant?.name ?? selectedBuilding.variantId}
              </dd>
            </div>
          </dl>
        </section>

        <Separator />

        <section className="space-y-3" aria-labelledby="building-levels">
          <h3
            id="building-levels"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Upgrade levels
          </h3>
          <div className="space-y-2">
            <Label htmlFor="current-level">Current level</Label>
            <Select
              value={String(selectedBuilding.currentLevel)}
              onValueChange={(value) => {
                const currentLevel = Number(value);
                updateBuilding(selectedBuilding.id, {
                  currentLevel,
                  reserveThroughLevel: Math.max(
                    currentLevel,
                    selectedBuilding.reserveThroughLevel,
                  ),
                });
              }}
            >
              <SelectTrigger id="current-level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.map((candidate) => (
                  <SelectItem
                    key={candidate.level}
                    value={String(candidate.level)}
                  >
                    Level {candidate.level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reserve-level">Reserve through level</Label>
            <Select
              value={String(selectedBuilding.reserveThroughLevel)}
              onValueChange={(value) =>
                updateBuilding(selectedBuilding.id, {
                  reserveThroughLevel: Math.max(
                    selectedBuilding.currentLevel,
                    Number(value),
                  ),
                })
              }
            >
              <SelectTrigger id="reserve-level" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableLevels
                  .filter(
                    (candidate) =>
                      candidate.level >= selectedBuilding.currentLevel,
                  )
                  .map((candidate) => (
                    <SelectItem
                      key={candidate.level}
                      value={String(candidate.level)}
                    >
                      Level {candidate.level}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Separator />

        <section className="space-y-3" aria-labelledby="building-position">
          <h3
            id="building-position"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Position
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">World X</dt>
              <dd className="mt-1 font-mono font-medium">
                {selectedBuilding.x}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">World Z</dt>
              <dd className="mt-1 font-mono font-medium">
                {selectedBuilding.z}
              </dd>
            </div>
          </dl>
        </section>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">Current footprint</dt>
            <dd className="mt-1 font-mono font-medium">
              {currentFootprint?.width ?? 1}×{currentFootprint?.depth ?? 1}
            </dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">
              Reserved footprint
            </dt>
            <dd className="mt-1 font-mono font-medium">
              {reservedFootprint?.width ?? 1}×{reservedFootprint?.depth ?? 1}
            </dd>
          </div>
        </dl>

        <Separator />

        <section className="space-y-3" aria-labelledby="game-ranges">
          <h3
            id="game-ranges"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            MineColonies ranges
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Claim expansion</dt>
              <dd className="text-right font-medium">
                {isClaimingBuilding(selectedBuilding)
                  ? `${claimRadius} chunk radius (${claimRadius * 2 + 1}×${claimRadius * 2 + 1})`
                  : "None"}
              </dd>
            </div>
            {guardMapRange > 0 ? (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Game-map guard square</dt>
                <dd className="text-right font-medium">
                  {guardMapRange} blocks each direction
                </dd>
              </div>
            ) : null}
            {guardPatrolRadius > 0 ? (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Patrol-target limit</dt>
                <dd className="text-right font-medium">
                  {guardPatrolRadius} blocks
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
        <p className="text-xs text-muted-foreground">
          Rotation:{" "}
          <span className="font-mono font-medium text-foreground">
            {selectedBuilding.rotation}°
          </span>
        </p>
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
