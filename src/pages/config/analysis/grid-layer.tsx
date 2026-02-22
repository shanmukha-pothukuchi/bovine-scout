import { cn } from "@/lib/utils";
import type { ComponentProps, RefObject } from "react";

type GridLayerProps = {
  columnCount: number;
  rowCount: number;
  cellSize: number;
  containerRef?: RefObject<HTMLDivElement | null>;
} & ComponentProps<"div">;

export function GridLayer({
  columnCount,
  rowCount,
  cellSize,
  children,
  className = "",
  ref: containerRef,
  style,
  ...props
}: GridLayerProps) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const safeRowCount = Math.max(1, Math.floor(rowCount));

  return (
    <div
      ref={containerRef}
      className={cn("w-full p-2 grid gap-2 h-fit", className)}
      {...props}
      style={{
        ...style,
        gridTemplateColumns: `repeat(${safeColumnCount}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${safeRowCount}, ${cellSize}px)`,
      }}
    >
      {children}
    </div>
  );
}
