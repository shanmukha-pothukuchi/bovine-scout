import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CalculationsPanel } from "./calculations-panel";
import { componentCategories, availableEntities } from "./constants";
import { PageBuilderCanvas } from "./page-builder-canvas";
import type { AnyEntityEntry } from "@/lib/website-builder";

export default function Analysis() {
  const calculationContexts = new Map([
    ["match", "Match"],
    ["team", "Team"],
    ["pick_list", "Pick List"],
  ]);

  const [calculationContext, setCalculationContext] = useState<string | null>(
    calculationContexts.keys().next().value || null,
  );
  const [selectedEntity, setSelectedEntity] = useState<AnyEntityEntry | null>(
    availableEntities[0] ?? null,
  );

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
        <PageBuilderCanvas selectedTool={selectedEntity?.definition ?? null} />
      </div>
      <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border">
        <div className="flex flex-col gap-4">
          {componentCategories.map((category) => (
            <div key={category.name} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category.name}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {category.entities.map((entry) => {
                  const Icon = entry.definition.icon;
                  const isSelected =
                    selectedEntity?.definition.name === entry.definition.name;

                  return (
                    <button
                      key={entry.definition.name}
                      type="button"
                      className={cn(
                        "bg-input/30 border border-border rounded-md aspect-square flex flex-col items-center justify-center gap-1.5",
                        "hover:bg-input/50 cursor-pointer",
                        isSelected && "ring-primary ring-2",
                      )}
                      onClick={() => setSelectedEntity(entry)}
                    >
                      <Icon size={24} />
                      <span className="text-sm">{entry.definition.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
