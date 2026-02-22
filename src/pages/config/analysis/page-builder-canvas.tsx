import { Button } from "@/components/ui/button";
import {
  cn,
  doesRegionCollide,
  getSelectionFromPoints,
  isPointInAnyRegion,
} from "@/lib/utils";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GridBackground } from "./grid-background";
import { GridLayer } from "./grid-layer";
import { GridRegion } from "./grid-region";
import { SelectedToolCursor } from "./selected-tool-cursor";

import {
  useBuilderContext,
  type Entity,
  type GridArea,
  type GridPoint,
} from "@/lib/website-builder";

type PageBuilderCanvasProps = {
  selectedTool: Entity<string, any> | null;
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
};

export function PageBuilderCanvas({
  selectedTool,
  selectedEntityId,
  setSelectedEntityId,
}: PageBuilderCanvasProps) {
  const [columnCount] = useState(12);
  const [rowCount, setRowCount] = useState(5);
  const [showGrid, setShowGrid] = useState(true);
  const canDrawRegions =
    showGrid && !!selectedTool && selectedEntityId === null;
  const GAP = 8;
  const PADDING = 8;

  const containerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);

  const { state, registerEntity, setEntityRegion, entityRegistry } =
    useBuilderContext();

  const regions = useMemo(
    () => Object.values(state).map((entity) => entity.region),
    [state],
  );

  const [draftRegion, setDraftRegion] = useState<GridArea | null>(null);
  const [draftCollision, setDraftCollision] = useState(false);
  const [cellSize, setCellSize] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isPointerInCanvas, setIsPointerInCanvas] = useState(false);
  const [interactionMode, setInteractionMode] = useState<"idle" | "drawing">(
    "idle",
  );

  // Ref to hold latest values for event handlers
  const latest = useRef({
    canDrawRegions,
    selectedTool,
    regions,
    cellSize,
    rowCount,
    columnCount,
    registerEntity,
    setEntityRegion,
    state,
    interactionMode,
  });
  latest.current = {
    canDrawRegions,
    selectedTool,
    regions,
    cellSize,
    rowCount,
    columnCount,
    registerEntity,
    setEntityRegion,
    state,
    interactionMode,
  };

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
      const { cellSize, rowCount, columnCount } = latest.current;
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
    [GAP, PADDING],
  );

  const hasDraftCollision = draftRegion !== null ? draftCollision : false;

  useEffect(() => {
    if (draftRegion) {
      const bottomRow = draftRegion.end.top;
      if (bottomRow >= rowCount - 1) {
        setRowCount((prev) => Math.max(prev, bottomRow + 1));
      }
    }
  }, [draftRegion, rowCount]);

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
        const cell = getCellFromPointer(pointer.x, pointer.y);
        if (cell) {
          if (dragState === "pending") {
            if (isPointInAnyRegion(cell, latest.current.regions)) return;
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

    const handleMouseDown = (event: MouseEvent) => {
      if (latest.current.interactionMode !== "idle") return;
      if (!latest.current.canDrawRegions) return;
      event.preventDefault();
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      const start = getCellFromPointer(event.clientX, event.clientY);
      if (start && isPointInAnyRegion(start, latest.current.regions)) return;

      if (start) {
        dragState = "dragging";
        dragStart = start;
        setInteractionMode("drawing");
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

      const current = getCellFromPointer(event.clientX, event.clientY);
      if (!current) return;

      if (dragState === "pending") {
        if (isPointInAnyRegion(current, latest.current.regions)) {
          dragState = "idle";
          stopAutoScroll();
          return;
        }
        dragState = "dragging";
        dragStart = current;
        setInteractionMode("drawing");
        setDraftRegion(getSelectionFromPoints(current, current));
        return;
      }

      if (dragStart) {
        const newDraft = getSelectionFromPoints(dragStart, current);
        setDraftRegion(newDraft);
        setDraftCollision(doesRegionCollide(newDraft, latest.current.regions));
      }
    };

    const finalizeDrag = () => {
      const wasDragging = dragState === "dragging";
      dragState = "idle";
      dragStart = null;
      stopAutoScroll();

      if (!wasDragging) return;
      if (latest.current.interactionMode !== "drawing") return;

      setInteractionMode("idle");

      setDraftRegion((draft: GridArea | null): GridArea | null => {
        if (draft && !doesRegionCollide(draft, latest.current.regions)) {
          const { selectedTool, registerEntity } = latest.current;
          if (selectedTool) {
            const id = nanoid();
            registerEntity(id, selectedTool, draft);
          }
        }
        return null;
      });
      setDraftCollision(false);
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
  }, [getCellFromPointer]);

  return (
    <div
      className="flex flex-col h-full"
      onMouseDown={() => {
        if (latest.current.interactionMode === "idle") {
          setSelectedEntityId(null);
        }
      }}
    >
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
          {Object.entries(state).map(([entityId, entityState]) => {
            const entityEntry = entityRegistry.current[entityState.name];
            if (!entityEntry) return null;
            const EntityWrapper = entityEntry.wrapper;
            const region = entityState.region;

            return (
              <GridRegion
                key={entityId}
                top={region.start.top}
                left={region.start.left}
                height={region.end.top - region.start.top + 1}
                width={region.end.left - region.start.left + 1}
                className="rounded-md overflow-clip group cursor-pointer"
                selected={selectedEntityId === entityId}
                onSelect={() => setSelectedEntityId(entityId)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedEntityId(entityId);
                }}
              >
                <EntityWrapper entityId={entityId} />
              </GridRegion>
            );
          })}
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
