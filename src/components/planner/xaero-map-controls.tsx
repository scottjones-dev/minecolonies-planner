"use client";

import { MapPinned, Trash2, Upload } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getXaeroMapWorldRect,
  isPngFile,
  MAX_XAERO_MAP_BYTES,
  validateXaeroMapCalibration,
  type XaeroMapCalibration,
} from "@/lib/xaero-map";
import { useXaeroMapStore } from "@/stores/xaero-map-store";

function calibrationForFile(
  fileName: string,
  width: number,
  height: number,
  current?: XaeroMapCalibration,
): XaeroMapCalibration {
  return {
    fileName,
    imageWidth: width,
    imageHeight: height,
    originX: current?.originX ?? 0,
    originZ: current?.originZ ?? 0,
    pixelsPerBlock: current?.pixelsPerBlock ?? 1,
    opacity: current?.opacity ?? 0.72,
  };
}

export function XaeroMapControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const map = useXaeroMapStore((state) => state.map);
  const hydrate = useXaeroMapStore((state) => state.hydrate);
  const saveMap = useXaeroMapStore((state) => state.saveMap);
  const updateCalibration = useXaeroMapStore(
    (state) => state.updateCalibration,
  );
  const removeMap = useXaeroMapStore((state) => state.removeMap);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [calibration, setCalibration] = useState<XaeroMapCalibration | null>(
    null,
  );

  useEffect(() => {
    void hydrate().catch(() => {
      toast.error("The saved Xaero map could not be opened.");
    });
  }, [hydrate]);

  const worldRect = useMemo(
    () => (calibration ? getXaeroMapWorldRect(calibration) : null),
    [calibration],
  );

  const openEditor = () => {
    setPendingBlob(null);
    setCalibration(map?.calibration ?? null);
    setOpen(true);
  };

  const readPng = async (file: File) => {
    if (!isPngFile(file)) {
      toast.error("Choose the PNG exported by Xaero's World Map.");
      return;
    }
    if (file.size > MAX_XAERO_MAP_BYTES) {
      toast.error("That PNG is over 100 MB. Export a smaller area or scale.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const nextCalibration = calibrationForFile(
        file.name,
        bitmap.width,
        bitmap.height,
        map?.calibration,
      );
      bitmap.close();
      setPendingBlob(file);
      setCalibration(nextCalibration);
      setOpen(true);
    } catch {
      toast.error("That file is not a PNG this browser can render.");
    }
  };

  const updateNumber = (
    field: "originX" | "originZ" | "pixelsPerBlock" | "opacity",
    value: number,
  ) => {
    setCalibration((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!calibration) {
      fileInputRef.current?.click();
      return;
    }
    const error = validateXaeroMapCalibration(calibration);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      if (pendingBlob) await saveMap(pendingBlob, calibration);
      else await updateCalibration(calibration);
      setOpen(false);
      toast.success("Xaero map aligned beneath the planner grid.");
    } catch {
      toast.error("The browser could not save that map image.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await removeMap();
      setCalibration(null);
      setPendingBlob(null);
      setOpen(false);
      toast.success("Xaero map background removed.");
    } catch {
      toast.error("The saved Xaero map could not be removed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,image/png"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void readPng(file);
          event.target.value = "";
        }}
      />
      <Button
        variant={map ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={map ? "Edit Xaero map background" : "Import Xaero map PNG"}
        title={map ? map.calibration.fileName : "Import Xaero map PNG"}
        onClick={openEditor}
      >
        <MapPinned aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form className="space-y-5" onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Xaero world-map background</DialogTitle>
              <DialogDescription>
                In Xaero&apos;s fullscreen map, use its PNG export button.
                Import that north-up PNG here, then align its top-left pixel to
                a known Minecraft X/Z block.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border bg-muted/35 p-4 text-xs text-muted-foreground">
              {calibration ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {calibration.fileName}
                  </p>
                  <p>
                    {calibration.imageWidth.toLocaleString()} ×{" "}
                    {calibration.imageHeight.toLocaleString()} pixels
                  </p>
                  {worldRect ? (
                    <p>
                      Covers X {worldRect.x.toLocaleString()} to{" "}
                      {Math.ceil(
                        worldRect.x + worldRect.width - 1,
                      ).toLocaleString()}
                      , Z {worldRect.z.toLocaleString()} to{" "}
                      {Math.ceil(
                        worldRect.z + worldRect.depth - 1,
                      ).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p>Choose the PNG exported from Xaero&apos;s World Map.</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload aria-hidden="true" />
                {calibration ? "Choose another PNG" : "Choose Xaero PNG"}
              </Button>
            </div>

            {calibration ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="xaero-origin-x">Top-left block X</Label>
                    <Input
                      id="xaero-origin-x"
                      type="number"
                      step={1}
                      value={calibration.originX}
                      onChange={(event) =>
                        updateNumber("originX", Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="xaero-origin-z">Top-left block Z</Label>
                    <Input
                      id="xaero-origin-z"
                      type="number"
                      step={1}
                      value={calibration.originZ}
                      onChange={(event) =>
                        updateNumber("originZ", Number(event.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xaero-scale">Export pixels per block</Label>
                  <Input
                    id="xaero-scale"
                    type="number"
                    min={0.01}
                    max={16}
                    step={0.25}
                    value={calibration.pixelsPerBlock}
                    onChange={(event) =>
                      updateNumber("pixelsPerBlock", Number(event.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Use 1 for a full-resolution 1:1 export; use 0.5 for a
                    half-size export. One planner square always remains one
                    Minecraft block.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="xaero-opacity">Background opacity</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {Math.round(calibration.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    id="xaero-opacity"
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={Math.round(calibration.opacity * 100)}
                    className="w-full accent-primary"
                    onChange={(event) =>
                      updateNumber("opacity", Number(event.target.value) / 100)
                    }
                  />
                </div>
              </>
            ) : null}

            <DialogFooter>
              {map ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void remove()}
                  disabled={saving}
                >
                  <Trash2 aria-hidden="true" />
                  Remove
                </Button>
              ) : null}
              <Button type="submit" disabled={saving || !calibration}>
                {saving
                  ? "Saving…"
                  : map && !pendingBlob
                    ? "Update map"
                    : "Use map"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
