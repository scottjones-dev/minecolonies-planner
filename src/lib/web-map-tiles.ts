import type { WebTileMapSource } from "@/types/world-map";

export const MAX_VISIBLE_WEB_TILES = 196;

export type WorldBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type VisibleWebTile = {
  key: string;
  url: string;
  x: number;
  z: number;
  width: number;
  depth: number;
};

const TEMPLATE_FIELDS = new Set([
  "x",
  "y",
  "z",
  "zoom",
  "groupX",
  "groupZ",
  "zoomPrefix",
]);
const SECRET_QUERY_NAMES =
  /(?:^|[-_])(?:api[-_]?key|auth(?:orization)?|key|secret|sig(?:nature)?|token)(?:$|[-_])/i;

export function validateWebTileMapSource(
  source: WebTileMapSource,
): string | null {
  if (!source.name.trim() || source.name.length > 80) {
    return "The web map name must be between 1 and 80 characters.";
  }
  if (!source.urlTemplate.trim() || source.urlTemplate.length > 2_048) {
    return "Enter a web tile URL template no longer than 2,048 characters.";
  }
  const fields = [...source.urlTemplate.matchAll(/\{([^}]+)\}/g)].map(
    (match) => match[1],
  );
  if (
    !fields.includes("x") ||
    !(fields.includes("z") || fields.includes("y"))
  ) {
    return "The URL template must contain {x} and either {z} or {y}.";
  }
  if (fields.some((field) => !TEMPLATE_FIELDS.has(field))) {
    return "The URL template contains an unsupported placeholder.";
  }
  if (source.urlTemplate.replace(/\{[^}]+\}/g, "").match(/[{}]/)) {
    return "The URL template contains an incomplete placeholder.";
  }
  try {
    const parsed = new URL(source.urlTemplate.replace(/\{[^}]+\}/g, "0"));
    if (!(["http:", "https:"] as string[]).includes(parsed.protocol)) {
      return "Web tiles must use an HTTP or HTTPS address.";
    }
    if (parsed.username || parsed.password) {
      return "Do not save credentials in a web tile URL.";
    }
    for (const name of parsed.searchParams.keys()) {
      if (SECRET_QUERY_NAMES.test(name)) {
        return "Do not save API keys, tokens, or signatures in a layout.";
      }
    }
  } catch {
    return "Enter a valid HTTP or HTTPS web tile URL template.";
  }
  if (
    !Number.isInteger(source.tilePixelSize) ||
    source.tilePixelSize < 16 ||
    source.tilePixelSize > 2_048
  ) {
    return "Tile pixel size must be a whole number from 16 to 2,048.";
  }
  if (
    !Number.isFinite(source.blocksPerTile) ||
    source.blocksPerTile < 1 ||
    source.blocksPerTile > 65_536
  ) {
    return "Blocks per tile must be from 1 to 65,536.";
  }
  if (!Number.isInteger(source.originX) || !Number.isInteger(source.originZ)) {
    return "Tile origin X and Z must be whole Minecraft block coordinates.";
  }
  if (!Number.isInteger(source.zoom) || source.zoom < 0 || source.zoom > 30) {
    return "Web tile zoom must be a whole number from 0 to 30.";
  }
  if (source.zDirection !== "down" && source.zDirection !== "up") {
    return "Choose how tile rows map to Minecraft Z.";
  }
  if (
    !Number.isFinite(source.opacity) ||
    source.opacity < 0.05 ||
    source.opacity > 1
  ) {
    return "Opacity must be between 5% and 100%.";
  }
  return null;
}

export function resolveWebTileUrl(
  source: WebTileMapSource,
  tileX: number,
  tileZ: number,
): string {
  const replacements: Record<string, string> = {
    x: String(tileX),
    y: String(tileZ),
    z: String(tileZ),
    zoom: String(source.zoom),
    groupX: String(Math.floor(tileX / 32)),
    groupZ: String(Math.floor(tileZ / 32)),
    zoomPrefix: source.zoom === 0 ? "" : `${"z".repeat(source.zoom)}_`,
  };
  return source.urlTemplate.replace(
    /\{([^}]+)\}/g,
    (_, field: string) => replacements[field] ?? "",
  );
}

export function getVisibleWebTiles(
  source: WebTileMapSource,
  bounds: WorldBounds,
): VisibleWebTile[] {
  const size = source.blocksPerTile;
  const firstX = Math.floor((bounds.left - source.originX) / size);
  const lastX = Math.ceil((bounds.right - source.originX) / size) - 1;
  const firstZ =
    source.zDirection === "down"
      ? Math.floor((bounds.top - source.originZ) / size)
      : Math.floor((source.originZ - bounds.bottom) / size);
  const lastZ =
    source.zDirection === "down"
      ? Math.ceil((bounds.bottom - source.originZ) / size) - 1
      : Math.ceil((source.originZ - bounds.top) / size) - 1;
  let visibleFirstX = firstX;
  let visibleLastX = lastX;
  let visibleFirstZ = firstZ;
  let visibleLastZ = lastZ;
  const columns = lastX - firstX + 1;
  const rows = lastZ - firstZ + 1;
  if (columns * rows > MAX_VISIBLE_WEB_TILES) {
    const edge = Math.floor(Math.sqrt(MAX_VISIBLE_WEB_TILES));
    const centerX = Math.floor((firstX + lastX) / 2);
    const centerZ = Math.floor((firstZ + lastZ) / 2);
    visibleFirstX = centerX - Math.floor(edge / 2);
    visibleLastX = visibleFirstX + edge - 1;
    visibleFirstZ = centerZ - Math.floor(edge / 2);
    visibleLastZ = visibleFirstZ + edge - 1;
  }
  const tiles: VisibleWebTile[] = [];

  for (let tileZ = visibleFirstZ; tileZ <= visibleLastZ; tileZ += 1) {
    for (let tileX = visibleFirstX; tileX <= visibleLastX; tileX += 1) {
      tiles.push({
        key: `${source.zoom}:${tileX}:${tileZ}`,
        url: resolveWebTileUrl(source, tileX, tileZ),
        x: source.originX + tileX * size,
        z:
          source.zDirection === "down"
            ? source.originZ + tileZ * size
            : source.originZ - (tileZ + 1) * size,
        width: size,
        depth: size,
      });
    }
  }
  return tiles;
}
