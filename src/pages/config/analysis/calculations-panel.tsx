import { Cell } from "./cell";

export function CalculationsPanel() {
  return (
    <div className="flex-1">
      <Cell value="const x = 10;" onChange={() => {}} />
      <Cell value="ok" onChange={() => {}} />
    </div>
  );
}
