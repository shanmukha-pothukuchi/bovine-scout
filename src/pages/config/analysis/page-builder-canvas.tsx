import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { GridBackground } from "./grid-background";
import { GridLayer } from "./grid-layer";
import { GridRegion } from "./grid-region";
import { SelectedToolCursor } from "./selected-tool-cursor";

import type { Entity, GridArea, GridPoint } from "@/lib/website-builder";

type PageBuilderCanvasProps = {
  selectedTool: Entity<string, any> | null;
};

export function PageBuilderCanvas({ selectedTool }: PageBuilderCanvasProps) {
  const [columnCount] = useState(12);
  const [rowCount, setRowCount] = useState(5);
  const [showGrid, setShowGrid] = useState(true);
  const canDrawRegions = showGrid && !!selectedTool;
  const GAP = 8;
  const PADDING = 8;

  const containerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const [regions, setRegions] = useState<GridArea[]>([]);
  const regionsRef = useRef(regions);
  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);
  const [draftRegion, setDraftRegion] = useState<GridArea | null>(null);
  const [cellSize, setCellSize] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isPointerInCanvas, setIsPointerInCanvas] = useState(false);

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
    (clientX: number, clientY: number): GridPoint | null => {
      const container = gridLayerRef.current;
      if (!container || cellSize <= 0) return null;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - PADDING;
      const y = clientY - rect.top - PADDING;

      const stride = cellSize + GAP;

      const col = Math.floor(x / stride) + 1;
      const row = Math.floor(y / stride) + 1;

      if (col < 1 || col > columnCount || row < 1 || row > rowCount) {
        return null;
      }

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

      return { top: row, left: col };
    },
    [cellSize, rowCount, columnCount],
  );

  const getSelectionFromPoints = (
    start: GridPoint,
    end: GridPoint,
  ): GridArea => {
    return {
      start: {
        top: Math.min(start.top, end.top),
        left: Math.min(start.left, end.left),
      },
      end: {
        top: Math.max(start.top, end.top),
        left: Math.max(start.left, end.left),
      },
    };
  };

  const doesRegionCollide = (region: GridArea, existingRegions: GridArea[]) => {
    return existingRegions.some((existing) => {
      const isSeparated =
        region.end.left < existing.start.left ||
        existing.end.left < region.start.left ||
        region.end.top < existing.start.top ||
        existing.end.top < region.start.top;

      return !isSeparated;
    });
  };

  const hasDraftCollision =
    draftRegion !== null ? doesRegionCollide(draftRegion, regions) : false;

  useEffect(() => {
    if (draftRegion) {
      const bottomRow = draftRegion.end.top;
      if (bottomRow >= rowCount - 1) {
        setRowCount((prev) => Math.max(prev, bottomRow + 1));
      }
    }
  }, [draftRegion, rowCount]);

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
    let dragState: "idle" | "pending" | "dragging" = "idle";
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
      if (dragState === "idle") {
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
        const cell = getCellFromPointerRef.current(pointer.x, pointer.y);
        if (cell) {
          if (dragState === "pending") {
            if (isPointInAnyRegion(cell)) return;
            dragState = "dragging";
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
          point.left >= region.start.left &&
          point.left <= region.end.left &&
          point.top >= region.start.top &&
          point.top <= region.end.top
        );
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!canDrawRegions) return;
      event.preventDefault();
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      const start = getCellFromPointerRef.current(event.clientX, event.clientY);
      if (start && isPointInAnyRegion(start)) return;

      if (start) {
        dragState = "dragging";
        dragStart = start;
        setDraftRegion(getSelectionFromPoints(start, start));
      } else {
        dragState = "pending";
      }

      startAutoScroll();
    };

    const handleMouseMove = (event: MouseEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (dragState === "idle") return;

      event.preventDefault();

      const current = getCellFromPointerRef.current(
        event.clientX,
        event.clientY,
      );
      if (!current) return;

      if (dragState === "pending") {
        if (isPointInAnyRegion(current)) {
          dragState = "idle";
          stopAutoScroll();
          return;
        }
        dragState = "dragging";
        dragStart = current;
        setDraftRegion(getSelectionFromPoints(current, current));
        return;
      }

      if (dragStart) {
        setDraftRegion(getSelectionFromPoints(dragStart, current));
      }
    };

    const finalizeDrag = () => {
      const wasDragging = dragState === "dragging";
      dragState = "idle";
      dragStart = null;
      stopAutoScroll();

      if (!wasDragging) return;

      setDraftRegion((draft: GridArea | null): GridArea | null => {
        if (draft) {
          setRegions((previous: GridArea[]): GridArea[] =>
            !doesRegionCollide(draft, previous)
              ? [...previous, draft]
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
  }, [canDrawRegions]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-2">
        <div className="text-sm font-medium text-muted-foreground">Canvas</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGrid((prev) => !prev)}
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </Button>
      </div>
      <div ref={containerRef} className="relative overflow-y-auto flex-1">
        <SelectedToolCursor
          visible={isPointerInCanvas && canDrawRegions}
          x={cursorPosition.x}
          y={cursorPosition.y}
          label={selectedTool?.name ?? ""}
          icon={selectedTool?.icon}
        />
        {showGrid && (
          <GridBackground
            columnCount={columnCount}
            rowCount={rowCount}
            extraRowCount={3}
            cellSize={cellSize}
            gap={GAP}
            padding={PADDING}
          />
        )}
        <GridLayer
          columnCount={columnCount}
          rowCount={rowCount}
          cellSize={cellSize}
          ref={gridLayerRef}
          onMouseMove={(event) => {
            setCursorPosition({ x: event.clientX, y: event.clientY });
            setIsPointerInCanvas(true);
          }}
          onMouseLeave={() => setIsPointerInCanvas(false)}
          className={cn(
            "relative z-0",
            canDrawRegions ? "cursor-crosshair" : "cursor-default",
          )}
        >
          {regions.map((region, index) => (
            <GridRegion
              key={`${region.start.top}-${region.start.left}-${region.end.top}-${region.end.left}-${index}`}
              top={region.start.top}
              left={region.start.left}
              height={region.end.top - region.start.top + 1}
              width={region.end.left - region.start.left + 1}
            >
              <div className="w-full h-full bg-accent/50 rounded-md" />
            </GridRegion>
          ))}
          {draftRegion ? (
            <GridRegion
              top={draftRegion.start.top}
              left={draftRegion.start.left}
              height={draftRegion.end.top - draftRegion.start.top + 1}
              width={draftRegion.end.left - draftRegion.start.left + 1}
            >
              <div
                className={cn(
                  "w-full h-full rounded-md grid place-items-center",
                  hasDraftCollision ? "bg-red-500/15" : "bg-blue-500/15",
                )}
              />
            </GridRegion>
          ) : null}
        </GridLayer>
      </div>
    </div>
  );
}
