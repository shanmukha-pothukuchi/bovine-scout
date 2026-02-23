import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import {
  DATA_ATTR_DELETE_HANDLE,
  DATA_ATTR_GRID_REGION,
  DATA_ATTR_RESIZE_HANDLE,
} from "./constants";

export type GridRegionSquareProps = {
  top: number;
  left: number;
  height: number;
  width: number;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
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
  onDelete,
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
      {isInteractive && onDelete && (
        <button
          type="button"
          {...{ [DATA_ATTR_DELETE_HANDLE]: true }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-0 right-0 w-5 h-5 z-20 flex items-center justify-center",
            "bg-destructive/70 rounded-bl-sm cursor-pointer",
            "hover:bg-destructive transition-colors",
            !selected && "opacity-0 group-hover:opacity-100",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3 h-3 text-destructive-foreground"
          >
            <path d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06L8 9.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L9.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06L8 6.94 4.28 3.22Z" />
          </svg>
        </button>
      )}
      {isInteractive && onDelete && (
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
