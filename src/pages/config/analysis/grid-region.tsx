import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

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
      data-grid-region
      {...rest}
    >
      {children}
    </div>
  );
}
