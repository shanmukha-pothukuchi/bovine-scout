import { useEffect, useRef, useState } from "react";
import type { CalculationContextId } from "./constants";
import { Cell, type CellHandle, type CellResult } from "./cell";

type CalculationsPanelProps = {
  calculationContext: CalculationContextId;
  cells: string[];
  cellResults: CellResult[];
  setCellValue: (index: number, value: string) => void;
  addCell: (afterIndex?: number) => void;
  removeCell: (index: number) => void;
};

export function CalculationsPanel({
  cells,
  cellResults,
  setCellValue,
  addCell,
  removeCell,
}: CalculationsPanelProps) {
  const cellRefs = useRef<(CellHandle | null)[]>([]);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    if (pendingFocusIndex === null) return;
    const clampedIndex = Math.min(pendingFocusIndex, cells.length - 1);
    cellRefs.current[clampedIndex]?.focus();
    setPendingFocusIndex(null);
  }, [cells.length, pendingFocusIndex]);

  const handleAddCell = (afterIndex?: number) => {
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : cells.length;
    setPendingFocusIndex(insertAt);
    addCell(afterIndex);
  };

  const handleRemoveCell = (index: number) => {
    setPendingFocusIndex(Math.max(0, index - 1));
    removeCell(index);
  };

  return (
    <div className="flex-1 flex flex-col">
      {cells.map((value, index) => (
        <Cell
          key={index}
          ref={(el) => { cellRefs.current[index] = el; }}
          value={value}
          onChange={(v) => setCellValue(index, v)}
          onAddCell={() => handleAddCell(index)}
          onNavigatePrev={() => cellRefs.current[index - 1]?.focus()}
          onNavigateNext={index < cells.length - 1 ? () => cellRefs.current[index + 1]?.focus() : () => handleAddCell(index)}
          onRemove={cells.length > 1 ? () => handleRemoveCell(index) : undefined}
          result={cellResults[index]}
        />
      ))}
      <div
        className="first:border-t border-b border-border flex font-mono text-base flex-col cursor-pointer select-none"
        style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)" }}
        onClick={() => handleAddCell(cells.length - 1)}
      >
        <div className="flex flex-1">
          <div className="w-12 bg-muted relative flex flex-col items-center justify-center">
            <div className="aspect-square w-9 rounded-full bg-accent" />
          </div>
          <div className="flex-1 p-2.5 text-muted-foreground font-mono leading-normal">
            click to add cell
          </div>
        </div>
      </div>
    </div>
  );
}
