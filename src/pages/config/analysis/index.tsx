import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { CalculationsPanel } from "./calculations-panel";
import { PageBuilderCanvas } from "./page-builder-canvas";

export default function Analysis() {
  const calculationContexts = new Map([
    ["match", "Match"],
    ["team", "Team"],
    ["pick_list", "Pick List"],
  ]);

  const [calculationContext, setCalculationContext] = useState<string | null>(
    calculationContexts.keys().next().value || null,
  );
  const [pageBuilderTool, setPageBuilderTool] = useState<string | null>("Text");

  return (
    <div className="h-full flex">
      <div className="w-72 h-full bg-sidebar border-r border-border flex flex-col">
        <div className="p-2 border-border">
          <Select
            value={calculationContext}
            onValueChange={setCalculationContext}
          >
            <SelectTrigger size="sm">
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
      <div className="flex-1">
        <PageBuilderCanvas selectedTool={pageBuilderTool} />
      </div>
      <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border"></div>
    </div>
  );
}
