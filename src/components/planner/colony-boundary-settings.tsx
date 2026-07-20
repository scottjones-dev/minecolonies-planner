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
import { usePlannerStore } from "@/stores/planner-store";

export function ColonyBoundarySettings() {
  const { colonyRadiusChunks, colonyBoundaryMode } = usePlannerStore(
    (state) => state.rules,
  );
  const setColonyRadiusChunks = usePlannerStore(
    (state) => state.setColonyRadiusChunks,
  );
  const setColonyBoundaryMode = usePlannerStore(
    (state) => state.setColonyBoundaryMode,
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
          <PopoverTitle>Colony boundary</PopoverTitle>
          <PopoverDescription>
            The first Town Hall sets the centre of the build radius.
          </PopoverDescription>
        </PopoverHeader>
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
      </PopoverContent>
    </Popover>
  );
}
