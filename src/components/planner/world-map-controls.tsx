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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getRasterMapWorldRect,
  isSupportedRasterFile,
  MAX_WORLD_MAP_BYTES,
  validateRasterMapSource,
  WORLD_MAP_ACCEPT,
} from "@/lib/world-map";
import { deleteMapAsset, migrateLegacyXaeroMap } from "@/lib/world-map-storage";
import { usePlannerStore } from "@/stores/planner-store";
import { useWorldMapStore } from "@/stores/world-map-store";
import {
  type RasterMapSource,
  supportedMinecraftVersions,
  type WorldMapSourcePreset,
  type WorldProfile,
  worldMapSourceLabels,
  worldMapSourcePresets,
} from "@/types/world-map";

function sourceForFile(
  file: File,
  width: number,
  height: number,
  current: RasterMapSource | null,
): RasterMapSource {
  return {
    kind: "raster",
    assetId: crypto.randomUUID(),
    preset: current?.preset ?? "xaero",
    fileName: file.name,
    imageWidth: width,
    imageHeight: height,
    originX: current?.originX ?? 0,
    originZ: current?.originZ ?? 0,
    pixelsPerBlock: current?.pixelsPerBlock ?? 1,
    opacity: current?.opacity ?? 0.72,
  };
}

export function WorldMapControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const migrationAttempted = useRef(false);
  const world = usePlannerStore((state) => state.world);
  const setWorldProfile = usePlannerStore((state) => state.setWorldProfile);
  const map = useWorldMapStore((state) => state.map);
  const missingAssetId = useWorldMapStore((state) => state.missingAssetId);
  const hydrate = useWorldMapStore((state) => state.hydrate);
  const saveMap = useWorldMapStore((state) => state.saveMap);
  const clearMap = useWorldMapStore((state) => state.clear);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [profile, setProfile] = useState<WorldProfile>(world);
  const [source, setSource] = useState<RasterMapSource | null>(world.mapSource);

  useEffect(() => {
    void hydrate(world.mapSource).catch(() => {
      toast.error("The saved world-map image could not be opened.");
    });
  }, [hydrate, world.mapSource]);

  useEffect(() => {
    if (migrationAttempted.current || world.mapSource) return;
    migrationAttempted.current = true;
    void migrateLegacyXaeroMap()
      .then(async (legacy) => {
        if (!legacy || usePlannerStore.getState().world.mapSource) return;
        await saveMap(legacy.blob, legacy.source);
        setWorldProfile({
          ...usePlannerStore.getState().world,
          mapSource: legacy.source,
        });
        toast.success("Your existing Xaero background was migrated.");
      })
      .catch(() => undefined);
  }, [saveMap, setWorldProfile, world.mapSource]);

  const worldRect = useMemo(
    () => (source ? getRasterMapWorldRect(source) : null),
    [source],
  );

  const openEditor = () => {
    setPendingBlob(null);
    setProfile(world);
    setSource(world.mapSource);
    setOpen(true);
  };

  const readImage = async (file: File) => {
    if (!isSupportedRasterFile(file)) {
      toast.error("Choose a PNG, JPEG, or WebP map image.");
      return;
    }
    if (file.size > MAX_WORLD_MAP_BYTES) {
      toast.error("That image is over 100 MB. Export a smaller area or scale.");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const nextSource = sourceForFile(
        file,
        bitmap.width,
        bitmap.height,
        source,
      );
      bitmap.close();
      setPendingBlob(file);
      setSource(nextSource);
      setOpen(true);
    } catch {
      toast.error("That image cannot be decoded by this browser.");
    }
  };

  const updateSourceNumber = (
    field: "originX" | "originZ" | "pixelsPerBlock" | "opacity",
    value: number,
  ) =>
    setSource((current) => (current ? { ...current, [field]: value } : null));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profile.seed.length > 128) {
      toast.error("The world seed must be 128 characters or fewer.");
      return;
    }
    if (source) {
      const error = validateRasterMapSource(source);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setSaving(true);
    try {
      if (source && pendingBlob) await saveMap(pendingBlob, source);
      const nextProfile = { ...profile, mapSource: source };
      setWorldProfile(nextProfile);
      if (source && !pendingBlob) await hydrate(source);
      setOpen(false);
      toast.success(
        source
          ? "World profile and explored map image saved."
          : "World profile saved.",
      );
    } catch {
      toast.error("The browser could not save this world-map source.");
    } finally {
      setSaving(false);
    }
  };

  const removeBackground = async () => {
    if (!source) return;
    setSaving(true);
    try {
      await deleteMapAsset(source.assetId);
      clearMap();
      setSource(null);
      setPendingBlob(null);
      const nextProfile = { ...profile, mapSource: null };
      setProfile(nextProfile);
      setWorldProfile(nextProfile);
      toast.success(
        "Explored map image removed; seed fallback remains available.",
      );
    } catch {
      toast.error("The saved map image could not be removed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={WORLD_MAP_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void readImage(file);
          event.target.value = "";
        }}
      />
      <Button
        variant={world.mapSource || world.seed ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Edit world profile and map source"
        title={
          missingAssetId
            ? "Map image is missing on this browser; reattach it"
            : map
              ? map.source.fileName
              : world.seed
                ? `Seed ${world.seed}`
                : "Add world seed or map image"
        }
        onClick={openEditor}
      >
        <MapPinned aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <form className="space-y-5" onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>World map source</DialogTitle>
              <DialogDescription>
                Save the exact world profile with this layout. Explored map-mod
                imagery is drawn above the vanilla seed-biome fallback.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="world">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="world">World profile</TabsTrigger>
                <TabsTrigger value="image">Map image</TabsTrigger>
              </TabsList>
              <TabsContent value="world" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="world-seed">World seed</Label>
                  <Input
                    id="world-seed"
                    value={profile.seed}
                    maxLength={128}
                    placeholder="Numeric or text seed"
                    onChange={(event) =>
                      setProfile({ ...profile, seed: event.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minecraft-version">Java version</Label>
                    <NativeSelect
                      id="minecraft-version"
                      className="w-full"
                      value={profile.minecraftVersion}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          minecraftVersion: event.target
                            .value as WorldProfile["minecraftVersion"],
                        })
                      }
                    >
                      {supportedMinecraftVersions.map((version) => (
                        <NativeSelectOption key={version} value={version}>
                          {version}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="world-dimension">Dimension</Label>
                    <NativeSelect
                      id="world-dimension"
                      className="w-full"
                      value={profile.dimension}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          dimension: event.target
                            .value as WorldProfile["dimension"],
                        })
                      }
                    >
                      <NativeSelectOption value="overworld">
                        Overworld
                      </NativeSelectOption>
                      <NativeSelectOption value="nether">
                        Nether
                      </NativeSelectOption>
                      <NativeSelectOption value="end">
                        The End
                      </NativeSelectOption>
                    </NativeSelect>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="world-generator">World generator</Label>
                  <NativeSelect
                    id="world-generator"
                    className="w-full"
                    value={profile.generator}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        generator: event.target
                          .value as WorldProfile["generator"],
                      })
                    }
                  >
                    <NativeSelectOption value="default">
                      Default
                    </NativeSelectOption>
                    <NativeSelectOption value="large-biomes">
                      Large biomes
                    </NativeSelectOption>
                    <NativeSelectOption value="amplified">
                      Amplified
                    </NativeSelectOption>
                    <NativeSelectOption value="modded">
                      Modded or custom
                    </NativeSelectOption>
                  </NativeSelect>
                  <p className="text-xs text-muted-foreground">
                    The seed layer shows vanilla biome placement only. It cannot
                    reproduce explored chunks, builds, modded generators, or
                    datapacks; attach the real map image for those.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="map-source-preset">Image source</Label>
                  <NativeSelect
                    id="map-source-preset"
                    className="w-full"
                    value={source?.preset ?? "xaero"}
                    onChange={(event) =>
                      setSource((current) =>
                        current
                          ? {
                              ...current,
                              preset: event.target
                                .value as WorldMapSourcePreset,
                            }
                          : current,
                      )
                    }
                  >
                    {worldMapSourcePresets.map((preset) => (
                      <NativeSelectOption key={preset} value={preset}>
                        {worldMapSourceLabels[preset]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="rounded-2xl border bg-muted/35 p-4 text-xs text-muted-foreground">
                  {source ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {source.fileName}
                      </p>
                      <p>
                        {source.imageWidth.toLocaleString()} ×{" "}
                        {source.imageHeight.toLocaleString()} pixels
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
                    <p>
                      Choose a north-up PNG, JPEG, or WebP exported by any map
                      mod.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload aria-hidden="true" />
                    {source ? "Choose another image" : "Choose map image"}
                  </Button>
                </div>
                {source ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="map-origin-x">Top-left block X</Label>
                        <Input
                          id="map-origin-x"
                          type="number"
                          step={1}
                          value={source.originX}
                          onChange={(event) =>
                            updateSourceNumber(
                              "originX",
                              Number(event.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="map-origin-z">Top-left block Z</Label>
                        <Input
                          id="map-origin-z"
                          type="number"
                          step={1}
                          value={source.originZ}
                          onChange={(event) =>
                            updateSourceNumber(
                              "originZ",
                              Number(event.target.value),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="map-scale">Export pixels per block</Label>
                      <Input
                        id="map-scale"
                        type="number"
                        min={0.01}
                        max={16}
                        step={0.25}
                        value={source.pixelsPerBlock}
                        onChange={(event) =>
                          updateSourceNumber(
                            "pixelsPerBlock",
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="map-opacity">Image opacity</Label>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {Math.round(source.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        id="map-opacity"
                        type="range"
                        min={5}
                        max={100}
                        value={Math.round(source.opacity * 100)}
                        className="w-full accent-primary"
                        onChange={(event) =>
                          updateSourceNumber(
                            "opacity",
                            Number(event.target.value) / 100,
                          )
                        }
                      />
                    </div>
                  </>
                ) : null}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              {source ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void removeBackground()}
                  disabled={saving}
                >
                  <Trash2 aria-hidden="true" /> Remove image
                </Button>
              ) : null}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save world source"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
