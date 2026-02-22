import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GridLayerProps = {
  columnCount: number;
  rowCount: number;
  showBoxes?: boolean;
  children?: ReactNode;
  className?: string;
};

export function GridLayer({
  columnCount,
  rowCount,
  showBoxes = false,
  children,
  className = "",
}: GridLayerProps) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const safeRowCount = Math.max(1, Math.floor(rowCount));
  const extraRowCount = 3;

  const baseRowCount = safeRowCount - extraRowCount;
  const baseOpacity = 0.3;
  const opacityStep = baseOpacity / (extraRowCount + 1);

  return (
    <div
      className={cn("w-full p-2 grid gap-2 h-fit", className)}
      style={{
        gridTemplateColumns: `repeat(${safeColumnCount}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: safeRowCount }).map((_, rowIndex) =>
        Array.from({ length: safeColumnCount }).map((_, columnIndex) => (
          <div
            className="w-full aspect-square rounded-md bg-secondary"
            key={`${rowIndex}-${columnIndex}`}
            style={{
              opacity: Math.max(
                baseOpacity -
                  Math.max(rowIndex - baseRowCount + 1, 0) * opacityStep,
                0,
              ),
              visibility: showBoxes ? "visible" : "hidden",
            }}
          ></div>
        )),
      )}
      {children}
    </div>
  );
}
