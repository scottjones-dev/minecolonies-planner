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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { usePlannerStore } from "@/stores/planner-store";

export function ColonyBoundarySettings() {
  const {
    colonyRadiusChunks,
    colonyBoundaryMode,
    preferredCommuteDistance,
    warningCommuteDistance,
    showCommuteConnections,
    guardCoverageRadius,
    guardCoverageMode,
    showGuardCoverage,
  } = usePlannerStore((state) => state.rules);
  const setColonyRadiusChunks = usePlannerStore(
    (state) => state.setColonyRadiusChunks,
  );
  const setColonyBoundaryMode = usePlannerStore(
    (state) => state.setColonyBoundaryMode,
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
  const setGuardCoverageRadius = usePlannerStore(
    (state) => state.setGuardCoverageRadius,
  );
  const setGuardCoverageMode = usePlannerStore(
    (state) => state.setGuardCoverageMode,
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
          <Label htmlFor="colony-radius">Radius in chunks</Label>
          <div className="flex items-center gap-2">
            <Input
              id="colony-radius"
              type="number"
              min={1}
              max={64}
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
        <div className="space-y-2">
          <Label htmlFor="boundary-mode">Outside-boundary result</Label>
          <Select
            value={colonyBoundaryMode}
            onValueChange={(value) => {
              if (value === "warning" || value === "invalid") {
                setColonyBoundaryMode(value);
              }
            }}
          >
            <SelectTrigger id="boundary-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setColonyRadiusChunks(8)}
        >
          Reset to 8 chunks
        </Button>
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
          Guard coverage
        </h3>
        <div className="space-y-2">
          <Label htmlFor="guard-radius">Coverage radius in blocks</Label>
          <Input
            id="guard-radius"
            type="number"
            min={1}
            max={512}
            value={guardCoverageRadius}
            onChange={(event) =>
              setGuardCoverageRadius(Number(event.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guard-mode">Assignment coverage rule</Label>
          <Select
            value={guardCoverageMode}
            onValueChange={(value) => {
              if (value === "either" || value === "both") {
                setGuardCoverageMode(value);
              }
            }}
          >
            <SelectTrigger id="guard-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="either">Residence or workplace</SelectItem>
              <SelectItem value="both">Both locations</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
