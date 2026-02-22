import type { GridArea, GridPoint } from "../website-builder";

export const getSelectionFromPoints = (
  start: GridPoint,
  end: GridPoint,
): GridArea => ({
  start: {
    top: Math.min(start.top, end.top),
    left: Math.min(start.left, end.left),
  },
  end: {
    top: Math.max(start.top, end.top),
    left: Math.max(start.left, end.left),
  },
});

export const doesRegionCollide = (
  region: GridArea,
  existingRegions: GridArea[],
) =>
  existingRegions.some((existing) => {
    const isSeparated =
      region.end.left < existing.start.left ||
      existing.end.left < region.start.left ||
      region.end.top < existing.start.top ||
      existing.end.top < region.start.top;
    return !isSeparated;
  });

export const doesRegionCollideExcluding = (
  region: GridArea,
  existingRegions: GridArea[],
  excludeRegion: GridArea,
) =>
  existingRegions
    .filter(
      (r) =>
        r.start.top !== excludeRegion.start.top ||
        r.start.left !== excludeRegion.start.left ||
        r.end.top !== excludeRegion.end.top ||
        r.end.left !== excludeRegion.end.left,
    )
    .some((existing) => {
      const isSeparated =
        region.end.left < existing.start.left ||
        existing.end.left < region.start.left ||
        region.end.top < existing.start.top ||
        existing.end.top < region.start.top;
      return !isSeparated;
    });

export const isPointInAnyRegion = (
  point: GridPoint,
  regions: GridArea[],
): boolean =>
  regions.some(
    (region) =>
      point.left >= region.start.left &&
      point.left <= region.end.left &&
      point.top >= region.start.top &&
      point.top <= region.end.top,
  );
