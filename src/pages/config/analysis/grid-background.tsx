type GridBackgroundProps = {
  columnCount: number;
  rowCount: number;
  extraRowCount: number;
  cellSize: number;
  gap: number;
  padding: number;
};

export function GridBackground({
  columnCount,
  rowCount,
  extraRowCount,
  cellSize,
  gap,
  padding,
}: GridBackgroundProps) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const safeRowCount = Math.max(1, Math.floor(rowCount));
  const baseRowCount = Math.max(0, safeRowCount - extraRowCount);
  const baseOpacity = 0.5;
  const opacityStep = baseOpacity / (extraRowCount + 1);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ padding }}>
      {Array.from({ length: safeRowCount }).map((_, rowIndex) =>
        Array.from({ length: safeColumnCount }).map((_, columnIndex) => {
          const x = columnIndex * (cellSize + gap);
          const y = rowIndex * (cellSize + gap);
          const opacity = Math.max(
            baseOpacity - Math.max(rowIndex - baseRowCount, 0) * opacityStep,
            0,
          );

          return (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className="absolute rounded-md bg-secondary"
              style={{
                left: padding + x,
                top: padding + y,
                width: cellSize,
                height: cellSize,
                opacity,
              }}
            />
          );
        }),
      )}
    </div>
  );
}
