"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import { BLOCK_SIZE } from "@/lib/planner-coordinates";
import { getVisibleWebTiles, type WorldBounds } from "@/lib/web-map-tiles";
import type { WebTileMapSource } from "@/types/world-map";

type TileState = {
  image: HTMLImageElement | null;
  failed: boolean;
};

export function WebTileLayer({
  source,
  bounds,
  onErrorCountChange,
}: {
  source: WebTileMapSource;
  bounds: WorldBounds;
  onErrorCountChange: (count: number) => void;
}) {
  const tiles = useMemo(
    () => getVisibleWebTiles(source, bounds),
    [bounds, source],
  );
  const [states, setStates] = useState<Record<string, TileState>>({});
  const statesRef = useRef(states);

  const updateTile = useCallback((url: string, state: TileState) => {
    setStates((current) => {
      const next = { ...current, [url]: state };
      statesRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const retained: Record<string, TileState> = {};
    for (const tile of tiles) {
      const state = statesRef.current[tile.url];
      if (state) retained[tile.url] = state;
    }
    statesRef.current = retained;
    setStates(retained);
    const pending = tiles.filter(
      (tile) => statesRef.current[tile.url] === undefined,
    );
    if (pending.length === 0) return;
    let active = true;
    const images = pending.map((tile) => {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (!active) return;
        updateTile(tile.url, { image, failed: false });
      };
      image.onerror = () => {
        if (!active) return;
        updateTile(tile.url, { image: null, failed: true });
      };
      image.src = tile.url;
      return image;
    });
    return () => {
      active = false;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [tiles, updateTile]);

  const errorCount = tiles.reduce(
    (count, tile) => count + (states[tile.url]?.failed ? 1 : 0),
    0,
  );
  useEffect(() => {
    onErrorCountChange(errorCount);
  }, [errorCount, onErrorCountChange]);

  return tiles.map((tile) => {
    const image = states[tile.url]?.image;
    return image ? (
      <KonvaImage
        key={tile.key}
        image={image}
        x={tile.x * BLOCK_SIZE}
        y={tile.z * BLOCK_SIZE}
        width={tile.width * BLOCK_SIZE}
        height={tile.depth * BLOCK_SIZE}
        opacity={source.opacity}
        imageSmoothingEnabled={false}
        listening={false}
      />
    ) : null;
  });
}
