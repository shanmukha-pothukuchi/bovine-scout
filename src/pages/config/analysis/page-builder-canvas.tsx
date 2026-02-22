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
  const [selection, setSelection] = useState<GridSelection>({
    top: 2,
    left: 4,
    height: 3,
    width: 3,
  });

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

  useEffect(() => {
    const parent = gridLayerRef.current;

    if (!parent) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true;

      const start = getCellFromTarget(event.target);

      if (!start) {
        return;
      }

      event.preventDefault();
      isDraggingRef.current = true;
      dragStartRef.current = start;
      setSelection(getSelectionFromPoints(start, start));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDownRef.current) {
        return;
      }

      const current = getCellFromTarget(event.target);

      if (!current) {
        return;
      }

      if (!isDraggingRef.current || !dragStartRef.current) {
        event.preventDefault();
        isDraggingRef.current = true;
        dragStartRef.current = current;
        setSelection(getSelectionFromPoints(current, current));
        return;
      }

      event.preventDefault();

      setSelection(getSelectionFromPoints(dragStartRef.current, current));
    };

    const finalizeDrag = () => {
      isMouseDownRef.current = false;

      if (!isDraggingRef.current) {
        return;
      }

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
        <GridRegion
          top={selection.top}
          left={selection.left}
          height={selection.height}
          width={selection.width}
          isResizing={true}
        >
          <div className="w-full h-full bg-accent/50 rounded-md grid place-items-center">
            hello world
          </div>
        </GridRegion>
      </GridLayer>
    </div>
  );
}
