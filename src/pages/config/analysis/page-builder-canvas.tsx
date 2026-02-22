import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { GridBackground } from "./grid-background";
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
  const [columnCount] = useState(12);
  const [rowCount, setRowCount] = useState(5);
  const EXTRA_ROW_BUFFER = 3;
  const GAP = 8;
  const PADDING = 8;

  const containerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<"idle" | "pending" | "dragging">("idle");
  const [regions, setRegions] = useState<GridSelection[]>([]);
  const regionsRef = useRef<GridSelection[]>(regions);
  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);
  const [draftRegion, setDraftRegion] = useState<GridSelection | null>(null);
  const [cellSize, setCellSize] = useState(0);

  useEffect(() => {
    const container = gridLayerRef.current;
    if (!container) return;

    const computeCellSize = () => {
      const width = container.clientWidth;
      const size =
        (width - 2 * PADDING - (columnCount - 1) * GAP) / columnCount;
      setCellSize(Math.max(0, size));
    };

    computeCellSize();

    const observer = new ResizeObserver(computeCellSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [columnCount, GAP, PADDING]);

  const getCellFromPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      clampToGrid = false,
    ): GridPoint | null => {
      const container = gridLayerRef.current;
      if (!container || cellSize <= 0) return null;

      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left - PADDING;
      let y = clientY - rect.top - PADDING;

      const stride = cellSize + GAP;

      if (clampToGrid) {
        x = Math.max(0, Math.min(x, columnCount * stride - GAP));
        y = Math.max(0, Math.min(y, rowCount * stride - GAP));
      }

      const col = Math.floor(x / stride) + 1;
      const row = Math.floor(y / stride) + 1;

      if (col < 1 || col > columnCount || row < 1 || row > rowCount) {
        return null;
      }

      if (!clampToGrid) {
        const xInCell = x - (col - 1) * stride;
        const yInCell = y - (row - 1) * stride;
        if (
          xInCell < 0 ||
          xInCell > cellSize ||
          yInCell < 0 ||
          yInCell > cellSize
        ) {
          return null;
        }
      }

      return { top: row, left: col };
    },
    [cellSize, rowCount, columnCount],
  );

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
    if (draftRegion) {
      const bottomRow = draftRegion.top + draftRegion.height - 1;
      if (bottomRow >= rowCount - EXTRA_ROW_BUFFER) {
        setRowCount((prev) => Math.max(prev, bottomRow + EXTRA_ROW_BUFFER));
      }
    }
  }, [draftRegion, rowCount, EXTRA_ROW_BUFFER]);

  const getCellFromPointerRef = useRef(getCellFromPointer);
  useEffect(() => {
    getCellFromPointerRef.current = getCellFromPointer;
  }, [getCellFromPointer]);

  useEffect(() => {
    const parent = gridLayerRef.current;
    const container = containerRef.current;
    if (!parent || !container) return;

    const EDGE_THRESHOLD = 100;
    const SCROLL_SPEED = 10;

    let scrollFrame: number | null = null;
    let dragStart: GridPoint | null = null;
    const pointer = { x: 0, y: 0 };

    const startAutoScroll = () => {
      if (scrollFrame !== null) return;
      scrollFrame = requestAnimationFrame(autoScroll);
    };

    const stopAutoScroll = () => {
      if (scrollFrame === null) return;
      cancelAnimationFrame(scrollFrame);
      scrollFrame = null;
    };

    const autoScroll = () => {
      if (dragStateRef.current === "idle") {
        scrollFrame = null;
        return;
      }

      const rect = container.getBoundingClientRect();
      let scrolled = false;

      if (pointer.y < rect.top + EDGE_THRESHOLD) {
        container.scrollTop -= SCROLL_SPEED;
        scrolled = true;
      } else if (pointer.y > rect.bottom - EDGE_THRESHOLD) {
        container.scrollTop += SCROLL_SPEED;
        scrolled = true;
      }

      if (scrolled) {
        const cell = getCellFromPointerRef.current(pointer.x, pointer.y, true);
        if (cell) {
          if (dragStateRef.current === "pending") {
            if (isPointInAnyRegion(cell)) return;
            dragStateRef.current = "dragging";
            dragStart = cell;
            setDraftRegion(getSelectionFromPoints(cell, cell));
          } else if (dragStart) {
            setDraftRegion(getSelectionFromPoints(dragStart, cell));
          }
        }
      }

      scrollFrame = requestAnimationFrame(autoScroll);
    };

    const isPointInAnyRegion = (point: GridPoint): boolean => {
      return regionsRef.current.some((region) => {
        return (
          point.left >= region.left &&
          point.left < region.left + region.width &&
          point.top >= region.top &&
          point.top < region.top + region.height
        );
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      const nearest = getCellFromPointerRef.current(
        event.clientX,
        event.clientY,
        true,
      );
      if (nearest && isPointInAnyRegion(nearest)) return;

      const start = getCellFromPointerRef.current(event.clientX, event.clientY);
      if (start) {
        dragStateRef.current = "dragging";
        dragStart = start;
        setDraftRegion(getSelectionFromPoints(start, start));
      } else {
        dragStateRef.current = "pending";
      }

      startAutoScroll();
    };

    const handleMouseMove = (event: MouseEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (dragStateRef.current === "idle") return;

      event.preventDefault();
      const current = getCellFromPointerRef.current(
        event.clientX,
        event.clientY,
        true,
      );
      if (!current) return;

      if (dragStateRef.current === "pending") {
        if (isPointInAnyRegion(current)) {
          dragStateRef.current = "idle";
          stopAutoScroll();
          return;
        }
        dragStateRef.current = "dragging";
        dragStart = current;
        setDraftRegion(getSelectionFromPoints(current, current));
        return;
      }

      if (dragStart) {
        setDraftRegion(getSelectionFromPoints(dragStart, current));
      }
    };

    const finalizeDrag = () => {
      const wasDragging = dragStateRef.current === "dragging";
      dragStateRef.current = "idle";
      dragStart = null;
      stopAutoScroll();

      if (!wasDragging) return;

      setDraftRegion((currentDraft) => {
        if (currentDraft) {
          setRegions((previous) =>
            !doesRegionCollide(currentDraft, previous)
              ? [...previous, currentDraft]
              : previous,
          );
        }
        return null;
      });
    };

    parent.addEventListener("mousedown", handleMouseDown);
    parent.addEventListener("dragstart", (e) => e.preventDefault());
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", finalizeDrag);

    return () => {
      parent.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", finalizeDrag);
      stopAutoScroll();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-y-auto h-full">
      <GridBackground
        columnCount={columnCount}
        rowCount={rowCount}
        extraRowCount={EXTRA_ROW_BUFFER}
        cellSize={cellSize}
        gap={GAP}
        padding={PADDING}
      />
      <GridLayer
        columnCount={columnCount}
        rowCount={rowCount}
        cellSize={cellSize}
        containerRef={gridLayerRef}
        className="cursor-crosshair relative z-0"
      >
        {regions.map((region, index) => (
          <GridRegion
            key={`${region.top}-${region.left}-${region.height}-${region.width}-${index}`}
            top={region.top}
            left={region.left}
            height={region.height}
            width={region.width}
          >
            <div className="w-full h-full bg-accent/50 rounded-md" />
          </GridRegion>
        ))}
        {draftRegion ? (
          <GridRegion
            top={draftRegion.top}
            left={draftRegion.left}
            height={draftRegion.height}
            width={draftRegion.width}
          >
            <div
              className={cn(
                "w-full h-full rounded-md grid place-items-center",
                hasDraftCollision ? "bg-red-500/15" : "bg-green-500/15",
              )}
            />
          </GridRegion>
        ) : null}
      </GridLayer>
    </div>
  );
}
