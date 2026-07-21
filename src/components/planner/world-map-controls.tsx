"use client";

import { ArchiveRestore, MapPinned, Trash2, Upload } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { importJourneyMapArchive } from "@/lib/journeymap-import";
import {
  resolveWebTileUrl,
  validateWebTileMapSource,
} from "@/lib/web-map-tiles";
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
  type WebTileMapSource,
  type WorldMapSourcePreset,
  type WorldProfile,
  worldMapSourceLabels,
  worldMapSourcePresets,
} from "@/types/world-map";

const defaultWebTileSource: WebTileMapSource = {
  kind: "web-tiles",
  name: "Remote world map",
  urlTemplate: "",
  tilePixelSize: 512,
  blocksPerTile: 512,
  originX: 0,
  originZ: 0,
  zoom: 0,
  zDirection: "down",
  opacity: 0.78,
};

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
  const journeyMapInputRef = useRef<HTMLInputElement>(null);
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
  const [source, setSource] = useState<RasterMapSource | null>(
    world.mapSource?.kind === "raster" ? world.mapSource : null,
  );
  const [webSource, setWebSource] = useState<WebTileMapSource>(
    world.mapSource?.kind === "web-tiles"
      ? world.mapSource
      : defaultWebTileSource,
  );
  const [sourceMode, setSourceMode] = useState<"none" | "raster" | "web">(
    world.mapSource?.kind === "raster"
      ? "raster"
      : world.mapSource?.kind === "web-tiles"
        ? "web"
        : "none",
  );

  useEffect(() => {
    const rasterSource =
      world.mapSource?.kind === "raster" ? world.mapSource : null;
    void hydrate(rasterSource).catch(() => {
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
    setSource(world.mapSource?.kind === "raster" ? world.mapSource : null);
    setWebSource(
      world.mapSource?.kind === "web-tiles"
        ? world.mapSource
        : defaultWebTileSource,
    );
    setSourceMode(
      world.mapSource?.kind === "raster"
        ? "raster"
        : world.mapSource?.kind === "web-tiles"
          ? "web"
          : "none",
    );
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
      setSourceMode("raster");
      setOpen(true);
    } catch {
      toast.error("That image cannot be decoded by this browser.");
    }
  };

  const readJourneyMapArchive = async (file: File) => {
    setSaving(true);
    try {
      const result = await importJourneyMapArchive(file, profile.dimension);
      setPendingBlob(result.blob);
      setSource({
        kind: "raster",
        assetId: crypto.randomUUID(),
        preset: "journeymap",
        fileName: result.fileName,
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
        originX: result.originX,
        originZ: result.originZ,
        pixelsPerBlock: result.pixelsPerBlock,
        opacity: source?.opacity ?? 0.78,
      });
      setSourceMode("raster");
      toast.success(
        `Composed ${result.tileCount.toLocaleString()} JourneyMap tiles from ${result.sourceDirectory}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "That JourneyMap export could not be imported.",
      );
    } finally {
      setSaving(false);
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
    if (sourceMode === "raster" && source) {
      const error = validateRasterMapSource(source);
      if (error) {
        toast.error(error);
        return;
      }
    }
    if (sourceMode === "web") {
      const error = validateWebTileMapSource(webSource);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setSaving(true);
    try {
      if (sourceMode === "raster" && source && pendingBlob) {
        await saveMap(pendingBlob, source);
      }
      const mapSource =
        sourceMode === "raster"
          ? source
          : sourceMode === "web"
            ? webSource
            : null;
      const nextProfile = { ...profile, mapSource };
      setWorldProfile(nextProfile);
      if (sourceMode === "raster" && source && !pendingBlob) {
        await hydrate(source);
      } else if (sourceMode !== "raster") {
        clearMap();
      }
      setOpen(false);
      toast.success(
        mapSource
          ? "World profile and explored map source saved."
          : "World profile saved.",
      );
    } catch {
      toast.error("The browser could not save this world-map source.");
    } finally {
      setSaving(false);
    }
  };

  const removeMapSource = async () => {
    if (sourceMode === "none") return;
    setSaving(true);
    try {
      if (sourceMode === "raster" && source) {
        await deleteMapAsset(source.assetId);
      }
      clearMap();
      setSource(null);
      setSourceMode("none");
      setPendingBlob(null);
      const nextProfile = { ...profile, mapSource: null };
      setProfile(nextProfile);
      setWorldProfile(nextProfile);
      toast.success(
        "Explored map source removed; seed fallback remains available.",
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
      <input
        ref={journeyMapInputRef}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void readJourneyMapArchive(file);
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
              : world.mapSource?.kind === "web-tiles"
                ? world.mapSource.name
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="world">World profile</TabsTrigger>
                <TabsTrigger value="image">Map image</TabsTrigger>
                <TabsTrigger value="web">Web tiles</TabsTrigger>
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload aria-hidden="true" />
                      {source ? "Choose another image" : "Choose map image"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => journeyMapInputRef.current?.click()}
                    >
                      <ArchiveRestore aria-hidden="true" />
                      {saving ? "Reading export…" : "Import JourneyMap ZIP"}
                    </Button>
                  </div>
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

              <TabsContent value="web" className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                  <div>
                    <Label htmlFor="use-web-tiles">Use remote web tiles</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      The server must permit browser CORS requests.
                    </p>
                  </div>
                  <Switch
                    id="use-web-tiles"
                    checked={sourceMode === "web"}
                    onCheckedChange={(checked) =>
                      setSourceMode(checked ? "web" : "none")
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="web-map-name">Map name</Label>
                  <Input
                    id="web-map-name"
                    value={webSource.name}
                    maxLength={80}
                    onChange={(event) =>
                      setWebSource({ ...webSource, name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="web-map-url">Tile URL template</Label>
                  <Input
                    id="web-map-url"
                    value={webSource.urlTemplate}
                    placeholder="https://map.example/tiles/{zoom}/{x}/{z}.png"
                    onChange={(event) =>
                      setWebSource({
                        ...webSource,
                        urlTemplate: event.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Required: {"{x}"} and {"{z}"} (or {"{y}"}). Also supports
                    {" {zoom}, {groupX}, {groupZ}, and {zoomPrefix}"}. Do not
                    put private keys or tokens in a layout.
                  </p>
                  {webSource.urlTemplate ? (
                    <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      Tile 0,0: {resolveWebTileUrl(webSource, 0, 0)}
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="web-tile-pixels">Tile pixels</Label>
                    <Input
                      id="web-tile-pixels"
                      type="number"
                      min={16}
                      max={2048}
                      step={1}
                      value={webSource.tilePixelSize}
                      onChange={(event) =>
                        setWebSource({
                          ...webSource,
                          tilePixelSize: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="web-tile-blocks">Blocks per tile</Label>
                    <Input
                      id="web-tile-blocks"
                      type="number"
                      min={1}
                      max={65536}
                      value={webSource.blocksPerTile}
                      onChange={(event) =>
                        setWebSource({
                          ...webSource,
                          blocksPerTile: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="web-origin-x">Tile 0 X origin</Label>
                    <Input
                      id="web-origin-x"
                      type="number"
                      step={1}
                      value={webSource.originX}
                      onChange={(event) =>
                        setWebSource({
                          ...webSource,
                          originX: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="web-origin-z">Tile 0 Z origin</Label>
                    <Input
                      id="web-origin-z"
                      type="number"
                      step={1}
                      value={webSource.originZ}
                      onChange={(event) =>
                        setWebSource({
                          ...webSource,
                          originZ: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="web-zoom">Provider zoom</Label>
                    <Input
                      id="web-zoom"
                      type="number"
                      min={0}
                      max={30}
                      step={1}
                      value={webSource.zoom}
                      onChange={(event) =>
                        setWebSource({
                          ...webSource,
                          zoom: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="web-z-direction">Tile row direction</Label>
                    <NativeSelect
                      id="web-z-direction"
                      className="w-full"
                      value={webSource.zDirection}
                      onChange={(event) =>
                        setWebSource({
                          ...webSource,
                          zDirection: event.target
                            .value as WebTileMapSource["zDirection"],
                        })
                      }
                    >
                      <NativeSelectOption value="down">
                        Rows increase with +Z
                      </NativeSelectOption>
                      <NativeSelectOption value="up">
                        Rows increase with -Z
                      </NativeSelectOption>
                    </NativeSelect>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="web-opacity">Tile opacity</Label>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {Math.round(webSource.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    id="web-opacity"
                    type="range"
                    min={5}
                    max={100}
                    value={Math.round(webSource.opacity * 100)}
                    className="w-full accent-primary"
                    onChange={(event) =>
                      setWebSource({
                        ...webSource,
                        opacity: Number(event.target.value) / 100,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This adapter expects square, north-up tiles aligned directly
                  to Minecraft X/Z. Isometric and 3D map projections need a flat
                  export image instead.
                </p>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              {sourceMode !== "none" ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void removeMapSource()}
                  disabled={saving}
                >
                  <Trash2 aria-hidden="true" /> Remove map source
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
