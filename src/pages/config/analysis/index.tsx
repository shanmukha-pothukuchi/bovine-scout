import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BuilderProvider,
  useBuilderContext,
  type AnyEntityEntry,
} from "@/lib/website-builder";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalculationsPanel } from "./calculations-panel";
import type { CellResult } from "./cell";
import {
  availableEntities,
  componentCategories,
  type CalculationContextId,
} from "./constants";
import { PageBuilderCanvas } from "./page-builder-canvas";
import { evaluate } from "@/lib/bovine-basic/interpreter";
import type { Expr } from "@/lib/bovine-basic/ast";
import Parser from "@/lib/bovine-basic/parser";
import { createGlobalEnvironment } from "@/lib/bovine-basic/stdlib";
import { runtimeValToString } from "@/lib/bovine-basic/values";
import { useConfig } from "../context";

const CALCULATION_CONTEXTS: [CalculationContextId, string][] = [
  ["match", "Match"],
  ["team", "Team"],
  ["pick_list", "Pick List"],
];

const createEmptyCellsByContext = (): Record<CalculationContextId, string[]> => ({
  match: [""],
  team: [""],
  pick_list: [""],
});

function AnalysisContainer() {
  const [calculationContext, setCalculationContext] =
    useState<CalculationContextId>("match");
  const [cellsByContext, setCellsByContext] = useState<
    Record<CalculationContextId, string[]>
  >(createEmptyCellsByContext);
  const [selectedEntity, setSelectedEntity] = useState<AnyEntityEntry | null>(
    availableEntities[0] ?? null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const { getEntityState, attributeRegistry } = useBuilderContext();
  const { setExpressionEnvironment } = useConfig();

  const cellParserRef = useRef(new Parser());
  const [cellResults, setCellResults] = useState<CellResult[]>([]);

  useEffect(() => {
    const cells = cellsByContext[calculationContext];
    const env = createGlobalEnvironment();
    const results: CellResult[] = [];

    for (const src of cells) {
      if (src.trim() === "") {
        results.push({ output: null, error: null });
        continue;
      }
      try {
        const ast = cellParserRef.current.produceAST(src);
        const val = evaluate(ast as unknown as Expr, env);
        const output = runtimeValToString(val);
        results.push({ output: output === "unit" ? null : output, error: null });
      } catch (e) {
        results.push({ output: null, error: e instanceof Error ? e.message : String(e) });
      }
    }

    setCellResults(results);
    setExpressionEnvironment(env);
  }, [cellsByContext, calculationContext, setExpressionEnvironment]);

  const setCellValue = useCallback(
    (contextId: CalculationContextId, index: number, value: string) => {
      setCellsByContext((prev) => ({
        ...prev,
        [contextId]: prev[contextId].map((v, i) => (i === index ? value : v)),
      }));
    },
    [],
  );

  const addCell = useCallback((contextId: CalculationContextId, afterIndex?: number) => {
    setCellsByContext((prev) => {
      const cells = prev[contextId];
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : cells.length;
      const next = [...cells.slice(0, insertAt), "", ...cells.slice(insertAt)];
      return { ...prev, [contextId]: next };
    });
  }, []);

  const removeCell = useCallback(
    (contextId: CalculationContextId, index: number) => {
      setCellsByContext((prev) => {
        const cells = prev[contextId].filter((_, i) => i !== index);
        return { ...prev, [contextId]: cells.length > 0 ? cells : [""] };
      });
    },
    [],
  );

  return (
    <div className="h-full flex">
      <div className="w-72 h-full bg-sidebar border-r border-border flex flex-col">
        <div className="p-2 border-border">
          <Select
            value={calculationContext}
            onValueChange={(v) => v && setCalculationContext(v as CalculationContextId)}
          >
            <SelectTrigger size="sm">
              <SelectValue>
                {CALCULATION_CONTEXTS.find(([id]) => id === calculationContext)?.[1] ??
                  "Select context"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CALCULATION_CONTEXTS.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CalculationsPanel
            calculationContext={calculationContext}
            cells={cellsByContext[calculationContext]}
            cellResults={cellResults}
            setCellValue={(index, value) =>
              setCellValue(calculationContext, index, value)
            }
            addCell={(afterIndex) => addCell(calculationContext, afterIndex)}
            removeCell={(index) => removeCell(calculationContext, index)}
          />
        </div>
      </div>
      <div className="flex-1">
        <PageBuilderCanvas
          selectedTool={selectedEntity?.definition ?? null}
          selectedEntityId={selectedEntityId}
          setSelectedEntityId={setSelectedEntityId}
        />
      </div>
      <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border">
        {selectedEntityId ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedEntityId(null)}
              >
                <CaretLeftIcon className="opacity-50" />
              </Button>
              <div className="text-sm font-medium text-muted-foreground">
                Properties
              </div>
            </div>
            {(() => {
              const entityState = getEntityState(selectedEntityId);
              if (!entityState) return null;

              return Object.entries(entityState.attributes).map(
                ([attrName, attrState]) => {
                  const attrEntry = attributeRegistry.current[attrState.name];
                  if (!attrEntry) return null;
                  const Component = attrEntry.wrapper;
                  return (
                    <Component
                      key={attrName}
                      entityId={selectedEntityId}
                      attributeKey={attrName}
                    />
                  );
                },
              );
            })()}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default () => (
  <BuilderProvider entities={availableEntities}>
    <AnalysisContainer />
  </BuilderProvider>
);
