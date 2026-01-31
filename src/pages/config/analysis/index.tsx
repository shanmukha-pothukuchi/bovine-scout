import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { CalculationsPanel } from "./calculations-panel";

export default function Analysis() {
  const [calculationContext, setCalculationContext] = useState<string | null>(
    "match",
  );

  const calculationContexts = new Map([
    ["match", "Match"],
    ["team", "Team"],
    ["pick_list", "Pick List"],
  ]);

  return (
    <div className="h-full flex">
      <div className="w-125 h-full bg-sidebar border-r border-border flex flex-col">
        <div className="p-2 bg-secondary border-border">
          <Select
            value={calculationContext}
            onValueChange={setCalculationContext}
          >
            <SelectTrigger>
              <SelectValue>
                {calculationContext
                  ? calculationContexts.get(calculationContext)
                  : "Select context"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[...calculationContexts.entries()].map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CalculationsPanel />
        </div>
      </div>
    </div>
  );
}
