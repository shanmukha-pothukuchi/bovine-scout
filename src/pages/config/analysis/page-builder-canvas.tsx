import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { GridLayer } from "./grid-layer";
import { GridRegion } from "./grid-region";

type GridPoint = {
  top: number;
  left: number;
};

type GridSelection = {
  top: number;
  left: number;
  height: number;
  width: number;
};

export function PageBuilderCanvas() {
  const columnCount = 12;
  const rowCount = 5;
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<GridPoint | null>(null);
  const draftRegionRef = useRef<GridSelection | null>(null);
  const [regions, setRegions] = useState<GridSelection[]>([]);
  const [draftRegion, setDraftRegion] = useState<GridSelection | null>(null);

  useEffect(() => {
    draftRegionRef.current = draftRegion;
  }, [draftRegion]);

  const getCellFromTarget = (target: EventTarget | null): GridPoint | null => {
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const cell = target.closest<HTMLElement>("[data-grid-cell='true']");

    if (!cell) {
      return null;
    }

    const top = Number(cell.dataset.top);
    const left = Number(cell.dataset.left);

    if (!Number.isFinite(top) || !Number.isFinite(left)) {
      return null;
    }

    return { top, left };
  };

  const getCellFromPointer = (event: MouseEvent): GridPoint | null => {
    const directCell = getCellFromTarget(event.target);

    if (directCell) {
      return directCell;
    }

    const elementUnderPointer = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );

    return getCellFromTarget(elementUnderPointer);
  };

  const getSelectionFromPoints = (
    start: GridPoint,
    end: GridPoint,
  ): GridSelection => {
    const top = Math.min(start.top, end.top);
    const left = Math.min(start.left, end.left);
    const bottom = Math.max(start.top, end.top);
    const right = Math.max(start.left, end.left);

    return {
      top,
      left,
      height: bottom - top + 1,
      width: right - left + 1,
    };
  };

  const doesRegionCollide = (
    region: GridSelection,
    existingRegions: GridSelection[],
  ) => {
    const regionBottom = region.top + region.height - 1;
    const regionRight = region.left + region.width - 1;

    return existingRegions.some((existingRegion) => {
      const existingBottom = existingRegion.top + existingRegion.height - 1;
      const existingRight = existingRegion.left + existingRegion.width - 1;

      const isSeparated =
        regionRight < existingRegion.left ||
        existingRight < region.left ||
        regionBottom < existingRegion.top ||
        existingBottom < region.top;

      return !isSeparated;
    });
  };

  const hasDraftCollision =
    draftRegion !== null ? doesRegionCollide(draftRegion, regions) : false;

  useEffect(() => {
    const parent = gridLayerRef.current;

    if (!parent) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true;
      event.preventDefault();

      const start = getCellFromTarget(event.target);

      if (!start) {
        return;
      }

      isDraggingRef.current = true;
      dragStartRef.current = start;
      setDraftRegion(getSelectionFromPoints(start, start));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDownRef.current) {
        return;
      }

      const current = getCellFromPointer(event);

      if (!current) {
        return;
      }

      if (!isDraggingRef.current || !dragStartRef.current) {
        event.preventDefault();
        isDraggingRef.current = true;
        dragStartRef.current = current;
        setDraftRegion(getSelectionFromPoints(current, current));
        return;
      }

      event.preventDefault();

      setDraftRegion(getSelectionFromPoints(dragStartRef.current, current));
    };

    const finalizeDrag = () => {
      isMouseDownRef.current = false;

      if (!isDraggingRef.current) {
        return;
      }

      setRegions((previous) =>
        draftRegionRef.current &&
        !doesRegionCollide(draftRegionRef.current, previous)
          ? [...previous, draftRegionRef.current]
          : previous,
      );
      setDraftRegion(null);
      isDraggingRef.current = false;
      dragStartRef.current = null;
    };

    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    parent.addEventListener("mousedown", handleMouseDown);
    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseup", finalizeDrag);
    parent.addEventListener("mouseleave", finalizeDrag);
    parent.addEventListener("dragstart", handleDragStart);

    return () => {
      parent.removeEventListener("mousedown", handleMouseDown);
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseup", finalizeDrag);
      parent.removeEventListener("mouseleave", finalizeDrag);
      parent.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return (
    <div className="relative overflow-y-auto h-full">
      <GridLayer
        columnCount={columnCount}
        rowCount={rowCount}
        showBoxes
        containerRef={gridLayerRef}
        className="cursor-crosshair"
      />
      <GridLayer
        columnCount={columnCount}
        rowCount={rowCount}
        className="absolute inset-0 pointer-events-none"
      >
        {regions.map((region, index) => (
          <GridRegion
            key={`${region.top}-${region.left}-${region.height}-${region.width}-${index}`}
            top={region.top}
            left={region.left}
            height={region.height}
            width={region.width}
            isResizing={draftRegion !== null}
          >
            <div className="w-full h-full bg-accent/50 rounded-md" />
          </GridRegion>
        ))}
      </GridLayer>
      <GridLayer
        columnCount={columnCount}
        rowCount={rowCount}
        className="absolute inset-0 pointer-events-none"
      >
        {draftRegion ? (
          <GridRegion
            top={draftRegion.top}
            left={draftRegion.left}
            height={draftRegion.height}
            width={draftRegion.width}
            isResizing={draftRegion !== null}
          >
            <div
              className={cn(
                "w-full h-full rounded-md grid place-items-center",
                hasDraftCollision ? "bg-red-500/15" : "bg-green-500/15",
              )}
            >
              hello world
            </div>
          </GridRegion>
        ) : null}
      </GridLayer>
    </div>
  );
}
