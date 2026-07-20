export const BLOCK_SIZE = 24;

type ScreenPoint = {
  x: number;
  y: number;
};

type MapTransform = {
  zoom: number;
  panX: number;
  panY: number;
};

export function screenPointToWorldBlock(
  point: ScreenPoint,
  mapBounds: Pick<DOMRect, "left" | "top">,
  transform: MapTransform,
) {
  const mapX = point.x - mapBounds.left;
  const mapY = point.y - mapBounds.top;

  return {
    x: Math.round((mapX - transform.panX) / transform.zoom / BLOCK_SIZE),
    z: Math.round((mapY - transform.panY) / transform.zoom / BLOCK_SIZE),
  };
}
