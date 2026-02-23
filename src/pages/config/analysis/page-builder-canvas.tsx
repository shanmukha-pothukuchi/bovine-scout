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
  DATA_ATTR_DELETE_HANDLE,
  DATA_ATTR_GRID_REGION,
  DATA_ATTR_RESIZE_HANDLE,
} from "./constants";

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
  const [gridColumnCount] = useState(12);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const isRegionDrawingEnabled =
    isGridVisible && !!selectedTool && selectedEntityId === null;
  const CELL_GAP = 8;
  const GRID_PADDING = 8;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const gridLayerContainerRef = useRef<HTMLDivElement>(null);

  const {
    state: builderEntities,
    registerEntity,
    deregisterEntity,
    setEntityRegion,
    entityRegistry,
  } = useBuilderContext();

  const entityRegions = useMemo(
    () => Object.values(builderEntities).map((entity) => entity.region),
    [builderEntities],
  );

  const [regionDraft, setRegionDraft] = useState<GridArea | null>(null);

  const maxRowFromEntities =
    entityRegions.length > 0
      ? Math.max(...entityRegions.map((r) => r.end.top))
      : 0;
  const maxRowFromDraft = regionDraft ? regionDraft.end.top : 0;
  const ROW_COUNT_BUFFER = 1;
  const MIN_ROW_COUNT = 0;
  const gridRowCount = Math.max(
    MIN_ROW_COUNT,
    maxRowFromEntities + ROW_COUNT_BUFFER,
    maxRowFromDraft + ROW_COUNT_BUFFER,
  );

  const [isDraftColliding, setIsDraftColliding] = useState(false);
  const [gridCellSize, setGridCellSize] = useState(0);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const [isPointerInsideCanvas, setIsPointerInsideCanvas] = useState(false);
  const [draggedEntityOverlay, setDraggedEntityOverlay] = useState<{
    entityId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const interactionStateRef = useRef<{
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

  const builderStateRef = useRef({
    isRegionDrawingEnabled,
    isGridVisible,
    selectedTool,
    entityRegions,
    gridRowCount,
    gridColumnCount,
    registerEntity,
    setEntityRegion,
    builderEntities,
  });
  builderStateRef.current = {
    isRegionDrawingEnabled,
    isGridVisible,
    selectedTool,
    entityRegions,
    gridRowCount,
    gridColumnCount,
    registerEntity,
    setEntityRegion,
    builderEntities,
  };

  const gridStateRef = useRef({
    gridCellSize,
    regionDraft,
  });
  gridStateRef.current = {
    gridCellSize,
    regionDraft,
  };

  const scrollPointerPositionRef = useRef({ x: 0, y: 0 });
  const scrollAnimationFrameRef = useRef<number | null>(null);

  const performAutoScroll = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) {
      scrollAnimationFrameRef.current = null;
      return;
    }

    const rect = container.getBoundingClientRect();
    const EDGE_THRESHOLD = 30;
    const SCROLL_SPEED = 7;
    let didScroll = false;

    if (scrollPointerPositionRef.current.y < rect.top + EDGE_THRESHOLD) {
      container.scrollTop -= SCROLL_SPEED;
      didScroll = true;
    } else if (
      scrollPointerPositionRef.current.y >
      rect.bottom - EDGE_THRESHOLD
    ) {
      container.scrollTop += SCROLL_SPEED;
      didScroll = true;
    }

    if (didScroll) {
      const event = new MouseEvent("mousemove", {
        clientX: scrollPointerPositionRef.current.x,
        clientY: scrollPointerPositionRef.current.y,
        bubbles: true,
      });
      window.dispatchEvent(event);
    }

    scrollAnimationFrameRef.current = requestAnimationFrame(performAutoScroll);
  }, []);

  const startAutoScroll = useCallback(() => {
    if (scrollAnimationFrameRef.current === null) {
      scrollAnimationFrameRef.current =
        requestAnimationFrame(performAutoScroll);
    }
  }, [performAutoScroll]);

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedEntityId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedEntityId]);

  useEffect(() => {
    const container = gridLayerContainerRef.current;
    if (!container) return;

    const computeCellSize = () => {
      const width = container.clientWidth;
      const size =
        (width - 2 * GRID_PADDING - (gridColumnCount - 1) * CELL_GAP) /
        gridColumnCount;
      setGridCellSize(Math.max(0, size));
    };

    computeCellSize();

    const observer = new ResizeObserver(computeCellSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [gridColumnCount, CELL_GAP, GRID_PADDING]);

  const getCellFromPointer = useCallback(
    (clientX: number, clientY: number): GridPoint | null => {
      const container = gridLayerContainerRef.current;
      const { gridRowCount, gridColumnCount } = builderStateRef.current;
      const { gridCellSize } = gridStateRef.current;
      if (!container || gridCellSize <= 0) return null;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - GRID_PADDING;
      const y = clientY - rect.top - GRID_PADDING;

      const stride = gridCellSize + CELL_GAP;

      const col = Math.floor(x / stride) + 1;
      const row = Math.floor(y / stride) + 1;

      if (col < 1 || col > gridColumnCount || row < 1 || row > gridRowCount) {
        return null;
      }

      const xInCell = x - (col - 1) * stride;
      const yInCell = y - (row - 1) * stride;
      if (
        xInCell < 0 ||
        xInCell > gridCellSize ||
        yInCell < 0 ||
        yInCell > gridCellSize
      ) {
        return null;
      }

      return { top: row, left: col };
    },
    [CELL_GAP, GRID_PADDING],
  );

  const hasDraftCollision = regionDraft !== null ? isDraftColliding : false;

  useEffect(() => {
    const parent = gridLayerContainerRef.current;
    const container = canvasContainerRef.current;
    if (!parent || !container) return;

    let dragState: "idle" | "pending" | "dragging" = "idle";
    let dragStartCell: GridPoint | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      if (interactionStateRef.current.mode !== "idle") return;
      if (!builderStateRef.current.isRegionDrawingEnabled) return;

      const target = event.target as HTMLElement;
      if (target.closest(`[${DATA_ATTR_GRID_REGION}]`)) {
        return;
      }

      event.preventDefault();
      scrollPointerPositionRef.current = { x: event.clientX, y: event.clientY };

      const startCell = getCellFromPointer(event.clientX, event.clientY);
      if (
        startCell &&
        isPointInAnyRegion(startCell, builderStateRef.current.entityRegions)
      )
        return;

      if (startCell) {
        dragState = "dragging";
        dragStartCell = startCell;
        interactionStateRef.current.mode = "drawing";
        setRegionDraft(getSelectionFromPoints(startCell, startCell));
      } else {
        dragState = "pending";
      }

      startAutoScroll();
    };

    const handleMouseMove = (event: MouseEvent) => {
      scrollPointerPositionRef.current = { x: event.clientX, y: event.clientY };

      if (dragState === "idle") return;

      event.preventDefault();

      const currentCell = getCellFromPointer(event.clientX, event.clientY);
      if (!currentCell) return;

      if (dragState === "pending") {
        if (
          isPointInAnyRegion(currentCell, builderStateRef.current.entityRegions)
        ) {
          dragState = "idle";
          stopAutoScroll();
          return;
        }
        dragState = "dragging";
        dragStartCell = currentCell;
        interactionStateRef.current.mode = "drawing";
        setRegionDraft(getSelectionFromPoints(currentCell, currentCell));
        return;
      }

      if (dragStartCell) {
        const newDraftRegion = getSelectionFromPoints(
          dragStartCell,
          currentCell,
        );
        setRegionDraft(newDraftRegion);
        setIsDraftColliding(
          doesRegionCollide(
            newDraftRegion,
            builderStateRef.current.entityRegions,
          ),
        );
      }
    };

    const finalizeDrag = () => {
      const wasDragging = dragState === "dragging";
      dragState = "idle";
      dragStartCell = null;
      stopAutoScroll();

      if (!wasDragging) return;
      if (interactionStateRef.current.mode !== "drawing") return;

      interactionStateRef.current.mode = "idle";

      const draft = gridStateRef.current.regionDraft;
      if (
        draft &&
        !doesRegionCollide(draft, builderStateRef.current.entityRegions)
      ) {
        const { selectedTool, registerEntity } = builderStateRef.current;
        if (selectedTool) {
          const id = nanoid();
          registerEntity(id, selectedTool, draft);
        }
      }

      setRegionDraft(null);
      setIsDraftColliding(false);
    };

    parent.addEventListener("mousedown", handleMouseDown);
    parent.addEventListener("dragstart", (e) => e.preventDefault());
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", finalizeDrag);

    return () => {
      parent.removeEventListener("mousedown", handleMouseDown);
      parent.removeEventListener("dragstart", (e) => e.preventDefault());
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", finalizeDrag);
      stopAutoScroll();
    };
  }, [getCellFromPointer, startAutoScroll, stopAutoScroll]);

  const getRegionPixelRect = useCallback(
    (region: GridArea) => {
      const stride = gridCellSize + CELL_GAP;
      const x = GRID_PADDING + (region.start.left - 1) * stride;
      const y = GRID_PADDING + (region.start.top - 1) * stride;
      const w = (region.end.left - region.start.left + 1) * stride - CELL_GAP;
      const h = (region.end.top - region.start.top + 1) * stride - CELL_GAP;
      return { x, y, width: w, height: h };
    },
    [gridCellSize, CELL_GAP, GRID_PADDING],
  );

  const handleEntityDragStart = useCallback(
    (entityId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!builderStateRef.current.isGridVisible) return;

      const entityState = builderStateRef.current.builderEntities[entityId];
      if (!entityState) return;

      interactionStateRef.current = {
        ...interactionStateRef.current,
        mode: "dragging",
        entityId: entityId,
        originalRegion: entityState.region,
      };

      const startCell =
        getCellFromPointer(e.clientX, e.clientY) ?? entityState.region.start;
      interactionStateRef.current.startCell = startCell;

      scrollPointerPositionRef.current = { x: e.clientX, y: e.clientY };
      startAutoScroll();

      const pixelRect = getRegionPixelRect(entityState.region);
      const containerRect = canvasContainerRef.current?.getBoundingClientRect();
      const scrollTop = canvasContainerRef.current?.scrollTop ?? 0;

      const offsetX = e.clientX - (containerRect?.left ?? 0) - pixelRect.x;
      const offsetY =
        e.clientY - (containerRect?.top ?? 0) + scrollTop - pixelRect.y;

      setDraggedEntityOverlay({
        entityId,
        x: e.clientX - offsetX - (containerRect?.left ?? 0),
        y: e.clientY - offsetY - (containerRect?.top ?? 0) + scrollTop,
        width: pixelRect.width,
        height: pixelRect.height,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        scrollPointerPositionRef.current = { x: ev.clientX, y: ev.clientY };

        const cRect = canvasContainerRef.current?.getBoundingClientRect();
        const sTop = canvasContainerRef.current?.scrollTop ?? 0;
        setDraggedEntityOverlay((prev) =>
          prev
            ? {
                ...prev,
                x: ev.clientX - offsetX - (cRect?.left ?? 0),
                y: ev.clientY - offsetY - (cRect?.top ?? 0) + sTop,
              }
            : null,
        );

        const currentCell = getCellFromPointer(ev.clientX, ev.clientY);
        if (
          !currentCell ||
          !interactionStateRef.current.startCell ||
          !interactionStateRef.current.originalRegion
        )
          return;

        const deltaRow =
          currentCell.top - interactionStateRef.current.startCell.top;
        const deltaCol =
          currentCell.left - interactionStateRef.current.startCell.left;

        const orig = interactionStateRef.current.originalRegion;
        const regionHeight = orig.end.top - orig.start.top;
        const regionWidth = orig.end.left - orig.start.left;

        let newStartTop = orig.start.top + deltaRow;
        let newStartLeft = orig.start.left + deltaCol;

        newStartTop = Math.max(1, newStartTop);
        newStartLeft = Math.max(
          1,
          Math.min(
            newStartLeft,
            builderStateRef.current.gridColumnCount - regionWidth,
          ),
        );

        const candidateRegion: GridArea = {
          start: { top: newStartTop, left: newStartLeft },
          end: {
            top: newStartTop + regionHeight,
            left: newStartLeft + regionWidth,
          },
        };

        setRegionDraft(candidateRegion);
        interactionStateRef.current.draftRegion = candidateRegion;
        setIsDraftColliding(
          doesRegionCollideExcluding(
            candidateRegion,
            builderStateRef.current.entityRegions,
            orig,
          ),
        );
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        stopAutoScroll();

        const mode = interactionStateRef.current.mode;
        interactionStateRef.current.mode = "idle";
        setDraggedEntityOverlay(null);

        if (mode !== "dragging") return;

        const finalDraft = interactionStateRef.current.draftRegion;
        const origRegion = interactionStateRef.current.originalRegion;
        const entId = interactionStateRef.current.entityId;

        if (finalDraft && origRegion && entId) {
          const collides = doesRegionCollideExcluding(
            finalDraft,
            builderStateRef.current.entityRegions,
            origRegion,
          );
          if (!collides) {
            builderStateRef.current.setEntityRegion(entId, finalDraft);
          }
        }

        setRegionDraft(null);
        interactionStateRef.current = {
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
    [getCellFromPointer, getRegionPixelRect, startAutoScroll, stopAutoScroll],
  );

  const handleEntityResizeStart = useCallback(
    (entityId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!builderStateRef.current.isGridVisible) return;

      const entityState = builderStateRef.current.builderEntities[entityId];
      if (!entityState) return;

      interactionStateRef.current = {
        ...interactionStateRef.current,
        mode: "resizing",
        entityId: entityId,
        originalRegion: entityState.region,
      };

      scrollPointerPositionRef.current = { x: e.clientX, y: e.clientY };
      startAutoScroll();

      const handleMouseMove = (ev: MouseEvent) => {
        scrollPointerPositionRef.current = { x: ev.clientX, y: ev.clientY };

        const currentCell = getCellFromPointer(ev.clientX, ev.clientY);
        if (!currentCell || !interactionStateRef.current.originalRegion) return;

        const orig = interactionStateRef.current.originalRegion;

        const newEndTop = Math.max(orig.start.top, currentCell.top);
        const newEndLeft = Math.max(orig.start.left, currentCell.left);

        const candidateRegion: GridArea = {
          start: { ...orig.start },
          end: {
            top: newEndTop,
            left: Math.min(newEndLeft, builderStateRef.current.gridColumnCount),
          },
        };

        setRegionDraft(candidateRegion);
        interactionStateRef.current.draftRegion = candidateRegion;
        setIsDraftColliding(
          doesRegionCollideExcluding(
            candidateRegion,
            builderStateRef.current.entityRegions,
            orig,
          ),
        );
      };

      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        stopAutoScroll();

        const mode = interactionStateRef.current.mode;
        interactionStateRef.current.mode = "idle";

        if (mode !== "resizing") return;

        const finalDraft = interactionStateRef.current.draftRegion;
        const origRegion = interactionStateRef.current.originalRegion;
        const entId = interactionStateRef.current.entityId;

        if (finalDraft && origRegion && entId) {
          const collides = doesRegionCollideExcluding(
            finalDraft,
            builderStateRef.current.entityRegions,
            origRegion,
          );
          if (!collides) {
            builderStateRef.current.setEntityRegion(entId, finalDraft);
          }
        }

        setRegionDraft(null);
        interactionStateRef.current = {
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
    [getCellFromPointer, startAutoScroll, stopAutoScroll],
  );

  return (
    <div
      className="flex flex-col h-full"
      onMouseDown={() => {
        if (interactionStateRef.current.mode === "idle") {
          setSelectedEntityId(null);
        }
      }}
    >
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-2">
        <div className="text-sm font-medium text-muted-foreground">Canvas</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsGridVisible((prev) => !prev)}
        >
          {isGridVisible ? "Hide Grid" : "Show Grid"}
        </Button>
      </div>
      <div ref={canvasContainerRef} className="relative overflow-y-auto flex-1">
        <SelectedToolCursor
          visible={isPointerInsideCanvas && isRegionDrawingEnabled}
          x={pointerPosition.x}
          y={pointerPosition.y}
          label={selectedTool?.name ?? ""}
          icon={selectedTool?.icon}
        />
        {isGridVisible && (
          <GridBackground
            columnCount={gridColumnCount}
            rowCount={gridRowCount}
            extraRowCount={ROW_COUNT_BUFFER + 2}
            cellSize={gridCellSize}
            gap={CELL_GAP}
            padding={GRID_PADDING}
          />
        )}
        <GridLayer
          columnCount={gridColumnCount}
          rowCount={gridRowCount}
          cellSize={gridCellSize}
          ref={gridLayerContainerRef}
          onMouseMove={(event) => {
            setPointerPosition({ x: event.clientX, y: event.clientY });
            setIsPointerInsideCanvas(true);
          }}
          onMouseLeave={() => setIsPointerInsideCanvas(false)}
          className={cn(
            "relative z-0",
            isRegionDrawingEnabled ? "cursor-crosshair" : "cursor-default",
          )}
        >
          {Object.entries(builderEntities).map(([entityId, entityState]) => {
            const entityEntry = entityRegistry.current[entityState.name];
            if (!entityEntry) return null;
            const EntityWrapper = entityEntry.wrapper;
            const region = entityState.region;

            const isBeingInteracted =
              interactionStateRef.current.entityId === entityId &&
              (interactionStateRef.current.mode === "dragging" ||
                interactionStateRef.current.mode === "resizing");

            return (
              <GridRegion
                key={entityId}
                top={region.start.top}
                left={region.start.left}
                height={region.end.top - region.start.top + 1}
                width={region.end.left - region.start.left + 1}
                className={cn(
                  "rounded-md overflow-clip group",
                  isGridVisible ? "cursor-grab" : "cursor-default",
                  isBeingInteracted && "opacity-30",
                )}
                selected={selectedEntityId === entityId}
                onSelect={() => setSelectedEntityId(entityId)}
                onDelete={
                  isGridVisible ? () => deregisterEntity(entityId) : undefined
                }
                onMouseDown={(e) => {
                  if (
                    (e.target as HTMLElement).closest(
                      `[${DATA_ATTR_DELETE_HANDLE}]`,
                    )
                  ) {
                    return;
                  }
                  if (
                    (e.target as HTMLElement).closest(
                      `[${DATA_ATTR_RESIZE_HANDLE}]`,
                    )
                  ) {
                    handleEntityResizeStart(entityId, e);
                    return;
                  }
                  setSelectedEntityId(entityId);
                  handleEntityDragStart(entityId, e);
                }}
              >
                <EntityWrapper entityId={entityId} />
              </GridRegion>
            );
          })}
          {regionDraft ? (
            <GridRegion
              top={regionDraft.start.top}
              left={regionDraft.start.left}
              height={regionDraft.end.top - regionDraft.start.top + 1}
              width={regionDraft.end.left - regionDraft.start.left + 1}
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

        {draggedEntityOverlay &&
          (() => {
            const entityState = builderEntities[draggedEntityOverlay.entityId];
            if (!entityState) return null;
            const entityEntry = entityRegistry.current[entityState.name];
            if (!entityEntry) return null;
            const EntityWrapper = entityEntry.wrapper;

            return (
              <div
                className="absolute z-50 pointer-events-none rounded-md overflow-clip opacity-80 ring-2 ring-primary shadow-lg"
                style={{
                  top: draggedEntityOverlay.y,
                  left: draggedEntityOverlay.x,
                  width: draggedEntityOverlay.width,
                  height: draggedEntityOverlay.height,
                }}
              >
                <EntityWrapper entityId={draggedEntityOverlay.entityId} />
              </div>
            );
          })()}
      </div>
    </div>
  );
}
