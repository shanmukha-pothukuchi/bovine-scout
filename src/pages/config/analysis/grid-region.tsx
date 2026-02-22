import type { ReactNode } from "react";

export type GridRegionSquareProps = {
  top: number;
  left: number;
  height: number;
  width: number;
  isResizing?: boolean;
  children?: ReactNode;
};

export function GridRegion({
  top,
  left,
  height,
  width,
  isResizing = false,
  children,
}: GridRegionSquareProps) {
  const safeTop = Math.max(1, Math.floor(top));
  const safeLeft = Math.max(1, Math.floor(left));
  const safeLength = Math.max(1, Math.floor(height));
  const safeWidth = Math.max(1, Math.floor(width));

  return (
    <div
      className="relative z-10"
      style={{
        gridColumn: `${safeLeft} / span ${safeWidth}`,
        gridRow: `${safeTop} / span ${safeLength}`,
        pointerEvents: isResizing ? "none" : "auto",
      }}
    >
      {children}
    </div>
  );
}
