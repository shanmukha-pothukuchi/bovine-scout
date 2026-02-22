import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { DATA_ATTR_GRID_REGION, DATA_ATTR_RESIZE_HANDLE } from "./constants";

export type GridRegionSquareProps = {
  top: number;
  left: number;
  height: number;
  width: number;
  selected?: boolean;
  onSelect?: () => void;
} & HTMLAttributes<HTMLDivElement>;

export function GridRegion({
  top,
  left,
  height,
  width,
  children,
  className,
  selected,
  onSelect,
  ...rest
}: GridRegionSquareProps) {
  const safeTop = Math.max(1, Math.floor(top));
  const safeLeft = Math.max(1, Math.floor(left));
  const safeLength = Math.max(1, Math.floor(height));
  const safeWidth = Math.max(1, Math.floor(width));

  const isInteractive = !!onSelect;

  return (
    <div
      className={cn(
        "relative z-10 select-none",
        selected && "ring-2 ring-primary rounded-md",
        className,
      )}
      style={{
        gridColumn: `${safeLeft} / span ${safeWidth}`,
        gridRow: `${safeTop} / span ${safeLength}`,
      }}
      {...{ [DATA_ATTR_GRID_REGION]: true }}
      {...rest}
    >
      {children}
      {isInteractive && (
        <div
          {...{ [DATA_ATTR_RESIZE_HANDLE]: true }}
          className={cn(
            "absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20",
            "bg-primary/50 rounded-tl-sm",
            "hover:bg-primary/80 transition-colors",
            !selected && "opacity-0 group-hover:opacity-100",
          )}
        />
      )}
    </div>
  );
}
