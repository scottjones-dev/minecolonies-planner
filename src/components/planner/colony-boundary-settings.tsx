"use client";

import { Settings2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  guardPatrolRadiusBlocksByLevel,
  guardTowerClaimRadiusByLevel,
  initialColonyRadiusChunks,
  maximumColonyRadiusChunks,
  maximumInitialColonyRadiusChunks,
} from "@/data/minecolonies-rules";
import { usePlannerStore } from "@/stores/planner-store";

export function ColonyBoundarySettings() {
  const {
    colonyRadiusChunks,
    preferredCommuteDistance,
    warningCommuteDistance,
    showCommuteConnections,
    showGuardCoverage,
  } = usePlannerStore((state) => state.rules);
  const setColonyRadiusChunks = usePlannerStore(
    (state) => state.setColonyRadiusChunks,
  );
  const setPreferredCommuteDistance = usePlannerStore(
    (state) => state.setPreferredCommuteDistance,
  );
  const setWarningCommuteDistance = usePlannerStore(
    (state) => state.setWarningCommuteDistance,
  );
  const setShowCommuteConnections = usePlannerStore(
    (state) => state.setShowCommuteConnections,
  );
  const setShowGuardCoverage = usePlannerStore(
    (state) => state.setShowGuardCoverage,
  );

  return (
    <Popover>
      <PopoverTrigger
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        aria-label="Planner settings"
      >
        <Settings2 aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end">
        <PopoverHeader>
          <PopoverTitle>Planner settings</PopoverTitle>
          <PopoverDescription>
            Configure colony validation and map overlays.
          </PopoverDescription>
        </PopoverHeader>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Colony boundary
        </h3>
        <div className="space-y-2">
          <Label htmlFor="colony-radius">Initial square radius in chunks</Label>
          <div className="flex items-center gap-2">
            <Input
              id="colony-radius"
              type="number"
              min={1}
              max={maximumInitialColonyRadiusChunks}
              value={colonyRadiusChunks}
              onChange={(event) =>
                setColonyRadiusChunks(Number(event.target.value))
              }
            />
            <span className="shrink-0 text-xs text-muted-foreground">
              {colonyRadiusChunks * 16} blocks
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setColonyRadiusChunks(initialColonyRadiusChunks)}
        >
          Reset to source default ({initialColonyRadiusChunks})
        </Button>
        <p className="text-xs text-muted-foreground">
          Like the game, the complete current-level blueprint must fit inside
          land claimed before it is placed. Valid colony buildings then expand
          the claim, up to {maximumColonyRadiusChunks} chunks from Town Hall.
        </p>
        <Separator />
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Commute distance
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="preferred-commute">Preferred blocks</Label>
            <Input
              id="preferred-commute"
              type="number"
              min={1}
              max={warningCommuteDistance}
              value={preferredCommuteDistance}
              onChange={(event) =>
                setPreferredCommuteDistance(Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warning-commute">Maximum blocks</Label>
            <Input
              id="warning-commute"
              type="number"
              min={preferredCommuteDistance}
              max={512}
              value={warningCommuteDistance}
              onChange={(event) =>
                setWarningCommuteDistance(Number(event.target.value))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="commute-lines" className="leading-5">
            Show assignment lines
          </Label>
          <Switch
            id="commute-lines"
            checked={showCommuteConnections}
            onCheckedChange={setShowCommuteConnections}
          />
        </div>
        <Separator />
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Guard map protection
        </h3>
        <p className="text-xs text-muted-foreground">
          The game map draws Guard Tower protection as square half-widths of{" "}
          {guardTowerClaimRadiusByLevel.map((radius) => radius * 16).join(", ")}{" "}
          blocks for levels 1–5. The larger patrol limits ({" "}
          {guardPatrolRadiusBlocksByLevel.join(", ")} blocks) govern patrol
          targets and are not the map coverage overlay.
        </p>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="guard-overlays" className="leading-5">
            Show guard overlays
          </Label>
          <Switch
            id="guard-overlays"
            checked={showGuardCoverage}
            onCheckedChange={setShowGuardCoverage}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
