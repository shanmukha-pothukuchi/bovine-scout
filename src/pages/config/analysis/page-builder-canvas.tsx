import { Button } from "@/components/ui/button";
import {
  cn,
  doesRegionCollide,
  doesRegionCollideExcluding,
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
  const [dragFloat, setDragFloat] = useState<{
    entityId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const interactionRef = useRef<{
    mode: "idle" | "drawing" | "dragging" | "resizing";
    entityId: string | null;
    originalRegion: GridArea | null;
    startCell: GridPoint | null;
    draftRegion: GridArea | null;
  }>({
    mode: "idle",
    entityId: null,
    originalRegion: null,
    startCell: null,
    draftRegion: null,
  });

  const builderRef = useRef({
    canDrawRegions,
    selectedTool,
    regions,
    rowCount,
    columnCount,
    registerEntity,
    setEntityRegion,
    state,
  });
  builderRef.current = {
    canDrawRegions,
    selectedTool,
    regions,
    rowCount,
    columnCount,
    registerEntity,
    setEntityRegion,
    state,
  };

  const gridStateRef = useRef({
    cellSize,
    draftRegion,
  });
  gridStateRef.current = {
    cellSize,
    draftRegion,
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
      const { rowCount, columnCount } = builderRef.current;
      const { cellSize } = gridStateRef.current;
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
            if (isPointInAnyRegion(cell, builderRef.current.regions)) return;
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
      if (interactionRef.current.mode !== "idle") return;
      if (!builderRef.current.canDrawRegions) return;

      const target = event.target as HTMLElement;
      // Do not trigger native rectangle drawing when interacting with an existing region
      if (target.closest("[data-grid-region]")) {
        return;
      }

      event.preventDefault();
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      const start = getCellFromPointer(event.clientX, event.clientY);
      if (start && isPointInAnyRegion(start, builderRef.current.regions))
        return;

      if (start) {
        dragState = "dragging";
        dragStart = start;
        interactionRef.current.mode = "drawing";
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
        if (isPointInAnyRegion(current, builderRef.current.regions)) {
          dragState = "idle";
          stopAutoScroll();
          return;
        }
        dragState = "dragging";
        dragStart = current;
        interactionRef.current.mode = "drawing";
        setDraftRegion(getSelectionFromPoints(current, current));
        return;
      }

      if (dragStart) {
        const newDraft = getSelectionFromPoints(dragStart, current);
        setDraftRegion(newDraft);
        setDraftCollision(
          doesRegionCollide(newDraft, builderRef.current.regions),
        );
      }
    };

    const finalizeDrag = () => {
      const wasDragging = dragState === "dragging";
      dragState = "idle";
      dragStart = null;
      stopAutoScroll();

      if (!wasDragging) return;
      if (interactionRef.current.mode !== "drawing") return;

      interactionRef.current.mode = "idle";

      const draft = gridStateRef.current.draftRegion;
      if (draft && !doesRegionCollide(draft, builderRef.current.regions)) {
        const { selectedTool, registerEntity } = builderRef.current;
        if (selectedTool) {
          const id = nanoid();
          registerEntity(id, selectedTool, draft);
        }
      }

      setDraftRegion(null);
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

  /** Get the pixel rect of a grid region relative to the scroll container */
  const getRegionPixelRect = useCallback(
    (region: GridArea) => {
      const stride = cellSize + GAP;
      const x = PADDING + (region.start.left - 1) * stride;
      const y = PADDING + (region.start.top - 1) * stride;
      const w = (region.end.left - region.start.left + 1) * stride - GAP;
      const h = (region.end.top - region.start.top + 1) * stride - GAP;
      return { x, y, width: w, height: h };
    },
    [cellSize, GAP, PADDING],
  );

  // ─── Manual drag handler (region floats with cursor) ───
  const handleEntityDragStart = useCallback(
    (entityId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const entityState = builderRef.current.state[entityId];
      if (!entityState) return;

      interactionRef.current = {
        ...interactionRef.current,
        mode: "dragging",
        entityId: entityId,
        originalRegion: entityState.region,
      };

      const startCell = getCellFromPointer(e.clientX, e.clientY);
      interactionRef.current.startCell = startCell;

      const pixelRect = getRegionPixelRect(entityState.region);
      const containerRect = containerRef.current?.getBoundingClientRect();
      const scrollTop = containerRef.current?.scrollTop ?? 0;

      const offsetX = e.clientX - (containerRect?.left ?? 0) - pixelRect.x;
      const offsetY =
        e.clientY - (containerRect?.top ?? 0) + scrollTop - pixelRect.y;

      setDragFloat({
        entityId,
        x: e.clientX - offsetX - (containerRect?.left ?? 0),
        y: e.clientY - offsetY - (containerRect?.top ?? 0) + scrollTop,
        width: pixelRect.width,
        height: pixelRect.height,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        const cRect = containerRef.current?.getBoundingClientRect();
        const sTop = containerRef.current?.scrollTop ?? 0;
        setDragFloat((prev) =>
          prev
            ? {
                ...prev,
                x: ev.clientX - offsetX - (cRect?.left ?? 0),
                y: ev.clientY - offsetY - (cRect?.top ?? 0) + sTop,
              }
            : null,
        );

        const current = getCellFromPointer(ev.clientX, ev.clientY);
        if (
          !current ||
          !interactionRef.current.startCell ||
          !interactionRef.current.originalRegion
        )
          return;

        const deltaRow = current.top - interactionRef.current.startCell.top;
        const deltaCol = current.left - interactionRef.current.startCell.left;

        const orig = interactionRef.current.originalRegion;
        const regionHeight = orig.end.top - orig.start.top;
        const regionWidth = orig.end.left - orig.start.left;

        let newStartTop = orig.start.top + deltaRow;
        let newStartLeft = orig.start.left + deltaCol;

        newStartTop = Math.max(
          1,
          Math.min(newStartTop, builderRef.current.rowCount - regionHeight),
        );
        newStartLeft = Math.max(
          1,
          Math.min(newStartLeft, builderRef.current.columnCount - regionWidth),
        );

        const candidate: GridArea = {
          start: { top: newStartTop, left: newStartLeft },
          end: {
            top: newStartTop + regionHeight,
            left: newStartLeft + regionWidth,
          },
        };

        setDraftRegion(candidate);
        interactionRef.current.draftRegion = candidate;
        setDraftCollision(
          doesRegionCollideExcluding(
            candidate,
            builderRef.current.regions,
            orig,
          ),
        );

        if (candidate.end.top >= builderRef.current.rowCount - 1) {
          setRowCount((prev) => Math.max(prev, candidate.end.top + 1));
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        const mode = interactionRef.current.mode;
        interactionRef.current.mode = "idle";
        setDragFloat(null);

        if (mode !== "dragging") return;

        const finalDraft = interactionRef.current.draftRegion;
        const origRegion = interactionRef.current.originalRegion;
        const entId = interactionRef.current.entityId;

        if (finalDraft && origRegion && entId) {
          const collides = doesRegionCollideExcluding(
            finalDraft,
            builderRef.current.regions,
            origRegion,
          );
          if (!collides) {
            builderRef.current.setEntityRegion(entId, finalDraft);
          }
        }

        setDraftRegion(null);
        interactionRef.current = {
          mode: "idle",
          entityId: null,
          originalRegion: null,
          startCell: null,
          draftRegion: null,
        };
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [getCellFromPointer, getRegionPixelRect],
  );

  const handleEntityResizeStart = useCallback(
    (entityId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const entityState = builderRef.current.state[entityId];
      if (!entityState) return;

      interactionRef.current = {
        ...interactionRef.current,
        mode: "resizing",
        entityId: entityId,
        originalRegion: entityState.region,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const current = getCellFromPointer(ev.clientX, ev.clientY);
        if (!current || !interactionRef.current.originalRegion) return;

        const orig = interactionRef.current.originalRegion;

        const newEndTop = Math.max(orig.start.top, current.top);
        const newEndLeft = Math.max(orig.start.left, current.left);

        const candidate: GridArea = {
          start: { ...orig.start },
          end: {
            top: Math.min(newEndTop, builderRef.current.rowCount),
            left: Math.min(newEndLeft, builderRef.current.columnCount),
          },
        };

        setDraftRegion(candidate);
        interactionRef.current.draftRegion = candidate;
        setDraftCollision(
          doesRegionCollideExcluding(
            candidate,
            builderRef.current.regions,
            orig,
          ),
        );

        if (candidate.end.top >= builderRef.current.rowCount - 1) {
          setRowCount((prev) => Math.max(prev, candidate.end.top + 1));
        }
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        const mode = interactionRef.current.mode;
        interactionRef.current.mode = "idle";

        if (mode !== "resizing") return;

        const finalDraft = interactionRef.current.draftRegion;
        const origRegion = interactionRef.current.originalRegion;
        const entId = interactionRef.current.entityId;

        if (finalDraft && origRegion && entId) {
          const collides = doesRegionCollideExcluding(
            finalDraft,
            builderRef.current.regions,
            origRegion,
          );
          if (!collides) {
            builderRef.current.setEntityRegion(entId, finalDraft);
          }
        }

        setDraftRegion(null);
        interactionRef.current = {
          mode: "idle",
          entityId: null,
          originalRegion: null,
          startCell: null,
          draftRegion: null,
        };
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [getCellFromPointer],
  );

  return (
    <div
      className="flex flex-col h-full"
      onMouseDown={() => {
        if (interactionRef.current.mode === "idle") {
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

            const isBeingInteracted =
              interactionRef.current.entityId === entityId &&
              (interactionRef.current.mode === "dragging" ||
                interactionRef.current.mode === "resizing");

            return (
              <GridRegion
                key={entityId}
                top={region.start.top}
                left={region.start.left}
                height={region.end.top - region.start.top + 1}
                width={region.end.left - region.start.left + 1}
                className={cn(
                  "rounded-md overflow-clip group cursor-grab",
                  isBeingInteracted && "opacity-30",
                )}
                selected={selectedEntityId === entityId}
                onSelect={() => setSelectedEntityId(entityId)}
                onMouseDown={(e) => {
                  // Check if resize handle was clicked
                  if (
                    (e.target as HTMLElement).closest("[data-resize-handle]")
                  ) {
                    handleEntityResizeStart(entityId, e);
                    return;
                  }
                  // Otherwise start drag
                  setSelectedEntityId(entityId);
                  handleEntityDragStart(entityId, e);
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

        {/* Floating drag clone — follows cursor pixel-by-pixel */}
        {dragFloat &&
          (() => {
            const entityState = state[dragFloat.entityId];
            if (!entityState) return null;
            const entityEntry = entityRegistry.current[entityState.name];
            if (!entityEntry) return null;
            const EntityWrapper = entityEntry.wrapper;

            return (
              <div
                className="absolute z-50 pointer-events-none rounded-md overflow-clip opacity-80 ring-2 ring-primary shadow-lg"
                style={{
                  top: dragFloat.y,
                  left: dragFloat.x,
                  width: dragFloat.width,
                  height: dragFloat.height,
                }}
              >
                <EntityWrapper entityId={dragFloat.entityId} />
              </div>
            );
          })()}
      </div>
    </div>
  );
}
