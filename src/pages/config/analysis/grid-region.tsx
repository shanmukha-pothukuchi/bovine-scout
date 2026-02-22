import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type GridRegionSquareProps = {
  top: number;
  left: number;
  height: number;
  width: number;
  children?: ReactNode;
  className?: string;
};

export function GridRegion({
  top,
  left,
  height,
  width,
  children,
  className,
}: GridRegionSquareProps) {
  const safeTop = Math.max(1, Math.floor(top));
  const safeLeft = Math.max(1, Math.floor(left));
  const safeLength = Math.max(1, Math.floor(height));
  const safeWidth = Math.max(1, Math.floor(width));

  return (
    <div
      className={cn("relative z-10", className)}
      style={{
        gridColumn: `${safeLeft} / span ${safeWidth}`,
        gridRow: `${safeTop} / span ${safeLength}`,
      }}
    >
      {children}
    </div>
  );
}
