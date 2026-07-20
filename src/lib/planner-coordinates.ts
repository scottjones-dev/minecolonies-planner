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

export function worldBlockToCanvasCoordinate(block: number): number {
  return (block + 0.5) * BLOCK_SIZE;
}

export function canvasCoordinateToWorldBlock(coordinate: number): number {
  return Math.floor(coordinate / BLOCK_SIZE);
}

export function screenPointToWorldBlock(
  point: ScreenPoint,
  mapBounds: Pick<DOMRect, "left" | "top">,
  transform: MapTransform,
) {
  const mapX = point.x - mapBounds.left;
  const mapY = point.y - mapBounds.top;

  return {
    x: canvasCoordinateToWorldBlock((mapX - transform.panX) / transform.zoom),
    z: canvasCoordinateToWorldBlock((mapY - transform.panY) / transform.zoom),
  };
}
