import type { CalculationContextId } from "./constants";
import { Cell, type CellResult } from "./cell";

type CalculationsPanelProps = {
  calculationContext: CalculationContextId;
  cells: string[];
  cellResults: CellResult[];
  setCellValue: (index: number, value: string) => void;
  addCell: () => void;
  removeCell: (index: number) => void;
};

export function CalculationsPanel({
  cells,
  cellResults,
  setCellValue,
}: CalculationsPanelProps) {
  return (
    <div className="flex-1 flex flex-col">
      {cells.map((value, index) => (
        <Cell
          key={index}
          value={value}
          onChange={(v) => setCellValue(index, v)}
          result={cellResults[index]}
        />
      ))}
    </div>
  );
}
